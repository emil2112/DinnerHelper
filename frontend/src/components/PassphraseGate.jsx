import { useState } from 'react';
import { apiFetch } from '../lib/api';

export default function PassphraseGate({ onAuth }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    setChecking(true);
    setError('');
    localStorage.setItem('dinnerhelper-auth', value);
    try {
      const res = await apiFetch('/chats');
      if (res.ok) {
        onAuth();
      } else {
        localStorage.removeItem('dinnerhelper-auth');
        setError('Wrong passphrase. Try again.');
      }
    } catch {
      localStorage.removeItem('dinnerhelper-auth');
      setError('Could not reach the server. Check your connection.');
    }
    setChecking(false);
  }

  return (
    <div className="passphrase-gate">
      <div className="gate-card">
        <span className="gate-logo">🍽️</span>
        <h1>Dinner Ideas</h1>
        <p>By us, for us ♡</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter passphrase"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
          />
          {error && <p className="gate-error">{error}</p>}
          <button type="submit" disabled={checking || !value.trim()}>
            {checking ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
