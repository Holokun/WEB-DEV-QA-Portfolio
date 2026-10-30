import { test, expect, ownedDatabase } from '../fixtures/app.js';
import { createApplication } from '../../app/api/application.js';
import { connect, type Socket, type AddressInfo } from 'node:net';
import { once } from 'node:events';
import { Agent, request as httpRequest } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

async function listeningApplication() {
  const dbPath = ownedDatabase();
  const app = createApplication({ dbPath });
  await new Promise<void>(resolveReady => app.server.listen(0, '127.0.0.1', resolveReady));
  return { app, dbPath, port: (app.server.address() as AddressInfo).port };
}

async function acceptedSocket(app: ReturnType<typeof createApplication>, port: number) {
  // A client-side connect event alone does not prove the server owns the socket yet.
  const accepted = once(app.server, 'connection');
  const socket = connect(port, '127.0.0.1');
  const [[serverSocket]] = await Promise.all([accepted, once(socket, 'connect')]);
  return { socket, serverSocket: serverSocket as Socket };
}

for (const prefix of ['', 'GET /api/games HTTP/1.1\r\nHost:']) {
  test(`application shutdown releases an accepted socket without a complete request (${prefix ? 'partial headers' : 'browser preconnect'})`, async () => {
    const { app, port } = await listeningApplication();
    const { socket, serverSocket } = await acceptedSocket(app, port);
    socket.resume();
    try {
      if (prefix) {
        const received = once(serverSocket, 'data');
        socket.write(prefix);
        await received;
      }
      let closed = false;
      const stopped = app.close().then(() => { closed = true; });
      await expect.poll(() => closed, { timeout: 2000 }).toBe(true);
      await stopped;
      await expect.poll(() => socket.destroyed).toBe(true);
      expect(app.server.listening).toBe(false);
    } finally {
      socket.destroy();
      await app.close();
    }
  });
}

test('application shutdown releases a reused connection with incomplete next-request headers', async () => {
  const { app, port } = await listeningApplication();
  const agent = new Agent({ keepAlive: true, maxSockets: 1 });
  const accepted = once(app.server, 'connection');
  const first = httpRequest({ hostname: '127.0.0.1', port, path: '/api/games/1', agent });
  const responseEnded = new Promise<number | undefined>((resolveResponse, reject) => {
    first.once('error', reject);
    first.once('response', response => {
      response.resume();
      response.once('error', reject);
      response.once('end', () => resolveResponse(response.statusCode));
    });
  });
  try {
    first.end();
    const [serverSocket] = await accepted as [Socket];
    expect(await responseEnded).toBe(200);
    const socket = first.socket!;
    expect(socket.destroyed).toBe(false);
    const received = once(serverSocket, 'data');
    socket.write('GET /api/games HTTP/1.1\r\nHost:');
    await received;
    let closed = false;
    const stopped = app.close().then(() => { closed = true; });
    await expect.poll(() => closed, { timeout: 2000 }).toBe(true);
    await stopped;
    await expect.poll(() => socket.destroyed).toBe(true);
  } finally {
    agent.destroy();
    first.destroy();
    await app.close();
  }
});

test('application shutdown drains a received feedback body and response while releasing an unused socket', async () => {
  const { app, dbPath, port } = await listeningApplication();
  const { socket: unused } = await acceptedSocket(app, port);
  unused.resume();
  const description = `Synthetic feedback during shutdown ${randomUUID()}`;
  const input = { gameId: 1, email: '  player@example.com  ', description: `  ${description}  ` };
  const body = JSON.stringify(input);
  const active = httpRequest({ hostname: '127.0.0.1', port, path: '/api/feedback', method: 'POST', headers: {
    'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), Connection: 'keep-alive',
  } });
  const responseEnded = new Promise<{ status: number | undefined; body: string }>((resolveResponse, reject) => {
    active.once('error', reject);
    active.once('response', response => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { text += chunk; });
      response.once('error', reject);
      response.once('end', () => resolveResponse({ status: response.statusCode, body: text }));
    });
  });
  const received = new Promise<void>(resolveReceived => app.server.once('request', request => {
    request.once('data', () => resolveReceived());
  }));
  try {
    const beforeDb = new DatabaseSync(dbPath);
    let beforeCount: number;
    try {
      beforeCount = Number(beforeDb.prepare('SELECT COUNT(*) AS count FROM feedback').get()!.count);
    } finally { beforeDb.close(); }
    active.write(body.slice(0, 12));
    await received;
    let closed = false;
    const stopped = app.close().then(() => { closed = true; });
    expect(app.server.listening).toBe(false);
    active.end(body.slice(12));
    const response = await responseEnded;
    await expect.poll(() => closed, { timeout: 2000 }).toBe(true);
    await stopped;
    expect(response.status).toBe(201);
    const { id } = JSON.parse(response.body) as { id: number };
    expect(Number.isSafeInteger(id) && id > 0).toBe(true);
    const db = new DatabaseSync(dbPath);
    try {
      const afterCount = Number(db.prepare('SELECT COUNT(*) AS count FROM feedback').get()!.count);
      expect(afterCount).toBe(beforeCount + 1);
      expect(db.prepare('SELECT id,game_id,email,description FROM feedback WHERE id=?').all(id)).toEqual([
        { id, game_id: 1, email: 'player@example.com', description },
      ]);
      db.exec('BEGIN EXCLUSIVE; ROLLBACK;');
    } finally { db.close(); }
    await expect.poll(() => unused.destroyed).toBe(true);
  } finally {
    active.destroy();
    unused.destroy();
    await app.close();
  }
});
