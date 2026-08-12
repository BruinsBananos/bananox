/**
 * Banano X edge: long-cache hashed assets, short-cache HTML,
 * drop GitHub Pages Access-Control-Allow-Origin: *.
 */
const IMMUTABLE =
  /^\/(site|theme|faucet)\.[a-f0-9]{8}\.(css|js)$|^\/favicon\.svg$|^\/fonts\//;
const SHORT_HTML =
  /^\/$|^\/(facts|ecosystem|faucet|faucets|community|node)\/$|^\/robots\.txt$|^\/sitemap\.xml$|^\/og-image\.jpg$/;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname;
    if (host !== "bananox.com" && host !== "www.bananox.com") {
      return fetch(request);
    }

    let cacheTtlByStatus;
    let browser = null;
    if (IMMUTABLE.test(url.pathname)) {
      cacheTtlByStatus = { "200-299": 31536000, "400-599": 0 };
      browser = "public, max-age=31536000, immutable";
    } else if (SHORT_HTML.test(url.pathname)) {
      cacheTtlByStatus = { "200-299": 120, "400-599": 0 };
      browser = "public, max-age=120";
    } else if (url.pathname === "/sw.js") {
      cacheTtlByStatus = { "200-299": 60, "400-599": 0 };
      browser = "public, max-age=60";
    }

    const init = cacheTtlByStatus
      ? { cf: { cacheEverything: true, cacheTtlByStatus } }
      : undefined;
    const res = await fetch(request, init);
    const headers = new Headers(res.headers);
    headers.delete("Access-Control-Allow-Origin");
    if (browser && res.ok) headers.set("Cache-Control", browser);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  },
};
