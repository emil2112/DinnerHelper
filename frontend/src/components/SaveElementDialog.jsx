import { useState, useEffect } from 'react';
import { describeElement, createElement } from '../lib/api';

// §5 "Saving an element": describe helper runs once on open, pre-fills an editable field,
// user accepts or edits, confirms.
export default function SaveElementDialog({ name, conversation, onSaved, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await describeElement(name, conversation);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setDescription(data.description);
        } else {
          setError('Could not generate a description — you can still write one.');
        }
      } catch {
        if (!cancelled) setError('Could not reach the server — you can still write a description.');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirm() {
    setSaving(true);
    const res = await createElement(name, description.trim());
    if (res.ok) {
      onSaved();
    } else {
      setError('Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <div className="save-dialog-overlay" onClick={onCancel}>
      <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="save-dialog-name">{name}</div>
        {loading ? (
          <div className="save-dialog-status">Thinking of a description…</div>
        ) : (
          <>
            {error && <div className="save-dialog-status error">{error}</div>}
            <textarea
              className="save-dialog-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="save-dialog-actions">
              <button
                type="button"
                className="save-dialog-confirm"
                onClick={confirm}
                disabled={saving || !description.trim()}
              >
                {saving ? 'Saving…' : 'Save to library'}
              </button>
              <button type="button" className="save-dialog-cancel" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
