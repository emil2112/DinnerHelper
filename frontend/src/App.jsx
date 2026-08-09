import { useState, useEffect, useCallback } from 'react';
import PassphraseGate from './components/PassphraseGate';
import Sidebar from './components/Sidebar';
import MainScreen from './components/MainScreen';
import LibraryPage from './components/LibraryPage';
import SaveElementDialog from './components/SaveElementDialog';
import {
  listSessions, getSession, streamChat,
  listElements, createElement, updateElement, deleteElement,
  getSettings, updateStaples,
} from './lib/api';

const DEV_MODE = import.meta.env.VITE_SKIP_AUTH === 'true';
if (DEV_MODE && !localStorage.getItem('dinnerhelper-auth')) {
  localStorage.setItem('dinnerhelper-auth', import.meta.env.VITE_DEV_PASSPHRASE || 'dev');
}

export default function App() {
  const [authed, setAuthed] = useState(DEV_MODE || !!localStorage.getItem('dinnerhelper-auth'));
  const [view, setView] = useState('main');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [plate, setPlate] = useState([]);
  const [energy, setEnergy] = useState('normal');
  const [sending, setSending] = useState(false);

  const [elements, setElements] = useState([]);
  const [staples, setStaples] = useState([]);

  const [saveTarget, setSaveTarget] = useState(null); // { index, text } | null

  const refreshSessions = useCallback(async () => {
    const res = await listSessions();
    if (res.ok) setSessions(await res.json());
  }, []);

  const refreshElements = useCallback(async () => {
    const res = await listElements();
    if (res.ok) setElements(await res.json());
  }, []);

  useEffect(() => {
    if (!authed) return;
    refreshSessions();
    refreshElements();
    getSettings().then(async (res) => {
      if (res.ok) setStaples((await res.json()).pantry_staples);
    });
  }, [authed, refreshSessions, refreshElements]);

  function newSession() {
    setActiveSessionId(null);
    setMessages([]);
  }

  async function selectSession(id) {
    const res = await getSession(id);
    if (!res.ok) return;
    const data = await res.json();
    setActiveSessionId(id);
    setMessages(data.messages);
    const lastPlateMsg = [...data.messages].reverse().find((m) => m.plate);
    setPlate(lastPlateMsg ? JSON.parse(lastPlateMsg.plate) : []);
  }

  function addPlateItem(text) {
    setPlate((prev) => [...prev, text]);
  }
  function editPlateItem(index, text) {
    setPlate((prev) => prev.map((p, i) => (i === index ? text : p)));
  }
  function removePlateItem(index) {
    setPlate((prev) => prev.filter((_p, i) => i !== index));
  }

  async function sendPrompt(promptText) {
    if (plate.length === 0 || sending) return;
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: promptText },
      { role: 'assistant', content: '', streaming: true },
    ]);

    try {
      const res = await streamChat({ sessionId: activeSessionId, message: promptText, plate, energy });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: body.error || 'Something went wrong.', error: true };
          return next;
        });
        setSending(false);
        return;
      }

      if (!activeSessionId) {
        const newSessionId = res.headers.get('X-Session-Id');
        if (newSessionId) setActiveSessionId(Number(newSessionId));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const chunk = acc;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: chunk, streaming: true };
          return next;
        });
      }
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: acc, streaming: false };
        return next;
      });
      refreshSessions();
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: 'Could not reach the server.', error: true };
        return next;
      });
    }
    setSending(false);
  }

  function requestSave(index, text) {
    setSaveTarget({ index, text });
  }

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant' && !m.streaming);
  const conversationContext = lastAssistantMessage ? lastAssistantMessage.content : null;

  async function addLibraryElement(name, description) {
    const res = await createElement(name, description);
    if (res.ok) refreshElements();
  }
  async function editLibraryElement(id, fields) {
    const res = await updateElement(id, fields);
    if (res.ok) refreshElements();
  }
  async function removeLibraryElement(id) {
    const res = await deleteElement(id);
    if (res.ok) refreshElements();
  }
  function addToTonightPlate(name) {
    addPlateItem(name);
    setView('main');
  }

  async function addStaple(name) {
    const next = [...staples, name];
    setStaples(next);
    await updateStaples(next);
  }
  async function removeStaple(name) {
    const next = staples.filter((s) => s !== name);
    setStaples(next);
    await updateStaples(next);
  }

  const savedNames = new Set(elements.map((e) => e.name.trim().toLowerCase()));

  if (!authed) {
    return <PassphraseGate onAuth={() => setAuthed(true)} />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onNewSession={newSession}
        onOpenLibrary={() => setView('library')}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">
        <header className="main-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <span className="main-header-title">{view === 'library' ? 'Library' : 'Dinner Helper'}</span>
        </header>

        {view === 'library' ? (
          <LibraryPage
            elements={elements}
            onAdd={addLibraryElement}
            onEdit={editLibraryElement}
            onDelete={removeLibraryElement}
            onAddToPlate={addToTonightPlate}
            onBack={() => setView('main')}
          />
        ) : (
          <MainScreen
            plate={plate}
            savedNames={savedNames}
            onAddPlateItem={addPlateItem}
            onEditPlateItem={editPlateItem}
            onRemovePlateItem={removePlateItem}
            onRequestSave={requestSave}
            energy={energy}
            onEnergyChange={setEnergy}
            messages={messages}
            onSendPrompt={sendPrompt}
            sending={sending}
            staples={staples}
            onAddStaple={addStaple}
            onRemoveStaple={removeStaple}
          />
        )}
      </main>

      {saveTarget && (
        <SaveElementDialog
          name={saveTarget.text}
          conversation={conversationContext}
          onSaved={() => {
            setSaveTarget(null);
            refreshElements();
          }}
          onCancel={() => setSaveTarget(null)}
        />
      )}
    </div>
  );
}
