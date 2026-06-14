import { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatInterface({ messages, sending, onSend }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [input]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    onSend(text);
  }

  const isEmpty = messages.length === 0 && !sending;

  return (
    <div className="chat-interface">
      {isEmpty ? (
        <div className="chat-hero">
          <h2>What sounds good for dinner?</h2>
          <p>Tell me what you're craving, what you have, or what kind of meal you're in the mood for.</p>
        </div>
      ) : (
        <div className="message-list">
          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))}
          {sending && <MessageBubble role="assistant" content="" loading />}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="input-area">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="e.g. I want something cosy and comforting with chicken"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="send-btn"
          onClick={submit}
          disabled={!input.trim() || sending}
          aria-label="Send"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
