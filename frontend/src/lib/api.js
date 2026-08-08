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

export async function fetchProfile() {
  return apiFetch('/profile');
}

export async function searchComponents(query) {
  return apiFetch(`/components/search?q=${encodeURIComponent(query)}`);
}

export async function createManualComponent(fields) {
  return apiFetch('/components/manual', {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

export async function saveSuggestedComponent(fields) {
  return apiFetch('/components/save-suggestion', {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

export async function requestSuggestions({ energy, componentIds, prompt, history }) {
  return apiFetch('/suggest', {
    method: 'POST',
    body: JSON.stringify({ energy, component_ids: componentIds, prompt, history }),
  });
}

export async function fetchMethod({ componentIds, servings, energy }) {
  return apiFetch('/method', {
    method: 'POST',
    body: JSON.stringify({ component_ids: componentIds, servings, energy }),
  });
}
