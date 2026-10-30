# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\lifecycle.spec.ts >> application shutdown releases a reused connection with incomplete next-request headers
- Location: tests\api\lifecycle.spec.ts:48:1

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
  1   | import { test, expect, ownedDatabase } from '../fixtures/app.js';
  2   | import { createApplication } from '../../app/api/application.js';
  3   | import { connect, type Socket, type AddressInfo } from 'node:net';
  4   | import { once } from 'node:events';
  5   | import { Agent, request as httpRequest } from 'node:http';
  6   | import { DatabaseSync } from 'node:sqlite';
  7   | import { randomUUID } from 'node:crypto';
  8   | 
  9   | async function listeningApplication() {
  10  |   const dbPath = ownedDatabase();
  11  |   const app = createApplication({ dbPath });
  12  |   await new Promise<void>(resolveReady => app.server.listen(0, '127.0.0.1', resolveReady));
  13  |   return { app, dbPath, port: (app.server.address() as AddressInfo).port };
  14  | }
  15  | 
  16  | async function acceptedSocket(app: ReturnType<typeof createApplication>, port: number) {
  17  |   // A client-side connect event alone does not prove the server owns the socket yet.
  18  |   const accepted = once(app.server, 'connection');
  19  |   const socket = connect(port, '127.0.0.1');
  20  |   const [[serverSocket]] = await Promise.all([accepted, once(socket, 'connect')]);
  21  |   return { socket, serverSocket: serverSocket as Socket };
  22  | }
  23  | 
  24  | for (const prefix of ['', 'GET /api/games HTTP/1.1\r\nHost:']) {
  25  |   test(`application shutdown releases an accepted socket without a complete request (${prefix ? 'partial headers' : 'browser preconnect'})`, async () => {
  26  |     const { app, port } = await listeningApplication();
  27  |     const { socket, serverSocket } = await acceptedSocket(app, port);
  28  |     socket.resume();
  29  |     try {
  30  |       if (prefix) {
  31  |         const received = once(serverSocket, 'data');
  32  |         socket.write(prefix);
  33  |         await received;
  34  |       }
  35  |       let closed = false;
  36  |       const stopped = app.close().then(() => { closed = true; });
  37  |       await expect.poll(() => closed, { timeout: 2000 }).toBe(true);
  38  |       await stopped;
  39  |       await expect.poll(() => socket.destroyed).toBe(true);
  40  |       expect(app.server.listening).toBe(false);
  41  |     } finally {
  42  |       socket.destroy();
  43  |       await app.close();
  44  |     }
  45  |   });
  46  | }
  47  | 
  48  | test('application shutdown releases a reused connection with incomplete next-request headers', async () => {
  49  |   const { app, port } = await listeningApplication();
  50  |   const agent = new Agent({ keepAlive: true, maxSockets: 1 });
  51  |   const accepted = once(app.server, 'connection');
  52  |   const first = httpRequest({ hostname: '127.0.0.1', port, path: '/api/games/1', agent });
  53  |   const responseEnded = new Promise<number | undefined>((resolveResponse, reject) => {
  54  |     first.once('error', reject);
  55  |     first.once('response', response => {
  56  |       response.resume();
  57  |       response.once('error', reject);
  58  |       response.once('end', () => resolveResponse(response.statusCode));
  59  |     });
  60  |   });
  61  |   try {
  62  |     first.end();
  63  |     const [serverSocket] = await accepted as [Socket];
  64  |     expect(await responseEnded).toBe(200);
  65  |     const socket = first.socket!;
  66  |     expect(socket.destroyed).toBe(false);
  67  |     const received = once(serverSocket, 'data');
  68  |     socket.write('GET /api/games HTTP/1.1\r\nHost:');
  69  |     await received;
  70  |     let closed = false;
  71  |     const stopped = app.close().then(() => { closed = true; });
> 72  |     await expect.poll(() => closed, { timeout: 2000 }).toBe(true);
      |                                                        ^ Error: expect(received).toBe(expected) // Object.is equality
  73  |     await stopped;
  74  |     await expect.poll(() => socket.destroyed).toBe(true);
  75  |   } finally {
  76  |     agent.destroy();
  77  |     first.destroy();
  78  |     await app.close();
  79  |   }
  80  | });
  81  | 
  82  | test('application shutdown drains a received feedback body and response while releasing an unused socket', async () => {
  83  |   const { app, dbPath, port } = await listeningApplication();
  84  |   const { socket: unused } = await acceptedSocket(app, port);
  85  |   unused.resume();
  86  |   const description = `Synthetic feedback during shutdown ${randomUUID()}`;
  87  |   const input = { gameId: 1, email: '  player@example.com  ', description: `  ${description}  ` };
  88  |   const body = JSON.stringify(input);
  89  |   const active = httpRequest({ hostname: '127.0.0.1', port, path: '/api/feedback', method: 'POST', headers: {
  90  |     'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), Connection: 'keep-alive',
  91  |   } });
  92  |   const responseEnded = new Promise<{ status: number | undefined; body: string }>((resolveResponse, reject) => {
  93  |     active.once('error', reject);
  94  |     active.once('response', response => {
  95  |       let text = '';
  96  |       response.setEncoding('utf8');
  97  |       response.on('data', chunk => { text += chunk; });
  98  |       response.once('error', reject);
  99  |       response.once('end', () => resolveResponse({ status: response.statusCode, body: text }));
  100 |     });
  101 |   });
  102 |   const received = new Promise<void>(resolveReceived => app.server.once('request', request => {
  103 |     request.once('data', () => resolveReceived());
  104 |   }));
  105 |   try {
  106 |     active.write(body.slice(0, 12));
  107 |     await received;
  108 |     let closed = false;
  109 |     const stopped = app.close().then(() => { closed = true; });
  110 |     expect(app.server.listening).toBe(false);
  111 |     active.end(body.slice(12));
  112 |     const response = await responseEnded;
  113 |     await expect.poll(() => closed, { timeout: 2000 }).toBe(true);
  114 |     await stopped;
  115 |     expect(response.status).toBe(201);
  116 |     const { id } = JSON.parse(response.body) as { id: number };
  117 |     expect(Number.isSafeInteger(id) && id > 0).toBe(true);
  118 |     const db = new DatabaseSync(dbPath);
  119 |     try {
  120 |       expect(db.prepare('SELECT id,game_id,email,description FROM feedback').all()).toEqual([
  121 |         { id, game_id: 1, email: 'player@example.com', description },
  122 |       ]);
  123 |       db.exec('BEGIN EXCLUSIVE; ROLLBACK;');
  124 |     } finally { db.close(); }
  125 |     await expect.poll(() => unused.destroyed).toBe(true);
  126 |   } finally {
  127 |     active.destroy();
  128 |     unused.destroy();
  129 |     await app.close();
  130 |   }
  131 | });
  132 | 
```