// Native bytes inventory and prospective Git-filter audit; never stages files.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = 'test-docs/smoke-evidence/2026-10-27';
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)]);
const files = walk(root).filter(p => !['sha256.json', 'portability.json'].includes(path.basename(p))).sort();
const inventory = { recordedAt: new Date().toISOString(), scope: 'Every dated evidence file except sha256.json and portability.json (self-referential audit outputs).',
  files: files.map(file => ({ path: path.relative(root, file).replaceAll('\\', '/'), sha256: hash(file) })) };
fs.writeFileSync(`${root}/sha256.json`, JSON.stringify(inventory, null, 2) + '\n');
const audit = [...files, `${root}/sha256.json`].map(file => {
  const gitPath = file.replaceAll('\\', '/');
  const raw = spawnSync('git', ['hash-object', '--no-filters', file], { encoding: 'utf8' });
  const filtered = spawnSync('git', ['hash-object', `--path=${gitPath}`, file], { encoding: 'utf8' });
  assert.equal(raw.status, 0, raw.stderr); assert.equal(filtered.status, 0, filtered.stderr);
  assert.equal(filtered.stdout.trim(), raw.stdout.trim(), `Git clean-filter bytes differ: ${file}`);
  return { path: path.relative(root, file).replaceAll('\\', '/'), rawAndProspectiveGitBlobSha1: raw.stdout.trim(), sha256: hash(file) };
});
fs.writeFileSync(`${root}/portability.json`, JSON.stringify({ recordedAt: new Date().toISOString(),
  method: 'git hash-object --no-filters vs git hash-object --path=<path>, no -w and no staging; verifies current -text clean-filter bytes, not a future index/commit.',
  matches: audit.length, mismatches: 0, files: audit }, null, 2) + '\n');
console.log(`${inventory.files.length} SHA-256 inventory entries; ${audit.length} prospective Git-filter byte matches; 0 mismatches; no staging.`);
