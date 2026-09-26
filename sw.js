const CACHE_NAME = 'cashflow-v5';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/cashflow/', '/cashflow/index.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function fetchAndCache(request) {
  return fetch(request).then(response => {
    if (response && response.status === 200) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
    }
    return response;
  });
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Pages: network first, so a new version shows up on the next open; cache only when offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetchAndCache(e.request).catch(() =>
        caches.match(e.request).then(cached => cached || caches.match('/cashflow/index.html'))
      )
    );
    return;
  }
  // Other assets (icons, manifest): cache first, refresh in background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetchAndCache(e.request).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
