// Service Worker minimalista - NO CACHE
// Versione 7 - Cache completamente disabilitata

const CACHE_NAME = 'clan-planner-v7-no-cache';

self.addEventListener('install', event => {
  // Salta l'attesa e attiva immediatamente
  self.skipWaiting();
  console.log('Service Worker v7 installato - NO CACHE');
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // Elimina TUTTE le cache precedenti
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Eliminando cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Tutte le cache eliminate');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // NON intercettare richieste CSS - lasciale gestire al browser
  if (event.request.url.endsWith('.css') || event.request.url.includes('bootstrap')) {
    return; // Lascia che il browser gestisca normalmente
  }
  
  // Per JavaScript e altri file: sempre network
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Solo per file JS aggiungi header no-cache
        if (event.request.url.endsWith('.js')) {
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        }
        
        // Altri file: ritorna normalmente
        return response;
      })
      .catch(error => {
        console.error('Fetch error:', error);
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// Messaggio per forzare skip waiting
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(name => caches.delete(name)));
      })
    );
  }
});
