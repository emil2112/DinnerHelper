import { buildSystemPrompt, buildUserMessage } from './systemPrompt.js';

const MODEL = 'claude-sonnet-5';

// Logging-only backstop (docs/dinner-helper-spec.md §6.3 "Safety backstop"). Never blocks the
// response — the prompt has proven reliable live; this exists only to detect drift.
const ONION_RE = /\bonions?\b/i;
const GARLIC_RE = /\bgarlic\b/i;
const REMOVED_RE = /\b(removed?|pulled out|taken out|discarded)\b/i;

function checkBackstop(text) {
  if (ONION_RE.test(text)) {
    console.log(`Backstop: onion mentioned in chat reply: "${text.slice(0, 200)}"`);
  }
  if (GARLIC_RE.test(text) && !REMOVED_RE.test(text)) {
    console.log(`Backstop: garlic without "removed" in chat reply: "${text.slice(0, 200)}"`);
  }
}

// Streams the assistant reply back to the caller as raw text chunks (no SSE envelope — just the
// text deltas, in order) while accumulating the full text server-side. Async and awaited by the
// caller BEFORE any Response is returned: the initial connection to Anthropic is confirmed
// good (or this throws) first, so a bad key or network failure becomes a proper error response
// instead of a silently empty 200 stream. Only once that's confirmed does pumping start.
export async function streamChatReply({ apiKey, history, plate, energy, prompt, staples, savedElements }) {
  const systemPrompt = buildSystemPrompt(staples, savedElements);
  const userContent = buildUserMessage(plate, energy, prompt);
  const messages = [...history, { role: 'user', content: userContent }];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  let resolveFullText;
  let rejectFullText;
  const fullTextPromise = new Promise((resolve, reject) => {
    resolveFullText = resolve;
    rejectFullText = reject;
  });

  const { readable, writable } = new TransformStream();

  (async () => {
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    let fullText = '';
    try {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          let event;
          try {
            event = JSON.parse(data);
          } catch {
            continue;
          }
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            fullText += event.delta.text;
            await writer.write(encoder.encode(event.delta.text));
          }
        }
      }

      checkBackstop(fullText);
      resolveFullText(fullText);
    } catch (e) {
      rejectFullText(e);
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return { readable, fullTextPromise, userContent };
}
