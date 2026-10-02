// Henhouse Poultry Hub - Service Worker
const CACHE_NAME = "henhouse-v2";

// Add all local resources and workspace pages needed for full offline navigation
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/images/henhouse-mark.jpg",
  "./assets/images/henhouse-wordmark.jpg",
  "./js/supabase-config.js",
  "./pages/farm-management.html",
  "./pages/seller.html",
  "./pages/buyer.html",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];

// Install Event - Pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate Caching Strategy
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Exclude database and external live APIs from caching
  if (/supabase\.co|open-meteo\.com/.test(url.hostname)) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.ok || networkResponse.type === "opaque")) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || (req.mode === "navigate" ? caches.match("./index.html") : undefined));

      return cachedResponse || fetchPromise;
    })
  );
});
