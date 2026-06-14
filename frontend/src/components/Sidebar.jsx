function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, isOpen, onClose }) {
  function handleSelectChat(id) {
    onSelectChat(id);
    onClose();
  }

  function handleNewChat() {
    onNewChat();
    onClose();
  }

  return (
    <>
      <div
        className={`sidebar-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          ✕
        </button>

        <div className="sidebar-brand">
          <span className="brand-icon">🍽</span>
          <div>
            <div className="brand-name">Dinner Ideas</div>
            <div className="brand-tagline">By us, for us ♡</div>
          </div>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          + New chat
        </button>

        <div className="sidebar-section-label">CHAT HISTORY</div>

        <nav className="chat-list">
          {chats.map(chat => (
            <button
              key={chat.id}
              className={`chat-item${chat.id === activeChatId ? ' active' : ''}`}
              onClick={() => handleSelectChat(chat.id)}
            >
              <span className="chat-item-title">{chat.title || 'Untitled chat'}</span>
              <span className="chat-item-time">{relativeTime(chat.updated_at)}</span>
            </button>
          ))}
          {chats.length === 0 && (
            <div className="chat-list-empty">No conversations yet</div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="settings-btn">⚙ Settings</button>
        </div>
      </aside>
    </>
  );
}
