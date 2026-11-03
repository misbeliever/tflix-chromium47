const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {createCompanion} = require('./server.cjs');
(async () => {
  assert.throws(() => createCompanion('0.0.0.0'));
  const c=createCompanion('127.0.0.1',18769);
  await new Promise(resolve=>c.server.listen(18769,'127.0.0.1',resolve));
  const request=(route,data,extra={}) => fetch(c.origin+route,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json',...extra},body:data?JSON.stringify(data):undefined});
  try {
    assert.equal((await fetch(c.origin+'/state')).status,401);
    assert.equal((await request('/state',null,{Origin:'http://untrusted.example'})).status,403);
    const wrongHost=await new Promise(resolve => { require('node:http').get(c.origin+'/state',{headers:{Host:'evil.example',Authorization:'Bearer '+c.token}},r => {r.resume();resolve(r.statusCode);}); });
    assert.equal(wrongHost,403);
    assert.equal((await request('/command',{action:'play'})).status,409);
    assert.equal((await request('/tv',{history:[{ref:'a',title:'Saved',secret:'do not forward'}],results:[],apiKey:'secret'})).status,200);
    const state=await (await request('/state')).json();
    assert.equal(state.connected,true);assert(!JSON.stringify(state).includes('secret'));
    assert.equal((await request('/command',{action:'shell'})).status,400);
    assert.equal((await request('/command',{action:'open',ref:'unknown'})).status,400);
    assert.equal((await request('/command',{action:'search',query:'x'.repeat(121)})).status,400);
    assert.equal((await request('/command',{action:'search',query:'Example'})).status,202);
    const response=await request('/tv',{} ,{Origin:'http://127.0.0.1:8081'});
    assert.equal(response.headers.get('access-control-allow-origin'),'http://127.0.0.1:8081');
    assert.equal((await response.json()).commands[0].query,'Example');
    assert.equal((await (await request('/tv',{})).json()).commands.length,0);
    for(let i=0;i<10;i++)assert.equal((await request('/command',{action:'pause'})).status,202);
    assert.equal((await request('/command',{action:'pause'})).status,429);
  } finally { await new Promise(resolve=>c.server.close(resolve)); }

  // Run the actual TV adapter with a fake dialog/player/network; no TMDB or provider traffic.
  let calls=[], payloads=[], task, connectionInput, currentOverlay, listener, opened;
  const controls={};
  function overlay(){const elements={};return {className:'',remove(){currentOverlay=null;},querySelector(id){if(!elements[id])elements[id]={value:'http://127.0.0.1:18768/#'+'a'.repeat(32)};return elements[id];}};}
  const app={activePlayer:{media:{title:'Example'},activePlayerInstance:{videoEl:{play:async()=>calls.push('play'),pause:()=>calls.push('pause')},seekBy:n=>calls.push(n)},close:()=>calls.push('stop')},openDetails:x=>opened=x,resumeHistoryItem:async x=>opened=x};
  let commands=[{action:'search',query:'Example'},{action:'play'},{action:'pause'},{action:'rewind'},{action:'forward'}];
  const context={URL:function(){throw Error('Invalid scheme');},AbortController,console,storage:{getHistory:()=>[{id:7,title:'Saved',media_type:'movie',source:'tmdb'}]},tmdb:{searchMulti:async()=>[{id:8,title:'Example',media_type:'movie'},{id:9,name:'Person',media_type:'person'}]},nav:{setScope(){},pushBackHandler(){},popBackHandler(){},clearScope(){}},window:{addEventListener:(e,f)=>listener=f},document:{createElement:overlay,body:{appendChild:x=>currentOverlay=x},querySelector:()=>null},setTimeout:f=>{task=f;return 1;},clearTimeout(){},fetch:async(url,opts)=>{payloads.push(JSON.parse(opts.body));return {ok:true,json:async()=>({commands:commands.splice(0)})};}};
  const source=fs.readFileSync(require('node:path').join(__dirname,'../src/companion.js'),'utf8').replace(/^import .*;\n/gm,'').replace(/^export function /gm,'function ');
  const parse=vm.runInNewContext(source+'\nparseCompanionAddress',context);
  for(const address of ['http://192.168.1.20:18768/#','192.168.1.20:18768/#','HTTP://192.168.1.20/#']) {
    const parsed=parse('  '+address+'A'.repeat(32)+'  ');assert.equal(parsed.base,'http://192.168.1.20:18768');assert.equal(parsed.token,'a'.repeat(32));
  }
  for(const address of ['http://8.8.8.8:18768/#','http://192.168.1.256:18768/#','http://192.168.01.20:18768/#','http://user@192.168.1.20:18768/#','https://192.168.1.20:18768/#','file://192.168.1.20:18768/#','http://192.168.1.20:80/#','http://192.168.1.20:18768/path#'])assert.throws(()=>parse(address+'a'.repeat(32)));
  assert.throws(()=>parse('http://192.168.1.20:18768/'),/access key after #/);
  assert.throws(()=>parse('http://192.168.1.20:18768/#short'),/32-character/);
  const adapter=vm.runInNewContext(source+'\ncreateCompanion',context)(app);
  assert(/id="companion-url" type="text"/.test(source),'Connection address must be visible plain text');
  adapter.show();currentOverlay.querySelector('#companion-connect').onclick();
  await new Promise(r=>setImmediate(r));
  assert.deepEqual(calls,['play','pause',-10,10]);
  await task();
  assert.equal(payloads.at(-1).results.length,1);
  commands=[{action:'open',ref:payloads.at(-1).results[0].ref}];await task();assert.equal(opened.id,8);
  commands=[{action:'resume',ref:payloads.at(-1).history[0].ref}];await task();assert.equal(opened.id,7);
  app.activePlayer.activePlayerInstance=null;commands=[{action:'play'}];await task();await task();
  assert(payloads.at(-1).message.includes('built-in video player'));
  const before=payloads.length;adapter.disconnect();await task();assert.equal(payloads.length,before);
  console.log('PASS: authentication, Host/Origin, input bounds, queue limit, redaction, one-time delivery, TV search/open/resume/playback, iframe rejection, disconnect, visible address and URL-constructor-free validation');
})().catch(e=>{console.error(e);process.exitCode=1;});
