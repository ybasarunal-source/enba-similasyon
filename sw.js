// ENBA Platform Service Worker Neutralizer
// This script unregisters itself and clears all related caches to fix the white screen issue.

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Delete all caches
            caches.keys().then((keys) => {
                return Promise.all(keys.map((key) => caches.delete(key)));
            }),
            // Unregister itself
            self.registration.unregister(),
            // Claim all clients
            self.clients.claim()
        ]).then(() => {
            console.log("Service Worker: Neutralized and unregistered.");
        })
    );
});
