import { test, expect, ownedDatabase, startApp } from '../fixtures/app.js';
import { DatabaseSync } from 'node:sqlite';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { resetTestDatabase } from '../../app/db/reset.js';
import { createApplication } from '../../app/api/application.js';
import { connect } from 'node:net';
import type { AddressInfo } from 'node:net';
import { emailVariants, descriptionBoundaries } from '../fixtures/feedback-data.js';

const valid = () => ({ gameId: 1, email: 'player@example.com', description: `Synthetic feedback ${randomUUID()}` });
function rows(dbPath: string) {
  const db = new DatabaseSync(dbPath);
  try {
    // A missing table on the baseline is empty, so RED identifies the missing route before schema assertions.
    if (!db.prepare("SELECT name FROM sqlite_master WHERE name='feedback'").get()) return [];
    return db.prepare('SELECT id,game_id AS gameId,email,description FROM feedback ORDER BY id').all();
  } finally { db.close(); }
}
async function accepted(request: APIRequestContext, dbPath: string, input: ReturnType<typeof valid>, path = '/api/feedback') {
  const before = rows(dbPath);
  const response = await request.post(path, { data: input });
  expect(response.status()).toBe(201);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = await response.json();
  expect(body).toEqual({ id: expect.any(Number) });
  expect(Number.isSafeInteger(body.id) && body.id > 0).toBe(true);
  const after = rows(dbPath);
  expect(after).toHaveLength(before.length + 1);
  const db = new DatabaseSync(dbPath);
  try {
    expect(db.prepare('SELECT id,game_id AS gameId,email,description FROM feedback WHERE id=?').all(body.id))
      .toEqual([{ id: body.id, gameId: input.gameId, email: input.email.trim(), description: input.description.trim() }]);
  } finally { db.close(); }
  expect(after.filter(row => row.id !== body.id)).toEqual(before);
}
async function rejected(response: APIResponse, dbPath: string, before: ReturnType<typeof rows>, status = 400, code = 'INVALID_BODY') {
  expect(response.status()).toBe(status);
  expect(await response.json()).toEqual({ error: { code, message: expect.any(String) } });
  expect(rows(dbPath)).toEqual(before);
}

test('TEST-API-02: trims a valid synthetic submission and inserts exactly one row selected by response ID', async ({ request, dbPath }) => {
  await accepted(request, dbPath, { ...valid(), email: ' \tplayer@example.com\n', description: `  Synthetic feedback ${randomUUID()}  ` });
});
for (const variant of emailVariants) test(`TEST-API-02: ${variant.id} ${variant.accepted ? 'accepts' : 'rejects'} literal email`, async ({ request, dbPath }) => {
  const input = { ...valid(), email: variant.email };
  if (variant.accepted) {
    await accepted(request, dbPath, input);
    expect(rows(dbPath).at(-1)!.email).toBe(variant.stored);
  } else {
    const before = rows(dbPath);
    await rejected(await request.post('/api/feedback', { data: input }), dbPath, before);
  }
});
for (const boundary of descriptionBoundaries) test(`TEST-API-02: fixed description ${boundary.id}`, async ({ request, dbPath }) => {
  const input = { ...valid(), description: boundary.description };
  if (boundary.accepted) {
    await accepted(request, dbPath, input);
    expect(rows(dbPath).at(-1)!.description).toBe(boundary.stored);
  } else {
    const before = rows(dbPath);
    await rejected(await request.post('/api/feedback', { data: input }), dbPath, before);
  }
});
test('TEST-API-02: internal description whitespace and SQL punctuation are stored as data without a maximum', async ({ request, dbPath }) => {
  await accepted(request, dbPath, { ...valid(), description: `Synthetic ${randomUUID()}\n  '; DROP TABLE games; -- ${'a'.repeat(100_000)}` });
  expect((await request.get('/api/games')).status()).toBe(200);
});

const invalidBodies: readonly [string, unknown][] = [
  ['null', null], ['array', []], ['string', 'feedback'], ['number', 1], ['boolean', true], ['empty object', {}],
  ['missing game', { email: 'player@example.com', description: '12345678901234567890' }],
  ['missing email', { gameId: 1, description: '12345678901234567890' }],
  ['missing description', { gameId: 1, email: 'player@example.com' }],
  ['extra field', { ...valid(), extra: true }],
  ...['1', null, true, [], {}, 0, -1, 1.5, 9007199254740992].map(gameId => [`gameId ${JSON.stringify(gameId)}`, { ...valid(), gameId }] as [string, unknown]),
  ...[null, true, 1, [], {}].flatMap(value => ['email', 'description'].map(key => [`${key} ${JSON.stringify(value)}`, { ...valid(), [key]: value }] as [string, unknown])),
  ['empty email', { ...valid(), email: '  ' }],
  ['unknown game and invalid email', { ...valid(), gameId: 999, email: 'bad' }],
  ['unknown game and invalid description', { ...valid(), gameId: 999, description: 'short' }],
];
for (const [name, body] of invalidBodies) test(`REQ-API-07: rejects ${name} before game lookup without insertion`, async ({ request, dbPath }) => {
  const before = rows(dbPath);
  await rejected(await request.post('/api/feedback', { data: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }), dbPath, before);
});
for (const body of ['', '{', '{"gameId":1,']) test(`REQ-API-07: rejects malformed JSON ${JSON.stringify(body)}`, async ({ request, dbPath }) => {
  const before = rows(dbPath);
  await rejected(await request.post('/api/feedback', { data: body, headers: { 'Content-Type': 'application/json' } }), dbPath, before);
});
for (const query of ['search=', 'x=&x=', '=x', 'GameId=1']) test(`REQ-API-05: feedback query ${query} precedes malformed body and game lookup`, async ({ request, dbPath }) => {
  const before = rows(dbPath);
  for (const body of ['{', JSON.stringify({ ...valid(), gameId: 999 })])
    await rejected(await request.post(`/api/feedback?${query}`, { data: body }), dbPath, before, 400, 'INVALID_QUERY');
});
for (const gameId of [999, 9007199254740991]) test(`REQ-API-07: valid absent game ${gameId} is NOT_FOUND`, async ({ request, dbPath }) => {
  const before = rows(dbPath);
  await rejected(await request.post('/api/feedback', { data: { ...valid(), gameId } }), dbPath, before, 404, 'NOT_FOUND');
});
test('REQ-API-05: bare feedback question mark accepts no supplied keys', async ({ request, dbPath }) => {
  await accepted(request, dbPath, valid(), '/api/feedback?');
});
test('REQ-API-06: real failed feedback insertion is generic and validation still runs first', async ({ playwright }) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const app = await startApp(dbPath);
  const request = await playwright.request.newContext({ baseURL: app.baseURL });
  try {
    const db = new DatabaseSync(dbPath);
    try { db.exec("CREATE TRIGGER feedback_failure BEFORE INSERT ON feedback BEGIN SELECT RAISE(ABORT, 'secret SQL dependency details'); END;"); }
    finally { db.close(); }
    const before = rows(dbPath);
    const response = await request.post('/api/feedback', { data: valid() });
    expect(response.status()).toBe(500);
    expect(await response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } });
    expect(rows(dbPath)).toEqual(before);
    await rejected(await request.post('/api/feedback', { data: { ...valid(), email: 'bad' } }), dbPath, before);
    await rejected(await request.post('/api/feedback?x=', { data: '{' }), dbPath, before, 400, 'INVALID_QUERY');
    expect((await request.get('/api/games')).status()).toBe(200);
  } finally { await request.dispose(); await app.stop(); }
});
test('REQ-FBK-02: served pure validator matches all email examples and reports every invalid field', async ({ request }) => {
  const response = await request.get('/shared/feedback-validation.js');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/javascript');
  const { validateFeedback } = await import(`data:text/javascript;base64,${Buffer.from(await response.text()).toString('base64')}`);
  for (const variant of emailVariants) {
    const result = validateFeedback({ ...valid(), email: variant.email });
    expect(result.valid, variant.id).toBe(variant.accepted);
    if (variant.accepted) expect(result.value.email).toBe(variant.stored);
    else expect(result.errors.email).toEqual(expect.any(String));
  }
  expect(validateFeedback({ gameId: null, email: ' ', description: 'short' })).toEqual({ valid: false, errors: { gameId: expect.any(String), email: expect.any(String), description: expect.any(String) } });
  expect(validateFeedback({})).toEqual({ valid: false, errors: { gameId: expect.any(String), email: expect.any(String), description: expect.any(String) } });
  expect(validateFeedback({ ...valid(), extra: true })).toEqual({ valid: false, errors: { body: expect.any(String) } });
  for (const boundary of descriptionBoundaries) expect(validateFeedback({ ...valid(), description: boundary.description }).valid).toBe(boundary.accepted);
});

test('REQ-API-06: an interrupted HTTP body inserts nothing and leaves the app responsive', async ({ playwright }) => {
  const dbPath = ownedDatabase();
  const app = createApplication({ dbPath });
  await new Promise<void>(resolveReady => app.server.listen(0, '127.0.0.1', resolveReady));
  const port = (app.server.address() as AddressInfo).port;
  const request = await playwright.request.newContext({ baseURL: `http://127.0.0.1:${port}` });
  const socket = connect(port, '127.0.0.1');
  try {
    const received = new Promise<void>(resolveReceived => app.server.once('request', incoming => {
      incoming.once('data', () => resolveReceived());
    }));
    const aborted = new Promise<void>(resolveAborted => app.server.once('request', incoming => {
      incoming.once('aborted', () => resolveAborted());
    }));
    await new Promise<void>((resolveConnected, reject) => {
      socket.once('connect', resolveConnected);
      socket.once('error', reject);
    });
    socket.write('POST /api/feedback HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: 9999\r\n\r\n{"gameId":1');
    await received;
    socket.destroy();
    await aborted;
    expect(rows(dbPath)).toEqual([]);
    expect((await request.get('/api/games')).status()).toBe(200);
    await accepted(request, dbPath, valid());
  } finally { socket.destroy(); await request.dispose(); await app.close(); }
});

function allocationSnapshot(dbPath: string) {
  const db = new DatabaseSync(dbPath);
  try {
    // Read exact SQLite IDs/counters as text even if the baseline persists an unsafe number.
    return {
      games: db.prepare('SELECT * FROM games ORDER BY id').all(),
      patchNotes: db.prepare('SELECT * FROM patch_notes ORDER BY id').all(),
      feedback: db.prepare('SELECT CAST(id AS TEXT) AS id,game_id,email,description FROM feedback ORDER BY id').all(),
      sequence: db.prepare('SELECT name,CAST(seq AS TEXT) AS seq FROM sqlite_sequence ORDER BY name').all(),
    };
  } finally { db.close(); }
}

for (const counter of [9007199254740990n, 9007199254740991n])
  test(`REQ-API-07: feedback allocation at counter ${counter} preserves the safe response ID contract`, async ({ playwright }) => {
    const dbPath = ownedDatabase();
    resetTestDatabase(dbPath);
    const db = new DatabaseSync(dbPath);
    try {
      db.prepare('INSERT INTO feedback(game_id,email,description) VALUES(?,?,?)').run(1, 'player@example.com', 'Synthetic preexisting feedback');
      db.prepare("UPDATE sqlite_sequence SET seq=? WHERE name='feedback'").run(counter);
    } finally { db.close(); }
    const beforeStartup = allocationSnapshot(dbPath);
    const app = await startApp(dbPath);
    const request = await playwright.request.newContext({ baseURL: app.baseURL });
    try {
      expect(allocationSnapshot(dbPath)).toEqual(beforeStartup);
      const input = valid();
      if (counter === 9007199254740990n) {
        await accepted(request, dbPath, input);
        const after = allocationSnapshot(dbPath);
        expect(after.feedback.at(-1)).toEqual({ id: '9007199254740991', game_id: input.gameId, email: input.email, description: input.description });
        expect(after.sequence).toEqual([{ name: 'feedback', seq: '9007199254740991' }]);
      }
      const beforeRejected = allocationSnapshot(dbPath);
      const response = await request.post('/api/feedback', { data: valid() });
      // One assertion captures the erroneous response and any committed row/counter change together.
      expect({ status: response.status(), body: await response.json(), database: allocationSnapshot(dbPath) }).toEqual({
        status: 500,
        body: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
        database: beforeRejected,
      });
      const beforeErrors = rows(dbPath);
      await rejected(await request.post('/api/feedback', { data: { ...valid(), email: 'bad' } }), dbPath, beforeErrors);
      await rejected(await request.post('/api/feedback?x=', { data: '{' }), dbPath, beforeErrors, 400, 'INVALID_QUERY');
      await rejected(await request.post('/api/feedback', { data: { ...valid(), gameId: 999 } }), dbPath, beforeErrors, 404, 'NOT_FOUND');
      expect(allocationSnapshot(dbPath)).toEqual(beforeRejected);
      const unlocked = new DatabaseSync(dbPath);
      try { unlocked.exec('BEGIN IMMEDIATE; ROLLBACK;'); } finally { unlocked.close(); }
      expect((await request.get('/api/games')).status()).toBe(200);
    } finally { await request.dispose(); await app.stop(); }
  });
