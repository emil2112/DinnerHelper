import { validateAuth } from './auth.js';
import { streamChatReply } from './chat.js';
import { describeElement } from './descriptionHelper.js';
import {
  listSessions, getSessionWithMessages, createSession, renameSession, deleteSession,
  getMessageHistory, addMessage,
  listElements, createElement, updateElement, deleteElement,
  getSettings, updateStaples,
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
    'Access-Control-Expose-Headers': 'X-Session-Id',
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
  async fetch(request, env, ctx) {
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
      // ── Chat (streaming) ──────────────────────────────────────────────

      // POST /chat — { session_id: number|null, message, plate: string[], energy }
      if (method === 'POST' && pathname === '/chat') {
        const { session_id, message, plate, energy } = await request.json();

        const isNewSession = !session_id;
        const history = isNewSession ? [] : await getMessageHistory(env.DB, session_id);

        const [settings, savedElements] = await Promise.all([
          getSettings(env.DB),
          listElements(env.DB),
        ]);
        const staples = JSON.parse(settings?.pantry_staples || '[]');

        // Awaited before anything is persisted: a bad key or network failure throws here and
        // is caught by the outer try/catch as a normal error response, with no orphan session
        // left behind for a chat that never actually happened.
        const { readable, fullTextPromise, userContent } = await streamChatReply({
          apiKey: env.ANTHROPIC_API_KEY,
          history,
          plate: Array.isArray(plate) ? plate : [],
          energy,
          prompt: message,
          staples,
          savedElements,
        });

        const sessionId = isNewSession
          ? await createSession(env.DB, message.slice(0, 60) + (message.length > 60 ? '…' : ''))
          : session_id;

        const plateJson = JSON.stringify(Array.isArray(plate) ? plate : []);
        ctx.waitUntil(
          (async () => {
            try {
              await addMessage(env.DB, sessionId, 'user', userContent, plateJson);
              const fullText = await fullTextPromise;
              await addMessage(env.DB, sessionId, 'assistant', fullText, null);
            } catch (e) {
              console.log(`Chat persistence failed for session ${sessionId}: ${e.message}`);
            }
          })()
        );

        return new Response(readable, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Session-Id': String(sessionId),
            ...corsHeaders,
          },
        });
      }

      // ── Sessions CRUD ──────────────────────────────────────────────────

      // GET /sessions
      if (method === 'GET' && pathname === '/sessions') {
        return json(await listSessions(env.DB), 200, corsHeaders);
      }

      // GET /sessions/:id
      if (method === 'GET' && (params = matchPath('/sessions/:id', pathname))) {
        return json(await getSessionWithMessages(env.DB, Number(params.id)), 200, corsHeaders);
      }

      // PATCH /sessions/:id — rename
      if (method === 'PATCH' && (params = matchPath('/sessions/:id', pathname))) {
        const { title } = await request.json();
        await renameSession(env.DB, Number(params.id), title);
        return json({ ok: true }, 200, corsHeaders);
      }

      // DELETE /sessions/:id
      if (method === 'DELETE' && (params = matchPath('/sessions/:id', pathname))) {
        await deleteSession(env.DB, Number(params.id));
        return json({ ok: true }, 200, corsHeaders);
      }

      // ── Elements CRUD ──────────────────────────────────────────────────

      // GET /elements
      if (method === 'GET' && pathname === '/elements') {
        return json(await listElements(env.DB), 200, corsHeaders);
      }

      // POST /elements — { name, description }
      if (method === 'POST' && pathname === '/elements') {
        const { name, description } = await request.json();
        const id = await createElement(env.DB, name, description);
        return json({ id, name, description: description || null }, 200, corsHeaders);
      }

      // POST /elements/describe — §6.2 helper. { name, conversation? } -> { description }
      if (method === 'POST' && pathname === '/elements/describe') {
        const { name, conversation } = await request.json();
        const description = await describeElement(env.ANTHROPIC_API_KEY, name, conversation);
        return json({ description }, 200, corsHeaders);
      }

      // PATCH /elements/:id — { name?, description? }
      if (method === 'PATCH' && (params = matchPath('/elements/:id', pathname))) {
        const fields = await request.json();
        await updateElement(env.DB, Number(params.id), fields);
        return json({ ok: true }, 200, corsHeaders);
      }

      // DELETE /elements/:id
      if (method === 'DELETE' && (params = matchPath('/elements/:id', pathname))) {
        await deleteElement(env.DB, Number(params.id));
        return json({ ok: true }, 200, corsHeaders);
      }

      // ── Settings ───────────────────────────────────────────────────────

      // GET /settings
      if (method === 'GET' && pathname === '/settings') {
        const settings = await getSettings(env.DB);
        return json({ ...settings, pantry_staples: JSON.parse(settings?.pantry_staples || '[]') }, 200, corsHeaders);
      }

      // PATCH /settings — { pantry_staples: string[] }
      if (method === 'PATCH' && pathname === '/settings') {
        const { pantry_staples } = await request.json();
        await updateStaples(env.DB, Array.isArray(pantry_staples) ? pantry_staples : []);
        return json({ ok: true }, 200, corsHeaders);
      }

      return json({ error: 'Not found' }, 404, corsHeaders);
    } catch (e) {
      return json({ error: e.message }, 500, corsHeaders);
    }
  },
};
