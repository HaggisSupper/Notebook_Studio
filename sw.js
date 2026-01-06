
const CACHE_NAME = 'studio-v2.0';
const RUNTIME_CACHE = 'studio-runtime-v2.0';
const STATIC_CACHE = 'studio-static-v2.0';

// Core assets that must be cached for offline functionality
const coreAssets = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Assets that should be cached but not critical
const staticAssets = [
  '/src/index.tsx',
  '/src/App.tsx'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[ServiceWorker] Caching core assets');
        await cache.addAll(coreAssets);
        
        // Try to cache static assets, but don't fail if they're not available
        try {
          const staticCache = await caches.open(STATIC_CACHE);
          await staticCache.addAll(staticAssets);
        } catch (error) {
          console.warn('[ServiceWorker] Failed to cache some static assets:', error);
        }
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('[ServiceWorker] Install failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const cachesToDelete = cacheNames.filter(name => 
        name !== CACHE_NAME && 
        name !== RUNTIME_CACHE && 
        name !== STATIC_CACHE
      );
      
      await Promise.all(
        cachesToDelete.map(cache => {
          console.log('[ServiceWorker] Deleting old cache:', cache);
          return caches.delete(cache);
        })
      );
      
      // Claim all clients immediately
      await self.clients.claim();
      console.log('[ServiceWorker] Activated');
    })()
  );
});

// Fetch event - implement network-first strategy with cache fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for API calls and external resources
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.includes('/api/') ||
    url.hostname.includes('cdn') ||
    url.hostname.includes('googleapis')
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try network first for fresh content
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Network failed, try cache
        console.log('[ServiceWorker] Network failed, falling back to cache:', request.url);
        
        // Check all caches
        const cachedResponse = 
          await caches.match(request) ||
          await caches.match(request, { ignoreSearch: true });
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If it's a navigation request and no cache, return offline page
        if (request.mode === 'navigate') {
          const cache = await caches.open(CACHE_NAME);
          const offlinePage = await cache.match('/index.html');
          if (offlinePage) {
            return offlinePage;
          }
        }
        
        // Last resort - return error
        return new Response('Offline and no cached version available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      }
    })()
  );
});

// Handle messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cache => caches.delete(cache)));
        console.log('[ServiceWorker] All caches cleared');
      })()
    );
  }
});
