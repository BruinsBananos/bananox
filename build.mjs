/**
 * Hash + minify site assets and rewrite published HTML / sw.js.
 * Run: node build.mjs
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

function sha8(buf) {
  return createHash("sha256").update(buf).digest("hex").slice(0, 8);
}

function minifyCss(src) {
  return src
    .replace(/^\uFEFF/, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function minifyJs(src) {
  // Keep `+` / `-` spacing so string values like rootMargin stay valid.
  return src
    .replace(/^\uFEFF/, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:\\\w])\/\/[^\n]*/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*/g, "\n")
    .replace(/\s*([{}();,=<>!&|?:[\]])\s*/g, "$1")
    .replace(/\n+/g, "")
    .trim();
}

function wipeHashed(prefix, ext) {
  const re = new RegExp(`^${prefix}\\.[a-f0-9]{8}\\.${ext}$`);
  for (const name of readdirSync(root)) {
    if (re.test(name)) unlinkSync(join(root, name));
  }
}

function emit(prefix, ext, contents) {
  wipeHashed(prefix, ext);
  const hash = sha8(contents);
  const name = `${prefix}.${hash}.${ext}`;
  writeFileSync(join(root, name), contents);
  return `/${name}`;
}

const siteCss = emit("site", "css", minifyCss(readFileSync(join(root, "styles.css"), "utf8")));
const faucetCss = emit("faucet", "css", minifyCss(readFileSync(join(root, "faucet.css"), "utf8")));
const themeJs = emit("theme", "js", minifyJs(readFileSync(join(root, "theme.js"), "utf8")));
const siteJs = emit("site", "js", minifyJs(readFileSync(join(root, "site.js"), "utf8")));
const faucetJs = emit("faucet", "js", minifyJs(readFileSync(join(root, "faucet.js"), "utf8")));

const pages = [
  "index.html",
  "404.html",
  "community/index.html",
  "ecosystem/index.html",
  "facts/index.html",
  "faucet/index.html",
  "faucets/index.html",
  "node/index.html",
];

function rewriteHtml(html) {
  html = html.replace(/\/(?:styles|site)\.[a-f0-9]{8}\.css|\/styles\.css/g, siteCss);
  html = html.replace(/\/theme\.[a-f0-9]{8}\.js|\/theme\.js/g, themeJs);
  html = html.replace(/\/site\.[a-f0-9]{8}\.js|\/site\.js/g, siteJs);
  html = html.replace(/\/faucet\.[a-f0-9]{8}\.css|\/faucet\.css/g, faucetCss);
  html = html.replace(/\/faucet\.[a-f0-9]{8}\.js|\/faucet\.js/g, faucetJs);
  return html;
}

for (const rel of pages) {
  const p = join(root, rel);
  writeFileSync(p, rewriteHtml(readFileSync(p, "utf8")));
}

let sw = readFileSync(join(root, "sw.js"), "utf8");
sw = sw.replace(/const CACHE = "[^"]+";/, 'const CACHE = "bananox-shell-v23-hashed";');
sw = sw.replace(
  /const PRECACHE = \[[\s\S]*?\];/,
  `const PRECACHE = [\n  "${siteCss}",\n  "${themeJs}",\n  "${siteJs}",\n  "/favicon.svg",\n  "/fonts/syne-700.woff2",\n];`
);
writeFileSync(join(root, "sw.js"), sw);

console.log("built", { siteCss, faucetCss, siteJs });
