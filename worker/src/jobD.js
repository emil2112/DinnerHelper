// Job D — Plate completion (docs/prompts-v2.md). Called from the suggestion panel: the default
// "Suggest an addition" tap and free-text prompt-bar submissions both land here.
import { buildProfileBlock } from './profileBlock.js';

const SYSTEM_TEMPLATE = `{PROFILE}

## YOUR TASK
The user is assembling a dinner plate from separate elements. You will be given the elements
already on the plate, and optionally a request in their own words.

Suggest additions that would complete or improve the plate.

## RULES
- Look at the plate as a whole. What is it missing — protein, a carbohydrate, a cold element,
  acidity, texture, colour?
- If everything on the plate is hot and cooked, a cold or acidic element is almost always the
  right answer. This is the single most reliable improvement to their plates.
- Respect the equipment state you are given. If the oven is full or at a fixed temperature,
  suggest hob or no-cook elements and say so briefly.
- Respect the time budget. If they have 10 minutes of hands-on time left, do not suggest
  something needing 25.
- Obey the dietary rules absolutely. Onion in any form is the most common failure — check
  yourself before answering.
- If the user has made a request in their own words, that request outranks your own read of
  the plate. "Something lighter" means lighter, even if you think it needs a carb.
- Be specific and confident. "Cucumber and dill salad with lemon" is useful. "A fresh salad"
  is not.
- Suggest 3 additions. Each genuinely different from the others — not three salads.
- Never suggest something already on the plate, or a near-duplicate of it.

## OUTPUT
Return ONLY a JSON array. No prose before or after.

[
  {
    "display_name": "cucumber and dill salad with lemon",
    "role": "veg",
    "equipment": "none",
    "active_min": 8,
    "passive_min": 0,
    "oven_temp_c": null,
    "serve_temp": "cold",
    "texture_tags": ["crunchy", "fresh"],
    "flavour_tags": ["acidic", "herbal"],
    "method_summary": "One sentence on how it's made.",
    "why": "One short sentence on what it adds to THIS plate specifically."
  }
]

Field rules:
- "equipment": one of "oven" | "hob" | "none" | "grill"
- "oven_temp_c": REQUIRED integer when equipment is "oven", otherwise null
- "role": one of "protein" | "carb" | "veg" | "sauce" | "bread" | "other"`;

function equipmentState(plateComponents) {
  const ovenComponents = plateComponents.filter((c) => c.equipment === 'oven');
  if (ovenComponents.length === 0) return 'free';
  const temps = [...new Set(ovenComponents.map((c) => c.oven_temp_c))];
  return `in use at ${temps.join('°C / ')}°C`;
}

function buildUserMessage({ plateComponents, profile, energy, budget, month, userRequest, recentMealElementNames }) {
  const lines = plateComponents.map(
    (c) =>
      `${c.display_name} | ${c.role} | ${c.equipment} | ${c.oven_temp_c ?? 'n/a'} | ${c.serve_temp} | ${c.flavour_tags.join(',')} | ${c.active_min} min`
  );
  const hobCount = plateComponents.filter((c) => c.equipment === 'hob').length;
  const activeSum = plateComponents.reduce((s, c) => s + c.active_min, 0);

  return `Current plate:
${lines.length ? lines.join('\n') : '(empty — nothing added yet)'}

Oven state: ${equipmentState(plateComponents)}
Hob elements in use: ${hobCount} of ${profile.hob_capacity}
Active minutes used: ${activeSum} of ${budget.active_cap_min} (${energy})
Current month: ${month} (Denmark)

${userRequest || 'No specific request. Suggest what would complete this plate.'}

Recent meals (avoid repeating):
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
  return { suggestions: parseJsonArray(replyText), userMessage, replyText };
}
