// One-off local review aid. No workflow or application imports this file.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { yaml } = require(path.resolve('node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/lib/utilsBundle.js'));
const evidence = 'test-docs/smoke-evidence/2026-10-27';
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const command = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  assert.equal(r.status, 0, `${cmd} ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
};
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)]);
const testFiles = ['catalogue', 'detail', 'favourites', 'feedback'].map(n => `tests/e2e/${n}.spec.ts`);
const sourceFiles = ['package.json', 'pnpm-lock.yaml', 'playwright.config.ts', '.github/workflows/tests.yml', '.gitattributes', 'README.md', ...testFiles,
  'tests/fixtures/app.ts', 'tests/fixtures/suite.ts', ...walk('app'), ...walk('dist/app')];
const workflow = yaml.parseDocument(fs.readFileSync('.github/workflows/tests.yml', 'utf8'), { uniqueKeys: true });
assert.deepEqual(workflow.errors, []);
const w = workflow.toJS();
const packageNow = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const packageBefore = JSON.parse(command('git', ['show', 'HEAD:package.json']));
assert.deepEqual(packageNow.devDependencies, packageBefore.devDependencies);
assert.deepEqual(packageNow.engines, packageBefore.engines);
assert.equal(packageNow.packageManager, 'pnpm@11.19.0');
assert.match(packageNow.scripts['test:smoke'], /--grep @smoke --project=chromium --project=firefox --project=webkit --workers=1 --retries=0 --forbid-only$/);
assert.deepEqual(Object.keys(w.on).sort(), ['pull_request', 'push', 'workflow_dispatch']);
assert.deepEqual(w.permissions, { contents: 'read' });
const job = w.jobs.playwright;
assert.equal(job['runs-on'], 'ubuntu-24.04');
assert.equal(job['timeout-minutes'], 20);
assert.equal(job.strategy['fail-fast'], false);
const expression = job.strategy.matrix.suite.slice(3, -2).trim();
const evaluate = (event, branch, defaultBranch, refType = 'branch') => JSON.parse(Function('github', `return (${expression.replace('fromJSON(', '(')});`)({ event_name: event, ref_name: branch, ref_type: refType, event: { repository: { default_branch: defaultBranch } } }));
const cases = [
  ['push', 'feature', 'main', ['smoke']], ['push', 'main', 'main', ['smoke', 'full']],
  ['push', 'trunk', 'trunk', ['smoke', 'full']], ['pull_request', 'feature', 'main', ['full']],
  ['workflow_dispatch', 'feature', 'main', ['smoke', 'full']],
  ['push', 'main', 'main', ['smoke'], 'tag'],
];
const triggerChecks = cases.map(([event, branch, defaultBranch, expected, refType = 'branch']) => {
  const actual = evaluate(event, branch, defaultBranch, refType); assert.deepEqual(actual, expected);
  return { event, branch, defaultBranch, refType, actual };
});
const smokeStep = job.steps.find(s => s.name === 'Run five-path desktop smoke');
const fullStep = job.steps.find(s => s.name === 'Run full required regression');
assert.equal(smokeStep.if, "matrix.suite == 'smoke'");
assert.equal(fullStep.if, "matrix.suite == 'full'");
assert.match(fullStep.run, /pnpm test --workers=1 --retries=0 --forbid-only --reporter=list,html,json/);
assert.match(smokeStep.run, /pnpm test:smoke --reporter=list,html,json/);
assert(job.steps.some(s => s.run === 'pnpm install --frozen-lockfile'));
assert(job.steps.some(s => s.run === 'pnpm exec playwright install --with-deps chromium firefox webkit'));
assert(job.steps.some(s => s.run === 'npm install --global pnpm@11.19.0'));
assert.equal(job.steps.find(s => s.name === 'Set up Node.js').with['node-version'], '24.22.1');
const upload = job.steps.find(s => s.name === 'Preserve native reports and failure artifacts');
assert.equal(upload.if, 'always()');
assert.equal(upload.with['retention-days'], 14);
assert.equal(upload['timeout-minutes'], 5);
assert.equal(upload.with.path, 'test-results/${{ matrix.suite }}/');
assert(!job.steps.some(s => s['continue-on-error']));
for (const file of testFiles) {
  const original = command('git', ['show', `HEAD:${file}`]).replace(/\r\n/g, '\n');
  const current = fs.readFileSync(file, 'utf8').trim().replace(/\r\n/g, '\n');
  assert.equal(current.replaceAll(' @smoke', ''), original, `${file}: non-tag source change`);
}
const listing = JSON.parse(fs.readFileSync(`${evidence}/listing.json`, 'utf8'));
const flatten = suites => suites.flatMap(s => [...(s.specs ?? []).flatMap(s => s.tests.map(t => ({ title: s.title, ...t }))), ...flatten(s.suites ?? [])]);
const listed = flatten(listing.suites);
assert.equal(listed.length, 15);
for (const browser of ['chromium', 'firefox', 'webkit']) assert.equal(listed.filter(t => t.projectName === browser).length, 5);
const initial = JSON.parse(fs.readFileSync(`${evidence}/playwright.json`, 'utf8'));
assert.deepEqual([initial.stats.expected, initial.stats.unexpected, initial.stats.skipped, initial.stats.flaky], [14, 1, 0, 0]);
const check = JSON.parse(fs.readFileSync(`${evidence}/catalogue-check/playwright.json`, 'utf8'));
assert.deepEqual([check.stats.expected, check.stats.unexpected, check.stats.skipped, check.stats.flaky], [1, 0, 0, 0]);
const task1 = 'test-docs/accessibility-evidence/2026-10-26';
const previous = JSON.parse(fs.readFileSync(`${task1}/sha256.json`, 'utf8'));
for (const entry of previous.files) assert.equal(hash(`${task1}/${entry.path}`), entry.sha256, `Task1 preserved: ${entry.path}`);
const result = {
  recordedAt: new Date().toISOString(), validation: 'YAML parse + exact field assertions + local JavaScript evaluation of the GitHub expression subset; not GitHub workflow execution or actionlint',
  checks: { yamlErrors: 0, triggerChecks, listing: { total: listed.length, perDesktop: 5 }, sourceBodiesUnchanged: testFiles,
    task1InventoryMatches: previous.files.length, task1Mismatches: 0 },
  initialStats: initial.stats, focusedStats: check.stats,
};
fs.writeFileSync(`${evidence}/local-validation.json`, JSON.stringify(result, null, 2) + '\n');
fs.writeFileSync(`${evidence}/source-manifest.json`, JSON.stringify({
  recordedAt: new Date().toISOString(), provenance: 'Retrospective manifest after the runs; no source edits between initial smoke and focused catalogue check.',
  head: command('git', ['rev-parse', 'HEAD']), branch: command('git', ['branch', '--show-current']),
  files: sourceFiles.map(file => ({ file: file.replaceAll('\\', '/'), sha256: hash(file) })),
}, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
