import { useState, useEffect, useRef } from 'react';
import { searchElements } from '../lib/api';

export default function AddElementCard({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchElements(query.trim());
      if (res.ok) setResults(await res.json());
      setSearching(false);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  function reset() {
    setQuery('');
    setResults([]);
  }

  function add(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    reset();
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      add(query);
    }
    if (e.key === 'Escape') {
      setOpen(false);
      reset();
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
      <input
        type="text"
        className="add-element-input"
        placeholder="Type an element…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
      />
      {searching && <div className="add-element-status">Searching…</div>}
      {!searching && results.length > 0 && (
        <div className="autocomplete-list">
          {results.map((text) => (
            <button type="button" key={text} className="autocomplete-item" onClick={() => add(text)}>
              {text}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="add-element-close" onClick={() => { setOpen(false); reset(); }}>
        Close
      </button>
    </div>
  );
}
