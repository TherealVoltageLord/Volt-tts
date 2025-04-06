const CACHE_NAME = 'volt-tts-v3';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap',
    'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS)
                    .catch(err => {
                        console.error('Failed to cache assets:', err);
                    });
            })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('voltagelord-volt-tts.hf.space')) {
        // Don't cache API responses
        return fetch(event.request);
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                return cachedResponse || fetch(event.request)
                    .then(response => {
                        // Cache new requests
                        if (event.request.method === 'GET') {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseToCache));
                        }
                        return response;
                    });
            })
            .catch(() => {
                // Fallback for failed requests
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});
