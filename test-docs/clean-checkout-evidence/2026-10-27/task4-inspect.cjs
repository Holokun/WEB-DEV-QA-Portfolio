const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const crypto=require('node:crypto');
const os=require('node:os');
const {DatabaseSync}=require('node:sqlite');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const git=(...args)=>cp.execFileSync('git',args,{encoding:'utf8'}).trim();
(async()=>{
 const pw=require('@playwright/test');
 const modules=Object.fromEntries(['@playwright/test','playwright','playwright-core','@axe-core/playwright','axe-core','typescript'].map(name=>{let file;try{file=require.resolve(name)}catch{file=require.resolve(name,{paths:[path.dirname(require.resolve(name==='axe-core'?'@axe-core/playwright':'@playwright/test'))]})}return[name,{resolved:file,realpath:fs.realpathSync(file),sha256:hash(file)}]}));
 const browsers=[];
 for(const name of ['chromium','firefox','webkit']) {
  const ordinary=pw[name].executablePath();
  const executablePath=name==='firefox'?path.resolve('.playwright-browsers',path.basename(path.dirname(path.dirname(ordinary))),'firefox','firefox.exe'):ordinary;
  const browser=await pw[name].launch({headless:true,...(name==='firefox'?{executablePath}:{})});
  browsers.push({name,version:browser.version(),executablePath,sha256:hash(executablePath)});
  await browser.close();
 }
 const dbPath=path.resolve('test-results/task4-dev-owned/games.sqlite');
 const db=new DatabaseSync(dbPath,{readOnly:true});
 const api={};
 for(const url of ['/api/games','/api/games?search=Ember&genre=RPG','/api/games/1','/api/games/1/patch-notes']){const response=await fetch('http://127.0.0.1:58730'+url);api[url]={status:response.status,body:await response.json()}}
 const inventory=git('ls-files','-z','app','tests','scripts','package.json','pnpm-lock.yaml','playwright.config.ts','tsconfig.json','pnpm-workspace.yaml').split('\0').filter(Boolean).map(p=>({path:p,sha256:hash(p)}));
 const record={recordedAt:new Date().toISOString(),commit:git('rev-parse','HEAD'),branch:git('branch','--show-current'),origin:git('remote','get-url','origin'),trackedDiff:git('diff','--exit-code'),node:process.version,nodeExec:process.execPath,nodeSha256:hash(process.execPath),platform:process.platform,osRelease:os.release(),architecture:process.arch,cwd:process.cwd(),modules,browsers,sourceFiles:inventory,dev:{baseURL:'http://127.0.0.1:58730',dbPath,api,tableCounts:{games:db.prepare('select count(*) as count from games').get().count,patchNotes:db.prepare('select count(*) as count from patch_notes').get().count,feedback:db.prepare('select count(*) as count from feedback').get().count}}};
 db.close();fs.writeFileSync('task4-evidence/environment-source-dev.json',JSON.stringify(record,null,2)+'\n');
 console.log(JSON.stringify({commit:record.commit,node:record.node,modules,browsers,devCounts:record.dev.tableCounts},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
