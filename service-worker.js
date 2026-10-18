// Incremente VERSION a cada publicação que altere arquivos do app.
const VERSION = 'v1-4-0';
const CACHE = `operacao-15-${VERSION}`;
const EXTERNAL_CACHE = 'operacao-15-external';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './storage.js',
  './data.js',
  './missions.js',
  './protocol-engine.js',
  './training-library.js',
  './app.js',
  './firebase-config.js',
  './cloud.js',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png'
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const FIREBASE_SDK_HOST = 'www.gstatic.com';
const FIREBASE_SDK_PATH = '/firebasejs/';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== EXTERNAL_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  const response = await network;
  if (response) return response;
  if (request.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
  return Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isFont = FONT_HOSTS.includes(url.hostname);
  const isFirebaseSdk = url.hostname === FIREBASE_SDK_HOST && url.pathname.startsWith(FIREBASE_SDK_PATH);
  if (isFont || isFirebaseSdk) {
    event.respondWith(cacheFirst(request, EXTERNAL_CACHE));
    return;
  }
  if (url.origin === self.location.origin) event.respondWith(staleWhileRevalidate(request));
});
