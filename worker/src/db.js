export async function listChats(db) {
  const { results } = await db
    .prepare('SELECT id, title, updated_at FROM chats ORDER BY updated_at DESC')
    .all();
  return results;
}

export async function createChat(db, title) {
  const { meta } = await db
    .prepare('INSERT INTO chats (title, created_at, updated_at) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
    .bind(title)
    .run();
  return meta.last_row_id;
}

export async function getChat(db, id) {
  const chat = await db
    .prepare('SELECT * FROM chats WHERE id = ?')
    .bind(id)
    .first();
  const { results: messages } = await db
    .prepare('SELECT role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC')
    .bind(id)
    .all();
  return { chat, messages };
}

export async function addMessage(db, chatId, role, content) {
  await db
    .prepare('INSERT INTO messages (chat_id, role, content, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
    .bind(chatId, role, content)
    .run();
  await db
    .prepare('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(chatId)
    .run();
}

export async function deleteChat(db, id) {
  await db.prepare('DELETE FROM chats WHERE id = ?').bind(id).run();
}

export async function renameChat(db, id, title) {
  await db.prepare('UPDATE chats SET title = ? WHERE id = ?').bind(title, id).run();
}

export async function listPantry(db) {
  const { results } = await db
    .prepare('SELECT * FROM pantry_staples ORDER BY category, name')
    .all();
  return results;
}

export async function addPantryItem(db, category, name, notes) {
  const { meta } = await db
    .prepare('INSERT INTO pantry_staples (category, name, notes) VALUES (?, ?, ?)')
    .bind(category, name, notes || null)
    .run();
  return meta.last_row_id;
}

export async function deletePantryItem(db, id) {
  await db.prepare('DELETE FROM pantry_staples WHERE id = ?').bind(id).run();
}

function parseComponentRow(r) {
  return {
    ...r,
    texture_tags: JSON.parse(r.texture_tags),
    flavour_tags: JSON.parse(r.flavour_tags),
    season_months: JSON.parse(r.ingredient_season_months),
  };
}

const COMPONENT_SELECT = `
  SELECT c.*, i.name AS ingredient_name, i.season_months AS ingredient_season_months
  FROM components c
  JOIN ingredients i ON i.id = c.ingredient_id
`;

export async function listApprovedComponents(db) {
  const { results } = await db.prepare(`${COMPONENT_SELECT} WHERE c.status = 'approved'`).all();
  return results.map(parseComponentRow);
}

export async function getComponentsByIds(db, ids) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  const { results } = await db
    .prepare(`${COMPONENT_SELECT} WHERE c.id IN (${placeholders})`)
    .bind(...ids)
    .all();
  return results.map(parseComponentRow);
}

// Autocomplete: match against display_name or a recorded alias. LEFT JOIN can produce one row
// per matching alias for the same component, so dedupe by id before returning.
export async function searchComponents(db, query, limit = 8) {
  const like = `%${query}%`;
  const { results } = await db
    .prepare(`
      SELECT c.*, i.name AS ingredient_name, i.season_months AS ingredient_season_months
      FROM components c
      JOIN ingredients i ON i.id = c.ingredient_id
      LEFT JOIN component_aliases a ON a.component_id = c.id
      WHERE c.status = 'approved' AND (c.display_name LIKE ? OR a.alias LIKE ?)
      ORDER BY c.display_name
    `)
    .bind(like, like)
    .all();
  const seen = new Map();
  for (const r of results) {
    if (!seen.has(r.id)) seen.set(r.id, parseComponentRow(r));
  }
  return [...seen.values()].slice(0, limit);
}

// Find-or-create the ingredient/technique pair a new component needs. Manual and saved-suggestion
// components reuse this rather than requiring a curated ingredient/technique to already exist —
// the ingredient becomes the element's own name, and the technique is a generic per-equipment
// bucket, since a typed-in element like "lemon-dill dressing" isn't naturally an existing
// ingredient x technique pair the way seeded components are.
async function findOrCreateIngredient(db, name, role) {
  const existing = await db.prepare('SELECT id FROM ingredients WHERE name = ?').bind(name).first();
  if (existing) return existing.id;
  const { meta } = await db
    .prepare("INSERT INTO ingredients (name, role, season_months) VALUES (?, ?, '[]')")
    .bind(name, role)
    .run();
  return meta.last_row_id;
}

async function findOrCreateTechnique(db, equipment, activeMin) {
  const name = `manual-${equipment}`;
  const existing = await db.prepare('SELECT id FROM techniques WHERE name = ?').bind(name).first();
  if (existing) return existing.id;
  const { meta } = await db
    .prepare('INSERT INTO techniques (name, equipment, default_active_min, default_passive_min) VALUES (?, ?, ?, 0)')
    .bind(name, equipment, activeMin)
    .run();
  return meta.last_row_id;
}

export async function createComponent(db, fields, source) {
  const {
    display_name, role, equipment, active_min, passive_min = 0,
    oven_temp_c = null, serve_temp = 'hot', texture_tags = [], flavour_tags = [],
  } = fields;

  const ingredientId = await findOrCreateIngredient(db, display_name, role);
  const techniqueId = await findOrCreateTechnique(db, equipment, active_min);

  const existing = await db
    .prepare('SELECT id FROM components WHERE ingredient_id = ? AND technique_id = ?')
    .bind(ingredientId, techniqueId)
    .first();
  if (existing) return getComponentsByIds(db, [existing.id]).then((rows) => rows[0]);

  const { meta } = await db
    .prepare(`
      INSERT INTO components (
        ingredient_id, technique_id, display_name, role, equipment, active_min, passive_min,
        oven_temp_c, serve_temp, texture_tags, flavour_tags, status, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)
    `)
    .bind(
      ingredientId, techniqueId, display_name, role, equipment, active_min, passive_min,
      oven_temp_c, serve_temp, JSON.stringify(texture_tags), JSON.stringify(flavour_tags), source
    )
    .run();

  return getComponentsByIds(db, [meta.last_row_id]).then((rows) => rows[0]);
}

export async function getProfile(db) {
  return db.prepare('SELECT * FROM profile WHERE id = 1').first();
}

export async function recordSuggestion(db, componentIds) {
  await db
    .prepare('INSERT INTO suggestions (component_ids, accepted) VALUES (?, 0)')
    .bind(JSON.stringify(componentIds))
    .run();
}

export async function listRecentSuggestionComponentIds(db, limit = 5) {
  const { results } = await db
    .prepare('SELECT component_ids FROM suggestions ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all();
  const ids = new Set();
  for (const row of results) {
    for (const id of JSON.parse(row.component_ids)) ids.add(id);
  }
  return ids;
}

export function plateSignature(componentIds) {
  return [...componentIds].sort((a, b) => a - b).join(',');
}

export async function getCachedMethod(db, signature, servings) {
  const row = await db
    .prepare('SELECT payload FROM method_cache WHERE plate_signature = ? AND servings = ?')
    .bind(signature, servings)
    .first();
  return row ? JSON.parse(row.payload) : null;
}

export async function cacheMethod(db, signature, servings, payload) {
  await db
    .prepare('INSERT OR REPLACE INTO method_cache (plate_signature, servings, payload) VALUES (?, ?, ?)')
    .bind(signature, servings, JSON.stringify(payload))
    .run();
}

export async function listRecipes(db) {
  const { results } = await db
    .prepare('SELECT * FROM saved_recipes ORDER BY created_at DESC')
    .all();
  return results;
}

export async function saveRecipe(db, title, content, sourceChatId) {
  const { meta } = await db
    .prepare('INSERT INTO saved_recipes (title, content, source_chat_id) VALUES (?, ?, ?)')
    .bind(title, content, sourceChatId || null)
    .run();
  return meta.last_row_id;
}

export async function deleteRecipe(db, id) {
  await db.prepare('DELETE FROM saved_recipes WHERE id = ?').bind(id).run();
}
