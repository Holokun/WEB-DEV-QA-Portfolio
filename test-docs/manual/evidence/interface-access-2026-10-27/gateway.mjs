// Verification-only failure/hold gateway for observing application UI messages.
import http from 'node:http';
import { readFileSync, appendFileSync } from 'node:fs';
const upstream = new URL(process.argv[2]);
const rulesFile = process.argv[3], journal = process.argv[4];
const rules = () => JSON.parse(readFileSync(rulesFile, 'utf8')).rules;
const match = req => rules().find(r => r.path === new URL(req.url, upstream).pathname && (!r.method || r.method === req.method));
const server = http.createServer(async (req, res) => {
  const record = { at: new Date().toISOString(), method: req.method, path: req.url };
  const selected = match(req);
  if (selected) record.injected = selected;
  if (selected?.hold) {
    appendFileSync(journal, JSON.stringify({ ...record, phase: 'held' }) + '\n');
    while (match(req)?.hold && !res.destroyed) await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (res.destroyed) return;
  if (selected?.mode === '500') {
    res.writeHead(500, { 'content-type': 'application/json' });
    const body = JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Controlled verification failure.' } });
    res.end(body); appendFileSync(journal, JSON.stringify({ ...record, status: 500, responseBody: body }) + '\n'); return;
  }
  if (selected?.mode === 'abort') { req.socket.destroy(); appendFileSync(journal, JSON.stringify({ ...record, phase: 'aborted' }) + '\n'); return; }
  const sent = [], received = []; req.on('data', chunk => sent.push(chunk));
  const forward = http.request({ hostname: upstream.hostname, port: upstream.port, method: req.method, path: req.url,
    headers: { ...req.headers, host: upstream.host } }, response => {
    res.writeHead(response.statusCode, response.headers);
    response.on('data', chunk => received.push(chunk));
    response.on('end', () => appendFileSync(journal, JSON.stringify({ ...record, status: response.statusCode,
      requestBody: Buffer.concat(sent).toString(), responseBody: req.url.startsWith('/api/') ? Buffer.concat(received).toString() : undefined }) + '\n'));
    response.pipe(res);
  });
  forward.on('error', error => { appendFileSync(journal, JSON.stringify({ ...record, instrumentError: error.message }) + '\n'); res.writeHead(502); res.end('Verification gateway error'); });
  req.pipe(forward);
});
server.listen(0, '127.0.0.1', () => console.log(JSON.stringify({ baseURL: `http://127.0.0.1:${server.address().port}`, upstream: upstream.origin, journal })));
