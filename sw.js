self.addEventListener('install', (event) => {
    event.waitUntil(caches.open('mistaFy-v1').then(cache => cache.addAll([
        '/',
        '/styles.min.css',
        '/app.min.js',
        '/manifest.json'
    ])));
});

self.addEventListener('fetch', (event) => {
    event.respondWith(caches.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') return response;
            const responseToCache = response.clone();
            caches.open('mistaFy-v1').then(cache => {
                cache.put(event.request, responseToCache);
            });
            return response;
        });
    }));
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = ['mistaFy-v1'];
    event.waitUntil(caches.keys().then(cacheNames => Promise.all(
        cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) return caches.delete(cacheName);
        })
    )));
});
