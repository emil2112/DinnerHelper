import { useState } from 'react';

export default function PromptBar({ onSubmit, disabled, plateEmpty }) {
  const [text, setText] = useState('');

  function submit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || disabled || plateEmpty) return;
    onSubmit(value);
    setText('');
  }

  return (
    <form className="input-area" onSubmit={submit}>
      <input
        type="text"
        className="chat-input"
        placeholder="What are you looking for?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      <button
        type="submit"
        className="send-btn"
        disabled={disabled || plateEmpty || !text.trim()}
        aria-label="Ask"
      >
        ↑
      </button>
    </form>
  );
}
