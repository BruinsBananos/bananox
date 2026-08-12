/* Banano X - lightweight shell cache for instant revisits */
const CACHE = "bananox-shell-v22-hashed";

/* Install stays fast: only shell assets. HTML is network-first at runtime. */
const PRECACHE = [
  "/site.2eaa810e.css",
  "/site.4c060905.js",
  "/favicon.svg",
  "/fonts/syne-700.woff2",
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
  // Never cache API-ish paths if any appear on this origin later
  if (/faucet\.php|\/api\//i.test(url.pathname)) return false;
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheableGet(request)) return;

  const url = new URL(request.url);
  const isNavigate = request.mode === "navigate" || request.destination === "document";
  // Only hashed build outputs + fonts/icon. Never cache-first source CSS/JS.
  const isShellAsset =
    /^\/(site|faucet)\.[a-f0-9]{8}\.(css|js)$/i.test(url.pathname) ||
    url.pathname === "/favicon.svg" ||
    url.pathname.startsWith("/fonts/");

  // Shell assets: cache-first (busted by CACHE name)
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

  // HTML navigations: network-first, fall back to cache
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
          caches.match(request).then((cached) => cached || caches.match("/") || caches.match("/index.html") || caches.match("/404.html"))
        )
    );
    return;
  }

  // Other same-origin: stale-while-revalidate
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