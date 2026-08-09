import EffortToggle from './EffortToggle';
import PlateGrid from './PlateGrid';
import PromptBar from './PromptBar';
import Conversation from './Conversation';
import PantryStaples from './PantryStaples';

export default function MainScreen({
  plate,
  savedNames,
  onAddPlateItem,
  onEditPlateItem,
  onRemovePlateItem,
  onRequestSave,
  energy,
  onEnergyChange,
  messages,
  onSendPrompt,
  sending,
  staples,
  onAddStaple,
  onRemoveStaple,
}) {
  return (
    <div className="tonight-screen">
      <div className="tonight-header">
        <h1 className="tonight-title">Dinner Helper</h1>
        <EffortToggle value={energy} onChange={onEnergyChange} />
      </div>

      <PlateGrid
        plate={plate}
        savedNames={savedNames}
        onAdd={onAddPlateItem}
        onEdit={onEditPlateItem}
        onRemove={onRemovePlateItem}
        onSaveRequest={onRequestSave}
      />

      <PromptBar onSubmit={onSendPrompt} disabled={sending} plateEmpty={plate.length === 0} />

      <Conversation messages={messages} />

      <PantryStaples staples={staples} onAdd={onAddStaple} onRemove={onRemoveStaple} />
    </div>
  );
}
