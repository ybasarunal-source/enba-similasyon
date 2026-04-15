const CACHE_NAME = 'enba-sim-v14';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/data.js',
  '/app.jsx',
  '/detailed-plan.jsx',
  '/landing.jsx',
  '/router.jsx',
  '/pnl-module.jsx',
  '/manifest.json'
];

// Kurulum: statik dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Aktivasyon: eski önbellekleri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: önce ağ, yoksa önbellek (Network First)
self.addEventListener('fetch', (event) => {
  // CDN isteklerini (fonts, react, xlsx) önbelleğe al
  if (event.request.url.includes('fonts.googleapis') ||
      event.request.url.includes('fonts.gstatic') ||
      event.request.url.includes('unpkg.com') ||
      event.request.url.includes('cdnjs.cloudflare')) {
    event.respondWith(
      caches.open(CACHE_NAME + '-cdn').then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Uygulama dosyaları — Network First (Önce Ağ, başarısız olursa önbellek)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // İnternet var ve yanıt başarılı ise önbelleği tazele
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // İnternet bağlantısı yoksa (offline) önbellekteki veriyi göster
        return caches.match(event.request);
      })
  );
});
