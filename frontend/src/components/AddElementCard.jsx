import { useState, useEffect, useRef } from 'react';
import { searchComponents, createManualComponent } from '../lib/api';

const ROLE_OPTIONS = ['protein', 'carb', 'veg', 'sauce', 'bread', 'other'];
const EQUIPMENT_OPTIONS = ['none', 'hob', 'oven', 'grill'];

const BLANK_MANUAL = { display_name: '', role: 'veg', equipment: 'none', active_min: 10, oven_temp_c: '', serve_temp: 'hot' };

export default function AddElementCard({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState(BLANK_MANUAL);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open || manualOpen) return undefined;
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchComponents(query.trim());
      if (res.ok) setResults(await res.json());
      setSearching(false);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, manualOpen]);

  function reset() {
    setQuery('');
    setResults([]);
    setManualOpen(false);
    setManual(BLANK_MANUAL);
  }

  function closeAndReset() {
    setOpen(false);
    reset();
  }

  function pick(component) {
    onAdd(component);
    reset();
  }

  function startManual() {
    setManualOpen(true);
    setManual((m) => ({ ...m, display_name: query.trim() }));
  }

  async function submitManual(e) {
    e.preventDefault();
    if (!manual.display_name.trim() || !manual.active_min) return;
    if (manual.equipment === 'oven' && !manual.oven_temp_c) return;
    setSaving(true);
    const res = await createManualComponent({
      display_name: manual.display_name.trim(),
      role: manual.role,
      equipment: manual.equipment,
      active_min: Number(manual.active_min),
      oven_temp_c: manual.equipment === 'oven' ? Number(manual.oven_temp_c) : null,
      serve_temp: manual.serve_temp,
    });
    setSaving(false);
    if (res.ok) {
      const component = await res.json();
      pick(component);
      closeAndReset();
    }
  }

  if (!open) {
    return (
      <button type="button" className="add-element-card" onClick={() => setOpen(true)}>
        <span>+ Add element</span>
        <span className="add-element-hint">type or suggest</span>
      </button>
    );
  }

  return (
    <div className="add-element-card open">
      {!manualOpen && (
        <>
          <input
            type="text"
            className="add-element-input"
            placeholder="Type an element…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {searching && <div className="add-element-status">Searching…</div>}
          {!searching && results.length > 0 && (
            <div className="autocomplete-list">
              {results.map((c) => (
                <button type="button" key={c.id} className="autocomplete-item" onClick={() => pick(c)}>
                  {c.display_name}
                </button>
              ))}
            </div>
          )}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <button type="button" className="add-new-component-link" onClick={startManual}>
              No match — add &ldquo;{query.trim()}&rdquo; as a new component
            </button>
          )}
        </>
      )}

      {manualOpen && (
        <form className="manual-component-form" onSubmit={submitManual}>
          <label>
            Name
            <input
              type="text"
              value={manual.display_name}
              onChange={(e) => setManual((m) => ({ ...m, display_name: e.target.value }))}
              required
            />
          </label>
          <label>
            Role
            <select value={manual.role} onChange={(e) => setManual((m) => ({ ...m, role: e.target.value }))}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            Equipment
            <select
              value={manual.equipment}
              onChange={(e) => setManual((m) => ({ ...m, equipment: e.target.value }))}
            >
              {EQUIPMENT_OPTIONS.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </label>
          {manual.equipment === 'oven' && (
            <label>
              Oven temp (°C)
              <input
                type="number"
                value={manual.oven_temp_c}
                onChange={(e) => setManual((m) => ({ ...m, oven_temp_c: e.target.value }))}
                required
              />
            </label>
          )}
          <label>
            Active minutes
            <input
              type="number"
              min="1"
              value={manual.active_min}
              onChange={(e) => setManual((m) => ({ ...m, active_min: e.target.value }))}
              required
            />
          </label>
          <label>
            Serve
            <select
              value={manual.serve_temp}
              onChange={(e) => setManual((m) => ({ ...m, serve_temp: e.target.value }))}
            >
              <option value="hot">hot</option>
              <option value="room">room</option>
              <option value="cold">cold</option>
            </select>
          </label>
          <div className="manual-component-actions">
            <button type="submit" className="manual-save-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save to library'}
            </button>
            <button type="button" className="manual-cancel-btn" onClick={() => setManualOpen(false)}>
              Back
            </button>
          </div>
        </form>
      )}

      <button type="button" className="add-element-close" onClick={closeAndReset}>
        Close
      </button>
    </div>
  );
}
