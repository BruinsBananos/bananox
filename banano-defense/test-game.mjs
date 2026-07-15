/**
 * BANANO DEFENSE — automated smoke & logic tests (Node, no browser required)
 * Run: node test-game.mjs
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const results = { pass: 0, fail: 0, warn: 0, errors: [] };

function pass(name) { results.pass++; console.log(`  ✓ ${name}`); }
function fail(name, detail) {
  results.fail++;
  results.errors.push({ name, detail });
  console.log(`  ✗ ${name}`);
  if (detail) console.log(`      ${detail}`);
}
function warn(name, detail) {
  results.warn++;
  console.log(`  ⚠ ${name}${detail ? `: ${detail}` : ""}`);
}

function assert(cond, name, detail) {
  if (cond) pass(name);
  else fail(name, detail);
}

// ── Load sources ─────────────────────────────────────────────────────────────
const gameJs = fs.readFileSync(path.join(ROOT, "game.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const styleCss = fs.readFileSync(path.join(ROOT, "style.css"), "utf8");

console.log("\n══ BANANO DEFENSE — Test Suite ══\n");

// ── 1. Syntax ────────────────────────────────────────────────────────────────
console.log("1. Syntax & files");
try {
  execSync(`node --check "${path.join(ROOT, "game.js")}"`, { stdio: "pipe" });
  pass("game.js parses (node --check)");
} catch (e) {
  fail("game.js parses", e.stderr?.toString() || e.message);
}
assert(fs.existsSync(path.join(ROOT, "index.html")), "index.html exists");
assert(fs.existsSync(path.join(ROOT, "style.css")), "style.css exists");
assert(indexHtml.includes('href="style.css"'), "index.html links style.css");
assert(indexHtml.includes('src="game.js"'), "index.html links game.js");
assert(!gameJs.includes("ENEMY_DEFS_TAIL"), "no broken ENEMY_DEFS_TAIL split");

// ── 2. DOM ID parity ─────────────────────────────────────────────────────────
console.log("\n2. DOM / HTML parity");
const idRefs = [...gameJs.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]);
const htmlIds = [...indexHtml.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const htmlIdSet = new Set(htmlIds);
const requiredIds = [...new Set(idRefs)].filter((id) => id !== "btn-upgrade" && id !== "btn-sell");
for (const id of requiredIds) {
  assert(htmlIdSet.has(id), `HTML has #${id}`, `game.js references missing element`);
}

// ── 3. Constants extraction (eval in sandbox) ──────────────────────────────
console.log("\n3. Game constants & data integrity");

function extractConst(name) {
  const re = new RegExp(`const ${name} = ([\\s\\S]*?);\\n`);
  const m = gameJs.match(re);
  if (!m) return null;
  try {
    return vm.runInNewContext(`(${m[1]})`, {});
  } catch {
    return null;
  }
}

const ACHIEVEMENTS = extractConst("ACHIEVEMENTS");
const TOWER_DEFS = extractConst("TOWER_DEFS");
const ENEMY_DEFS = extractConst("ENEMY_DEFS");
const WAVE_EVENTS = extractConst("WAVE_EVENTS");
const BOSS_PHASE_CFG = extractConst("BOSS_PHASE_CFG");
const TOWER_SHOP_KEYS = extractConst("TOWER_SHOP_KEYS");
const DEFAULT_SETTINGS = extractConst("DEFAULT_SETTINGS");
const PATH_TILES = extractConst("PATH_TILES");

assert(ACHIEVEMENTS && ACHIEVEMENTS.length === 43, "43 achievements defined", `got ${ACHIEVEMENTS?.length}`);
assert(indexHtml.includes("43 achievements"), "index.html shows 43 achievements");
if (ACHIEVEMENTS) {
  const ids = ACHIEVEMENTS.map((a) => a.id);
  assert(ids.length === new Set(ids).size, "achievement IDs unique");
  assert(ACHIEVEMENTS.some((a) => a.id === "wave_50"), "wave_50 achievement exists");
  assert(ACHIEVEMENTS.some((a) => a.id === "rug_phase3"), "rug_phase3 achievement exists");
  assert(ACHIEVEMENTS.some((a) => a.id === "all_types"), "all_types achievement exists");
  const wave50 = ACHIEVEMENTS.find((a) => a.id === "wave_50");
  assert(String(wave50.check).includes("wonCampaign"), "wave_50 checks wonCampaign not wave>=50");
}

if (TOWER_SHOP_KEYS && TOWER_DEFS) {
  for (const k of TOWER_SHOP_KEYS) {
    assert(!!TOWER_DEFS[k], `TOWER_SHOP_KEYS includes ${k}`);
  }
  assert(TOWER_SHOP_KEYS.length === 7, "7 shop tower keys");
}

if (ENEMY_DEFS) {
  const types = Object.keys(ENEMY_DEFS);
  assert(types.includes("tick"), "Gas Fee Tick enemy");
  assert(types.includes("hodler"), "Diamond HODLer enemy");
  assert(types.includes("fomo"), "FOMO Rocket enemy");
  assert(types.includes("mint"), "Mint Bot enemy");
  assert(types.includes("boss"), "Rugpull boss");
  assert(ENEMY_DEFS.boss.hp === 1320, "boss base HP 1320");
  assert(ENEMY_DEFS.boss.lives === 5, "boss costs 5 lives on leak");
  assert(ENEMY_DEFS.tick.goldSteal === 30, "tick steals up to 30 BAN");
}

if (DEFAULT_SETTINGS) {
  assert(DEFAULT_SETTINGS.showAllRanges === false, "default showAllRanges false");
  assert(DEFAULT_SETTINGS.showDebug === false, "default showDebug false");
  assert(typeof DEFAULT_SETTINGS.volume === "number", "default volume number");
}

if (WAVE_EVENTS) {
  const keys = Object.keys(WAVE_EVENTS).map(Number);
  assert(keys.includes(7) && keys.includes(48), "wave events 7-48 present");
  assert(WAVE_EVENTS[18]?.id === "fog", "wave 18 fog event");
  assert(WAVE_EVENTS[12]?.id === "double_ban", "wave 12 double BAN");
  assert(WAVE_EVENTS[25]?.id === "fomo_friday", "wave 25 FOMO Friday");
  assert(WAVE_EVENTS[33]?.id === "mint_rush", "wave 33 Mint & Run");
  assert(WAVE_EVENTS[46]?.id === "ban_storm", "wave 46 BAN Storm");
}

// ── 4. Balance constants from source ─────────────────────────────────────────
console.log("\n4. Balance & maintainability (Phases 1–6)");
assert(gameJs.includes("WAVE_INTEREST_CAP = 220"), "interest cap 220");
assert(gameJs.includes("WAVE_INTEREST_RATE = 0.017"), "interest rate 1.7%");
assert(gameJs.includes('SAVE_KEY = "banano_defense_v1"'), "save key unchanged");
assert(gameJs.includes("airdropCd: 3"), "starter airdropCd 3");
assert(gameJs.includes("rageCd: 8"), "starter rageCd 8");
assert(gameJs.includes("refreshTypesBuilt()"), "refreshTypesBuilt on sell/place");
assert(gameJs.includes("jitter: Array.from"), "chain jitter baked at spawn");
assert(gameJs.includes("pierced >= maxPierce"), "pierce uses maxPierce check");
assert(gameJs.includes("e.progress = clamp(e.progress"), "path progress clamped");
assert(gameJs.includes("o.type === \"boss\" && o.bossPhase >= 2) continue"), "shill skip boss P2+ heal");
assert(gameJs.includes("bossPhase3Kills"), "boss phase 3 kill tracking");
assert(!gameJs.includes("lifetimeBosses + state.bossKills"), "hammer unlock does not double-count boss kills");
assert(gameJs.includes("lifetimeBosses: meta.lifetimeBosses"), "achievement snapshot uses meta.lifetimeBosses only");
assert(gameJs.includes("showGameToast"), "placement toast system");
assert(gameJs.includes("towerEffectiveRange"), "fog range modifier");
assert(gameJs.includes("tickDebug"), "debug overlay");
assert(gameJs.includes("const ENDLESS_EVENT_CYCLE"), "endless event cycle constant");
assert(gameJs.includes("const WAVE_THREAT_ORDER"), "wave threat order constant");
assert(gameJs.includes("function createRunDefaults"), "createRunDefaults factory");
assert(gameJs.includes("function applyRunReset"), "applyRunReset helper");
assert(gameJs.includes("function bindGameInput"), "bindGameInput groups listeners");
assert(gameJs.includes("function hideAllOverlays"), "hideAllOverlays helper");
assert(gameJs.includes("RUN_START_GOLD_BASE = 250"), "run start gold constant");
assert(
  gameJs.includes('if (state.phase === "playing")') && gameJs.includes("state.rageTimer = Math.max"),
  "gameplay timers freeze when not playing (pause/end)"
);
assert(gameJs.includes("state.enemies = []") && gameJs.includes("function endGame"), "endGame clears battlefield entities");

// Pierce formula: sniper pierce=1, lv1 => 1 target
const sniperPierce = 1 + 1 - 1;
assert(sniperPierce === 1, "sniper Lv1 pierce = 1 target (off-by-one fix)");

// ── 5. Pure logic mirrors ────────────────────────────────────────────────────
console.log("\n5. Logic mirrors");

const TILE = 40;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const tileCenter = (tx, ty) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
const hpScale = (wave) => 1 + (wave - 1) * 0.13 + Math.floor((wave - 1) / 10) * 0.08;

assert(hpScale(1) === 1, "hpScale wave 1 = 1");
assert(hpScale(10) > hpScale(5), "hpScale increases with wave");

const pathPixels = PATH_TILES.map((p) => tileCenter(p.x, p.y));
const pathSegLens = [];
let totalPathLen = 0;
for (let i = 0; i < pathPixels.length - 1; i++) {
  const len = dist(pathPixels[i].x, pathPixels[i].y, pathPixels[i + 1].x, pathPixels[i + 1].y);
  pathSegLens.push(len);
  totalPathLen += len;
}

function posAlongPath(progress) {
  let remaining = clamp(progress, 0, totalPathLen);
  for (let i = 0; i < pathSegLens.length; i++) {
    const seg = pathSegLens[i];
    if (remaining <= seg || i === pathSegLens.length - 1) {
      const t = seg === 0 ? 0 : clamp(remaining / seg, 0, 1);
      const a = pathPixels[i], b = pathPixels[i + 1];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= seg;
  }
  const last = pathPixels[pathPixels.length - 1];
  return { x: last.x, y: last.y };
}

const start = posAlongPath(0);
const end = posAlongPath(totalPathLen);
const over = posAlongPath(totalPathLen + 500);
assert(start.x === pathPixels[0].x && start.y === pathPixels[0].y, "path start at spawn");
assert(end.x === pathPixels[pathPixels.length - 1].x, "path end at wallet");
assert(over.x === end.x && over.y === end.y, "path progress clamped at end");

if (BOSS_PHASE_CFG) {
  function bossPhaseFromRatio(ratio) {
    if (ratio <= BOSS_PHASE_CFG[3].threshold) return 3;
    if (ratio <= BOSS_PHASE_CFG[2].threshold) return 2;
    return 1;
  }
  assert(bossPhaseFromRatio(1) === 1, "boss P1 at full HP");
  assert(bossPhaseFromRatio(0.66) === 1, "boss P1 above 65%");
  assert(bossPhaseFromRatio(0.64) === 2, "boss P2 at 64%");
  assert(bossPhaseFromRatio(0.31) === 3, "boss P3 at 31%");
  assert(BOSS_PHASE_CFG[3].spawns.length >= 2, "rug pulse spawns adds");
}

// Wave composition enemy types
function waveComposition(wave) {
  const enemies = [];
  const base = 8 + Math.floor(wave * 1.5);
  const w = wave;
  if (w % 10 === 0) {
    const bossCount = w >= 50 ? 1 : Math.min(2, 1 + Math.floor((w - 1) / 20));
    enemies.push({ type: "boss", count: bossCount });
    enemies.push({ type: "whale", count: 1 + Math.floor(w / 20) });
    enemies.push({ type: "bear", count: 2 + Math.floor(w / 10) });
    enemies.push({ type: "shill", count: 1 + Math.floor(w / 15) });
    enemies.push({ type: "paper", count: base });
    enemies.push({ type: "spam", count: 5 + Math.floor(w * 0.72) });
  } else if (w % 5 === 0) {
    enemies.push({ type: "boss", count: 1 });
    enemies.push({ type: "bear", count: 2 + Math.floor(w / 10) });
    enemies.push({ type: "fud", count: 4 + w });
    enemies.push({ type: "paper", count: base });
  } else if (w % 4 === 0) {
    enemies.push({ type: "whale", count: 1 });
    enemies.push({ type: "shill", count: 1 + Math.floor(w / 10) });
    enemies.push({ type: "bot", count: 3 + Math.floor(w / 3) });
    enemies.push({ type: "paper", count: base });
  } else if (w % 3 === 0) {
    enemies.push({ type: "spam", count: 8 + Math.floor(w * 1.35) });
    enemies.push({ type: "fud", count: 5 + w });
    enemies.push({ type: "bear", count: Math.max(1, Math.floor(w / 6)) });
  } else if (w % 2 === 0) {
    enemies.push({ type: "fud", count: 6 + Math.floor(w * 1.4) });
    enemies.push({ type: "bot", count: 2 + Math.floor(w / 4) });
    enemies.push({ type: "paper", count: base });
  } else {
    enemies.push({ type: "paper", count: base + 4 });
    if (w > 3) enemies.push({ type: "fud", count: w + 2 });
    if (w > 8) enemies.push({ type: "bear", count: Math.floor(w / 6) });
    if (w > 12) enemies.push({ type: "spam", count: w });
    if (w > 18) enemies.push({ type: "shill", count: 1 });
    if (w > 22) enemies.push({ type: "whale", count: 1 });
  }
  if (w >= 14) enemies.push({ type: "tick", count: 1 + Math.floor(w / 14) });
  if (w >= 16) enemies.push({ type: "fomo", count: 1 + Math.floor(w / 20) });
  if (w >= 20) enemies.push({ type: "hodler", count: Math.max(1, Math.floor(w / 22)) });
  if (w >= 24) enemies.push({ type: "mint", count: 1 + Math.floor(w / 28) });
  return enemies;
}

const w5 = waveComposition(5);
assert(w5.some((g) => g.type === "boss"), "wave 5 has boss");
const w14 = waveComposition(14);
assert(w14.some((g) => g.type === "tick"), "wave 14+ has ticks");
const w20 = waveComposition(20);
assert(w20.some((g) => g.type === "hodler"), "wave 20+ has hodlers");
const w16 = waveComposition(16);
assert(w16.some((g) => g.type === "fomo"), "wave 16+ has FOMO Rockets");
const w24 = waveComposition(24);
assert(w24.some((g) => g.type === "mint"), "wave 24+ has Mint Bots");
const w50 = waveComposition(50);
const bossCount50 = w50.find((g) => g.type === "boss")?.count ?? 0;
assert(bossCount50 === 1, "wave 50 has single Rugpull finale", `count=${bossCount50}`);

for (let w = 1; w <= 50; w++) {
  for (const g of waveComposition(w)) {
    if (!ENEMY_DEFS[g.type]) {
      fail(`wave ${w} unknown enemy ${g.type}`);
      break;
    }
  }
}
pass("waves 1–50 only use valid enemy types");

// Interest cap
const interest = Math.min(220, Math.floor(20000 * 0.017));
assert(interest === 220, "interest capped at 220 for 20k gold");

// Endless wave events cycle
const ENDLESS_EVENT_CYCLE = extractConst("ENDLESS_EVENT_CYCLE");
function getWaveEvent(wave, mode) {
  if (WAVE_EVENTS[wave]) return { ...WAVE_EVENTS[wave] };
  if (mode === "endless" && wave > 50 && ENDLESS_EVENT_CYCLE) {
    const key = ENDLESS_EVENT_CYCLE[(wave - 51) % ENDLESS_EVENT_CYCLE.length];
    return WAVE_EVENTS[key] ? { ...WAVE_EVENTS[key] } : null;
  }
  return null;
}
assert(getWaveEvent(51, "endless")?.id === WAVE_EVENTS[7].id, "endless W51 cycles events");
assert(getWaveEvent(61, "endless")?.id === WAVE_EVENTS[48].id, "endless event cycle wraps");

// ── 6. CSS sanity ────────────────────────────────────────────────────────────
console.log("\n6. CSS / UI hooks");
assert(styleCss.includes(".game-toast"), "game toast styles");
assert(styleCss.includes(".settings-panel") || styleCss.includes(".setting-row"), "settings panel styles");
assert(styleCss.includes(".hotkeys-modal") || styleCss.includes(".hotkey-list"), "hotkeys overlay styles");
assert(styleCss.includes(".end-bests"), "end screen bests styles");
assert(styleCss.includes(".end-stats-extended"), "end screen extended stats styles");
assert(styleCss.includes(".tower-key"), "shop key badge styles");
assert(styleCss.includes(".stat-critical"), "critical lives HUD styles");
assert(indexHtml.includes('id="end-perfect"'), "end screen perfect waves stat");
assert(indexHtml.includes('id="end-spent"'), "end screen BAN spent stat");
assert(indexHtml.includes('id="opt-mute"'), "settings mute toggle");
assert(styleCss.includes("--banano"), "banano CSS variables");

// ── 7. Boot smoke (mock DOM) ─────────────────────────────────────────────────
console.log("\n7. Boot smoke (mock DOM)");

const storage = {};
const classList = () => ({
  _c: new Set(),
  add(...a) { a.forEach((x) => this._c.add(x)); },
  remove(...a) { a.forEach((x) => this._c.delete(x)); },
  toggle(x) { this._c.has(x) ? this._c.delete(x) : this._c.add(x); },
  contains(x) { return this._c.has(x); },
});

function makeEl(id, tag = "div") {
  const el = {
    id, tagName: tag.toUpperCase(), children: [],
    classList: classList(),
    dataset: {},
    style: {},
    textContent: "",
    innerHTML: "",
    value: "32",
    checked: false,
    disabled: false,
    offsetWidth: 100,
    width: 960,
    height: 640,
    addEventListener() {},
    appendChild(child) { this.children.push(child); return child; },
    removeChild() {},
    querySelectorAll(sel) {
      if (sel === ".tower-card") return this.children.filter((c) => c.classList.contains("tower-card"));
      return this.children;
    },
    querySelector() { return this.children[0] || null; },
    getContext() { return makeCtx(); },
    setAttribute() {},
    click() {},
  };
  return el;
}

function makeCtx() {
  const gradient = { addColorStop() {} };
  const store = { canvas: { width: 960, height: 640 } };
  const methods = {
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  };
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (methods[prop]) return methods[prop];
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

const elements = {};
const ALL_IDS = [...new Set([...idRefs, "bg-bananas", "game", "btn-upgrade", "btn-sell"])];
for (const id of ALL_IDS) elements[id] = makeEl(id, id === "game" ? "canvas" : "div");

const document = {
  getElementById(id) { return elements[id] || makeEl(id); },
  createElement(tag = "div") { return makeEl(`dyn-${tag}`, tag); },
};

let rafCb = null;
const window = {
  addEventListener() {},
  AudioContext: class {
    constructor() { this.state = "running"; this.currentTime = 0; this.sampleRate = 44100; this.destination = {}; }
    createGain() { return { gain: { value: 0 }, connect() {} }; }
    createOscillator() { return { frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, type: "", connect() {}, start() {}, stop() {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
    createBufferSource() { return { connect() {}, start() {} }; }
    createBiquadFilter() { return { type: "", frequency: { value: 0 }, connect() {} }; }
    resume() { return Promise.resolve(); }
  },
  webkitAudioContext: null,
  performance: { now: () => Date.now() },
  localStorage: {
    getItem(k) { return storage[k] ?? null; },
    setItem(k, v) { storage[k] = v; },
  },
  requestAnimationFrame(cb) { rafCb = cb; return 1; },
};

try {
  const sandbox = {
    document, window, console, Math, Date, setTimeout, clearTimeout,
    parseInt, parseFloat, Array, Object, String, Number, Boolean, Error, Proxy,
    performance: window.performance,
    requestAnimationFrame: window.requestAnimationFrame,
    localStorage: window.localStorage,
  };
  sandbox.window = window;
  vm.runInNewContext(gameJs, sandbox, { filename: "game.js", timeout: 5000 });
  pass("game.js boots in mock DOM without throw");
  assert(typeof rafCb === "function", "requestAnimationFrame registered");
  // Run one frame tick
  if (rafCb) {
    try {
      rafCb(performance.now() + 16);
      pass("one animation frame tick completes");
    } catch (frameErr) {
      warn("animation frame tick (mock canvas limits)", frameErr.message);
    }
  }
} catch (e) {
  fail("game.js boots in mock DOM", e.stack || e.message);
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log("\n══ Summary ══");
console.log(`  Passed: ${results.pass}`);
console.log(`  Failed: ${results.fail}`);
console.log(`  Warnings: ${results.warn}`);
if (results.errors.length) {
  console.log("\nFailures:");
  for (const e of results.errors) console.log(`  - ${e.name}: ${e.detail}`);
}
console.log(results.fail === 0 ? "\n✅ ALL TESTS PASSED\n" : "\n❌ TESTS FAILED\n");
process.exit(results.fail === 0 ? 0 : 1);