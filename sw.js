
const CACHE_NAME = 'studio-v1.0.0';
const API_HOSTS = new Set([
  'openrouter.ai',
  'generativelanguage.googleapis.com',
  'api.tavily.com'
]);
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isApiRequest = API_HOSTS.has(requestUrl.hostname);

  if (isApiRequest) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const networkFetch = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              event.waitUntil(
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, networkResponse.clone()))
              );
            }
            return networkResponse;
          })
          .catch(
            () =>
              cachedResponse ||
              new Response('Service unavailable', {
                status: 503,
                headers: { 'Content-Type': 'text/plain' }
              })
          );

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html').then(
              cachedPage =>
                cachedPage ||
                new Response('Offline fallback unavailable', {
                  status: 503,
                  headers: { 'Content-Type': 'text/plain' }
                })
            );
          }
          return new Response('Network unavailable', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
