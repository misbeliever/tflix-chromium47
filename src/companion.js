import { storage } from './store/storage.js';
import { tmdb } from './api/tmdb.js';
import { nav } from './nav/spatialNav.js';

// Only private IPv4 companion addresses are supported; no browser URL constructor needed.
export function parseCompanionAddress(value) {
  let text = String(value || '').trim();
  if (/^https:\/\//i.test(text)) throw Error('Use http:// for the local Mac companion, not https://.');
  text = text.replace(/^http:\/\//i, '');
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) throw Error('Use http:// followed by the Mac IP address.');
  const match = /^(\d{1,3}(?:\.\d{1,3}){3})(?::(\d+))?\/?(?:#([^\s]*))?$/.exec(text);
  if (!match) throw Error('Enter the Mac connection address, for example http://192.168.1.20:18768/#access-key.');
  const host = match[1], octets = host.split('.').map(Number);
  const privateHost = host === '127.0.0.1' || octets[0] === 10 || octets[0] === 192 && octets[1] === 168 || octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31;
  if (!privateHost || octets.some((n, i) => n > 255 || String(n) !== host.split('.')[i])) throw Error('Use your Mac’s private home-network IPv4 address.');
  if (match[2] && match[2] !== '18768') throw Error('The Mac companion uses port 18768.');
  if (!match[3]) throw Error('Address recognised. Use Copy connection address on the Mac page to include its access key after #.');
  if (!/^[a-f0-9]{32}$/i.test(match[3])) throw Error('The access key after # must be the complete 32-character key from the Mac companion.');
  return {base: 'http://' + host + ':18768', token: match[3].toLowerCase()};
}

// Connection credentials stay in memory and disappear when TFlix closes.
export function createCompanion(app) {
  let connection = null, timer = null, generation = 0, results = [], message = 'Ready', serial = 0;
  let resultItems = {}, historyItems = {};
  function disconnect() {
    generation++; connection = null; clearTimeout(timer); results=[]; resultItems={}; historyItems={};
  }
  function summary(item, ref) {
    const isTv = item.media_type === 'tv' || item.mediaType === 'tv';
    return {ref, title:item.title || item.name || 'Untitled',
      detail:(isTv && item.season ? `S${item.season} E${item.episode || 1} · ` : '') + (item.progress ? `${item.progress}% watched` : '')};
  }
  async function execute(command, currentGeneration) {
    if (command.action === 'search') {
      const items = await tmdb.searchMulti(command.query);
      if (generation !== currentGeneration) return;
      resultItems = {};
      results = items.filter(x => x.media_type === 'movie' || x.media_type === 'tv').slice(0,20).map(item => {
        const ref = 'result-' + (++serial); resultItems[ref]=item; return summary(item,ref);
      });
      message = `${results.length} results`;
    } else if (command.action === 'open' || command.action === 'resume') {
      if (document.querySelector('.modal-overlay')) throw Error('Close the TV dialog or player first');
      const item = command.action === 'open' ? resultItems[command.ref] : historyItems[command.ref];
      if (!item) throw Error('Refresh the title list');
      if (command.action === 'resume') await app.resumeHistoryItem(item);
      else app.openDetails(item);
      message='Title opened on TV';
    } else {
      const modal=app.activePlayer;
      if (command.action === 'stop') { if (modal) modal.close(); message='Player closed'; return; }
      const player=modal && modal.activePlayerInstance;
      if (!player || !player.videoEl) throw Error('Controls require the built-in video player; embedded players are not supported');
      if (command.action === 'play') await player.videoEl.play();
      else if (command.action === 'pause') player.videoEl.pause();
      else if (command.action === 'rewind') player.seekBy(-10);
      else if (command.action === 'forward') player.seekBy(10);
      else throw Error('Unknown control');
      message='Playback command applied';
    }
  }
  async function poll(currentGeneration) {
    if (!connection || currentGeneration !== generation) return;
    const controller=new AbortController();
    const timeout=setTimeout(() => controller.abort(),4000);
    try {
      historyItems={};
      const history=storage.getHistory().map(item => {
        const ref=JSON.stringify([item.source || 'tmdb', item.id]);
        historyItems[ref]=item; return summary(item,ref);
      });
      const modal=app.activePlayer;
      const response=await fetch(connection.base+'/tv', {method:'POST',signal:controller.signal,
        headers:{'Authorization':'Bearer '+connection.token,'Content-Type':'application/json'},
        body:JSON.stringify({history,results,message,title:modal ? modal.media.title || modal.media.name || '' : '',
          playback:!!(modal && modal.activePlayerInstance && modal.activePlayerInstance.videoEl)})});
      if (!response.ok) throw Error('Mac connection refused; check the address');
      const data=await response.json();
      clearTimeout(timeout);
      if (currentGeneration !== generation) return;
      for (const command of data.commands || []) {
        if (currentGeneration !== generation) return;
        try { await execute(command,currentGeneration); }
        catch (e) { if (currentGeneration === generation) message=e.message; }
      }
    } catch (e) {
      if (currentGeneration === generation) message='Mac unavailable; reconnecting';
    } finally {
      clearTimeout(timeout);
      if (connection && currentGeneration === generation) timer=setTimeout(() => poll(currentGeneration),1500);
    }
  }
  function show() {
    const overlay=document.createElement('div'); overlay.className='modal-overlay';
    overlay.innerHTML='<div class="modal-container" style="max-width:720px;padding:32px"><h2>Mac companion</h2><p style="margin:20px 0">Start the companion on your Mac. Copy its complete connection address, including the access key after #. The address stays visible so you can check it. Your watch history and searches are shared only while connected.</p><label for="companion-url">Mac connection address</label><input class="focusable" id="companion-url" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" style="display:block;width:95%;margin:20px 0;padding:12px" placeholder="http://192.168.…:18768/#…"><p id="companion-message" role="status"></p><button class="btn btn-primary focusable" id="companion-connect">Connect</button> <button class="btn btn-secondary focusable" id="companion-disconnect">Disconnect</button> <button class="btn btn-secondary focusable" id="companion-close">Back</button></div>';
    document.body.appendChild(overlay);
    const close=() => {nav.popBackHandler(close);nav.clearScope(overlay);overlay.remove();return true;};
    nav.setScope(overlay);nav.pushBackHandler(close);
    const status=overlay.querySelector('#companion-message');
    status.textContent=connection?'Connected / reconnecting. Disconnect to stop sharing.':'Disconnected';
    overlay.querySelector('#companion-close').onclick=close;
    overlay.querySelector('#companion-disconnect').onclick=() => {disconnect();status.textContent='Disconnected';};
    overlay.querySelector('#companion-connect').onclick=() => {
      try {
        const next = parseCompanionAddress(overlay.querySelector('#companion-url').value);
        disconnect();connection=next;message='Ready';poll(generation);close();
      } catch(e) {status.textContent=e.message;}
    };
  }
  window.addEventListener('pagehide',disconnect);
  return {show,disconnect};
}
