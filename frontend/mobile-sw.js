const CACHE_NAME = 'american-lyceum-mobile-v1';
const PRECACHE_URLS = [
    '/mobile.html',
    '/mobile.css?v=20260730-animated-shell-1',
    '/mobile.js?v=20260730-animated-shell-1',
    '/mobile.webmanifest',
    '/images/logo.jpeg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    event.respondWith((async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
            const response = await fetch(request);
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
            return response;
        } catch (_error) {
            return caches.match('/mobile.html');
        }
    })());
});
