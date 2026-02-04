const CACHE_NAME = "enigma-v1";
const FILES_TO_CACHE = [
  "index.html",
  "login.html",
  "breathe.html",
  "journal.html",
  "wins.html",
  "progress.html",
  "style.css",
  "storage.js",
  "manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
