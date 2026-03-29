// APP_VERSION is defined by version.js — bump it there to bust the cache.
importScripts('version.js');

const CACHE  = `squigglebug-${APP_VERSION}`;
// Relative paths so the SW works at any host path (root or subdirectory).
// e.g. both https://squigglebug.app/ and https://user.github.io/squigglebug/ work.
const BASE   = new URL('./', self.location.href).href;
const ASSETS = [
  BASE,
  `${BASE}index.html`,
  `${BASE}app.js`,
  `${BASE}style.css`,
  `${BASE}manifest.json`,
  `${BASE}version.js`,
  `${BASE}assets/icon-192.png`,
  `${BASE}assets/icon-512.png`,
];

// Install — cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — remove stale caches from previous versions
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

