import { useState } from 'react';

export default function PantryStaples({ staples, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState('');

  function submit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
    setAdding(false);
  }

  return (
    <div className="pantry-section">
      <div className="pantry-header">
        <div className="pantry-title">
          <span className="pantry-icon">🧂</span>
          Pantry staples ({staples.length})
        </div>
        <div className="pantry-actions">
          <button type="button" className="add-staple-btn" onClick={() => setAdding((v) => !v)}>
            {adding ? 'Cancel' : '+ Add staple'}
          </button>
        </div>
      </div>

      {adding && (
        <form className="pantry-add-form" onSubmit={submit}>
          <input
            type="text"
            placeholder="e.g. Soy sauce"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <button type="submit">Add</button>
          <button type="button" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      )}

      <div className="pantry-body">
        {staples.length === 0 && <div className="pantry-empty">No staples yet.</div>}
        <div className="pantry-pills">
          {staples.map((s) => (
            <span className="pantry-pill" key={s}>
              <span className="pill-name">{s}</span>
              <button type="button" className="pill-delete-btn" onClick={() => onRemove(s)} aria-label={`Remove ${s}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
