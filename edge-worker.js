/**
 * Banano X edge: long-cache hashed assets, short-cache HTML,
 * drop GitHub Pages Access-Control-Allow-Origin: *.
 */
const IMMUTABLE =
  /^\/(site|theme|faucet)\.[a-f0-9]{8}\.(css|js)$|^\/favicon\.svg$|^\/fonts\//;
const SHORT_HTML =
  /^\/$|^\/(facts|ecosystem|faucet|faucets|community|node)\/$|^\/robots\.txt$|^\/sitemap\.xml$|^\/og-image\.jpg$|^\/\.well-known\/security\.txt$/;
const HIDDEN = /^\/(build\.mjs|patch-html\.mjs|edge-worker\.js)$/;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname;
    if (host !== "bananox.com" && host !== "www.bananox.com") {
      return fetch(request);
    }

    if (HIDDEN.test(url.pathname)) {
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "public, max-age=300", "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // One cache entry per path (ignore tracking query strings).
    const clean = new URL(url);
    clean.search = "";
    const originReq =
      request.method === "GET" && clean.href !== request.url
        ? new Request(clean, request)
        : request;

    let cacheTtlByStatus;
    let browser = null;
    if (IMMUTABLE.test(url.pathname)) {
      cacheTtlByStatus = { "200-299": 31536000, "400-599": 0 };
      browser = "public, max-age=31536000, immutable";
    } else if (SHORT_HTML.test(url.pathname)) {
      cacheTtlByStatus = { "200-299": 60, "400-599": 0 };
      browser = "public, max-age=60";
    } else if (url.pathname === "/sw.js") {
      cacheTtlByStatus = { "200-299": 60, "400-599": 0 };
      browser = "public, max-age=60";
    }

    const init = cacheTtlByStatus
      ? { cf: { cacheEverything: true, cacheTtlByStatus } }
      : undefined;
    const res = await fetch(originReq, init);
    const headers = new Headers(res.headers);
    headers.delete("Access-Control-Allow-Origin");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    if (browser && res.ok) headers.set("Cache-Control", browser);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  },
};
