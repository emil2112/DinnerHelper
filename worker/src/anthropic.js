import systemPromptTemplate from '../system-prompt.md';

function formatPantry(items) {
  if (!items || items.length === 0) return 'No staples recorded yet.';
  const byCategory = {};
  for (const item of items) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item.name + (item.notes ? ` (${item.notes})` : ''));
  }
  return Object.entries(byCategory)
    .map(([cat, names]) => `**${cat}**: ${names.join(', ')}`)
    .join('\n');
}

export async function callAnthropic(apiKey, messages, pantryItems) {
  const systemPrompt = systemPromptTemplate.replace(
    '[INJECTED DYNAMICALLY FROM APP SETTINGS]',
    formatPantry(pantryItems)
  );

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}
