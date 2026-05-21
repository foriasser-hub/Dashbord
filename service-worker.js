/* ============================================
   LE PARADISIER MANAGER - Service Worker
   Cache offline pour fonctionnement hors-ligne
   ============================================ */

const CACHE_NAME = 'paradisier-v2.0.0';
const ASSETS_TO_CACHE = [
    './',
    './index-local.html',
    './styles.css',
    './js/storage.js',
    './js/app-local.js',
    './js/modules.js',
    './js/modules-extra.js',
    './js/backup-settings.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// Installation - mise en cache des assets
self.addEventListener('install', event => {
    console.log('[SW] Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Mise en cache des fichiers');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.log('[SW] Erreur cache:', err))
    );
});

// Activation - nettoyage des anciens caches
self.addEventListener('activate', event => {
    console.log('[SW] Activation...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Suppression ancien cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - stratégie Cache First avec fallback réseau
self.addEventListener('fetch', event => {
    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') return;
    
    // Ignorer les requêtes vers des APIs externes
    if (event.request.url.includes('/api/')) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Retourner depuis le cache
                    return cachedResponse;
                }
                
                // Sinon, aller chercher sur le réseau
                return fetch(event.request)
                    .then(networkResponse => {
                        // Mettre en cache la nouvelle ressource
                        if (networkResponse.ok) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Fallback pour les pages HTML
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('./index-local.html');
                        }
                    });
            })
    );
});

// Message pour forcer la mise à jour
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
