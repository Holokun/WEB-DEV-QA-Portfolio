import { createServer, type Server } from 'node:http';
import { readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Socket } from 'node:net';
import { openDatabase } from '../db/database.js';
import { apiError, handleGames, type ApiResult } from './games.js';
import { handleFeedback } from './feedback.js';

const uiAssets = new Map<string, readonly [string, string]>([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/shared/feedback-validation.js', ['shared/feedback-validation.js', 'text/javascript; charset=utf-8']],
  ...['main', 'api-client', 'catalogue', 'detail', 'favourites', 'favourite-button', 'favourites-view', 'feedback'].map(name => [`/${name}.js`, [`${name}.js`, 'text/javascript; charset=utf-8']] as const),
]);

export function createApplication(options: { dbPath: string; uiDir?: string }): { server: Server; close(): Promise<void> } {
  const db = openDatabase(options.dbPath);
  const activeRequests = new Map<Socket, number>();
  const server = createServer((request, response) => {
    const socket = request.socket;
    activeRequests.set(socket, (activeRequests.get(socket) ?? 0) + 1);
    let responseFinished = false;
    let released = false;
    const releaseRequest = (): void => {
      if (released || !responseFinished || !request.complete) return;
      released = true;
      const remaining = activeRequests.get(socket);
      if (remaining !== undefined) activeRequests.set(socket, remaining - 1);
      if (closed) {
        if (activeRequests.get(socket) === 0) socket.end();
        server.closeIdleConnections();
      }
    };
    request.once('end', releaseRequest);
    response.once('finish', () => {
      responseFinished = true;
      releaseRequest();
    });
    const send = (result: ApiResult): void => {
      if (response.destroyed || response.writableEnded) return;
      if (response.headersSent) { response.destroy(); return; }
      response.writeHead(result.status, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(result.body));
    };
    const respond = async (): Promise<void> => {
      try {
        const url = new URL(request.url ?? '/', 'http://127.0.0.1');
        if (request.method === 'POST' && url.pathname === '/api/feedback') {
          send(await handleFeedback(url, request, db));
          return;
        }
        if (request.method === 'GET') {
          const result = handleGames(url, db);
          if (result) { send(result); return; }
          const asset = uiAssets.get(url.pathname);
          if (asset && options.uiDir) {
            try {
              const root = realpathSync(resolve(options.uiDir));
              const file = realpathSync(join(root, asset[0]!));
              if (file === resolve(root, asset[0]!)) {
                const content = readFileSync(file);
                response.writeHead(200, { 'Content-Type': asset[1]!, 'X-Content-Type-Options': 'nosniff' });
                response.end(content);
                return;
              }
            } catch (error) {
              if (!['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
            }
          }
        }
        send(apiError(404, 'NOT_FOUND', 'Resource not found.'));
      } catch {
        send(apiError(500, 'INTERNAL_ERROR', 'An unexpected server error occurred.'));
      }
    };
    void respond();
  });
  server.on('connection', socket => {
    activeRequests.set(socket, 0);
    socket.once('close', () => activeRequests.delete(socket));
  });
  let closed = false;
  return { server, close: async () => {
    if (closed) return;
    closed = true;
    try {
      if (server.listening) await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
        // Partial headers can keep Node's parser active even on a reused socket.
        // Preserve parsed requests through their full bodies and responses.
        for (const [socket, active] of activeRequests) if (active === 0) socket.destroy();
      });
    } finally { db.close(); }
  } };
}
