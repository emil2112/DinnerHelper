const WORKER_URL = (import.meta.env.VITE_WORKER_URL || 'http://localhost:8787').replace(/\/$/, '');

export async function apiFetch(path, options = {}) {
  const auth = localStorage.getItem('dinnerhelper-auth') ?? '';
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Auth': auth,
      ...options.headers,
    },
  });
  return res;
}

// Streaming — returns the raw Response so the caller can read res.body directly and read
// res.headers.get('X-Session-Id'). Not JSON, so it doesn't go through the helpers below.
export async function streamChat({ sessionId, message, plate, energy }) {
  return apiFetch('/chat', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, message, plate, energy }),
  });
}

export async function listSessions() {
  return apiFetch('/sessions');
}

export async function getSession(id) {
  return apiFetch(`/sessions/${id}`);
}

export async function renameSession(id, title) {
  return apiFetch(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) });
}

export async function deleteSession(id) {
  return apiFetch(`/sessions/${id}`, { method: 'DELETE' });
}

export async function listElements() {
  return apiFetch('/elements');
}

export async function createElement(name, description) {
  return apiFetch('/elements', { method: 'POST', body: JSON.stringify({ name, description }) });
}

export async function describeElement(name, conversation) {
  return apiFetch('/elements/describe', { method: 'POST', body: JSON.stringify({ name, conversation }) });
}

export async function updateElement(id, fields) {
  return apiFetch(`/elements/${id}`, { method: 'PATCH', body: JSON.stringify(fields) });
}

export async function deleteElement(id) {
  return apiFetch(`/elements/${id}`, { method: 'DELETE' });
}

export async function getSettings() {
  return apiFetch('/settings');
}

export async function updateStaples(staples) {
  return apiFetch('/settings', { method: 'PATCH', body: JSON.stringify({ pantry_staples: staples }) });
}
