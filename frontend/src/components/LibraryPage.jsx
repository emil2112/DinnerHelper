import { useState } from 'react';

function LibraryRow({ element, onEdit, onDelete, onAddToPlate }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(element.name);
  const [description, setDescription] = useState(element.description || '');

  function save() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onEdit(element.id, { name: trimmedName, description: description.trim() });
    setEditing(false);
  }

  function cancel() {
    setName(element.name);
    setDescription(element.description || '');
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="library-row editing">
        <input
          type="text"
          className="library-edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <textarea
          className="library-edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div className="library-row-actions">
          <button type="button" className="library-save-btn" onClick={save} disabled={!name.trim()}>
            Save
          </button>
          <button type="button" className="library-cancel-btn" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="library-row">
      <div className="library-row-text">
        <div className="library-row-name">{element.name}</div>
        {element.description && <div className="library-row-description">{element.description}</div>}
      </div>
      <div className="library-row-actions">
        <button type="button" className="library-add-to-plate-btn" onClick={() => onAddToPlate(element.name)}>
          + Add to tonight's plate
        </button>
        <button type="button" className="library-edit-btn" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button type="button" className="library-delete-btn" onClick={() => onDelete(element.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function LibraryPage({ elements, onAdd, onEdit, onDelete, onAddToPlate, onBack }) {
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  function submitNew(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(trimmed, newDescription.trim());
    setNewName('');
    setNewDescription('');
  }

  return (
    <div className="library-page">
      <button type="button" className="library-back-btn" onClick={onBack}>
        ← Back
      </button>

      <h1 className="library-title">Library</h1>

      <form className="library-add-form" onSubmit={submitNew}>
        <input
          type="text"
          placeholder="Element name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <button type="submit" disabled={!newName.trim()}>
          Add
        </button>
      </form>

      <div className="library-list">
        {elements.length === 0 && <div className="library-empty">Nothing saved yet.</div>}
        {elements.map((element) => (
          <LibraryRow
            key={element.id}
            element={element}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddToPlate={onAddToPlate}
          />
        ))}
      </div>
    </div>
  );
}
