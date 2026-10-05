import { DatabaseSync } from 'node:sqlite';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSchema, insertSeed } from './database.js';

function assertOwnedTestPath(dbPath: string): void {
  if (!isAbsolute(dbPath)) throw new Error('Test database path must be absolute.');
  if (resolve(dbPath) === resolve('data/games.sqlite')) throw new Error('Reset requires an explicitly owned test directory.');
  let directory: string;
  try { directory = realpathSync(dirname(dbPath)); }
  catch { throw new Error('Reset requires an explicitly owned test directory.'); }
  if (existsSync(dbPath) && lstatSync(dbPath).isSymbolicLink()) throw new Error('Reset requires an explicitly owned test directory, without a database symlink.');
  while (true) {
    const marker = join(directory, '.game-companion-test-owner');
    if (existsSync(marker) && readFileSync(marker, 'utf8') === 'game-companion-test-database-v1\n') return;
    const parent = dirname(directory);
    if (parent === directory) throw new Error('Reset requires an explicitly owned test directory.');
    directory = parent;
  }
}

export function resetTestDatabase(dbPath: string): void {
  assertOwnedTestPath(dbPath);
  const db = new DatabaseSync(dbPath);
  try {
    db.exec('PRAGMA foreign_keys=ON; BEGIN IMMEDIATE');
    try {
      createSchema(db);
      db.exec('DELETE FROM patch_notes; DELETE FROM games;');
      insertSeed(db);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  } finally { db.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.env.DB_PATH) throw new Error('DB_PATH must identify an absolute owned test database.');
  resetTestDatabase(process.env.DB_PATH);
  console.log('Owned test database reset to fixture version 1.');
}
