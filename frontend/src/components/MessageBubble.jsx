import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageBubble({ role, content, loading }) {
  if (role === 'user') {
    return (
      <div className="bubble-row user">
        <div className="bubble user-bubble">{content}</div>
      </div>
    );
  }

  return (
    <div className="bubble-row assistant">
      <div className={`bubble assistant-bubble${loading ? ' loading' : ''}`}>
        {loading ? (
          <span className="typing-dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}
