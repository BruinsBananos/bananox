import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

const themeIife = /  <script>\s*\(function \(\) \{\s*try \{\s*var k = "bx-theme";[\s\S]*?<\/script>\s*/;
const themeIife404 = /  <script>\s*\(function \(\) \{\s*try \{\s*var path = location\.pathname[\s\S]*?<\/script>\s*  <script>\s*\(function \(\) \{\s*try \{\s*var k = "bx-theme";[\s\S]*?<\/script>\s*/;
const faucetInline = /  <script>\s*\(function \(\) \{\s*\/\/ Fixed production API only[\s\S]*?<\/script>\s*/;

const mktCsp =
  "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self' https://cloud.umami.is; connect-src 'self' https://cloud.umami.is; worker-src 'self'; upgrade-insecure-requests";
const faucetCsp =
  "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self' https://cloud.umami.is https://challenges.cloudflare.com; connect-src 'self' https://node.bananox.com https://cloud.umami.is https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; worker-src 'self'; upgrade-insecure-requests";
const notFoundCsp =
  "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; upgrade-insecure-requests";

const replacements = [
  ['style="padding-top: 2.5rem;"', 'class="section section-compact"'],
  ['class="section" style="padding-top: 2.5rem;"', 'class="section section-compact"'],
  ['class="section" style="padding-top: 0;"', 'class="section section-flush"'],
  ['class="badge" style="margin-bottom: 1rem;"', 'class="badge lead"'],
  ['class="hero-actions" style="justify-content:center;margin-top:1.25rem;"', 'class="hero-actions center-row mt-sm"'],
  ['class="hero-actions" style="justify-content:center;gap:0.75rem;flex-wrap:wrap;"', 'class="hero-actions center-row"'],
  ['class="stats-strip reveal" style="max-width: 720px; margin: 0 auto 2.5rem;"', 'class="stats-strip reveal narrow mb-lg"'],
  ['class="stats-strip reveal" style="margin-bottom: 3rem;"', 'class="stats-strip reveal mb-xl"'],
  ['class="section-header reveal" style="margin-bottom: 1.5rem;"', 'class="section-header reveal mb-sm"'],
  ['class="section-header reveal" style="margin-bottom: 2rem;"', 'class="section-header reveal mb-md"'],
  ['class="timeline reveal" style="margin-bottom: 2.5rem;"', 'class="timeline reveal mb-lg"'],
  ['class="timeline reveal" style="margin-bottom: 3rem;"', 'class="timeline reveal mb-xl"'],
  ['class="grid-2" style="max-width: 720px; margin: 0 auto 1.5rem;"', 'class="grid-2 narrow mb-sm"'],
  ['class="grid-2" style="max-width: 720px; margin: 0 auto 2.5rem;"', 'class="grid-2 narrow mb-lg"'],
  ['class="grid-2" style="margin-bottom: 3.5rem;"', 'class="grid-2 mb-xl"'],
  ['class="steps" style="margin-bottom: 3rem;"', 'class="steps mb-xl"'],
  ['class="cta-band reveal" style="margin-top: 3rem;"', 'class="cta-band reveal mt-xl"'],
  ['class="list-item reveal" style="justify-content: center; text-align: center;"', 'class="list-item reveal list-item-center"'],
  ['<div style="width: 100%;">', '<div class="w-full">'],
  ['<strong style="margin-bottom: 0.5rem;">', '<strong>'],
  ['<span style="display: block; margin-bottom: 1rem;">', '<span>'],
  ['style="color: var(--banana); text-decoration: underline; text-underline-offset: 3px;"', 'class="link-accent"'],
  ['class="muted reveal" style="text-align:center; margin-top: 2rem; font-size: 1rem;"', 'class="muted reveal muted-center"'],
  ['<h2 style="font-size: clamp(1.5rem, 3vw, 2rem);">', '<h2 class="heading-sm">'],
  ['<h2 style="font-size: clamp(1.6rem, 3.5vw, 2.2rem);">', '<h2 class="heading-md">'],
  ['<h3 style="font-size: clamp(1.4rem, 3vw, 1.85rem); color: var(--banana); margin-bottom: 0.65rem;">', '<h3 class="heading-card">'],
  ['class="container" style="text-align:center;padding:4rem 1rem 5rem;"', 'class="container not-found"'],
  ['class="badge" style="margin:0 auto 1rem;"', 'class="badge"'],
  ['<p style="max-width:32rem;margin:0.75rem auto 1.75rem;opacity:0.85;">', '<p>'],
];

function setCsp(html, csp) {
  return html.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/,
    `<meta http-equiv="Content-Security-Policy" content="${csp}">`);
}

function injectTheme(html) {
  if (html.includes('src="/theme.js"') || /src="\/theme\.[a-f0-9]{8}\.js"/.test(html)) {
    return html;
  }
  return html.replace(
    /(<script>\s*\(function \(\) \{\s*try \{\s*var path = location\.pathname[\s\S]*?<\/script>\s*)?<script>\s*\(function \(\) \{\s*try \{\s*var k = "bx-theme";[\s\S]*?<\/script>/,
    '  <script src="/theme.js"></script>'
  );
}

const pages = [
  ["index.html", mktCsp],
  ["community/index.html", mktCsp],
  ["ecosystem/index.html", mktCsp],
  ["facts/index.html", mktCsp],
  ["faucets/index.html", mktCsp],
  ["node/index.html", mktCsp],
  ["faucet/index.html", faucetCsp],
  ["404.html", notFoundCsp],
];

for (const [rel, csp] of pages) {
  let html = readFileSync(join(root, rel), "utf8");
  html = setCsp(html, csp);
  html = injectTheme(html);
  if (rel === "faucet/index.html") {
    html = html.replace(faucetInline, '  <script src="/faucet.js" defer></script>\n');
  }
  for (const [from, to] of replacements) {
    html = html.split(from).join(to);
  }
  writeFileSync(join(root, rel), html);
  const leftover = (html.match(/style="/g) || []).length;
  console.log("patched", rel, "inline-styles-left", leftover);
}
