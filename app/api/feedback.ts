import type { IncomingMessage } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';
import { validateFeedback } from '../shared/feedback-validation.js';
import { apiError, type ApiResult } from './games.js';

export async function handleFeedback(url: URL, request: IncomingMessage, db: DatabaseSync): Promise<ApiResult> {
  if ([...url.searchParams.keys()].length) {
    request.resume();
    return apiError(400, 'INVALID_QUERY', 'Invalid query parameters.');
  }
  const chunks: Buffer[] = [];
  // Stream errors propagate to the application's guarded generic error response.
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  let body: unknown;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { return apiError(400, 'INVALID_BODY', 'Invalid feedback body.'); }
  const validation = validateFeedback(body);
  if (!validation.valid) return apiError(400, 'INVALID_BODY', 'Invalid feedback body.');
  const { gameId, email, description } = validation.value;
  if (!db.prepare('SELECT id FROM games WHERE id=?').get(gameId)) return apiError(404, 'NOT_FOUND', 'Game not found.');
  db.exec('BEGIN IMMEDIATE');
  try {
    const inserted = db.prepare('INSERT INTO feedback(game_id,email,description) VALUES(?,?,?)').run(gameId, email, description);
    const id = Number(inserted.lastInsertRowid);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Feedback ID must be a positive safe integer.');
    db.exec('COMMIT');
    return { status: 201, body: { id } };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
