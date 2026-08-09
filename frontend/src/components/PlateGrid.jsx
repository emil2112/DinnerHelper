import { useState } from 'react';

function PlateBox({ text, saved, onEdit, onRemove, onSave }) {
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
      <div className="element-box-actions">
        {!saved && (
          <button type="button" className="element-save-btn" onClick={onSave}>
            Save
          </button>
        )}
        <button type="button" className="element-remove-btn" onClick={onRemove} aria-label={`Remove ${text}`}>
          ×
        </button>
      </div>
    </div>
  );
}

// The one input that matters most (per the last build's regression): plain text in, Enter out.
// No autocomplete, no library lookup, no debounce, no async anything on this path — typing and
// pressing Enter is a single synchronous state update, every time.
export default function PlateGrid({ plate, savedNames, onAdd, onEdit, onRemove, onSaveRequest }) {
  const [newText, setNewText] = useState('');

  function submitNew() {
    const trimmed = newText.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewText('');
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitNew();
    }
  }

  return (
    <div className="slot-list">
      {plate.map((text, i) => (
        <PlateBox
          key={i}
          text={text}
          saved={savedNames.has(text.trim().toLowerCase())}
          onEdit={(next) => onEdit(i, next)}
          onRemove={() => onRemove(i)}
          onSave={() => onSaveRequest(i, text)}
        />
      ))}
      <div className="add-element-card open">
        <input
          type="text"
          className="add-element-input"
          placeholder="Type an element…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
