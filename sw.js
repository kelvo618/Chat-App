const C='plink-v3',SHELL=['/','/icon.svg','/icon-192.png','/manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.pathname.startsWith('/api')||u.pathname.startsWith('/socket.io')||u.pathname.startsWith('/uploads'))return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
});

// ---- push notifications (messages, calls, missed calls) ----
self.addEventListener('push',e=>{
  let d={};try{d=e.data.json()}catch{}
  e.waitUntil((async()=>{
    const wins=await clients.matchAll({type:'window',includeUncontrolled:true});
    if(wins.some(w=>w.visibilityState==='visible'))return;   // the app is open and in view: it already shows this itself
    await self.registration.showNotification(d.title||'PHANTOM LINK',{
      body:d.body||'',icon:'/icon-192.png',badge:'/icon-192.png',tag:d.tag||undefined,renotify:!!d.tag,
      requireInteraction:d.type==='call',vibrate:d.type==='call'?[300,150,300,150,300]:[120],
      data:{url:d.url||'/',type:d.type||'',chat:d.chat||''}
    });
  })());
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const d=e.notification.data||{};
  e.waitUntil((async()=>{
    const wins=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const w of wins){
      if('focus' in w){await w.focus();w.postMessage({type:'open',chat:d.chat||null,tab:d.type==='call'||d.type==='missed'?'calls':null});return}
    }
    await clients.openWindow(d.url||'/');
  })());
});
