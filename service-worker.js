const C='cw-cache-v1';const A=['./','./index.html','./styles.css','./app.jsx','./manifest.webmanifest','./icon-192.png','./icon-512.png',
'https://unpkg.com/react@18/umd/react.production.min.js','https://unpkg.com/react-dom@18/umd/react-dom.production.min.js','https://unpkg.com/@babel/standalone/babel.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)))}) ;
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(e.request.method==='GET'){const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp)).catch(()=>{})}return n}).catch(()=>caches.match('./index.html'))))});