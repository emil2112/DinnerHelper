import { useState } from 'react';

export default function PromptBar({ onSubmit, disabled, placeholder }) {
  const [text, setText] = useState('');

  function submit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    onSubmit(value);
    setText('');
  }

  return (
    <form className="prompt-bar" onSubmit={submit}>
      <input
        type="text"
        className="prompt-bar-input"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      <button type="submit" className="prompt-bar-send" disabled={disabled || !text.trim()}>
        Ask
      </button>
    </form>
  );
}
