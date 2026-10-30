# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\lifecycle.spec.ts >> application shutdown drains a received feedback body and response while releasing an unused socket
- Location: tests\api\lifecycle.spec.ts:47:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 2000ms exceeded while waiting on the predicate
```

# Test source

```ts
  1  | import { test, expect, ownedDatabase } from '../fixtures/app.js';
  2  | import { createApplication } from '../../app/api/application.js';
  3  | import { connect, type Socket, type AddressInfo } from 'node:net';
  4  | import { once } from 'node:events';
  5  | import { request as httpRequest } from 'node:http';
  6  | import { DatabaseSync } from 'node:sqlite';
  7  | 
  8  | async function listeningApplication() {
  9  |   const dbPath = ownedDatabase();
  10 |   const app = createApplication({ dbPath });
  11 |   await new Promise<void>(resolveReady => app.server.listen(0, '127.0.0.1', resolveReady));
  12 |   return { app, dbPath, port: (app.server.address() as AddressInfo).port };
  13 | }
  14 | 
  15 | async function acceptedSocket(app: ReturnType<typeof createApplication>, port: number) {
  16 |   // A client-side connect event alone does not prove the server owns the socket yet.
  17 |   const accepted = once(app.server, 'connection');
  18 |   const socket = connect(port, '127.0.0.1');
  19 |   const [[serverSocket]] = await Promise.all([accepted, once(socket, 'connect')]);
  20 |   return { socket, serverSocket: serverSocket as Socket };
  21 | }
  22 | 
  23 | for (const prefix of ['', 'GET /api/games HTTP/1.1\r\nHost:']) {
  24 |   test(`application shutdown releases an accepted socket without a complete request (${prefix ? 'partial headers' : 'browser preconnect'})`, async () => {
  25 |     const { app, port } = await listeningApplication();
  26 |     const { socket, serverSocket } = await acceptedSocket(app, port);
  27 |     socket.resume();
  28 |     try {
  29 |       if (prefix) {
  30 |         const received = once(serverSocket, 'data');
  31 |         socket.write(prefix);
  32 |         await received;
  33 |       }
  34 |       let closed = false;
  35 |       const stopped = app.close().then(() => { closed = true; });
  36 |       await expect.poll(() => closed, { timeout: 2000 }).toBe(true);
  37 |       await stopped;
  38 |       await expect.poll(() => socket.destroyed).toBe(true);
  39 |       expect(app.server.listening).toBe(false);
  40 |     } finally {
  41 |       socket.destroy();
  42 |       await app.close();
  43 |     }
  44 |   });
  45 | }
  46 | 
  47 | test('application shutdown drains a received feedback body and response while releasing an unused socket', async () => {
  48 |   const { app, dbPath, port } = await listeningApplication();
  49 |   const { socket: unused } = await acceptedSocket(app, port);
  50 |   unused.resume();
  51 |   const input = { gameId: 1, email: '  player@example.com  ', description: '  Synthetic feedback during shutdown  ' };
  52 |   const body = JSON.stringify(input);
  53 |   const active = httpRequest({ hostname: '127.0.0.1', port, path: '/api/feedback', method: 'POST', headers: {
  54 |     'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), Connection: 'keep-alive',
  55 |   } });
  56 |   const responseEnded = new Promise<{ status: number | undefined; body: string }>((resolveResponse, reject) => {
  57 |     active.once('error', reject);
  58 |     active.once('response', response => {
  59 |       let text = '';
  60 |       response.setEncoding('utf8');
  61 |       response.on('data', chunk => { text += chunk; });
  62 |       response.once('error', reject);
  63 |       response.once('end', () => resolveResponse({ status: response.statusCode, body: text }));
  64 |     });
  65 |   });
  66 |   const received = new Promise<void>(resolveReceived => app.server.once('request', request => {
  67 |     request.once('data', () => resolveReceived());
  68 |   }));
  69 |   try {
  70 |     active.write(body.slice(0, 12));
  71 |     await received;
  72 |     let closed = false;
  73 |     const stopped = app.close().then(() => { closed = true; });
  74 |     expect(app.server.listening).toBe(false);
  75 |     active.end(body.slice(12));
  76 |     const response = await responseEnded;
> 77 |     await expect.poll(() => closed, { timeout: 2000 }).toBe(true);
     |                                                        ^ Error: expect(received).toBe(expected) // Object.is equality
  78 |     await stopped;
  79 |     expect(response.status).toBe(201);
  80 |     const { id } = JSON.parse(response.body) as { id: number };
  81 |     expect(Number.isSafeInteger(id) && id > 0).toBe(true);
  82 |     const db = new DatabaseSync(dbPath);
  83 |     try {
  84 |       expect(db.prepare('SELECT id,game_id,email,description FROM feedback').all()).toEqual([
  85 |         { id, game_id: 1, email: 'player@example.com', description: 'Synthetic feedback during shutdown' },
  86 |       ]);
  87 |       db.exec('BEGIN EXCLUSIVE; ROLLBACK;');
  88 |     } finally { db.close(); }
  89 |     await expect.poll(() => unused.destroyed).toBe(true);
  90 |   } finally {
  91 |     active.destroy();
  92 |     unused.destroy();
  93 |     await app.close();
  94 |   }
  95 | });
  96 | 
```