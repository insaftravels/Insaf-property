/* ইনসাফ প্রপার্টি ম্যানেজার — Service Worker
   ⚠️ প্রতিবার ডিপ্লয়ের সময় CACHE_NAME এর সংখ্যা বাড়াও (v1 → v2 → v3 …) */
const CACHE_NAME = 'insaf-pm-v2';
const ASSETS = ['./','./index.html','./manifest.json'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  const url = e.request.url;
  // Firebase/Google/CDN → সবসময় নেটওয়ার্ক (ক্যাশ করো না)
  if(url.includes('firestore') || url.includes('googleapis') ||
     url.includes('gstatic') || url.includes('cloudflare')){
    return; // ব্রাউজার নিজে হ্যান্ডল করবে
  }
  // অ্যাপ শেল → cache-first
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request).then(resp=>{
      if(resp.ok && e.request.method==='GET'){
        const copy=resp.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));
      }
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
