import { test, expect, ownedDatabase, startApp } from '../fixtures/app.js';
import { expectedGames, expectedNotes } from '../fixtures/expected-data.js';
import { DatabaseSync } from 'node:sqlite';
import { resetTestDatabase } from '../../app/db/reset.js';

test('TEST-API-01: catalogue returns all exact fields in folded code-point order', async ({ request }) => {
  const response = await request.get('/api/games');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = await response.json();
  expect(body).toEqual({ games: [expectedGames[9], expectedGames[5], expectedGames[4], expectedGames[7], expectedGames[8], expectedGames[6], expectedGames[0], expectedGames[1], expectedGames[3], expectedGames[2]], total: 10, filters: { search: '', genre: '' } });
  expect(body.games.map((game: { id: number }) => game.id)).toEqual([10, 6, 5, 8, 9, 7, 1, 2, 4, 3]);
});

for (const [query, ids, search, genre] of [
  ['search=Ember', [6, 5], 'Ember', ''], ['genre=RPG', [6, 2], '', 'RPG'],
  ['search=%20%20Ember%20%20&genre=RPG', [6], 'Ember', 'RPG'],
  ['search=%20%20&genre=RPG', [6, 2], '', 'RPG'],
  ['search=Orbit', [1, 2], 'Orbit', ''], ['search=%C3%89CH', [3], 'ÉCH', ''],
  ['search=%C3%A9ch', [], 'éch', ''], ['search=echo', [], 'echo', ''],
  ['search=no-such-title', [], 'no-such-title', ''],
  ['search=Ember%20%20Quest', [], 'Ember  Quest', ''],
  ['search=&genre=', [10, 6, 5, 8, 9, 7, 1, 2, 4, 3], '', ''],
] as const) test(`TEST-API-01: literal filters ${query}`, async ({ request }) => {
  const response = await request.get(`/api/games?${query}`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.games.map((game: { id: number }) => game.id)).toEqual(ids);
  expect(body.total).toBe(ids.length);
  expect(body.filters).toEqual({ search, genre });
});

for (const search of ["' OR 1=1 --", '%', '_', '[Orbit]', '.*', 'Orbit; DROP TABLE games;'])
  test(`TEST-API-01: punctuation is literal data ${search}`, async ({ request }) => {
    const response = await request.get(`/api/games?search=${encodeURIComponent(search)}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ games: [], total: 0, filters: { search, genre: '' } });
    expect((await (await request.get('/api/games')).json()).total).toBe(10);
  });

for (const character of ['a', '🎮']) for (const length of [80, 81])
  test(`TEST-API-01: trimmed ${character} boundary ${length}`, async ({ request }) => {
    const value = character.repeat(length);
    const response = await request.get(`/api/games?search=${encodeURIComponent(`  ${value}  `)}`);
    expect(response.status()).toBe(length === 80 ? 200 : 400);
    if (length === 80) expect(await response.json()).toEqual({ games: [], total: 0, filters: { search: value, genre: '' } });
    else expect((await response.json()).error.code).toBe('INVALID_QUERY');
  });

for (const query of ['foo=x', 'Search=Orbit', 'Genre=Action', 'search=x&search=y', 'search=&search=', 'genre=RPG&genre=Action', '=x', 'genre=action', 'genre=%20RPG', 'genre=RPG%20', 'genre=Unknown'])
  test(`TEST-API-01: rejects invalid query ${query}`, async ({ request }) => {
    const response = await request.get(`/api/games?${query}`);
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: { code: 'INVALID_QUERY', message: expect.any(String) } });
  });

test('TEST-API-01: all strict genre values are accepted', async ({ request }) => {
  for (const [genre, ids] of [['Action', [8, 1]], ['Adventure', [5]], ['Puzzle', [9, 3]], ['Racing', [7]], ['RPG', [6, 2]], ['Strategy', [10, 4]]] as const) {
    const response = await request.get(`/api/games?genre=${genre}`);
    expect(response.status()).toBe(200);
    expect((await response.json()).games.map((game: { id: number }) => game.id)).toEqual(ids);
  }
});

test('TEST-API-01: each detail preserves literal fixture fields', async ({ request }) => {
  for (const game of expectedGames) {
    const response = await request.get(`/api/games/${game.id}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ game });
  }
});
test('TEST-API-01: notes have exact fields, stable date/ID order, and known empty result', async ({ request }) => {
  const notes = await request.get('/api/games/1/patch-notes');
  expect(notes.status()).toBe(200);
  expect(await notes.json()).toEqual({ patchNotes: [expectedNotes[1], expectedNotes[0], expectedNotes[2]] });
  expect((await (await request.get('/api/games/6/patch-notes')).json()).patchNotes).toEqual([expectedNotes[3]]);
  const noNotes = await request.get('/api/games/9/patch-notes');
  expect(noNotes.status()).toBe(200);
  expect(await noNotes.json()).toEqual({ patchNotes: [] });
});

for (const suffix of ['', '/patch-notes']) {
  for (const id of ['0', '-1', '01', '1.5', 'abc', '9007199254740992'])
    test(`TEST-API-01: malformed ID ${id}${suffix} precedes query rejection`, async ({ request }) => {
      for (const query of ['', '?genre=Action']) {
        const response = await request.get(`/api/games/${id}${suffix}${query}`);
        expect(response.status()).toBe(400);
        expect((await response.json()).error.code).toBe('INVALID_ID');
      }
    });
  for (const id of ['999', '9007199254740991'])
    test(`TEST-API-01: valid absent ID ${id}${suffix}`, async ({ request }) => {
      const response = await request.get(`/api/games/${id}${suffix}`);
      expect(response.status()).toBe(404);
      expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND', message: expect.any(String) } });
    });
  for (const query of ['search=', 'genre=Action', 'x=&x='])
    test(`TEST-API-01: detail scope rejects ${query}${suffix} before existence lookup`, async ({ request }) => {
      for (const id of [1, 999]) {
        const response = await request.get(`/api/games/${id}${suffix}?${query}`);
        expect(response.status()).toBe(400);
        expect((await response.json()).error.code).toBe('INVALID_QUERY');
      }
    });
}
test('TEST-API-01: bare question mark contains no supplied query keys', async ({ request }) => {
  for (const path of ['/api/games?', '/api/games/1?', '/api/games/1/patch-notes?']) expect((await request.get(path)).status()).toBe(200);
});
test('REQ-API-06: unknown API paths use the error envelope', async ({ request }) => {
  const response = await request.get('/api/unknown');
  expect(response.status()).toBe(404);
  expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND', message: expect.any(String) } });
});

test('TEST-API-01: ordering compares supplementary Unicode code points and prefix lengths', async ({ playwright }) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const db = new DatabaseSync(dbPath);
  try {
    db.exec('DELETE FROM patch_notes; DELETE FROM games;');
    const insert = db.prepare('INSERT INTO games VALUES(?,?,?,?,?,?)');
    for (const [id, title] of [[20, '🎮'], [21, '\uE000'], [22, 'ab'], [23, 'a'], [25, 'A']] as const)
      insert.run(id, title, 'Puzzle', 'Synthetic comparison fixture.', 2026, '["Windows"]');
  } finally { db.close(); }
  const app = await startApp(dbPath);
  const request = await playwright.request.newContext({ baseURL: app.baseURL });
  try {
    const response = await request.get('/api/games');
    expect(response.status()).toBe(200);
    expect((await response.json()).games.map((game: { id: number }) => game.id)).toEqual([23, 25, 22, 21, 20]);
  } finally { await request.dispose(); await app.stop(); }
});

test('TEST-API-04 / REQ-API-06: a real broken SQLite dependency yields generic errors after validation', async ({ playwright }) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const app = await startApp(dbPath);
  const request = await playwright.request.newContext({ baseURL: app.baseURL });
  try {
    const db = new DatabaseSync(dbPath);
    try { db.exec('PRAGMA foreign_keys=OFF; DROP TABLE games;'); } finally { db.close(); }
    for (const path of ['/api/games', '/api/games/1', '/api/games/1/patch-notes']) {
      const response = await request.get(path);
      expect(response.status()).toBe(500);
      expect(await response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } });
    }
    const invalid = await request.get('/api/games?foo=x');
    expect(invalid.status()).toBe(400);
    expect((await invalid.json()).error.code).toBe('INVALID_QUERY');
  } finally { await request.dispose(); await app.stop(); }
});
