import { useState, useEffect, useCallback } from 'react';
import { fetchMethod } from '../lib/api';

export default function MethodScreen({ elements, energy, defaultServings, onBack }) {
  const [servings, setServings] = useState(defaultServings || 2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [method, setMethod] = useState(null);

  const load = useCallback(
    async (nextServings) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchMethod({
          elements,
          servings: nextServings,
          energy,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || 'Could not work out a method for this plate.');
          setLoading(false);
          return;
        }
        setMethod(await res.json());
      } catch {
        setError('Could not reach the server.');
      }
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [elements, energy]
  );

  useEffect(() => {
    load(servings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function adjustServings(delta) {
    const next = Math.max(1, servings + delta);
    setServings(next);
    load(next);
  }

  return (
    <div className="method-screen">
      <div className="method-header">
        <button type="button" className="method-back-btn" onClick={onBack}>
          ← Tonight
        </button>
        <h1 className="method-title">Method</h1>
        <div className="servings-stepper">
          <button type="button" onClick={() => adjustServings(-1)} disabled={loading || servings <= 1}>
            −
          </button>
          <span>{servings} servings</span>
          <button type="button" onClick={() => adjustServings(1)} disabled={loading}>
            +
          </button>
        </div>
      </div>

      {loading && <div className="method-status">Working out the method…</div>}

      {error && !loading && (
        <div className="method-status error">
          {error}
          <button type="button" className="method-retry-btn" onClick={() => load(servings)}>
            Retry
          </button>
        </div>
      )}

      {method && !loading && !error && (
        <>
          <div className="method-summary">
            {method.total_active_min} active min · {method.total_elapsed_min} min total
            {method.cached ? ' · cached' : ''}
          </div>

          <div className="method-section">
            <div className="method-section-title">Timeline</div>
            <div className="timeline">
              {method.timeline.map((entry, i) => (
                <div className="timeline-entry" key={i}>
                  <div className="timeline-offset">T+{entry.offset_min}</div>
                  <div className="timeline-step">{entry.step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="method-section">
            <div className="method-section-title">Ingredients</div>
            {method.components.map((c) => (
              <div className="method-component" key={c.display_name}>
                <div className="method-component-name">{c.display_name}</div>
                <ul className="method-ingredient-list">
                  {c.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {method.notes && method.notes.length > 0 && (
            <div className="method-section">
              <div className="method-section-title">Notes</div>
              <ul className="method-notes-list">
                {method.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          <button type="button" className="we-made-it-btn" disabled title="Coming soon">
            We made it
          </button>
        </>
      )}
    </div>
  );
}
