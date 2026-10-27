const fs=require('node:fs');
const os=require('node:os');
class Recorder {
  onBegin(config,suite) {
    this.data={startedAt:new Date().toISOString(),node:process.version,platform:process.platform,release:os.release(),architecture:process.arch,cwd:process.cwd(),baseURL:process.env.GAME_TEST_URL,dbPath:process.env.GAME_TEST_DB,workers:config.workers,forbidOnly:config.forbidOnly,projects:config.projects.map(p=>({name:p.name,retries:p.retries,viewport:p.use.viewport,testMatch:p.testMatch,launchOptions:p.use.launchOptions})),listedTests:suite.allTests().length};
  }
  onEnd(result) {Object.assign(this.data,{finishedAt:new Date().toISOString(),status:result.status});fs.writeFileSync('task4-evidence/full-provenance.json',JSON.stringify(this.data,null,2)+'\n');}
}
module.exports=Recorder;
