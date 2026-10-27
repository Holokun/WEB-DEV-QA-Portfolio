process.env.DEBUG='pw:browser';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const pw=require('@playwright/test');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const runtime=[];
 for(const name of ['chromium','firefox','webkit']){
  const registryDefaultExecutable=pw[name].executablePath();
  const actualExecutable=name==='chromium'?path.join(path.dirname(path.dirname(path.dirname(registryDefaultExecutable))),'chromium_headless_shell-1243','chrome-headless-shell-win64','chrome-headless-shell.exe'):name==='firefox'?path.resolve('.playwright-browsers/firefox-1543/firefox/firefox.exe'):registryDefaultExecutable;
  const browser=await pw[name].launch(name==='firefox'?{executablePath:actualExecutable}:{});
  runtime.push({name,version:browser.version(),registryDefaultExecutable,actualExecutable,actualExecutableSha256:hash(actualExecutable),actualExecutableRealpath:fs.realpathSync(actualExecutable)});
  await browser.close();
 }
 fs.writeFileSync('task4-evidence/browser-runtime.json',JSON.stringify({recordedAt:new Date().toISOString(),note:'Default headless launch for Chromium/WebKit; documented clone-local official Firefox. Native DEBUG launch lines accompany this record. Earlier environment-source-dev executablePath fields were registry defaults, not proof of Chromium actual launched executable.',runtime},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
