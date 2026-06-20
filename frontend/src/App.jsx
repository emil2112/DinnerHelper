import { useState, useEffect } from 'react';
import PassphraseGate from './components/PassphraseGate';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import PantrySection from './components/PantrySection';
import { apiFetch } from './lib/api';

const DEV_MODE = import.meta.env.VITE_SKIP_AUTH === 'true';
if (DEV_MODE && !localStorage.getItem('dinnerhelper-auth')) {
  localStorage.setItem('dinnerhelper-auth', import.meta.env.VITE_DEV_PASSPHRASE || 'dev');
}

export default function App() {
  const [authed, setAuthed] = useState(DEV_MODE || !!localStorage.getItem('dinnerhelper-auth'));
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pantry, setPantry] = useState([]);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  useEffect(() => {
    if (!authed) return;
    loadChats();
    loadPantry();
  }, [authed]);

  async function loadChats() {
    const res = await apiFetch('/chats');
    if (res.ok) setChats(await res.json());
  }

  async function loadPantry() {
    const res = await apiFetch('/pantry');
    if (res.ok) setPantry(await res.json());
  }

  async function selectChat(id) {
    setActiveChatId(id);
    setLastFailedMessage(null);
    const res = await apiFetch(`/chats/${id}`);
    if (res.ok) {
      const { messages: msgs } = await res.json();
      setMessages(msgs ?? []);
    }
  }

  function newChat() {
    setActiveChatId(null);
    setMessages([]);
    setLastFailedMessage(null);
  }

  async function sendMessage(text) {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLastFailedMessage(null);
    setSending(true);

    try {
      const res = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ chat_id: activeChatId, message: text }),
      });

      if (res.ok) {
        const { chat_id, reply } = await res.json();
        setActiveChatId(chat_id);
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        loadChats();
      } else {
        setLastFailedMessage(text);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong. Please try again.', isError: true },
        ]);
      }
    } catch {
      setLastFailedMessage(text);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Could not reach the server. Check your connection.', isError: true },
      ]);
    }

    setSending(false);
  }

  async function addPantryItem(category, name, notes) {
    const res = await apiFetch('/pantry', {
      method: 'POST',
      body: JSON.stringify({ category, name, notes }),
    });
    if (res.ok) {
      const item = await res.json();
      setPantry(prev => [...prev, item]);
    }
  }

  async function removePantryItem(id) {
    const res = await apiFetch(`/pantry/${id}`, { method: 'DELETE' });
    if (res.ok) setPantry(prev => prev.filter(i => i.id !== id));
  }

  if (!authed) {
    return <PassphraseGate onAuth={() => setAuthed(true)} />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={newChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">
        <header className="main-header">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="main-header-title">Dinner Ideas</span>
        </header>
        <ChatInterface
          messages={messages}
          sending={sending}
          onSend={sendMessage}
          lastFailedMessage={lastFailedMessage}
          onRetry={sendMessage}
        />
        <PantrySection
          items={pantry}
          onAdd={addPantryItem}
          onRemove={removePantryItem}
        />
      </main>
    </div>
  );
}
