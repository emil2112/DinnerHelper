import { validateAuth } from './auth.js';
import { callAnthropic } from './anthropic.js';
import { energyBudget, rankLibraryCandidates, checkFeasibility } from './composer.js';
import { suggestAdditions } from './jobD.js';
import { generateMethod } from './jobC.js';
import {
  listChats, createChat, getChat, addMessage, deleteChat, renameChat,
  listPantry, addPantryItem, deletePantryItem,
  listRecipes, saveRecipe, deleteRecipe,
  listApprovedComponents, getComponentsByIds, searchComponents, createComponent,
  getProfile, recordSuggestion, listRecentSuggestionComponentIds,
  plateSignature, getCachedMethod, cacheMethod,
} from './db.js';

const ALLOWED_ORIGINS = [
  'https://emil2112.github.io',
  'http://localhost:5173',
];

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Auth',
  };
}

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status: status ?? 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function matchPath(pattern, pathname) {
  const pp = pattern.split('/');
  const path = pathname.split('/');
  if (pp.length !== path.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = path[i];
    } else if (pp[i] !== path[i]) {
      return null;
    }
  }
  return params;
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!validateAuth(request, env)) {
      return json({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    let params;

    try {
      // POST /chat
      if (method === 'POST' && pathname === '/chat') {
        const { chat_id, message } = await request.json();

        let chatId = chat_id ?? null;
        let history = [];

        if (chatId) {
          const { messages } = await getChat(env.DB, chatId);
          history = messages.map(m => ({ role: m.role, content: m.content }));
        } else {
          const title = message.slice(0, 60) + (message.length > 60 ? '…' : '');
          chatId = await createChat(env.DB, title);
        }

        history.push({ role: 'user', content: message });

        const pantryItems = await listPantry(env.DB);
        const reply = await callAnthropic(env.ANTHROPIC_API_KEY, history, pantryItems);

        await addMessage(env.DB, chatId, 'user', message);
        await addMessage(env.DB, chatId, 'assistant', reply);

        return json({ chat_id: chatId, reply }, 200, corsHeaders);
      }

      // GET /chats
      if (method === 'GET' && pathname === '/chats') {
        return json(await listChats(env.DB), 200, corsHeaders);
      }

      // GET /chats/:id
      if (method === 'GET' && (params = matchPath('/chats/:id', pathname))) {
        return json(await getChat(env.DB, Number(params.id)), 200, corsHeaders);
      }

      // DELETE /chats/:id
      if (method === 'DELETE' && (params = matchPath('/chats/:id', pathname))) {
        await deleteChat(env.DB, Number(params.id));
        return json({ ok: true }, 200, corsHeaders);
      }

      // PATCH /chats/:id
      if (method === 'PATCH' && (params = matchPath('/chats/:id', pathname))) {
        const { title } = await request.json();
        await renameChat(env.DB, Number(params.id), title);
        return json({ ok: true }, 200, corsHeaders);
      }

      // GET /profile
      if (method === 'GET' && pathname === '/profile') {
        return json(await getProfile(env.DB), 200, corsHeaders);
      }

      // GET /components/search?q=...
      if (method === 'GET' && pathname === '/components/search') {
        const q = url.searchParams.get('q') || '';
        if (q.trim().length < 2) return json([], 200, corsHeaders);
        return json(await searchComponents(env.DB, q.trim()), 200, corsHeaders);
      }

      // POST /components/manual — "add as new component" path (source='manual')
      if (method === 'POST' && pathname === '/components/manual') {
        const body = await request.json();
        const component = await createComponent(env.DB, body, 'manual');
        return json(component, 200, corsHeaders);
      }

      // POST /components/save-suggestion — one-tap save of a Job D result (source='llm')
      if (method === 'POST' && pathname === '/components/save-suggestion') {
        const body = await request.json();
        const component = await createComponent(env.DB, body, 'llm');
        return json(component, 200, corsHeaders);
      }

      // POST /suggest — the suggestion panel: library ranking (composer scoring) + Job D, side by side
      if (method === 'POST' && pathname === '/suggest') {
        const body = await request.json().catch(() => ({}));
        const energy = ['low', 'normal', 'cook'].includes(body.energy) ? body.energy : 'normal';
        const plateIds = Array.isArray(body.component_ids) ? body.component_ids : [];
        const userRequest = typeof body.prompt === 'string' && body.prompt.trim() ? body.prompt.trim() : null;
        const history = Array.isArray(body.history) ? body.history : [];

        const [allComponents, plateComponents, profile, recentIds] = await Promise.all([
          listApprovedComponents(env.DB),
          getComponentsByIds(env.DB, plateIds),
          getProfile(env.DB),
          listRecentSuggestionComponentIds(env.DB),
        ]);

        const month = new Date().getUTCMonth() + 1;
        const budget = energyBudget(energy, profile);

        const library = rankLibraryCandidates({
          components: allComponents,
          plateComponents,
          month,
          recentIds,
          limit: 6,
        });
        const feasibility = checkFeasibility(plateComponents, profile, budget);

        let novel = [];
        let assistantReply = null;
        let sentUserMessage = null;
        try {
          const jobD = await suggestAdditions(env.ANTHROPIC_API_KEY, {
            plateComponents,
            profile,
            energy,
            budget,
            month,
            userRequest,
            recentMealElementNames: [], // meals table is unused until Phase 4
            history,
          });
          novel = jobD.suggestions;
          assistantReply = jobD.replyText;
          sentUserMessage = jobD.userMessage;
        } catch (e) {
          // Library ranking still works without the LLM — degrade, don't fail the whole panel.
          novel = [];
          assistantReply = null;
        }

        if (library.length) await recordSuggestion(env.DB, library.map((c) => c.id));

        return json(
          { library, new: novel, feasibility, assistant_reply: assistantReply, user_message: sentUserMessage },
          200,
          corsHeaders
        );
      }

      // POST /method — "Cook this". Cached by (plate signature, servings); cache hit = no LLM call.
      if (method === 'POST' && pathname === '/method') {
        const body = await request.json().catch(() => ({}));
        const plateIds = Array.isArray(body.component_ids) ? body.component_ids : [];
        if (!plateIds.length) {
          return json({ error: 'component_ids is required' }, 400, corsHeaders);
        }
        const energy = ['low', 'normal', 'cook'].includes(body.energy) ? body.energy : 'normal';

        const profile = await getProfile(env.DB);
        const servings = Number.isInteger(body.servings) ? body.servings : profile.default_servings;

        const signature = plateSignature(plateIds);
        const cached = await getCachedMethod(env.DB, signature, servings);
        if (cached) {
          return json({ ...cached, cached: true }, 200, corsHeaders);
        }

        const plateComponents = await getComponentsByIds(env.DB, plateIds);
        const payload = await generateMethod(env.ANTHROPIC_API_KEY, {
          plateComponents,
          profile,
          servings,
          energy,
        });

        await cacheMethod(env.DB, signature, servings, payload);

        return json({ ...payload, cached: false }, 200, corsHeaders);
      }

      // GET /pantry
      if (method === 'GET' && pathname === '/pantry') {
        return json(await listPantry(env.DB), 200, corsHeaders);
      }

      // POST /pantry
      if (method === 'POST' && pathname === '/pantry') {
        const { category, name, notes } = await request.json();
        const id = await addPantryItem(env.DB, category, name, notes);
        return json({ id, category, name, notes: notes || null }, 200, corsHeaders);
      }

      // DELETE /pantry/:id
      if (method === 'DELETE' && (params = matchPath('/pantry/:id', pathname))) {
        await deletePantryItem(env.DB, Number(params.id));
        return json({ ok: true }, 200, corsHeaders);
      }

      // GET /recipes
      if (method === 'GET' && pathname === '/recipes') {
        return json(await listRecipes(env.DB), 200, corsHeaders);
      }

      // POST /recipes
      if (method === 'POST' && pathname === '/recipes') {
        const { title, content, source_chat_id } = await request.json();
        const id = await saveRecipe(env.DB, title, content, source_chat_id);
        return json({ id, title }, 200, corsHeaders);
      }

      // DELETE /recipes/:id
      if (method === 'DELETE' && (params = matchPath('/recipes/:id', pathname))) {
        await deleteRecipe(env.DB, Number(params.id));
        return json({ ok: true }, 200, corsHeaders);
      }

      return json({ error: 'Not found' }, 404, corsHeaders);
    } catch (e) {
      return json({ error: e.message }, 500, corsHeaders);
    }
  },
};
