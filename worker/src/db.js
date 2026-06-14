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
