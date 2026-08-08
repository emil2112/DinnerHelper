import { useState, useEffect, useMemo } from 'react';
import { fetchProfile, requestSuggestions, saveSuggestedComponent } from '../lib/api';
import { checkFeasibility } from '../lib/feasibility';
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
  const [library, setLibrary] = useState([]);
  const [novel, setNovel] = useState([]);
  const [savingKeys, setSavingKeys] = useState(new Set());
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchProfile().then(async (res) => {
      if (res.ok) setProfile(await res.json());
    });
  }, []);

  const budget = useMemo(() => {
    if (!profile) return null;
    try {
      return JSON.parse(profile.energy_budgets)[energy];
    } catch {
      return null;
    }
  }, [profile, energy]);

  const feasibility = useMemo(() => checkFeasibility(elements, profile, budget), [elements, profile, budget]);

  function addElement(component) {
    setElements((prev) => (prev.some((e) => e.id === component.id) ? prev : [...prev, component]));
  }

  function removeElement(id) {
    setElements((prev) => prev.filter((e) => e.id !== id));
  }

  async function runSuggest(promptText) {
    setSuggestVisible(true);
    setSuggestLoading(true);
    setSuggestError(null);
    try {
      const res = await requestSuggestions({
        energy,
        componentIds: elements.map((e) => e.id),
        prompt: promptText || null,
        history,
      });
      if (!res.ok) {
        setSuggestError('Could not get suggestions.');
        setSuggestLoading(false);
        return;
      }
      const data = await res.json();
      setLibrary(data.library);
      setNovel(data.new);
      setSavingKeys(new Set());
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

  async function saveNovelSuggestion(suggestion, key) {
    setSavingKeys((prev) => new Set(prev).add(key));
    const res = await saveSuggestedComponent({
      display_name: suggestion.display_name,
      role: suggestion.role,
      equipment: suggestion.equipment,
      active_min: suggestion.active_min,
      passive_min: suggestion.passive_min,
      oven_temp_c: suggestion.oven_temp_c,
      serve_temp: suggestion.serve_temp,
      texture_tags: suggestion.texture_tags,
      flavour_tags: suggestion.flavour_tags,
    });
    if (res.ok) {
      const component = await res.json();
      addElement(component);
    }
  }

  const promptPlaceholder =
    elements.length === 0 ? 'What are you starting with?' : 'Ask for an addition, or tell me what you want…';

  if (screen === 'method') {
    return (
      <MethodScreen
        plateComponents={elements}
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
        {elements.map((component) => (
          <ElementCard key={component.id} component={component} onRemove={() => removeElement(component.id)} />
        ))}
        <AddElementCard onAdd={addElement} />
      </div>

      {feasibility.warnings.length > 0 && (
        <div className="feasibility-warnings">
          {feasibility.warnings.map((w) => (
            <div className="feasibility-warning" key={w}>
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      <div className="tonight-footer">
        <div className="total-time">
          <span className={`total-time-value${feasibility.over_budget ? ' amber' : ''}`}>
            {feasibility.active_min}
          </span>
          <span className="total-time-label">active min</span>
        </div>
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
          library={library}
          novel={novel}
          onAddLibrary={addElement}
          onSaveNovel={saveNovelSuggestion}
          savingKeys={savingKeys}
        />
      )}

      <PromptBar onSubmit={runSuggest} disabled={suggestLoading} placeholder={promptPlaceholder} />

      <button type="button" className="chat-escape-hatch" onClick={onOpenChat}>
        Craving something specific? Open chat
      </button>
    </div>
  );
}
