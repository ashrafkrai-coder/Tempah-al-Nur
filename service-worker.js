const cacheName = 'surau-v5';
const staticAssets = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon32.png',
  './icons/icon512.png',
  './icons/icon912.png'
];

// Peringkat pemasangan: simpan aset dalam cache
self.addEventListener('install', async e => {
  const cache = await caches.open(cacheName);
  await cache.addAll(staticAssets);
  return self.skipWaiting();
});

// Peringkat pengaktifan
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== cacheName).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Peringkat fetch: ambil data dari cache jika tiada internet
self.addEventListener('fetch', async e => {
  const req = e.request;
  const url = new URL(req.url);

  // Jangan cache request selain GET (contoh POST tempahan)
  if (req.method !== 'GET') {
    e.respondWith(fetch(req));
    return;
  }

  // Untuk page/navigation, utamakan network supaya index.html sentiasa terkini
  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req));
    return;
  }

  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(req));
  } else {
    e.respondWith(networkAndCache(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  return cached || fetch(req);
}

async function networkAndCache(req) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    await cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || fetch(req);
  }
}

async function networkFirst(req) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    await cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || fetch(req);
  }
}
