export default function SuggestionPanel({ loading, error, suggestions, onAdd }) {
  return (
    <div className="suggestion-panel">
      {loading && <div className="suggestion-status">Thinking…</div>}
      {error && !loading && <div className="suggestion-status error">{error}</div>}
      {!loading && !error && (
        <div className="suggestion-list">
          {suggestions.length === 0 && <div className="suggestion-empty">No suggestions this time.</div>}
          {suggestions.map((s, i) => (
            <div className="suggestion-item" key={`${s.text}-${i}`}>
              <div className="suggestion-item-text">
                <div className="suggestion-item-name">{s.text}</div>
                {s.why && <div className="suggestion-item-why">{s.why}</div>}
              </div>
              <button type="button" className="suggestion-add-btn" onClick={() => onAdd(s.text)}>
                + Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
