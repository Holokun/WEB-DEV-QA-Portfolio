import { test, expect, ownedDatabase, startApp } from '../fixtures/app.js';
import { expectedGames, expectedNotes } from '../fixtures/expected-data.js';
import { DatabaseSync } from 'node:sqlite';
import { resetTestDatabase } from '../../app/db/reset.js';
import { createApplication } from '../../app/api/application.js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

function snapshot(dbPath: string) {
  const db = new DatabaseSync(dbPath);
  try {
    return {
      games: db.prepare('SELECT id,title,genre,description,release_year AS releaseYear,platforms FROM games ORDER BY id').all().map(row => ({ ...row, platforms: JSON.parse(row.platforms as string) })),
      patchNotes: db.prepare('SELECT id,game_id AS gameId,version,summary,published_at AS publishedAt FROM patch_notes ORDER BY id').all(),
    };
  } finally { db.close(); }
}

test('Suite ownership: databases and owner markers stay outside artifact cleanup', async ({ dbPath }, testInfo) => {
  // Moving owned databases beneath the runner's cleanup directory would erase another invocation's live data.
  for (const candidate of [dbPath, ownedDatabase()]) {
    expect(isAbsolute(candidate)).toBe(true);
    const marker = join(dirname(candidate), '.game-companion-test-owner');
    expect(readFileSync(marker, 'utf8')).toBe('game-companion-test-database-v1\n');
    for (const ownedPath of [candidate, marker]) {
      const fromCleanup = relative(testInfo.project.outputDir, ownedPath);
      const insideCleanup = fromCleanup !== '..' && !fromCleanup.startsWith(`..${sep}`) && !isAbsolute(fromCleanup);
      expect(insideCleanup, `Owned path ${ownedPath} must stay outside cleanup directory ${testInfo.project.outputDir}`).toBe(false);
    }
  }
});

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
  mkdirSync(join(uiDir, 'shared'));
  writeFileSync(join(uiDir, 'shared', 'feedback-validation.js'), 'export const sharedValidator = true;');
  writeFileSync(join(uiDir, 'shared', 'private.sqlite'), 'secret nested database content');
  writeFileSync(join(dirname(dbPath), 'secret.txt'), 'secret parent content');
  const app = await startApp(dbPath, uiDir);
  const request = await playwright.request.newContext({ baseURL: app.baseURL });
  try {
    const home = await request.get('/');
    expect(home.status()).toBe(200);
    expect(await home.text()).toContain('Owned UI');
    expect((await request.get('/styles.css')).status()).toBe(200);
    const validator = await request.get('/shared/feedback-validation.js');
    expect(validator.status()).toBe(200);
    expect(await validator.text()).toBe('export const sharedValidator = true;');
    for (const path of ['/games.sqlite', '/private.sqlite', '/secret.txt', '/package.json', '/../secret.txt', '/%2e%2e/secret.txt', '/%2e%2e%2fsecret.txt', '/ui/../private.sqlite', '/.git/config', '/main.js/../private.sqlite', '/shared/private.sqlite', '/shared/../private.sqlite', '/shared/feedback-validation.js/../private.sqlite']) {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      expect(await response.text()).not.toContain('secret');
    }
  } finally { await request.dispose(); await app.stop(); }
});

test('Application import creates a stopped server; close leaves no conflicting SQLite lock', async ({}) => {
  const dbPath = ownedDatabase();
  const app = createApplication({ dbPath });
  expect(app.server.listening).toBe(false);
  await app.close();
  // An exclusive write proves there is no conflicting SQLite lock; it does not establish handle closure.
  const db = new DatabaseSync(dbPath);
  try { db.exec("BEGIN EXCLUSIVE; UPDATE games SET title='After close' WHERE id=1; COMMIT;"); }
  finally { db.close(); }
});

function feedbackSnapshot(dbPath: string) {
  const db = new DatabaseSync(dbPath);
  try {
    return {
      ...snapshot(dbPath),
      feedback: db.prepare('SELECT id,game_id,email,description FROM feedback ORDER BY id').all(),
      sequence: db.prepare("SELECT seq FROM sqlite_sequence WHERE name='feedback'").get() ?? null,
    };
  } finally { db.close(); }
}
function insertFeedback(dbPath: string): number {
  const db = new DatabaseSync(dbPath);
  try { return Number(db.prepare('INSERT INTO feedback(game_id,email,description) VALUES(?,?,?)').run(1, 'player@example.com', 'Synthetic lifecycle feedback').lastInsertRowid); }
  finally { db.close(); }
}

test('REQ-DATA-01: new database has no feedback and enforces the feedback game reference', async ({}) => {
  const dbPath = ownedDatabase();
  const app = await startApp(dbPath);
  try {
    expect(feedbackSnapshot(dbPath)).toEqual({ games: expectedGames, patchNotes: expectedNotes, feedback: [], sequence: null });
    const db = new DatabaseSync(dbPath);
    try {
      db.exec('PRAGMA foreign_keys=ON');
      expect(() => db.prepare('INSERT INTO feedback(game_id,email,description) VALUES(999,?,?)').run('player@example.com', 'Synthetic foreign key failure')).toThrow(/FOREIGN KEY/);
    } finally { db.close(); }
  } finally { await app.stop(); }
});

test('REQ-DATA-01: old games/notes-only database adds feedback without restoring records', async ({}) => {
  const dbPath = ownedDatabase();
  const db = new DatabaseSync(dbPath);
  try {
    db.exec(`CREATE TABLE games(id INTEGER PRIMARY KEY,title TEXT,genre TEXT,description TEXT,release_year INTEGER,platforms TEXT);
      CREATE TABLE patch_notes(id INTEGER PRIMARY KEY,game_id INTEGER,version TEXT,summary TEXT,published_at TEXT);
      INSERT INTO games VALUES(1,'Existing','Puzzle','Preserve existing game',2000,'["Linux"]');
      INSERT INTO patch_notes VALUES(90,1,'9.0','Preserve existing note','2000-01-01'); PRAGMA user_version=1;`);
  } finally { db.close(); }
  const before = snapshot(dbPath);
  const app = await startApp(dbPath);
  try { expect(feedbackSnapshot(dbPath)).toEqual({ ...before, feedback: [], sequence: null }); }
  finally { await app.stop(); }
});

test('REQ-DATA-01: restart preserves feedback rows and a counter beyond the highest surviving row', async ({}) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const first = await startApp(dbPath);
  await first.stop();
  insertFeedback(dbPath);
  const deletedId = insertFeedback(dbPath);
  const db = new DatabaseSync(dbPath);
  try {
    db.prepare('DELETE FROM feedback WHERE id=?').run(deletedId);
    db.exec(`UPDATE games SET title='Preserved title', genre='Puzzle', description='Preserved description', release_year=2001, platforms='["Linux"]' WHERE id=1;
      DELETE FROM patch_notes WHERE id=3; DELETE FROM games WHERE id=10;
      INSERT INTO games VALUES(11,'Added','Racing','Preserved extra game',2026,'["Linux"]');
      UPDATE patch_notes SET version='9.0',summary='Preserved note',published_at='2026-10-01' WHERE id=1;
      INSERT INTO patch_notes VALUES(5,11,'1.0','Preserved extra note','2026-10-02');`);
  } finally { db.close(); }
  const before = feedbackSnapshot(dbPath);
  const second = await startApp(dbPath);
  try {
    expect(feedbackSnapshot(dbPath)).toEqual(before);
    expect(insertFeedback(dbPath)).toBe(deletedId + 1);
  } finally { await second.stop(); }
});

test('REQ-DATA-01: reset clears feedback and its counter, restores seed, and repeats identically', async ({}) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  insertFeedback(dbPath);
  insertFeedback(dbPath);
  const db = new DatabaseSync(dbPath);
  try { db.exec("UPDATE games SET title='Modified' WHERE id=1; DELETE FROM patch_notes WHERE id=3;"); } finally { db.close(); }
  resetTestDatabase(dbPath);
  expect(feedbackSnapshot(dbPath)).toEqual({ games: expectedGames, patchNotes: expectedNotes, feedback: [], sequence: null });
  const first = feedbackSnapshot(dbPath);
  resetTestDatabase(dbPath);
  expect(feedbackSnapshot(dbPath)).toEqual(first);
  expect(insertFeedback(dbPath)).toBe(1);
});

test('REQ-DATA-01: reset failure immediately before commit rolls back rows and the counter', async ({}) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  insertFeedback(dbPath);
  insertFeedback(dbPath);
  const db = new DatabaseSync(dbPath);
  try { db.exec("UPDATE games SET title='Preserved modified game' WHERE id=1; DELETE FROM patch_notes WHERE id=3; DELETE FROM feedback WHERE id=2;"); } finally { db.close(); }
  const before = feedbackSnapshot(dbPath);
  let callbacks = 0;
  expect(() => resetTestDatabase(dbPath, { beforeCommit: () => {
    callbacks++;
    throw new Error('Isolated pre-commit failure');
  } })).toThrow('Isolated pre-commit failure');
  expect(callbacks).toBe(1);
  expect(feedbackSnapshot(dbPath)).toEqual(before);
  expect(insertFeedback(dbPath)).toBe(3);
});

test('REQ-DATA-01: ownership rejection occurs before reset callback or database mutation', async ({}) => {
  let callbacks = 0;
  expect(() => resetTestDatabase(resolve('data/games.sqlite'), { beforeCommit: () => { callbacks++; } })).toThrow(/owned test directory/i);
  expect(callbacks).toBe(0);
});
