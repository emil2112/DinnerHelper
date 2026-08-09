import { validateAuth } from './auth.js';

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

// Kept for Stage 2 — routes like /sessions/:id will need it again.
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

    // Stage 0 teardown: every route removed except auth. Stage 2 rebuilds sessions,
    // messages (streaming chat), elements and settings per docs/dinner-helper-spec.md §4/§6.
    return json({ error: 'Not found' }, 404, corsHeaders);
  },
};
