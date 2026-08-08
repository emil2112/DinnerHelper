function equipmentLabel(component) {
  if (component.equipment === 'oven') return `Oven · ${component.oven_temp_c}°C`;
  if (component.equipment === 'hob') return 'Hob';
  if (component.equipment === 'grill') return 'Grill';
  return 'No cook';
}

export default function ElementCard({ component, onRemove }) {
  return (
    <div className="element-card">
      <div className="element-name">{component.display_name}</div>
      <div className="element-meta">
        {equipmentLabel(component)} · {component.active_min}
        {component.passive_min > 0 ? `+${component.passive_min}` : ''} min · {component.serve_temp}
      </div>
      <button
        type="button"
        className="element-remove-btn"
        onClick={onRemove}
        aria-label={`Remove ${component.display_name}`}
      >
        Remove
      </button>
    </div>
  );
}
