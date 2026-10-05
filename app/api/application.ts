import { createServer, type Server } from 'node:http';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { openDatabase } from '../db/database.js';
import { apiError, handleGames, type ApiResult } from './games.js';

const uiAssets = new Map<string, readonly [string, string]>([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ...['main', 'api-client', 'catalogue', 'detail'].map(name => [`/${name}.js`, [`${name}.js`, 'text/javascript; charset=utf-8']] as const),
]);

export function createApplication(options: { dbPath: string; uiDir?: string }): { server: Server; close(): Promise<void> } {
  const db = openDatabase(options.dbPath);
  const server = createServer((request, response) => {
    const send = (result: ApiResult): void => {
      response.writeHead(result.status, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(result.body));
    };
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      if (request.method === 'GET') {
        const result = handleGames(url, db);
        if (result) { send(result); return; }
        const asset = uiAssets.get(url.pathname);
        if (asset && options.uiDir) {
          try {
            const root = realpathSync(resolve(options.uiDir));
            const file = realpathSync(join(root, asset[0]!));
            if (dirname(file) === root) {
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
  });
  let closed = false;
  return { server, close: async () => {
    if (closed) return;
    closed = true;
    try {
      if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    } finally { db.close(); }
  } };
}
