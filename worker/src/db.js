export async function listSessions(db) {
  const { results } = await db
    .prepare('SELECT id, title, updated_at FROM sessions ORDER BY updated_at DESC')
    .all();
  return results;
}

export async function getSessionWithMessages(db, id) {
  const session = await db.prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first();
  const { results: messages } = await db
    .prepare('SELECT id, role, content, plate, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC')
    .bind(id)
    .all();
  return { session, messages };
}

export async function createSession(db, title) {
  const { meta } = await db
    .prepare('INSERT INTO sessions (title, created_at, updated_at) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
    .bind(title)
    .run();
  return meta.last_row_id;
}

export async function renameSession(db, id, title) {
  await db.prepare('UPDATE sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(title, id).run();
}

export async function deleteSession(db, id) {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
}

// role+content only — this is what gets replayed as the `messages` array for the next API call.
export async function getMessageHistory(db, sessionId) {
  const { results } = await db
    .prepare('SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC')
    .bind(sessionId)
    .all();
  return results;
}

export async function addMessage(db, sessionId, role, content, plate) {
  await db
    .prepare('INSERT INTO messages (session_id, role, content, plate, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)')
    .bind(sessionId, role, content, plate)
    .run();
  await db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(sessionId).run();
}

export async function listElements(db) {
  const { results } = await db.prepare('SELECT * FROM elements ORDER BY name COLLATE NOCASE').all();
  return results;
}

export async function createElement(db, name, description) {
  const { meta } = await db
    .prepare('INSERT INTO elements (name, description, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
    .bind(name, description || null)
    .run();
  return meta.last_row_id;
}

export async function updateElement(db, id, fields) {
  const sets = [];
  const values = [];
  if (fields.name !== undefined) {
    sets.push('name = ?');
    values.push(fields.name);
  }
  if (fields.description !== undefined) {
    sets.push('description = ?');
    values.push(fields.description);
  }
  sets.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  await db.prepare(`UPDATE elements SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
}

export async function deleteElement(db, id) {
  await db.prepare('DELETE FROM elements WHERE id = ?').bind(id).run();
}

export async function getSettings(db) {
  return db.prepare('SELECT * FROM settings WHERE id = 1').first();
}

export async function updateStaples(db, staples) {
  await db
    .prepare('UPDATE settings SET pantry_staples = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
    .bind(JSON.stringify(staples))
    .run();
}
