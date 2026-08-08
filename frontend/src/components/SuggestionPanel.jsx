export default function SuggestionPanel({ loading, error, library, novel, onAddLibrary, onSaveNovel, savingKeys }) {
  return (
    <div className="suggestion-panel">
      {loading && <div className="suggestion-status">Thinking…</div>}
      {error && !loading && <div className="suggestion-status error">{error}</div>}
      {!loading && !error && (
        <div className="suggestion-columns">
          <div className="suggestion-column">
            <div className="suggestion-column-title">From your library</div>
            {library.length === 0 && (
              <div className="suggestion-empty">Nothing left to suggest from the library.</div>
            )}
            {library.map((c) => (
              <div className="suggestion-item" key={c.id}>
                <div className="suggestion-item-name">{c.display_name}</div>
                <button type="button" className="suggestion-add-btn" onClick={() => onAddLibrary(c)}>
                  + Add
                </button>
              </div>
            ))}
          </div>
          <div className="suggestion-column">
            <div className="suggestion-column-title">Something new</div>
            {novel.length === 0 && <div className="suggestion-empty">No new ideas this time.</div>}
            {novel.map((s, i) => (
              <div className="suggestion-item new" key={`${s.display_name}-${i}`}>
                <div className="suggestion-item-name">{s.display_name}</div>
                {s.why && <div className="suggestion-item-why">{s.why}</div>}
                <button
                  type="button"
                  className="suggestion-add-btn"
                  onClick={() => onSaveNovel(s, i)}
                  disabled={savingKeys.has(i)}
                >
                  {savingKeys.has(i) ? 'Saving…' : 'Save to library'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
