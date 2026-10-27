// Verification-only instrumentation; normal product launch never imports this file.
import { createApplication } from './qa-build-87d9782/app/api/application.js';
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname);
const database = join(root, 'agent-session-2026-10-27.sqlite');
const controlPath = join(root, 'control-2026-10-27.json');
const logPath = join(root, 'requests-2026-10-27.jsonl');
if (!existsSync(controlPath)) writeFileSync(controlPath, JSON.stringify({ rules: [] }));
if (existsSync(database)) throw new Error('This probe requires its own new database; do not reset an existing session');
const app = createApplication({ dbPath: database, uiDir: join(root, 'qa-build-87d9782/app/ui') });
const original = app.server.listeners('request')[0];
app.server.removeAllListeners('request');
let requestId = 0;
app.server.on('request', async (request, response) => {
  const record = { requestId: ++requestId, at: new Date().toISOString(), method: request.method, url: request.url };
  const body = [];
  request.on('data', chunk => body.push(Buffer.from(chunk)));
  let responseBody = '';
  const end = response.end;
  response.end = function(chunk, ...args) {
    if (chunk && request.url?.startsWith('/api/')) responseBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    return end.call(this, chunk, ...args);
  };
  let recorded = false;
  function capture(outcome) {
    if (recorded) return;
    recorded = true;
    const payload = Buffer.concat(body).toString('utf8');
    appendFileSync(logPath, JSON.stringify({ ...record, outcome, status: response.headersSent ? response.statusCode : null,
      requestBody: payload || undefined, responseBody: responseBody || undefined, finishedAt: new Date().toISOString() }) + '\n');
  }
  response.on('finish', () => capture('response'));
  response.on('close', () => capture('closed'));
  try {
    const state = JSON.parse(readFileSync(controlPath, 'utf8'));
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const rule = (state.rules ?? []).find(candidate => candidate.path === url.pathname && (!candidate.method || candidate.method === request.method)
      && (candidate.query === undefined || candidate.query === url.search));
    if (rule) record.injected = rule;
    if (rule?.delayMs) await new Promise(resolveDelay => {
      const timer = setTimeout(resolveDelay, rule.delayMs);
      response.once('close', () => { clearTimeout(timer); resolveDelay(); });
    });
    if (response.destroyed) return;
    if (rule?.mode === 'abort') { request.socket.destroy(); return; }
    if (rule?.mode === '500') {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred.' } }));
      return;
    }
    original(request, response);
  } catch (error) {
    record.probeError = String(error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: { code: 'PROBE_ERROR', message: 'Verification instrument failed.' } }));
  }
});
await new Promise(resolveReady => app.server.listen(0, '127.0.0.1', resolveReady));
function hashes(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? hashes(path) : [{ path: path.slice(root.length + 1), sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }];
  });
}
const metadata = { startedAt: new Date().toISOString(), sourceCommit: '87d97821efc864f962fdab1a6070c89eb4c22f8c',
  node: process.version, baseURL: `http://127.0.0.1:${app.server.address().port}`, DB_PATH: database,
  snapshot: 'qa-build-87d9782', snapshotHashes: hashes(join(root, 'qa-build-87d9782')), fixtureVersion: 1,
  instrumentation: 'Request logging and opt-in labelled fault rules wrap the frozen app request handler; no product source is changed.' };
writeFileSync(join(root, 'session-environment-2026-10-27.json'), JSON.stringify(metadata, null, 2));
console.log(JSON.stringify(metadata, (key, value) => key === 'snapshotHashes' ? value.length : value));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  app.server.closeAllConnections();
  await app.close();
  process.exit(0);
});

