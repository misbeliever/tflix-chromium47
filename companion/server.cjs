// Mac-only companion. Durable pairing uses a private user-owned settings file.
const http=require('node:http'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
function createCompanion(host,port=18768,options={}) {
  if(host!=='127.0.0.1'&&!Object.values(os.networkInterfaces()).flat().some(x=>x.address===host&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)))throw Error('Choose localhost or this Mac’s private LAN IPv4 address');
  const directory=options.directory||process.env.TFLIX_COMPANION_DATA_DIR||path.join(os.homedir(),'Library/Application Support/TFlix Companion');
  fs.mkdirSync(directory,{recursive:true,mode:0o700});
  const dir=fs.lstatSync(directory);
  if(!dir.isDirectory()||dir.isSymbolicLink()||dir.uid!==process.getuid()||(dir.mode&0o077))throw Error('Pairing folder must be owned by you and private (mode 700)');
  const settings=path.join(directory,'pairing.json');
  function write(value){const temp=settings+'.'+crypto.randomBytes(8).toString('hex');try{fs.writeFileSync(temp,JSON.stringify(value),{mode:0o600,flag:'wx'});fs.renameSync(temp,settings);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}}
  let config;
  if(fs.existsSync(settings)) {
    const st=fs.lstatSync(settings);if(!st.isFile()||st.isSymbolicLink()||st.uid!==process.getuid()||(st.mode&0o077))throw Error('Pairing file must be a private file owned by you (mode 600)');
    config=JSON.parse(fs.readFileSync(settings,'utf8'));
    if(config.version!==1||!/^[a-f0-9]{32}$/.test(config.adminToken)||config.tvHash!==null&&!/^[a-f0-9]{64}$/.test(config.tvHash))throw Error('Pairing file is invalid; restore it or remove only pairing.json to pair again');
  } else {config={version:1,adminToken:crypto.randomBytes(16).toString('hex'),tvHash:null};write(config);}
  const token=config.adminToken,origin='http://'+host+':'+port,pairs=new Map();
  const appOrigins=['http://127.0.0.1:8081','http://localhost:5173','http://127.0.0.1:5173'];
  const equal=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&crypto.timingSafeEqual(x,y);};
  const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
  let state=null,seen=0,queue=[],serial=0;
  const server=http.createServer((req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    const reply=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
    if(req.headers.host!==host+':'+port)return reply(403,{error:'Invalid host'});
    if(req.headers.origin&&![origin,...appOrigins].includes(req.headers.origin))return reply(403,{error:'Invalid origin'});
    if(req.headers.origin){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');}
    if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, X-Pairing-Key');res.setHeader('Access-Control-Allow-Methods','GET, POST');return reply(204,null);}
    if(req.method==='GET'&&req.url==='/'){
      res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(fs.readFileSync(path.join(__dirname,'index.html')));
    }
    for(const [id,pair] of pairs)if(pair.expiresAt<Date.now())pairs.delete(id);
    const bearer=(req.headers.authorization||'').replace(/^Bearer /,'');
    const admin=equal(bearer,token),tv=!!config.tvHash&&equal(hash(bearer),config.tvHash);
    const pairStatus=/^\/pair\/status\?id=([a-f0-9]{32})$/.exec(req.url);
    if(req.method==='GET'&&pairStatus){
      if(!appOrigins.includes(req.headers.origin))return reply(403,{error:'Pair from TFlix on the TV'});
      const pair=pairs.get(pairStatus[1]);if(!pair||!equal(req.headers['x-pairing-key'],pair.key))return reply(404,{error:'Pairing expired; try again'});
      return reply(200,pair.token?{state:'approved',token:pair.token}:{state:'pending'});
    }
    const pairingRequest=['/pair/request','/pair/cancel'].includes(req.url)&&req.method==='POST';
    if(pairingRequest&&!appOrigins.includes(req.headers.origin))return reply(403,{error:'Pair from TFlix on the TV'});
    if(!pairingRequest&&!admin&&!(req.url==='/tv'&&tv))return reply(401,{error:'Open the private Mac URL, or pair the TV again'});
    if(req.method==='GET'&&req.url==='/state')return reply(200,{connected:Date.now()-seen<6000,paired:!!config.tvHash,state});
    if(req.method==='GET'&&req.url==='/pair/list')return reply(200,{requests:[...pairs].filter(([,p])=>!p.token).map(([id,p])=>({id,code:p.code,address:p.address,expiresAt:p.expiresAt}))});
    if(req.method!=='POST'||!['/command','/tv','/pair/request','/pair/cancel','/pair/approve','/pair/forget'].includes(req.url))return reply(404,{error:'Not found'});
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(415,{error:'JSON required'});
    let body='',size=0;req.on('data',chunk=>{size+=chunk.length;if(size>32768)req.destroy();else body+=chunk;});
    req.on('end',()=>{
      let data;try{data=JSON.parse(body);if(!data||typeof data!=='object')throw Error();}catch{return reply(400,{error:'Invalid JSON'});}
      if(req.url==='/pair/cancel'){
        const pair=pairs.get(data.id);if(!pair||!equal(req.headers['x-pairing-key'],pair.key))return reply(404,{error:'Pairing not found'});
        pairs.delete(data.id);return reply(200,{cancelled:true});
      }
      if(req.url==='/pair/request'){
        if(!/^[a-f0-9]{32}$/.test(data.key||''))return reply(400,{error:'Invalid pairing request'});
        if(pairs.size>=8)return reply(429,{error:'Too many pairing requests; wait two minutes'});
        const address=req.socket.remoteAddress||'';
        if([...pairs.values()].filter(p=>p.address===address).length>=3)return reply(429,{error:'Pairing already requested; wait two minutes'});
        const id=crypto.randomBytes(16).toString('hex'),code=String(crypto.randomInt(100000,1000000));
        const expiresAt=Date.now()+120000;pairs.set(id,{key:data.key,code,expiresAt,address,token:null});return reply(200,{id,code,expiresAt});
      }
      if(req.url==='/pair/approve'){
        const pair=pairs.get(data.id);if(!pair||pair.token)return reply(404,{error:'Pairing expired or already approved'});
        const tvToken=crypto.randomBytes(16).toString('hex');
        try{write({...config,tvHash:hash(tvToken)});}catch{return reply(500,{error:'Could not save pairing. Check Mac storage permissions'});}
        config.tvHash=hash(tvToken);pair.token=tvToken;queue=[];seen=0;state=null;return reply(200,{approved:true});
      }
      if(req.url==='/pair/forget'){
        try{write({...config,tvHash:null});}catch{return reply(500,{error:'Could not forget pairing'});}
        config.tvHash=null;pairs.clear();queue=[];state=null;seen=0;return reply(200,{forgotten:true});
      }
      if(req.url==='/tv'){
        const text=v=>typeof v==='string'?v.slice(0,160):'';
        const items=v=>Array.isArray(v)?v.slice(0,30).filter(x=>x&&typeof x.ref==='string').map(x=>({ref:text(x.ref),title:text(x.title),detail:text(x.detail)})):[];
        state={message:text(data.message),title:text(data.title),playback:!!data.playback,history:items(data.history),results:items(data.results)};seen=Date.now();
        const commands=queue.filter(x=>Date.now()-x.created<10000);queue=[];return reply(200,{commands});
      }
      if(Date.now()-seen>=6000)return reply(409,{error:'TV is disconnected'});
      if(!['search','open','resume','play','pause','rewind','forward','stop'].includes(data.action))return reply(400,{error:'Unknown action'});
      const command={id:++serial,action:data.action,created:Date.now()};
      if(data.action==='search'){if(typeof data.query!=='string'||!data.query.trim()||data.query.length>120)return reply(400,{error:'Search must be 1–120 characters'});command.query=data.query.trim();}
      if(data.action==='open'||data.action==='resume'){const list=data.action==='open'?state.results:state.history;if(!list.some(x=>x.ref===data.ref))return reply(400,{error:'Refresh the title list'});command.ref=data.ref;}
      if(queue.length>=10)return reply(429,{error:'Please wait for the TV'});
      queue.push(command);reply(202,{queued:true});
    });
  });
  server.requestTimeout=5000;server.headersTimeout=5000;server.on('close',()=>{state=null;queue=[];});
  return {server,token,origin,listen:()=>server.listen(port,host)};
}
module.exports={createCompanion};
if(require.main===module){const app=createCompanion(process.argv[2]||'127.0.0.1');app.server.on('error',e=>{console.error(e.message);process.exitCode=1;});app.server.on('listening',()=>console.log('Open on Mac (keep private):\n'+app.origin+'/#'+app.token+'\nEnter on TV (no key needed):\n'+app.origin+'/\nApprove the matching pairing code on the Mac page once. Stop with Control+C.'));app.listen();}
