import { useState } from 'react';

export default function ElementCard({ text, onEdit, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  function startEdit() {
    setDraft(text);
    setEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed) onEdit(trimmed);
    setEditing(false);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  }

  return (
    <div className="element-card">
      {editing ? (
        <input
          type="text"
          className="element-edit-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          autoFocus
        />
      ) : (
        <button type="button" className="element-name" onClick={startEdit}>
          {text}
        </button>
      )}
      <button type="button" className="element-remove-btn" onClick={onRemove} aria-label={`Remove ${text}`}>
        Remove
      </button>
    </div>
  );
}
