// One-off verification recorder; not a runtime dependency or CI reporter.
const fs = require('node:fs');
const os = require('node:os');
class ProvenanceReporter {
  onBegin(config, suite) {
    this.record = {
      recordedAt: new Date().toISOString(), node: process.version,
      platform: process.platform, release: os.release(), architecture: process.arch,
      cwd: process.cwd(), baseURL: process.env.GAME_TEST_URL,
      dbPath: process.env.GAME_TEST_DB, workers: config.workers,
      projects: config.projects.map(p => ({ name: p.name, retries: p.retries, viewport: p.use.viewport })),
      listedTests: suite.allTests().length,
    };
  }
  onEnd(result) {
    this.record.finishedAt = new Date().toISOString();
    this.record.status = result.status;
    fs.writeFileSync('test-docs/smoke-evidence/2026-10-27/run-provenance.json', JSON.stringify(this.record, null, 2) + '\n');
  }
}
module.exports = ProvenanceReporter;
