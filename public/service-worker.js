
const CACHE_NAME = 'pos-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      }).catch(() => {
        // If both fetch and cache fail, show offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Update the service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});

// Handle background sync for offline operations
self.addEventListener('sync', event => {
  if (event.tag === 'syncPendingOperations') {
    event.waitUntil(syncPendingOperations());
  }
});

// Function to sync pending operations
async function syncPendingOperations() {
  try {
    // Implement the logic to send pending operations to the server
    console.log('Syncing pending operations...');
    
    // This would typically involve:
    // 1. Retrieving pending operations from IndexedDB or localStorage
    // 2. Sending them to the server via fetch
    // 3. Clearing the pending operations upon successful sync
    
    // For demo purposes, we'll just log
    console.log('Sync completed');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
