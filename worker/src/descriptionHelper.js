// docs/dinner-helper-spec.md §6.2 — a single short call, not a chat, no system prompt.
const MODEL = 'claude-sonnet-5';

function buildPrompt(name, conversation) {
  const lines = [
    'Write a one-sentence description of this dish, as the person who cooks it would describe it to',
    "themselves. Mention the main ingredients and how it's prepared. Plain and factual — no",
    'adjectives like "delicious" or "vibrant". Return only the sentence.',
    '',
    `Dish: ${name}`,
  ];
  if (conversation) lines.push(conversation);
  return lines.join('\n');
}

export async function describeElement(apiKey, name, conversation) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: 'user', content: buildPrompt(name, conversation) }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text.trim();
}
