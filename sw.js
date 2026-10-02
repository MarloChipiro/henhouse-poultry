// Henhouse Poultry Hub - offline support
// Change the version number whenever you update index.html so phones fetch the new copy.
const CACHE = "henhouse-v1";

// The app itself
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

// Map and database libraries used inside Farm Management and Buyer
const LIBS = [
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  "https://unpkg.com/leaflet@1.9.4/dist/images/layers.png",
  "https://unpkg.com/leaflet@1.9.4/dist/images/layers-2x.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(SHELL);
      // Libraries are saved one by one; a failure here must not stop the install
      await Promise.all(
        LIBS.map((u) =>
          fetch(new Request(u, { mode: "no-cors" }))
            .then((r) => cache.put(u, r))
            .catch(() => {}),
        ),
      );
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Live data (database, weather, map pictures) is never saved: it needs internet
  if (/supabase\.co|open-meteo\.com|tile\.openstreetmap\.org|arcgisonline\.com/.test(url.hostname)) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || (req.mode === "navigate" ? caches.match("./index.html") : undefined));
      return cached || network;
    }),
  );
});
