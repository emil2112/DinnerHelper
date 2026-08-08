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

export async function searchElements(query) {
  return apiFetch(`/elements/search?q=${encodeURIComponent(query)}`);
}

export async function requestSuggestions({ energy, elements, prompt, history }) {
  return apiFetch('/suggest', {
    method: 'POST',
    body: JSON.stringify({ energy, elements, prompt, history }),
  });
}

export async function fetchMethod({ elements, servings, energy }) {
  return apiFetch('/method', {
    method: 'POST',
    body: JSON.stringify({ elements, servings, energy }),
  });
}
