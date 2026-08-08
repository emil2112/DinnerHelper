import { useState, useEffect } from 'react';
import { fetchProfile, requestSuggestions } from '../lib/api';
import ElementCard from './ElementCard';
import AddElementCard from './AddElementCard';
import SuggestionPanel from './SuggestionPanel';
import PromptBar from './PromptBar';
import MethodScreen from './MethodScreen';

const ENERGY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'cook', label: 'Cook' },
];

export default function TonightScreen({ onOpenChat }) {
  const [energy, setEnergy] = useState('normal');
  const [profile, setProfile] = useState(null);
  const [elements, setElements] = useState([]);
  const [screen, setScreen] = useState('plate');

  const [suggestVisible, setSuggestVisible] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchProfile().then(async (res) => {
      if (res.ok) setProfile(await res.json());
    });
  }, []);

  function addElement(text) {
    setElements((prev) => [...prev, text]);
  }

  function editElement(index, text) {
    setElements((prev) => prev.map((e, i) => (i === index ? text : e)));
  }

  function removeElement(index) {
    setElements((prev) => prev.filter((_e, i) => i !== index));
  }

  async function runSuggest(promptText) {
    setSuggestVisible(true);
    setSuggestLoading(true);
    setSuggestError(null);
    try {
      const res = await requestSuggestions({
        energy,
        elements,
        prompt: promptText || null,
        history,
      });
      if (!res.ok) {
        setSuggestError('Could not get suggestions.');
        setSuggestLoading(false);
        return;
      }
      const data = await res.json();
      setSuggestions(data.suggestions);
      if (data.assistant_reply && data.user_message) {
        setHistory((prev) => [
          ...prev,
          { role: 'user', content: data.user_message },
          { role: 'assistant', content: data.assistant_reply },
        ]);
      }
    } catch {
      setSuggestError('Could not reach the server.');
    }
    setSuggestLoading(false);
  }

  const promptPlaceholder =
    elements.length === 0 ? 'What are you starting with?' : 'Ask for an addition, or tell me what you want…';

  if (screen === 'method') {
    return (
      <MethodScreen
        elements={elements}
        energy={energy}
        defaultServings={profile?.default_servings || 2}
        onBack={() => setScreen('plate')}
      />
    );
  }

  return (
    <div className="tonight-screen">
      <div className="tonight-header">
        <h1 className="tonight-title">Tonight</h1>
        <div className="energy-toggle" role="tablist" aria-label="Energy level">
          {ENERGY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              role="tab"
              aria-selected={energy === level.value}
              className={`energy-btn${energy === level.value ? ' active' : ''}`}
              onClick={() => setEnergy(level.value)}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="slot-list">
        {elements.map((text, i) => (
          <ElementCard
            key={i}
            text={text}
            onEdit={(newText) => editElement(i, newText)}
            onRemove={() => removeElement(i)}
          />
        ))}
        <AddElementCard onAdd={addElement} />
      </div>

      <div className="tonight-footer">
        <button type="button" className="suggest-btn" onClick={() => runSuggest(null)} disabled={suggestLoading}>
          Suggest an addition
        </button>
        <button
          type="button"
          className="cook-this-btn"
          onClick={() => setScreen('method')}
          disabled={elements.length === 0}
        >
          Cook this
        </button>
      </div>

      {suggestVisible && (
        <SuggestionPanel
          loading={suggestLoading}
          error={suggestError}
          suggestions={suggestions}
          onAdd={addElement}
        />
      )}

      <PromptBar onSubmit={runSuggest} disabled={suggestLoading} placeholder={promptPlaceholder} />

      <button type="button" className="chat-escape-hatch" onClick={onOpenChat}>
        Craving something specific? Open chat
      </button>
    </div>
  );
}
