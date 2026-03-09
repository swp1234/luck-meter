const CACHE_NAME = 'luck-meter-v1';
const ASSETS = [
  '/luck-meter/',
  '/luck-meter/index.html',
  '/luck-meter/css/style.css',
  '/luck-meter/js/app.js',
  '/luck-meter/js/i18n.js',
  '/luck-meter/js/locales/ko.json',
  '/luck-meter/js/locales/en.json',
  '/luck-meter/js/locales/ja.json',
  '/luck-meter/js/locales/zh.json',
  '/luck-meter/js/locales/hi.json',
  '/luck-meter/js/locales/ru.json',
  '/luck-meter/js/locales/es.json',
  '/luck-meter/js/locales/pt.json',
  '/luck-meter/js/locales/id.json',
  '/luck-meter/js/locales/tr.json',
  '/luck-meter/js/locales/de.json',
  '/luck-meter/js/locales/fr.json',
  '/luck-meter/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
