# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\lifecycle.spec.ts >> application shutdown drains a received feedback body and response while releasing an unused socket
- Location: tests\api\lifecycle.spec.ts:46:1

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
  5  | import { DatabaseSync } from 'node:sqlite';
  6  | 
  7  | async function listeningApplication() {
  8  |   const dbPath = ownedDatabase();
  9  |   const app = createApplication({ dbPath });
  10 |   await new Promise<void>(resolveReady => app.server.listen(0, '127.0.0.1', resolveReady));
  11 |   return { app, dbPath, port: (app.server.address() as AddressInfo).port };
  12 | }
  13 | 
  14 | async function acceptedSocket(app: ReturnType<typeof createApplication>, port: number) {
  15 |   // A client-side connect event alone does not prove the server owns the socket yet.
  16 |   const accepted = once(app.server, 'connection');
  17 |   const socket = connect(port, '127.0.0.1');
  18 |   const [[serverSocket]] = await Promise.all([accepted, once(socket, 'connect')]);
  19 |   return { socket, serverSocket: serverSocket as Socket };
  20 | }
  21 | 
  22 | for (const prefix of ['', 'GET /api/games HTTP/1.1\r\nHost:']) {
  23 |   test(`application shutdown releases an accepted socket without a complete request (${prefix ? 'partial headers' : 'browser preconnect'})`, async () => {
  24 |     const { app, port } = await listeningApplication();
  25 |     const { socket, serverSocket } = await acceptedSocket(app, port);
  26 |     socket.resume();
  27 |     try {
  28 |       if (prefix) {
  29 |         const received = once(serverSocket, 'data');
  30 |         socket.write(prefix);
  31 |         await received;
  32 |       }
  33 |       let closed = false;
  34 |       const stopped = app.close().then(() => { closed = true; });
  35 |       await expect.poll(() => closed, { timeout: 2000 }).toBe(true);
  36 |       await stopped;
  37 |       await expect.poll(() => socket.destroyed).toBe(true);
  38 |       expect(app.server.listening).toBe(false);
  39 |     } finally {
  40 |       socket.destroy();
  41 |       await app.close();
  42 |     }
  43 |   });
  44 | }
  45 | 
  46 | test('application shutdown drains a received feedback body and response while releasing an unused socket', async () => {
  47 |   const { app, dbPath, port } = await listeningApplication();
  48 |   const { socket: unused } = await acceptedSocket(app, port);
  49 |   const { socket: active } = await acceptedSocket(app, port);
  50 |   unused.resume();
  51 |   let response = '';
  52 |   active.setEncoding('utf8');
  53 |   active.on('data', chunk => { response += chunk; });
  54 |   const responseEnded = once(active, 'end');
  55 |   const input = { gameId: 1, email: '  player@example.com  ', description: '  Synthetic feedback during shutdown  ' };
  56 |   const body = JSON.stringify(input);
  57 |   const received = new Promise<void>(resolveReceived => app.server.once('request', request => {
  58 |     request.once('data', () => resolveReceived());
  59 |   }));
  60 |   try {
  61 |     active.write(`POST /api/feedback HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body.slice(0, 12)}`);
  62 |     await received;
  63 |     let closed = false;
  64 |     const stopped = app.close().then(() => { closed = true; });
  65 |     expect(app.server.listening).toBe(false);
  66 |     active.end(body.slice(12));
  67 |     await responseEnded;
> 68 |     await expect.poll(() => closed, { timeout: 2000 }).toBe(true);
     |                                                        ^ Error: expect(received).toBe(expected) // Object.is equality
  69 |     await stopped;
  70 |     expect(response).toMatch(/^HTTP\/1\.1 201 /);
  71 |     const { id } = JSON.parse(response.split('\r\n\r\n')[1]!) as { id: number };
  72 |     expect(Number.isSafeInteger(id) && id > 0).toBe(true);
  73 |     const db = new DatabaseSync(dbPath);
  74 |     try {
  75 |       expect(db.prepare('SELECT id,game_id,email,description FROM feedback').all()).toEqual([
  76 |         { id, game_id: 1, email: 'player@example.com', description: 'Synthetic feedback during shutdown' },
  77 |       ]);
  78 |       db.exec('BEGIN EXCLUSIVE; ROLLBACK;');
  79 |     } finally { db.close(); }
  80 |     await expect.poll(() => unused.destroyed).toBe(true);
  81 |   } finally {
  82 |     active.destroy();
  83 |     unused.destroy();
  84 |     await app.close();
  85 |   }
  86 | });
  87 | 
```