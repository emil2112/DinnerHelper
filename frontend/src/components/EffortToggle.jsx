const LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'cook', label: 'Cook' },
];

export default function EffortToggle({ value, onChange }) {
  return (
    <div className="energy-toggle" role="tablist" aria-label="Effort level">
      {LEVELS.map((level) => (
        <button
          key={level.value}
          type="button"
          role="tab"
          aria-selected={value === level.value}
          className={`energy-btn${value === level.value ? ' active' : ''}`}
          onClick={() => onChange(level.value)}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}
