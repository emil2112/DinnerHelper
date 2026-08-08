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

// Autocomplete (docs/simplification.md): element_history first (ranked by use), then
// components.display_name as a starting corpus once history runs dry. Plain strings only —
// components/ingredients/techniques are kept around solely to seed this, nothing else reads
// role/equipment/tags from them any more.
export async function searchElements(db, query, limit = 8) {
  const like = `%${query}%`;

  const { results: historyResults } = await db
    .prepare('SELECT text FROM element_history WHERE text LIKE ? ORDER BY times_used DESC, last_used_at DESC LIMIT ?')
    .bind(like, limit)
    .all();

  const seen = new Set(historyResults.map((r) => r.text.toLowerCase()));
  const out = historyResults.map((r) => r.text);

  if (out.length < limit) {
    const { results: componentResults } = await db
      .prepare('SELECT DISTINCT display_name FROM components WHERE display_name LIKE ? LIMIT ?')
      .bind(like, limit)
      .all();
    for (const r of componentResults) {
      if (out.length >= limit) break;
      const key = r.display_name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r.display_name);
    }
  }

  return out;
}

export async function getProfile(db) {
  return db.prepare('SELECT * FROM profile WHERE id = 1').first();
}

// Hash of the sorted, lowercased, trimmed element strings, joined with servings to form the
// method_cache key (docs/simplification.md).
export async function plateSignature(elements) {
  const normalized = elements
    .map((e) => e.trim().toLowerCase())
    .sort()
    .join('|');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
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
