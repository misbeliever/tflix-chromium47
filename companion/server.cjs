// Mac companion; no TV shell access or external dependencies.
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
function createCompanion(host, port = 18768) {
  if (host !== '127.0.0.1' && !Object.values(os.networkInterfaces()).flat().some(x => x.address === host && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host))) throw Error('Choose localhost or this Mac’s private LAN IPv4 address');
  const token = crypto.randomBytes(16).toString('hex');
  const origin = 'http://' + host + ':' + port;
  let state = null, seen = 0, queue = [], serial = 0;
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    const reply = (code, value) => { res.writeHead(code, {'Content-Type':'application/json'}); res.end(JSON.stringify(value)); };
    if (req.headers.host !== host + ':' + port) return reply(403, {error:'Invalid host'});
    const allowed = [origin, 'http://127.0.0.1:8081', 'http://localhost:5173', 'http://127.0.0.1:5173'];
    if (req.headers.origin && !allowed.includes(req.headers.origin)) return reply(403, {error:'Invalid origin'});
    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Vary','Origin');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods','GET, POST');
      return reply(204, null);
    }
    if (req.method === 'GET' && req.url === '/') {
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      return res.end(fs.readFileSync(path.join(__dirname,'index.html')));
    }
    const auth = Buffer.from(req.headers.authorization || '');
    const expected = Buffer.from('Bearer ' + token);
    if (auth.length !== expected.length || !crypto.timingSafeEqual(auth, expected)) return reply(401,{error:'Open the private URL printed by the companion'});
    if (req.method === 'GET' && req.url === '/state') return reply(200,{connected:Date.now()-seen<6000, state});
    if (req.method !== 'POST' || !['/command','/tv'].includes(req.url)) return reply(404,{error:'Not found'});
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return reply(415,{error:'JSON required'});
    let body = '', size = 0;
    req.on('data', chunk => { size += chunk.length; if (size > 32768) req.destroy(); else body += chunk; });
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); if (!data || typeof data !== 'object') throw Error(); } catch { return reply(400,{error:'Invalid JSON'}); }
      if (req.url === '/tv') {
        // Copy only display fields: never forward arbitrary TV data or credentials.
        const text = v => typeof v === 'string' ? v.slice(0,160) : '';
        const items = v => Array.isArray(v) ? v.slice(0,30).filter(x => x && typeof x.ref === 'string').map(x => ({ref:text(x.ref),title:text(x.title),detail:text(x.detail)})) : [];
        state = {message:text(data.message),title:text(data.title),playback:!!data.playback,history:items(data.history),results:items(data.results)};
        seen = Date.now();
        const commands = queue.filter(x => Date.now()-x.created<10000);
        queue = [];
        return reply(200,{commands});
      }
      if (Date.now()-seen >= 6000) return reply(409,{error:'TV is disconnected'});
      if (!['search','open','resume','play','pause','rewind','forward','stop'].includes(data.action)) return reply(400,{error:'Unknown action'});
      const command = {id:++serial,action:data.action,created:Date.now()};
      if (data.action === 'search') {
        if (typeof data.query !== 'string' || !data.query.trim() || data.query.length>120) return reply(400,{error:'Search must be 1–120 characters'});
        command.query=data.query.trim();
      }
      if (data.action === 'open' || data.action === 'resume') {
        const list = data.action === 'open' ? state.results : state.history;
        if (!list.some(x => x.ref === data.ref)) return reply(400,{error:'Refresh the title list'});
        command.ref=data.ref;
      }
      if (queue.length >= 10) return reply(429,{error:'Please wait for the TV'});
      queue.push(command); reply(202,{queued:true});
    });
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.on('close', () => { state=null; queue=[]; });
  return {server, token, origin, listen:() => server.listen(port,host)};
}
module.exports = {createCompanion};
if (require.main === module) {
  const host = process.argv[2] || '127.0.0.1';
  const app = createCompanion(host);
  app.server.on('error', e => { console.error(e.message); process.exitCode=1; });
  app.server.on('listening', () => console.log('Open on Mac and enter in TFlix → Mac companion:\n'+app.origin+'/#'+app.token+'\nKeep this URL private. Stop with Control+C.'));
  app.listen();
}
