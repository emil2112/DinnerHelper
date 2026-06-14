import { useState } from 'react';

const CATEGORIES = ['pantry', 'spice', 'oil', 'sauce', 'vinegar', 'other'];

export default function PantrySection({ items, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState('pantry');
  const [newName, setNewName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [adding, setAdding] = useState(false);

  const grouped = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim() || adding) return;
    setAdding(true);
    await onAdd(newCategory, newName.trim(), '');
    setNewName('');
    setAdding(false);
    setShowForm(false);
  }

  return (
    <section className="pantry-section">
      <div className="pantry-header">
        <div className="pantry-title">
          <span className="pantry-icon">🍳</span>
          <span>Our Kitchen Staples</span>
        </div>
        <div className="pantry-actions">
          <button
            className="add-staple-btn"
            onClick={() => setShowForm(s => !s)}
          >
            + Add Staple
          </button>
        </div>
      </div>

      {showForm && (
        <form className="pantry-add-form" onSubmit={handleAdd}>
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Item name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={!newName.trim() || adding}>
            {adding ? '…' : 'Add'}
          </button>
          <button type="button" onClick={() => setShowForm(false)}>
            Cancel
          </button>
        </form>
      )}

      <div className="pantry-groups">
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="pantry-group">
            <div className="pantry-category-label">{cat.toUpperCase()}</div>
            <div className="pantry-pills">
              {catItems.map(item => (
                <div
                  key={item.id}
                  className={`pantry-pill${confirmDelete === item.id ? ' confirming' : ''}`}
                >
                  <span className="pill-name">{item.name}</span>
                  {confirmDelete === item.id ? (
                    <>
                      <button
                        className="pill-delete-confirm"
                        onClick={() => {
                          onRemove(item.id);
                          setConfirmDelete(null);
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                      <button
                        className="pill-delete-cancel"
                        onClick={() => setConfirmDelete(null)}
                      >
                        keep
                      </button>
                    </>
                  ) : (
                    <button
                      className="pill-delete-btn"
                      onClick={() => setConfirmDelete(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="pantry-empty">No staples yet — add your first one!</p>
        )}
      </div>
    </section>
  );
}
