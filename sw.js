/* ============================================================
   HaushaltsKasse – Service Worker (sw.js)
   Ermöglicht Installation als App + Offline-Grundfunktion
   ============================================================ */

const CACHE_NAME = 'haushaltskasse-v1';

// Beim Installieren: Grunddateien cachen
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png'
      ]);
    })
  );
  self.skipWaiting();
});

// Alte Caches aufräumen
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Anfragen abfangen: Netzwerk zuerst, Cache als Fallback
self.addEventListener('fetch', function(event) {
  // Firebase-Anfragen IMMER über Netzwerk (nie cachen)
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebase') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Erfolgreiche Antwort auch im Cache speichern
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Kein Netzwerk → aus Cache laden
        return caches.match(event.request);
      })
  );
});
