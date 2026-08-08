// Job C — Method (docs/prompts-v2.md, updated per docs/simplification.md). Elements are
// free-text strings — there is no structured metadata to send. Equipment, temperature and
// timing are inferred by the model from the description, same as Job D now does.
import { buildProfileBlock } from './profileBlock.js';

const SYSTEM_TEMPLATE = `{PROFILE}

## YOUR TASK
You are given the elements of one dinner — an arbitrary number, not a fixed four, and not
necessarily one of each role. It may include sauces or dressings alongside protein/carb/veg
elements. Produce (1) ingredient quantities for each element, and (2) a single interleaved
cooking timeline covering all of them together.

You are given elements as the user described them, without structured metadata. Infer
equipment, oven temperature and timing from the description. "Oven-roasted potato wedges"
means the oven at roughly 200 °C for around 40 minutes. Where two elements need the oven,
choose one temperature that works for both and adjust timings accordingly. State the
temperature you have chosen in the first step.

The timeline is the important part. Do not write separate recipes stacked on top of each other
— write one schedule for cooking every element as one meal, so everything is ready at the same
time.

## RULES
- Quantities for {servings} servings, in metric.
- Assume pantry staples are available; still list them where a quantity matters.
- Absolute compliance with the dietary rules. If a technique conventionally uses onion or
  garlic, substitute or omit and say nothing about it — the household knows.
- Garlic, where used, is whole cloves added during cooking and removed before serving. State
  the removal explicitly in the step.
- Timeline entries are relative offsets from start: T+0, T+15, T+35.
- Respect the given oven temperatures. If two elements need the oven, stage them so both work
  at the stated temperature.
- Sauces, dressings and other equipment: none elements have no fixed moment they need to
  happen — slot them into dead time created by something else's passive/oven time (e.g. while a
  tray roasts) rather than tacking them on as the last step. A dressing made at T+5 while the
  oven works is better than the same dressing made at T+40 for no reason.
- Account for resting time for meat and fish.
- Steps are terse and imperative. No chat, no encouragement, no explanation of technique the
  cook already knows.
- The final step must bring everything together for plating.

## OUTPUT
Return ONLY JSON. No prose before or after.

{
  "servings": 2,
  "total_active_min": 35,
  "total_elapsed_min": 50,
  "components": [
    {
      "display_name": "oven-roasted potato wedges",
      "ingredients": ["800 g potatoes", "2 tbsp rapeseed oil", "1 tsp paprika", "salt"]
    }
  ],
  "timeline": [
    { "offset_min": 0, "step": "Oven to 200°C. Cut potatoes into wedges, toss with oil and paprika, spread on a tray, in." }
  ],
  "notes": ["Optional. Serving or portioning notes. Omit if there is nothing worth saying."]
}`;

function buildUserMessage({ elements, servings, energy }) {
  const lines = elements.map((text) => `- ${text}`);
  return `Servings: ${servings}

Elements:
${lines.join('\n')}

Effort level: ${energy}`;
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Job C returned non-JSON output');
  }
}

export async function generateMethod(apiKey, { elements, profile, servings, energy }) {
  const systemPrompt = SYSTEM_TEMPLATE.replace('{PROFILE}', buildProfileBlock(profile)).replace(
    '{servings}',
    String(servings)
  );
  const userMessage = buildUserMessage({ elements, servings, energy });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return parseJsonObject(data.content[0].text);
}
