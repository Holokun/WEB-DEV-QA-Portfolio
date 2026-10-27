import {chromium,expect} from '@playwright/test';
import {DatabaseSync} from 'node:sqlite';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {readFileSync,writeFileSync,copyFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=process.cwd(),work=import.meta.dirname,parent=resolve(root,'test-docs/manual/evidence/new-features-structured-2026-10-27'),ev=join(parent,'focused-recoveries'),build=join(work,'build');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const originalManifest=JSON.parse(readFileSync(join(parent,'sha256.json'),'utf8'));
const originalManifestHash=sha(join(parent,'sha256.json'));
function verifyOriginal(){assert.equal(sha(join(parent,'sha256.json')),originalManifestHash);for(const e of originalManifest){const b=readFileSync(join(parent,e.file));assert.equal(b.length,e.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),e.sha256);}}
verifyOriginal();
const oldEnv=JSON.parse(readFileSync(join(parent,'environment.json'),'utf8'));
for(const item of oldEnv.buildFiles)assert.equal(sha(join(build,item.path)),item.sha256);
for(const item of oldEnv.sourceFiles)assert.equal(sha(join(root,item.path)),item.sha256);
const startedAt=new Date().toISOString(),runToken=startedAt.replaceAll(':','-'),dbPath=join(work,`focused-recovery-${runToken}.sqlite`);
assert.ok(!existsSync(dbPath));
const env={startedAt,classification:'focused corrective structured automated agent QA; not manual/human/exploratory/native AT',source:oldEnv.source,currentHEAD:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),productDiff:execFileSync('git',['diff','HEAD','--','app'],{encoding:'utf8'}),node:process.version,playwright:JSON.parse(readFileSync('node_modules/@playwright/test/package.json')).version,platform:process.platform,viewport:{width:1280,height:800},dbPath,build,buildFiles:oldEnv.buildFiles,sourceFiles:oldEnv.sourceFiles,originalManifestHash,originalArtifactHashesVerified:originalManifest.length};
assert.equal(env.productDiff,'');writeFileSync(join(ev,'environment.json'),JSON.stringify(env,null,2));
const app=spawn(process.execPath,[join(build,'app/api/server.js')],{cwd:root,env:{...process.env,DB_PATH:dbPath,UI_DIR:join(build,'app/ui'),PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});
let stdout='',stderr='';app.stdout.on('data',b=>stdout+=b);app.stderr.on('data',b=>stderr+=b);
const base=await new Promise((res,rej)=>{const timer=setTimeout(()=>rej(new Error('Owned app startup timeout')),10000);app.stdout.on('data',()=>{const m=stdout.match(/\{"url":"([^"]+)"\}/);if(m){clearTimeout(timer);res(m[1]);}});app.once('error',rej);});env.baseURL=base;
const db=new DatabaseSync(dbPath,{readOnly:true}),rows=()=>db.prepare('SELECT id,game_id,email,description FROM feedback ORDER BY id').all().map(x=>({...x}));
assert.deepEqual(rows(),[]);
const browser=await chromium.launch({headless:true});env.browser=browser.version();writeFileSync(join(ev,'environment.json'),JSON.stringify(env,null,2));
const context=await browser.newContext({viewport:env.viewport});await context.tracing.start({screenshots:true,snapshots:true,sources:true});
const page=await context.newPage();page.setDefaultTimeout(6000);
const network=[],con=[],pending=[],results=[];let current='setup';
page.on('console',m=>con.push({at:new Date().toISOString(),case:current,type:m.type(),text:m.text()}));page.on('pageerror',e=>con.push({at:new Date().toISOString(),case:current,type:'pageerror',text:String(e)}));
page.on('request',r=>{if(r.url().includes('/api/'))network.push({at:new Date().toISOString(),case:current,event:'request',method:r.method(),url:r.url(),postData:r.postData()});});
page.on('response',r=>{if(r.url().includes('/api/')){const id=current;pending.push((async()=>{let body;try{body=await r.text();}catch(e){body=String(e);}network.push({at:new Date().toISOString(),case:id,event:'response',status:r.status(),url:r.url(),body});})());}});
page.on('requestfailed',r=>network.push({at:new Date().toISOString(),case:current,event:'requestfailed',url:r.url(),failure:r.failure()}));
const original=JSON.parse(readFileSync(join(parent,'results.json'),'utf8'));
const oldDescriptions=new Set(original.flatMap(r=>r.actual?.selectedRows??r.actual?.recovery?.selectedRows??[]).map(r=>r.description));
const descriptions=new Set();
try{
for(const mode of ['HTTP500','ABORT']){
 current=`FEEDBACK-${mode}-CORRECTED`;const raw={gameId:6,email:'  Preserve.Case@example.COM  ',description:`  Synthetic focused recovery ${mode} run ${startedAt}  `};
 assert.ok(!descriptions.has(raw.description.trim()));assert.ok(!oldDescriptions.has(raw.description.trim()));descriptions.add(raw.description.trim());
 const r={id:current,scenario:'SCN-FBK-03',startedAt:new Date().toISOString(),simulation:mode,input:raw,expected:{failure:'Visible request error; exact raw fields retained; zero inserted rows',recovery:'Real POST201 positive safe ID; +1 row; exact trimmed fields by returned ID',uniqueNonboundaryDescription:true}};
 try{
  await page.goto(base+'/#/feedback');await expect(page.getByRole('heading',{name:'Feedback',exact:true})).toBeVisible();await expect(page.getByLabel('Game',{exact:true})).toBeEnabled();
  await page.getByLabel('Game',{exact:true}).selectOption('6');await page.getByLabel('Email',{exact:true}).fill(raw.email);await page.getByLabel('Description',{exact:true}).fill(raw.description);
  const before=rows();await page.route('**/api/feedback',route=>mode==='HTTP500'?route.fulfill({status:500,contentType:'application/json',body:'{"error":{"code":"INTERNAL_ERROR","message":"Unexpected server error"}}'}):route.abort('failed'));
  await page.getByRole('button',{name:'Submit feedback',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'Could not submit feedback'})).toBeVisible();
  await expect(page.getByLabel('Game',{exact:true})).toHaveValue('6');await expect(page.getByLabel('Email',{exact:true})).toHaveValue(raw.email);await expect(page.getByLabel('Description',{exact:true})).toHaveValue(raw.description);
  const afterFailure=rows();assert.deepEqual(afterFailure,before);
  const retained={gameId:await page.getByLabel('Game',{exact:true}).inputValue(),email:await page.getByLabel('Email',{exact:true}).inputValue(),description:await page.getByLabel('Description',{exact:true}).inputValue()};
  await page.screenshot({path:join(ev,current+'-failure-preserved.png'),fullPage:true});await page.unroute('**/api/feedback');
  const responsePromise=page.waitForResponse(res=>res.url()===base+'/api/feedback'&&res.request().method()==='POST');await page.getByRole('button',{name:'Submit feedback',exact:true}).click();const response=await responsePromise;const responseRaw=await response.text(),body=JSON.parse(responseRaw);
  assert.equal(response.status(),201);assert.equal(typeof body.id,'number');assert.ok(Number.isSafeInteger(body.id)&&body.id>0);await expect(page.getByRole('status')).toHaveText('Feedback submitted. Thank you!');
  const after=rows();assert.equal(after.length,before.length+1);assert.deepEqual(after.filter(x=>x.id!==body.id),before);
  const selected=db.prepare('SELECT id,game_id,email,description FROM feedback WHERE id=?').all(body.id).map(x=>({...x}));assert.deepEqual(selected,[{id:body.id,game_id:raw.gameId,email:raw.email.trim(),description:raw.description.trim()}]);
  r.actual={failure:{rawRetained:retained,countBefore:before.length,countAfter:afterFailure.length,rowsBefore:before,rowsAfter:afterFailure},recovery:{requestRaw:response.request().postData(),response:{status:response.status(),bodyRaw:responseRaw},returnedId:body.id,countBefore:before.length,countAfter:after.length,rowsBefore:before,rowsAfter:after,sqlQuery:'SELECT id,game_id,email,description FROM feedback WHERE id=?',sqlParameters:[body.id],selectedRows:selected,confirmation:await page.getByRole('status').innerText()},uniqueness:{distinctInFocusedRun:true,absentFromOriginalAcceptedDescriptions:true}};
  await page.screenshot({path:join(ev,current+'-recovered.png'),fullPage:true});r.status='PASS';
 }catch(e){r.status='FAIL';r.error=String(e.stack??e);}
 r.finishedAt=new Date().toISOString();results.push(r);writeFileSync(join(ev,'results.json'),JSON.stringify(results,null,2));console.log(`${r.status} ${current}`);
}
}finally{
await Promise.allSettled(pending);writeFileSync(join(ev,'network.json'),JSON.stringify(network,null,2));writeFileSync(join(ev,'console.json'),JSON.stringify(con,null,2));writeFileSync(join(ev,'app.stdout.log'),stdout);writeFileSync(join(ev,'app.stderr.log'),stderr);await context.tracing.stop({path:join(ev,'trace.zip')});await browser.close();db.close();app.kill();await once(app,'exit');
env.finishedAt=new Date().toISOString();env.summary={total:results.length,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length};env.originalArtifactHashesStillMatch=true;verifyOriginal();writeFileSync(join(ev,'environment.json'),JSON.stringify(env,null,2));copyFileSync(import.meta.filename,join(ev,'focused-recoveries.mjs'));copyFileSync(dbPath,join(ev,'focused-final.sqlite'));console.log(JSON.stringify(env.summary));process.exitCode=env.summary.failed?1:0;
}
