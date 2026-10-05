import { test, expect, ownedDatabase, startApp } from '../fixtures/app.js';
import { expectedGames, expectedNotes } from '../fixtures/expected-data.js';
import { DatabaseSync } from 'node:sqlite';
import { resetTestDatabase } from '../../app/db/reset.js';
import { createApplication } from '../../app/api/application.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

function snapshot(dbPath: string) {
  const db = new DatabaseSync(dbPath);
  try {
    return {
      games: db.prepare('SELECT id,title,genre,description,release_year AS releaseYear,platforms FROM games ORDER BY id').all().map(row => ({ ...row, platforms: JSON.parse(row.platforms as string) })),
      patchNotes: db.prepare('SELECT id,game_id AS gameId,version,summary,published_at AS publishedAt FROM patch_notes ORDER BY id').all(),
    };
  } finally { db.close(); }
}

test('TEST-DATA-01 current slice: new path seeds every literal game/note field once', async ({}) => {
  const dbPath = ownedDatabase();
  const app = await startApp(dbPath);
  try { expect(snapshot(dbPath)).toEqual({ games: expectedGames, patchNotes: expectedNotes }); }
  finally { await app.stop(); }
});

test('TEST-DATA-01 current slice: restart preserves changed, added, and deleted records', async ({}) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const first = await startApp(dbPath);
  await first.stop();
  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`UPDATE games SET title='Changed', genre='Puzzle', description='Changed description', release_year=2001, platforms='["Linux"]' WHERE id=1;
      DELETE FROM patch_notes WHERE id=3;
      DELETE FROM games WHERE id=10;
      INSERT INTO games VALUES(11,'Extra','Racing','An extra fictional racer.',2026,'["Linux"]');
      UPDATE patch_notes SET version='9.0',summary='Changed note',published_at='2026-10-01' WHERE id=1;
      INSERT INTO patch_notes VALUES(5,11,'1.0','Extra note','2026-10-02');`);
  } finally { db.close(); }
  const before = snapshot(dbPath);
  const second = await startApp(dbPath);
  try { expect(snapshot(dbPath)).toEqual(before); } finally { await second.stop(); }
});

test('TEST-DATA-01 current slice: explicit reset restores every seed field and is idempotent', async ({}) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`DELETE FROM patch_notes; DELETE FROM games;
      INSERT INTO games VALUES(50,'Wrong','Action','Wrong description',1900,'[]');
      INSERT INTO patch_notes VALUES(50,50,'wrong','Wrong note','2000-01-01');`);
  } finally { db.close(); }
  resetTestDatabase(dbPath);
  expect(snapshot(dbPath)).toEqual({ games: expectedGames, patchNotes: expectedNotes });
  const first = snapshot(dbPath);
  resetTestDatabase(dbPath);
  expect(snapshot(dbPath)).toEqual(first);
});

test('TEST-DATA-01 current slice: reset refuses relative and ordinary development paths', async ({}) => {
  expect(() => resetTestDatabase('test-results/games.sqlite')).toThrow(/absolute/i);
  expect(() => resetTestDatabase(resolve('data/games.sqlite'))).toThrow(/owned test directory/i);
  const unowned = resolve('test-results/unowned/games.sqlite');
  mkdirSync(dirname(unowned), { recursive: true });
  expect(() => resetTestDatabase(unowned)).toThrow(/owned test directory/i);
});

test('REQ-API-06: static allowlist does not disclose database, repository, or parent files', async ({ playwright }) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const uiDir = join(dirname(dbPath), 'ui');
  mkdirSync(uiDir);
  writeFileSync(join(uiDir, 'index.html'), '<!doctype html><title>Owned UI</title>');
  writeFileSync(join(uiDir, 'styles.css'), 'body { color: black; }');
  writeFileSync(join(uiDir, 'private.sqlite'), 'secret database content');
  writeFileSync(join(dirname(dbPath), 'secret.txt'), 'secret parent content');
  const app = await startApp(dbPath, uiDir);
  const request = await playwright.request.newContext({ baseURL: app.baseURL });
  try {
    const home = await request.get('/');
    expect(home.status()).toBe(200);
    expect(await home.text()).toContain('Owned UI');
    expect((await request.get('/styles.css')).status()).toBe(200);
    for (const path of ['/games.sqlite', '/private.sqlite', '/secret.txt', '/package.json', '/../secret.txt', '/%2e%2e/secret.txt', '/%2e%2e%2fsecret.txt', '/ui/../private.sqlite', '/.git/config', '/main.js/../private.sqlite']) {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      expect(await response.text()).not.toContain('secret');
    }
  } finally { await request.dispose(); await app.stop(); }
});

test('Application import creates a stopped server; close releases its database', async ({}) => {
  const dbPath = ownedDatabase();
  const app = createApplication({ dbPath });
  expect(app.server.listening).toBe(false);
  await app.close();
  // Real exclusive schema write verifies that cleanup did not leave a transaction or connection holding a lock.
  const db = new DatabaseSync(dbPath);
  try { db.exec("BEGIN EXCLUSIVE; UPDATE games SET title='After close' WHERE id=1; COMMIT;"); }
  finally { db.close(); }
});
