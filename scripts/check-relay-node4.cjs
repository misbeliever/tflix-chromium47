// NODE4 is an official Node 4 binary. All state/fixtures stay local and temporary.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),http=require('node:http');
const root=path.resolve(__dirname,'..'),runtime=process.env.NODE4;
assert(runtime,'Set NODE4 to the Node 4.4.3 executable');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tflix-node4-check-'));
const file=process.argv[2] || JSON.parse(fs.readFileSync(path.join(root,'package.json'))).serviceFile;
const harness=path.join(temp,'run.js');
fs.writeFileSync(harness,`var fs=require('fs'),vm=require('vm'),http=require('http'),https=require('https'),os=require('os');
var realCreate=http.createServer;http.createServer=function(fn){var s=realCreate(function(req,res){Object.defineProperty(req.socket,'remoteAddress',{value:req.headers['x-test-remote']||'127.0.0.1',configurable:true});fn(req,res)});var listen=s.listen;s.listen=function(port,host,cb){return listen.call(s,18770,'127.0.0.1',cb);};return s;};
https.request=function(options,cb){options=Object.assign({},options,{protocol:'http:',hostname:'127.0.0.1',host:'127.0.0.1',port:18771});return http.request(options,cb)};
os.tmpdir=function(){return ${JSON.stringify(temp)}};
var sandbox={};Object.getOwnPropertyNames(global).forEach(function(name){if(['services','module','global','inDebug','currentClient','currentModule'].indexOf(name)<0)sandbox[name]=global[name];});sandbox.require=require;sandbox.module={exports:{}};\nvm.runInNewContext(fs.readFileSync(${JSON.stringify(path.resolve(root,file))},'utf8'),sandbox,{filename:'TFlix-service.js'});`);
const fixture=http.createServer((req,res)=>{
 res.setHeader('Content-Type','application/json');
 if(req.url.endsWith('/manifest.json')) {
  const kind=req.url.split('/')[1];res.end(JSON.stringify({name:'Fixture '+kind,providers:[{id:kind==='invalid'?'../escape':kind,file:'provider.js'}]}));
 } else if(req.url==='/modern/provider.js')res.end("module.exports={id:'modern',resolve:async function(){return {}}};");
 else if(req.url==='/demo/provider.js')res.end("module.exports={id:'demo',name:'Local fixture',resolve:function(){return Promise.resolve({streamUrl:'https://fixture.invalid/video/main.m3u8'})}};");
 else if(req.url==='/video/main.m3u8'){res.setHeader('Content-Type','application/vnd.apple.mpegurl');res.end('#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\nsegment.ts\n');}
 else if(req.url==='/video/segment.ts'){res.writeHead(206,{'Content-Type':'video/mp2t','Content-Range':'bytes 0-3/4'});res.end('DATA');}
 else{res.statusCode=404;res.end('{}');}
});
function request(route,data,extra={}){return new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port:18770,path:route,method:extra['Access-Control-Request-Method']?'OPTIONS':data?'POST':'GET',headers:{Origin:'http://127.0.0.1:8081','Content-Type':'application/json',...extra}},res=>{let text='';res.on('data',x=>text+=x);res.on('end',()=>{let body;try{body=JSON.parse(text)}catch{body=text}resolve({code:res.statusCode,body,headers:res.headers})});});req.setTimeout(1500,()=>req.destroy(Error('timeout')));req.on('error',reject);req.end(data?JSON.stringify(data):undefined);});}
(async()=>{
 await new Promise(resolve=>fixture.listen(18771,'127.0.0.1',resolve));
 const child=cp.spawn(runtime,[harness],{stdio:['ignore','pipe','pipe']});
 let logs='';child.stdout.on('data',x=>logs+=x);child.stderr.on('data',x=>logs+=x);
 try {
  let health;
  for(let i=0;i<200;i++){if(child.exitCode!==null)break;try{health=await request('/health');break;}catch{await new Promise(r=>setTimeout(r,50));}}
  assert(health && health.code===200 && health.body.ok,'REPRO: Local relay Not reachable / provider install Failed to fetch.\n'+logs.slice(-2000));
  const preflight=await request('/packs/install',null,{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'});
  assert.equal(preflight.code,204);
  assert(preflight.headers['access-control-allow-headers'].toLowerCase().split(',').map(x=>x.trim()).includes('content-type'),'REPRO: Chromium 47 blocks JSON install: preflight must explicitly allow Content-Type, not wildcard');
  assert.equal(preflight.headers['access-control-allow-origin'],'http://127.0.0.1:8081');
  assert.equal((await request('/health',null,{Origin:'https://untrusted.example'})).code,403);
  assert.equal((await request('/pair/start',null,{'x-test-remote':'192.168.50.99'})).code,403);
  const providers=await request('/providers');assert.equal(providers.code,200);assert(Array.isArray(providers.body.providers));
  const pair=await request('/pair/start');assert.equal(pair.code,200);assert(/^\d{6}$/.test(pair.body.code));
  const install=await request('/packs/install',{url:'https://fixture.invalid/demo/manifest.json'});
  assert.equal(install.code,200,JSON.stringify(install.body));assert.deepEqual(install.body.installed,['demo']);
  assert.equal((await request('/providers')).body.providers[0].id,'demo');
  const resolved=await request('/resolve?provider=demo&tmdbId=1');assert.equal(resolved.code,200);
  const stream=new URL(resolved.body.streamUrl);
  const playlist=await request(stream.pathname+stream.search);assert.equal(playlist.code,200);assert(playlist.body.includes(encodeURIComponent('https://fixture.invalid/video/segment.ts')));assert(playlist.body.includes(encodeURIComponent('https://fixture.invalid/video/init.mp4')));
  const segment=await request('/hls?url='+encodeURIComponent('https://fixture.invalid/video/segment.ts'),null,{Range:'bytes=0-3'});assert.equal(segment.code,206);assert.equal(segment.body,'DATA');
  const modern=await request('/packs/install',{url:'https://fixture.invalid/modern/manifest.json'});assert.equal(modern.code,400);assert(modern.body.error.includes('incompatible with this Node runtime'));
  const invalid=await request('/packs/install',{url:'https://fixture.invalid/invalid/manifest.json'});assert.equal(invalid.code,400);assert(invalid.body.error.includes('invalid id/file'));
  assert(!fs.existsSync(path.join(temp,'escape.js')));
  assert.equal((await request('/packs/install',{url:'https://fixture.invalid/demo/manifest.json'},{'x-test-remote':'192.168.50.99'})).code,403);
  assert.equal((await request('/packs/uninstall',{url:'https://fixture.invalid/demo/manifest.json'})).code,200);
  console.log('PASS: actual Node 4 VM startup/health, URL+HTTP, pairing, pack install/load/resolve/uninstall, HLS rewrite/range, incompatible provider error, origin/LAN/path guards');
 } finally {child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));await new Promise(r=>fixture.close(r));fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
