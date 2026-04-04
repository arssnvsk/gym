const CACHE = 'gym-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(['/']))
      .catch(() => {}) // don't block install if pre-cache fails
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle GET from same origin
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // _next/static — immutable hashed files, cache-first forever
  // On localhost (dev mode) filenames are not hashed, so skip cache to get fresh JS
  if (url.pathname.startsWith('/_next/static/')) {
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone)).catch(() => {});
          }
          return res;
        });
      })
    );
    return;
  }

  // Navigation — network-first; only cache HTTP 200 pages (never redirects)
  // This prevents auth-redirect pages from being served stale when offline
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Icons, manifest, fonts — stale-while-revalidate
  if (
    url.pathname.startsWith('/api/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/icon.svg'
  ) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((res) => {
              if (res.ok) cache.put(request, res.clone()).catch(() => {});
              return res;
            })
            .catch(() => cached as Response);
          return cached || fetchPromise;
        })
      )
    );
  }
});
