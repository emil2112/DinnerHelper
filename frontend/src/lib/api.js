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
