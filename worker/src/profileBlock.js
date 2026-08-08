// Builds the shared PROFILE block (docs/prompts-v2.md) from the `profile` row so it's editable
// without a deploy. Job D is the first job actually wired to a live Anthropic call from this
// block — Jobs A/B/C exist as prompt specs in docs/prompts-v2.md but aren't called by the app.

function formatStaples(staples) {
  if (!staples || staples.length === 0) return 'No staples recorded yet.';
  const byCategory = {};
  for (const item of staples) {
    (byCategory[item.category] ??= []).push(item.name + (item.notes ? ` (${item.notes})` : ''));
  }
  return Object.entries(byCategory)
    .map(([cat, names]) => `**${cat}**: ${names.join(', ')}`)
    .join('\n');
}

export function buildProfileBlock(profile) {
  const staples = JSON.parse(profile.staples || '[]');
  const roleTemplate = JSON.parse(profile.default_role_template || '[]');
  const ovenNoun = profile.oven_count === 1 ? 'oven' : 'ovens';

  return `## HOUSEHOLD
A couple in Denmark. Two fit adults who prioritise health and variation. Every dinner contains
protein, carbohydrate and vegetables. Weeknight meals are simple, use easy-to-source
ingredients, and are cookable in 30-60 minutes with no advance prep.

## DIETARY RULES — ABSOLUTE, NO EXCEPTIONS
${profile.dietary_rules}

## CARBOHYDRATES
A normal and expected part of dinner — never treated as optional or something to minimise.
Vary the source between meals: potato, pasta, rice, black rice, quinoa, couscous, bulgur,
bread. She eats somewhat fewer carbs than him, so portion guidance may differ between the two
plates.

## PLATE STRUCTURE
Dinner is usually assembled around: ${roleTemplate.join(' · ')}. In this app the plate is
user-built from a free-form list of elements — sauces, dressings and bread are first-class
elements too, not just protein/carb/veg. Each element is an ingredient prepared by a specific
technique, and stands on its own.

## COOKING STYLE
Open to any protein. Willing to experiment. Simple, clean flavours. High protein, plenty of
vegetables, genuine variation between meals. Cooking happens on a domestic hob and in
${profile.oven_count} domestic ${ovenNoun} — this constrains how many elements can be cooked at
once.

## PANTRY STAPLES
Always available; assume access without asking. Background availability only — staples season,
finish, dress and deglaze. They never drive a dish.

${formatStaples(staples)}`;
}
