import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { seedGames, seedPatchNotes } from './seed.js';

export function createSchema(db: DatabaseSync): void {
  db.exec(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY, title TEXT NOT NULL, genre TEXT NOT NULL,
    description TEXT NOT NULL, release_year INTEGER NOT NULL, platforms TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS patch_notes (
    id INTEGER PRIMARY KEY, game_id INTEGER NOT NULL REFERENCES games(id),
    version TEXT NOT NULL, summary TEXT NOT NULL, published_at TEXT NOT NULL
  );`);
}

export function insertSeed(db: DatabaseSync): void {
  const game = db.prepare('INSERT INTO games (id,title,genre,description,release_year,platforms) VALUES (?,?,?,?,?,?)');
  for (const row of seedGames) game.run(row.id, row.title, row.genre, row.description, row.releaseYear, JSON.stringify(row.platforms));
  const note = db.prepare('INSERT INTO patch_notes (id,game_id,version,summary,published_at) VALUES (?,?,?,?,?)');
  for (const row of seedPatchNotes) note.run(row.id, row.gameId, row.version, row.summary, row.publishedAt);
  db.exec('PRAGMA user_version=1');
}

export function openDatabase(dbPath: string): DatabaseSync {
  const isNew = !existsSync(dbPath);
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    if (isNew) {
      db.exec('BEGIN IMMEDIATE');
      try { createSchema(db); insertSeed(db); db.exec('COMMIT'); }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    return db;
  } catch (error) { db.close(); throw error; }
}
