// Verification-only HTTP journal. Production pnpm dev does not import this file.
import http from 'node:http';
import { appendFileSync } from 'node:fs';
const upstream = new URL(process.argv[2]);
const journal = process.argv[3];
const server = http.createServer((req, res) => {
  const sent = [], received = [];
  const record = { at: new Date().toISOString(), method: req.method, path: req.url };
  req.on('data', chunk => sent.push(chunk));
  const forward = http.request({ hostname: upstream.hostname, port: upstream.port,
    path: req.url, method: req.method, headers: { ...req.headers, host: upstream.host } }, response => {
    res.writeHead(response.statusCode, response.headers);
    response.on('data', chunk => received.push(chunk));
    response.on('end', () => appendFileSync(journal, JSON.stringify({ ...record,
      status: response.statusCode, requestBody: Buffer.concat(sent).toString(),
      responseBody: req.url.startsWith('/api/') ? Buffer.concat(received).toString() : undefined }) + '\n'));
    response.pipe(res);
  });
  forward.on('error', error => {
    appendFileSync(journal, JSON.stringify({ ...record, instrumentError: error.message }) + '\n');
    res.writeHead(502); res.end('Verification gateway could not reach the development app.');
  });
  req.pipe(forward);
});
server.listen(0, '127.0.0.1', () => console.log(JSON.stringify({ baseURL: `http://127.0.0.1:${server.address().port}`, upstream: upstream.origin, journal })));
