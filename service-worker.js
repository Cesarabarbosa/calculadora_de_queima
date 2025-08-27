// Service Worker básico para GitHub Pages
const CACHE_NAME = 'queima-cache-v1';
const OFFLINE_URL = 'offline.html';
const PRECACHE = [
  './',
  'index.html',
  'manifest.json',
  'offline.html',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
      .then(self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Não cacheia métodos não-GET (login/salvamento)
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      // network-first
      const networkResp = await fetch(request);
      // cacheia apenas se for mesma origem
      const url = new URL(request.url);
      if (url.origin === location.origin) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResp.clone());
      }
      return networkResp;
    } catch (err) {
      // offline: tenta cache; se for navegação HTML, mostra offline.html
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.headers.get('accept')?.includes('text/html')) {
        return cache.match(OFFLINE_URL);
      }
      throw err;
    }
  })());
});
