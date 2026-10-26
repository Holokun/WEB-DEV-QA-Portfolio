import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'node:os';
import { chromium, firefox, webkit } from '@playwright/test';
import { DatabaseSync } from 'node:sqlite';

const target = resolve('test-docs/favourites-feedback-evidence/2026-10-26/runtime.json');
export default class MetadataReporter {
  async onBegin(config) {
    this.runtime = {
      startedAt: new Date().toISOString(), clientCalendar: '2026-10-26', timeZone: 'Asia/Yerevan',
      node: process.version, nodeExecutable: process.execPath, os: { platform: os.platform(), release: os.release(), version: os.version(), arch: os.arch() },
      playwright: JSON.parse(readFileSync('node_modules/@playwright/test/package.json', 'utf8')).version,
      pnpm: process.env.TASK4_PNPM_VERSION, fixtureVersion: 1,
      workers: config.workers, fullyParallel: config.fullyParallel, retries: config.projects.map(project => ({ project: project.name, retries: project.retries })),
      projects: config.projects.map(project => ({ name: project.name, viewport: project.use.viewport, browserName: project.use.browserName, launchOptions: project.use.launchOptions })),
      browsers: {},
    };
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const type = { chromium, firefox, webkit }[name];
      const options = config.projects.find(project => project.name === name).use.launchOptions;
      const browser = await type.launch(options);
      try { this.runtime.browsers[name] = { version: browser.version(), executable: options?.executablePath ?? type.executablePath() }; }
      finally { await browser.close(); }
    }
    this.capture();
  }
  capture() {
    this.runtime.baseURL = process.env.GAME_TEST_URL;
    this.runtime.DB_PATH = process.env.GAME_TEST_DB;
    writeFileSync(target, JSON.stringify(this.runtime, null, 2) + '\n');
  }
  onTestBegin() { this.capture(); }
  onEnd(result) {
    this.runtime.finishedAt = new Date().toISOString();
    this.runtime.status = result.status;
    this.capture();
    const db = new DatabaseSync(this.runtime.DB_PATH, { readOnly: true });
    try {
      const snapshot = {
        DB_PATH: this.runtime.DB_PATH,
        counts: db.prepare('SELECT (SELECT COUNT(*) FROM games) AS games, (SELECT COUNT(*) FROM patch_notes) AS patch_notes, (SELECT COUNT(*) FROM feedback) AS feedback').get(),
        sequence: db.prepare('SELECT name, CAST(seq AS TEXT) AS seq FROM sqlite_sequence ORDER BY name').all(),
        keyboardSubmissions: db.prepare("SELECT id, game_id, email, description FROM feedback WHERE email='Keyboard@example.com' ORDER BY id").all(),
      };
      writeFileSync(resolve('test-docs/favourites-feedback-evidence/2026-10-26/sql-snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n');
    } finally { db.close(); }
  }
}
