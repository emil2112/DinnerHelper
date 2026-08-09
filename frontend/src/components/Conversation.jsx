import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// messages.content for a user row is the full assembled template server-side ("Tonight's
// plate:\n...\n\n{prompt}"), but the box grid above already shows the plate — re-showing it in
// the bubble would be noise. Extract just the trailing prompt for display.
function displayText(content) {
  const idx = content.lastIndexOf('\n\n');
  return idx === -1 ? content : content.slice(idx + 2);
}

export default function Conversation({ messages }) {
  if (messages.length === 0) return null;

  return (
    <div className="message-list">
      {messages.map((m, i) => (
        <div className={`bubble-row ${m.role}`} key={i}>
          <div className={`bubble ${m.role}-bubble${m.streaming && !m.content ? ' loading' : ''}${m.error ? ' error' : ''}`}>
            {m.role === 'assistant' ? (
              m.streaming && !m.content ? (
                <span className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              )
            ) : (
              displayText(m.content)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
