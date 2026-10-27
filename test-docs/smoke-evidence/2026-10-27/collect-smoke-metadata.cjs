const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const { yaml } = require(path.resolve('node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/lib/utilsBundle.js'));
const evidence = 'test-docs/smoke-evidence/2026-10-27';
async function main() {
  const actions = [
    ['checkout', 'v7.0.1', '3d3c42e5aac5ba805825da76410c181273ba90b1'],
    ['setup-node', 'v7.1.0', '949feb2413d6458794dcd2491c4babbbce0c15c1'],
    ['upload-artifact', 'v7.0.2', 'cf430e030ddbb5b0abf93d22962f4752f3646cd9'],
  ];
  const pins = [];
  fs.mkdirSync(`${evidence}/official-metadata`, { recursive: true });
  for (const [name, tag, sha] of actions) {
    const remote = `https://github.com/actions/${name}.git`;
    const args = ['ls-remote', remote, `refs/tags/${tag}`, `refs/tags/${tag}^{}`];
    const result = spawnSync('git', args, { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const lines = result.stdout.trim().split('\n');
    const actual = lines.at(-1).split(/\s/)[0];
    assert.equal(actual, sha);
    const url = `https://raw.githubusercontent.com/actions/${name}/${sha}/action.yml`;
    const response = await fetch(url); assert(response.ok, `${url}: ${response.status}`);
    const text = await response.text();
    fs.writeFileSync(`${evidence}/official-metadata/${name}-action.yml`, text);
    const parsed = yaml.parse(text);
    pins.push({ repository: remote, tag, sha, command: `git ${args.join(' ')}`, output: result.stdout.trim(),
      metadata: url, runtime: parsed.runs.using, inputs: Object.keys(parsed.inputs ?? {}) });
  }
  const nodeURL = 'https://nodejs.org/dist/v24.22.1/SHASUMS256.txt';
  const nodeResponse = await fetch(nodeURL); assert(nodeResponse.ok);
  const nodeChecksums = await nodeResponse.text();
  fs.writeFileSync(`${evidence}/official-metadata/node-v24.22.1-SHASUMS256.txt`, nodeChecksums);
  assert.match(nodeChecksums, /6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6  node-v24.22.1-linux-x64.tar.xz/);
  const pnpmURL = 'https://registry.npmjs.org/pnpm/11.19.0';
  const pnpmResponse = await fetch(pnpmURL); assert(pnpmResponse.ok);
  const pnpmText = await pnpmResponse.text();
  fs.writeFileSync(`${evidence}/official-metadata/pnpm-11.19.0.json`, pnpmText);
  const pnpm = JSON.parse(pnpmText); assert.equal(pnpm.version, '11.19.0');
  const provenance = JSON.parse(fs.readFileSync(`${evidence}/run-provenance.json`, 'utf8'));
  const db = new DatabaseSync(provenance.dbPath, { readOnly: true });
  let rows;
  try { rows = db.prepare('SELECT id, game_id, email, description FROM feedback ORDER BY id').all(); }
  finally { db.close(); }
  assert.equal(rows.length, 3);
  assert(rows.every(r => r.game_id === 1 && r.email === 'Player@example.com' && r.description.startsWith('Primary UI submission ') && r.description.trim() === r.description));
  const metadata = { recordedAt: new Date().toISOString(), actionPins: pins,
    node: { version: '24.22.1', source: nodeURL, linuxX64ArchiveSha256: '6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6' },
    pnpm: { version: pnpm.version, engines: pnpm.engines, source: pnpmURL },
    playwright: JSON.parse(fs.readFileSync('node_modules/@playwright/test/package.json', 'utf8')).version,
    officialBrowserManifest: JSON.parse(fs.readFileSync('node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/browsers.json', 'utf8')),
    sql: { purpose: 'Read-only post-run corroboration. Per-POST +1 and returned-ID checks run in each unchanged feedback test.',
      dbPath: provenance.dbPath, rows },
  };
  fs.writeFileSync(`${evidence}/runtime-and-pins.json`, JSON.stringify(metadata, null, 2) + '\n');
  console.log(JSON.stringify({ actionPins: pins.map(({repository, tag, sha, runtime}) => ({repository, tag, sha, runtime})),
    node: metadata.node, pnpm: metadata.pnpm, playwright: metadata.playwright, sqlRows: rows.length }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
