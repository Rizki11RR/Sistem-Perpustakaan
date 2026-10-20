// Service Worker untuk PWA Offline-First
const CACHE_NAME = 'baitul-hikmah-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/tailwind.min.css',
  '/assets/js/app.js',
  '/assets/js/db.js',
  '/assets/js/sync.js',
  '/assets/js/ui.js',
  '/assets/js/buku.js',
  '/assets/js/anggota.js',
  '/assets/js/sirkulasi.js',
  '/assets/js/backup.js',
  '/assets/vendor/jsbarcode.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return from cache
        if (response) {
          return response;
        }
        // Clone request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
