const CACHE_NAME = 'eolas-cache-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/favicon-32.png',
  '/manifest.webmanifest',
  '/capture',
  '/ideas',
  '/projects',
  '/jobs',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

function stripRedirected(response) {
  if (!response.redirected) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => stripRedirected(response))
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        const responseClone = response.clone();
        if (event.request.method === 'GET' && response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return stripRedirected(response);
      });

      if (cached) {
        event.waitUntil(networkFetch.catch(() => {}));
        return cached;
      }

      return networkFetch.catch(() => caches.match(event.request));
    }),
  );
});
