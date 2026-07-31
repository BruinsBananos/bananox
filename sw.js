/* Banano X — lightweight shell cache for instant revisits */
const CACHE = "bananox-shell-v18-faucet-gamble";

/* Keep install fast — heavy assets cache on first visit, not at SW install */
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
  "./faucet.html",
  "./community.html",
  "./node.html",
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
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheableGet(request)) return;

  const url = new URL(request.url);
  const isHtml = request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/";

  // HTML navigations: network-first, fall back to cache (fresh content preferred)
  if (isHtml) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      });
    })
  );
});
