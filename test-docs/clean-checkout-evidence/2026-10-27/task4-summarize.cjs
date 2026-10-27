const fs=require('node:fs');
const path=require('node:path');
const report=JSON.parse(fs.readFileSync('task4-evidence/full-results.json','utf8'));
const listed=JSON.parse(fs.readFileSync('task4-evidence/test-list.json','utf8'));
function flatten(report){const rows=[];function visit(s){for(const spec of s.specs||[])for(const t of spec.tests||[])rows.push({file:spec.file,line:spec.line,column:spec.column,title:spec.title,project:t.projectName,status:t.status,expectedStatus:t.expectedStatus,results:t.results||[]});for(const c of s.suites||[])visit(c)}for(const s of report.suites||[])visit(s);return rows}
const rows=flatten(report), listRows=flatten(listed);
const counts={},smoke={},inventory={};
for(const row of rows){
 const key=row.project;
 counts[key]??={listed:0,passed:0,failed:0,skipped:0,attempts:0,maxRetry:0};
 const c=counts[key];c.listed++;c.attempts+=row.results.length;
 for(const r of row.results){if(r.status==='passed')c.passed++;else if(r.status==='skipped')c.skipped++;else c.failed++;c.maxRetry=Math.max(c.maxRetry,r.retry)}
 if(row.title.includes('@smoke')){smoke[key]??=[];smoke[key].push({title:row.title,status:row.status,results:row.results.map(r=>({status:r.status,retry:r.retry}))})}
 for(const match of row.title.matchAll(/(TEST-(?:UI|API|DATA|A11Y)-)(\d+(?:\/\d+)*)/g))for(const number of match[2].split('/')){const id=match[1]+number;inventory[id]??=[];inventory[id].push({project:row.project,title:row.title,status:row.status})}
}
const attachmentPaths=rows.flatMap(row=>row.results.flatMap(r=>(r.attachments||[]).filter(a=>a.path).map(a=>({project:row.project,title:row.title,name:a.name,contentType:a.contentType,originalPath:a.path,relativeToClone:path.relative(process.cwd(),a.path).replaceAll('\\','/')}))));
const summary={generatedAt:new Date().toISOString(),source:'Unmodified native full-results.json and test-list.json; derived inventory expansion handles combined IDs such as TEST-UI-02/03.',nativeStats:report.stats,nativeErrors:report.errors,listedExecutions:listRows.length,executedDefinitions:new Set(rows.map(r=>`${r.file}:${r.line}:${r.column}:${r.title}`)).size,projectCounts:counts,allAttempts:rows.reduce((n,r)=>n+r.results.length,0),unexpected:rows.filter(r=>r.status!=='expected'),inventoryIds:Object.keys(inventory).sort(),inventoryEntryCount:Object.keys(inventory).length,smoke,inventory,attachments:attachmentPaths};
summary.inlineAttachments=rows.flatMap(row=>row.results.flatMap(r=>(r.attachments||[]).filter(a=>a.body).map(a=>({project:row.project,title:row.title,name:a.name,contentType:a.contentType,bodyEncoding:'base64',bodyRetainedInNativeJSON:true}))));
summary.inlineAttachmentCount=summary.inlineAttachments.length;
fs.writeFileSync('task4-evidence/derived-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({stats:report.stats,counts,definitions:summary.executedDefinitions,inventory:summary.inventoryEntryCount,smoke:Object.fromEntries(Object.entries(smoke).map(([k,v])=>[k,v.length])),unexpected:summary.unexpected.length,attachments:attachmentPaths.length},null,2));
