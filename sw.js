/* Banano X — lightweight shell cache for instant revisits */
const CACHE = "bananox-shell-v4";

/* Keep install fast — heavy game HTML/JS cache on first visit, not at SW install */
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./site.js",
  "./favicon.svg",
  "./fonts/dm-sans.woff2",
  "./fonts/syne-700.woff2",
  "./facts.html",
  "./ecosystem.html",
  "./faucets.html",
  "./community.html",
  "./node.html",
  "./playQuest.html",
  "./arcade.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isCacheableGet(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  // Skip large game scripts on install path; runtime cache-on-success only
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheableGet(request)) return;

  const url = new URL(request.url);
  const isNavigate = request.mode === "navigate" || request.destination === "document";
  const isShellAsset =
    /\.(css|js|woff2|svg)$/i.test(url.pathname) ||
    /\/fonts\//i.test(url.pathname);

  // Shell assets: cache-first (versioned by CACHE name)
  if (isShellAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML navigations: network-first, fall back to cache (fresh content preferred)
  if (isNavigate) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // Other same-origin (e.g. game JS): stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
