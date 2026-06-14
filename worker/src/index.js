import { validateAuth } from './auth.js';
import { callAnthropic } from './anthropic.js';
import {
  listChats, createChat, getChat, addMessage, deleteChat, renameChat,
  listPantry, addPantryItem, deletePantryItem,
  listRecipes, saveRecipe, deleteRecipe,
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
