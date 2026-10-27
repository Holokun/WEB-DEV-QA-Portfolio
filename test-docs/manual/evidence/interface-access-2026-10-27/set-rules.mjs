import { writeFileSync, renameSync, appendFileSync } from 'node:fs';
const path = 'test-results/interface-access-rules.json';
const rules = JSON.parse(process.argv[2]);
writeFileSync(path + '.next', JSON.stringify({ rules }));
renameSync(path + '.next', path);
appendFileSync('test-docs/manual/evidence/interface-access-2026-10-27/http.jsonl', JSON.stringify({ at: new Date().toISOString(), phase: 'control', rules }) + '\n');
