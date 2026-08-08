// Job D — Plate completion (docs/prompts-v2.md, rewritten per docs/simplification.md). Elements
// are free-text strings now — no role/equipment/serve_temp metadata exists to send or receive.
import { buildProfileBlock } from './profileBlock.js';

const SYSTEM_TEMPLATE = `{PROFILE}

## YOUR TASK
The user is assembling a dinner plate from separate elements, described in their own words.
You will be given the elements already on the plate, and optionally a request from the user.

Suggest additions that would complete or improve the plate.

## RULES
- Read the plate as a whole. What is missing — protein, a carbohydrate, a cold element,
  acidity, texture, colour?
- Never suggest something already on the plate, or a variation of it. If the plate has roasted
  chicken, do not suggest any other chicken, or any other main protein, unless the user asks.
- If everything on the plate is hot and cooked, a cold or acidic element is almost always the
  right answer. This is the most reliable single improvement to their plates.
- Infer equipment from how the user described each element. "Oven-roasted" means the oven is
  in use; "pan-seared" means a hob ring is busy. Avoid suggesting a third or fourth thing that
  needs the same equipment at the same time, and say so briefly when it constrains you.
- Obey the dietary rules absolutely. Onion is the most common failure — check yourself.
- GARLIC: only ever as whole cloves added during cooking and removed before serving. Never name
  a suggestion in a way that implies garlic remains in the dish. "Spinach with garlic" is
  WRONG. "Spinach wilted with a whole garlic clove, removed" is correct, and better still is a
  suggestion that simply doesn't need garlic.
- If the user has made a request in their own words, it outranks your own read of the plate.
  "Something lighter" means lighter, even if you think it needs a carb.
- Be specific and confident. "Cucumber and dill salad with lemon" is useful. "A fresh salad"
  is not.
- Suggest 3 additions, each genuinely different from the others — not three salads.

## OUTPUT
Return ONLY a JSON array. No prose before or after.

[
  {
    "text": "cucumber and dill salad with lemon",
    "why": "One short sentence on what it adds to THIS plate specifically."
  }
]

"text" is what will appear in the user's plate box — write it the way they would.
"why" must reference the actual plate. "Cuts through two rich oven elements" is right.
"Fresh and healthy" is not.`;

// Server-side backstop for the two failure modes seen live (docs/simplification.md): reject any
// suggestion whose text mentions onion at all, or mentions garlic without also saying it's
// removed. This is deliberately blunt string matching, not an LLM judgement call.
const ONION_RE = /\bonions?\b/i;
const GARLIC_RE = /\bgarlic\b/i;
const REMOVED_RE = /removed?\b/i;

function violatesDietaryRules(text) {
  if (ONION_RE.test(text)) return true;
  if (GARLIC_RE.test(text) && !REMOVED_RE.test(text)) return true;
  return false;
}

function buildUserMessage({ elements, energy, month, userRequest, recentMealElementNames }) {
  const lines = elements.map((text) => `- ${text}`);
  return `Current plate:
${lines.length ? lines.join('\n') : '(empty — nothing added yet)'}

Effort level: ${energy}
Current month: ${month} (Denmark)

${userRequest || 'No specific request. Suggest what would complete this plate.'}

Recently cooked (avoid repeating):
${recentMealElementNames.length ? recentMealElementNames.join(', ') : 'None logged yet.'}`;
}

function parseJsonArray(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Job D returned non-JSON output');
  }
}

export async function suggestAdditions(apiKey, params) {
  const { profile, history = [] } = params;
  const systemPrompt = SYSTEM_TEMPLATE.replace('{PROFILE}', buildProfileBlock(profile));
  const userMessage = buildUserMessage(params);
  const messages = [...history, { role: 'user', content: userMessage }];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const replyText = data.content[0].text;
  const parsed = parseJsonArray(replyText);

  const suggestions = [];
  for (const s of parsed) {
    if (violatesDietaryRules(s.text)) {
      console.log(`Job D rejected (dietary rule backstop): "${s.text}"`);
      continue;
    }
    suggestions.push(s);
  }

  return { suggestions, userMessage, replyText };
}
