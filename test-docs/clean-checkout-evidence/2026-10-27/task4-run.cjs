const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const mode = process.argv[2];
const commands = {
  typecheck: ['typecheck'],
  dev: ['dev'],
  'dev-continuation': ['dev'],
  list: ['test', '--list', '--reporter=json'],
  full: ['test', '--workers=1', '--retries=0', '--forbid-only', '--reporter=list,json,html,./task4-provenance.cjs'],
};
if (!commands[mode]) throw Error('Choose a recorded mode');
fs.mkdirSync('task4-evidence', {recursive:true});
const env = {...process.env};
if (mode.startsWith('dev')) {
  const owned = path.resolve('test-results/task4-dev-owned');
  fs.mkdirSync(owned, {recursive:true});
  fs.writeFileSync(path.join(owned,'.game-companion-test-owner'),'game-companion-test-database-v1\n');
  env.DB_PATH = path.join(owned,'games.sqlite');
  env.PORT = '0';
}
env.PLAYWRIGHT_HTML_OUTPUT_DIR = path.resolve('task4-evidence/html');
env.PLAYWRIGHT_JSON_OUTPUT_NAME = path.resolve(`task4-evidence/${mode === 'list' ? 'test-list' : 'full-results'}.json`);
const startedAt = new Date().toISOString();
const record = {mode, startedAt, node:process.version, execPath:process.execPath, cwd:process.cwd(), command:['node','D:/programms/nodejs/node_modules/npm/bin/npx-cli.js','--yes','pnpm@11.19.0',...commands[mode]], DB_PATH:env.DB_PATH, PORT:env.PORT};
fs.writeFileSync(`task4-evidence/${mode}-command.json`,JSON.stringify(record,null,2)+'\n');
const log = fs.createWriteStream(`task4-evidence/${mode}.log`);
const child = spawn(process.execPath, ['D:/programms/nodejs/node_modules/npm/bin/npx-cli.js','--yes','pnpm@11.19.0',...commands[mode]],{env,stdio:['ignore','pipe','pipe']});
record.pid=child.pid;
child.stdout.on('data',c=>{log.write(c);process.stdout.write(c)});
child.stderr.on('data',c=>{log.write(c);process.stderr.write(c)});
child.on('close',(code,signal)=>{Object.assign(record,{finishedAt:new Date().toISOString(),exitCode:code,signal});fs.writeFileSync(`task4-evidence/${mode}-command.json`,JSON.stringify(record,null,2)+'\n');log.end();process.exitCode=code??1;});
