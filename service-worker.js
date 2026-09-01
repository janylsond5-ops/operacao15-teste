const CACHE = 'operacao-15-v1-3-1';
const ASSETS = ['./', './index.html', './styles.css', './data.js', './missions.js', './app.js', './manifest.webmanifest', './assets/icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
