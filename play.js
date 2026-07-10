(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════
  // POTASSIUM CLIMB — elegant Banano icy tower
  // Big view · worlds · upgrades · save · leaderboard · juice
  // ═══════════════════════════════════════════════════════════

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d", { alpha: false });
  // Wider + taller — see more of the tower
  var W = 720, H = 1000;
  canvas.width = W;
  canvas.height = H;

  var hud = document.getElementById("hud");
  var hudH = document.getElementById("hudH");
  var hudScore = document.getElementById("hudScore");
  var hudCoins = document.getElementById("hudCoins");
  var hudLevel = document.getElementById("hudLevel");
  var hudPow = document.getElementById("hudPow");
  var comboEl = document.getElementById("comboEl");
  var menuOv = document.getElementById("menuOv");
  var howOv = document.getElementById("howOv");
  var pauseOv = document.getElementById("pauseOv");
  var overOv = document.getElementById("overOv");
  var winOv = document.getElementById("winOv");
  var saveStatusEl = document.getElementById("saveStatus");

  // ── Worlds ──
  var WORLDS = [
    {
      id: "grove", name: "Frost Grove", icon: "🌲",
      tagline: "Gentle ice, wide ledges. Learn the slide.",
      goal: 120, unlock: 0,
      gap0: 54, gapScale: 0.12, gapMax: 38,
      wMin: 100, wMax: 180, hazard: 0.35, coin: 0.62, power: 0.1,
      palette: { sky0: "#0c1926", sky1: "#152a3d", ice: "#7dd3fc", accent: "#86efac", fog: "rgba(125,211,252,0.06)" },
      scoreMul: 1
    },
    {
      id: "glacier", name: "Peel Glacier", icon: "🍌",
      tagline: "Slippery peels everywhere. Watch your footing.",
      goal: 200, unlock: 100,
      gap0: 58, gapScale: 0.14, gapMax: 48,
      wMin: 86, wMax: 160, hazard: 0.55, coin: 0.58, power: 0.11,
      peelBias: 0.28,
      palette: { sky0: "#0a1420", sky1: "#1a2840", ice: "#93c5fd", accent: "#f5d041", fog: "rgba(245,208,65,0.05)" },
      scoreMul: 1.1
    },
    {
      id: "neon", name: "Neon Spire", icon: "💜",
      tagline: "Moving platforms, pink night glow.",
      goal: 280, unlock: 170,
      gap0: 62, gapScale: 0.16, gapMax: 55,
      wMin: 72, wMax: 140, hazard: 0.7, coin: 0.55, power: 0.12,
      moveBias: 0.28,
      palette: { sky0: "#0d0618", sky1: "#1a0a2e", ice: "#e879f9", accent: "#22d3ee", fog: "rgba(232,121,249,0.07)" },
      scoreMul: 1.25
    },
    {
      id: "fud", name: "FUD Summit", icon: "❄️",
      tagline: "Snowballs, spikes, crumbling peels. Stay sharp.",
      goal: 360, unlock: 240,
      gap0: 66, gapScale: 0.18, gapMax: 62,
      wMin: 64, wMax: 128, hazard: 1.15, coin: 0.52, power: 0.13,
      crumbleBias: 0.22, spikeBias: 0.14,
      palette: { sky0: "#080e18", sky1: "#121c2c", ice: "#bae6fd", accent: "#f87171", fog: "rgba(248,113,113,0.05)" },
      scoreMul: 1.4
    },
    {
      id: "peak", name: "Potassium Peak", icon: "👑",
      tagline: "The pure climb. Tight gaps, high glory.",
      goal: 450, unlock: 320,
      gap0: 70, gapScale: 0.2, gapMax: 70,
      wMin: 58, wMax: 118, hazard: 1.0, coin: 0.5, power: 0.14,
      palette: { sky0: "#0a0c14", sky1: "#16120a", ice: "#f5d041", accent: "#fde68a", fog: "rgba(245,208,65,0.06)" },
      scoreMul: 1.6
    },
    {
      id: "orbit", name: "Endless Orbit", icon: "🌌",
      tagline: "No summit. Just height, style, and infinity.",
      goal: 0, unlock: 400, endless: true,
      gap0: 64, gapScale: 0.22, gapMax: 78,
      wMin: 54, wMax: 120, hazard: 1.1, coin: 0.55, power: 0.15,
      palette: { sky0: "#05060e", sky1: "#101528", ice: "#a5b4fc", accent: "#f472b6", fog: "rgba(165,180,252,0.06)" },
      scoreMul: 1.75
    }
  ];
  var WORLD_BY_ID = {};
  for (var wi = 0; wi < WORLDS.length; wi++) WORLD_BY_ID[WORLDS[wi].id] = WORLDS[wi];

  // ── Upgrades (permanent, bought with banked BAN) ──
  var UPGRADE_DEFS = [
    { id: "jump", name: "Strong Legs", desc: "Higher jumps", max: 5, costs: [40, 90, 160, 260, 400], icon: "🦵" },
    { id: "grip", name: "Ice Skates", desc: "Less slide on ice", max: 5, costs: [35, 80, 140, 230, 350], icon: "⛸️" },
    { id: "magnet", name: "BAN Magnet", desc: "Pull coins from farther", max: 4, costs: [50, 110, 200, 320], icon: "🧲" },
    { id: "combo", name: "Combo Timer", desc: "Longer combo windows", max: 4, costs: [45, 100, 180, 300], icon: "🔥" },
    { id: "luck", name: "Lucky Peels", desc: "More coins spawn", max: 4, costs: [55, 120, 210, 340], icon: "🍀" },
    { id: "shield", name: "Starter Shield", desc: "Begin runs with shield time", max: 3, costs: [80, 180, 320], icon: "🛡️" },
    { id: "speed", name: "Tailwind", desc: "Faster run speed", max: 4, costs: [40, 95, 170, 280], icon: "💨" }
  ];

  // Physics base
  var GRAVITY = 2100;
  var JUMP_V = -740;
  var MOVE_ACCEL = 3600;
  var AIR_ACCEL = 3000;
  var MAX_RUN = 360;
  var ICE_FRICTION = 0.965;
  var AIR_DRAG = 0.995;
  var WALL_SLIDE = 140;
  var WALL_JUMP_X = 400;
  var WALL_JUMP_Y = -700;
  var COYOTE = 0.12;
  var JUMP_BUF = 0.14;
  var MAX_FALL = 1150;
  var PW = 38, PH = 44;
  var PLAT_H = 15;

  // State
  var state = "menu";
  var selectedWorld = "grove";
  var player = { x: 0, y: 0, vx: 0, vy: 0, facing: 1, squish: 1, stretch: 1 };
  var plats = [], coins = [], powers = [], hazards = [], particles = [], floats = [], snow = [], stars = [];
  var camY = 0, camShake = 0;
  var maxHeight = 0, score = 0, coinsGot = 0;
  var combo = 0, bestCombo = 0, comboTimer = 0, comboFlash = 0;
  var lastTs = 0, animT = 0;
  var grounded = false, groundPlat = null;
  var coyoteT = 0, jumpBuf = 0, jumpPressed = false, jumpHoldT = 0;
  var onWall = 0, wallCoyote = 0, wallCoyoteSide = 0;
  var nextPlatY = 0, startY = 0;
  var shieldT = 0, superJumpT = 0, floatT = 0, magnetT = 0, speedT = 0, invulnT = 0;
  var flash = 0, dead = false, won = false, endlessMode = false;
  var keyL = false, keyR = false, keyJ = false;
  var bankEarnedThisRun = 0;

  // ── Save ──
  var SAVE_KEY = "bx-potassium-climb-v2";
  var SAVE_BAK = "bx-potassium-climb-v2.bak";
  var SAVE_SCHEMA = 2;
  var progress = defaultProgress();

  function defaultProgress() {
    return {
      schemaVersion: SAVE_SCHEMA,
      bank: 0,
      bestScore: 0,
      bestHeight: 0,
      bestCombo: 0,
      runs: 0,
      unlocked: ["grove"],
      cleared: {},
      levelBest: {},
      upgrades: {},
      leaderboard: [],
      lastWorld: "grove",
      updatedAt: 0
    };
  }

  function upgLevel(id) {
    return progress.upgrades[id] | 0;
  }

  function upgCost(def) {
    var lv = upgLevel(def.id);
    if (lv >= def.max) return null;
    return def.costs[lv];
  }

  function isWorldUnlocked(w) {
    if (progress.unlocked.indexOf(w.id) >= 0) return true;
    if ((progress.bestHeight | 0) >= (w.unlock | 0)) return true;
    return false;
  }

  function ensureUnlocks() {
    for (var i = 0; i < WORLDS.length; i++) {
      var w = WORLDS[i];
      if (isWorldUnlocked(w) && progress.unlocked.indexOf(w.id) < 0) {
        progress.unlocked.push(w.id);
      }
    }
  }

  function loadProgress() {
    function parse(raw) {
      if (!raw) return null;
      try {
        var o = JSON.parse(raw);
        if (!o || typeof o !== "object") return null;
        // migrate v1 scores
        if (!o.schemaVersion) {
          var d = defaultProgress();
          d.bestScore = o.bestScore | 0;
          d.bestHeight = o.bestHeight | 0;
          d.bestCombo = o.bestCombo | 0;
          d.leaderboard = (o.runs || []).map(function (r) {
            return { score: r.s | 0, height: r.h | 0, combo: r.c | 0, world: "grove", at: r.t | 0 };
          }).slice(0, 15);
          return d;
        }
        var out = defaultProgress();
        out.bank = Math.max(0, o.bank | 0);
        out.bestScore = Math.max(0, o.bestScore | 0);
        out.bestHeight = Math.max(0, o.bestHeight | 0);
        out.bestCombo = Math.max(0, o.bestCombo | 0);
        out.runs = Math.max(0, o.runs | 0);
        out.unlocked = Array.isArray(o.unlocked) && o.unlocked.length ? o.unlocked.slice() : ["grove"];
        out.cleared = o.cleared && typeof o.cleared === "object" ? o.cleared : {};
        out.levelBest = o.levelBest && typeof o.levelBest === "object" ? o.levelBest : {};
        out.upgrades = o.upgrades && typeof o.upgrades === "object" ? o.upgrades : {};
        out.leaderboard = Array.isArray(o.leaderboard) ? o.leaderboard.slice(0, 15) : [];
        out.lastWorld = o.lastWorld && WORLD_BY_ID[o.lastWorld] ? o.lastWorld : "grove";
        out.updatedAt = o.updatedAt | 0;
        return out;
      } catch (e) { return null; }
    }
    var p = null;
    try { p = parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!p) {
      try { p = parse(localStorage.getItem(SAVE_BAK)); } catch (e2) {}
    }
    // also try old key once
    if (!p) {
      try {
        var old = localStorage.getItem("bx-potassium-tower-v1");
        if (old) p = parse(old);
      } catch (e3) {}
    }
    progress = p || defaultProgress();
    ensureUnlocks();
    if (progress.lastWorld && isWorldUnlocked(WORLD_BY_ID[progress.lastWorld] || WORLDS[0])) {
      selectedWorld = progress.lastWorld;
    }
  }

  function saveProgress(flash) {
    progress.updatedAt = Date.now();
    ensureUnlocks();
    var str;
    try { str = JSON.stringify(progress); } catch (e) { return false; }
    try {
      var prev = localStorage.getItem(SAVE_KEY);
      if (prev) localStorage.setItem(SAVE_BAK, prev);
      localStorage.setItem(SAVE_KEY, str);
      if (flash && saveStatusEl) {
        saveStatusEl.textContent = "Saved";
        setTimeout(function () {
          if (saveStatusEl && saveStatusEl.textContent === "Saved") saveStatusEl.textContent = "";
        }, 1600);
      }
      return true;
    } catch (e2) {
      if (saveStatusEl) saveStatusEl.textContent = "Save unavailable";
      return false;
    }
  }

  function exportProgress() {
    try {
      var blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "potassium-climb-progress.json";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 0);
    } catch (e) {}
  }

  function importProgress(json) {
    try {
      var o = JSON.parse(json);
      if (!o || typeof o !== "object") return false;
      var incoming = o.schemaVersion ? o : null;
      if (!incoming) {
        // wrap raw
        progress.bank = Math.max(progress.bank, o.bank | 0);
        progress.bestScore = Math.max(progress.bestScore, o.bestScore | 0);
        progress.bestHeight = Math.max(progress.bestHeight, o.bestHeight | 0);
      } else {
        progress.bank = Math.max(progress.bank, incoming.bank | 0);
        progress.bestScore = Math.max(progress.bestScore, incoming.bestScore | 0);
        progress.bestHeight = Math.max(progress.bestHeight, incoming.bestHeight | 0);
        progress.bestCombo = Math.max(progress.bestCombo, incoming.bestCombo | 0);
        if (incoming.upgrades) {
          Object.keys(incoming.upgrades).forEach(function (k) {
            progress.upgrades[k] = Math.max(progress.upgrades[k] | 0, incoming.upgrades[k] | 0);
          });
        }
        if (incoming.unlocked) {
          incoming.unlocked.forEach(function (id) {
            if (progress.unlocked.indexOf(id) < 0) progress.unlocked.push(id);
          });
        }
        if (incoming.cleared) {
          Object.keys(incoming.cleared).forEach(function (k) {
            progress.cleared[k] = progress.cleared[k] || incoming.cleared[k];
          });
        }
        if (Array.isArray(incoming.leaderboard)) {
          progress.leaderboard = progress.leaderboard.concat(incoming.leaderboard);
          progress.leaderboard.sort(function (a, b) { return (b.score | 0) - (a.score | 0); });
          progress.leaderboard = progress.leaderboard.slice(0, 15);
        }
      }
      ensureUnlocks();
      saveProgress(true);
      refreshHub();
      return true;
    } catch (e) { return false; }
  }

  function buyUpgrade(id) {
    var def = null;
    for (var i = 0; i < UPGRADE_DEFS.length; i++) {
      if (UPGRADE_DEFS[i].id === id) { def = UPGRADE_DEFS[i]; break; }
    }
    if (!def) return;
    var cost = upgCost(def);
    if (cost == null || progress.bank < cost) return;
    progress.bank -= cost;
    progress.upgrades[id] = (progress.upgrades[id] | 0) + 1;
    sfxPower();
    saveProgress(true);
    refreshHub();
    refreshSide();
  }

  // Audio
  var actx = null;
  function ensureAudio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (actx && actx.state === "suspended") actx.resume();
  }
  function beep(f, d, type, v, slide) {
    if (!actx) return;
    var t0 = actx.currentTime;
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + d);
    g.gain.setValueAtTime(v || 0.045, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g); g.connect(actx.destination);
    o.start(t0); o.stop(t0 + d + 0.02);
  }
  function sfxJump(c) { beep(360 + c * 18, 0.06, "square", 0.045, 220); if (c >= 3) beep(600 + c * 28, 0.08, "triangle", 0.03); }
  function sfxLand(c) { beep(180 + Math.min(c, 10) * 14, 0.04, "triangle", 0.035); }
  function sfxCoin() { beep(980, 0.04, "square", 0.028); beep(1320, 0.06, "square", 0.02); }
  function sfxPower() { beep(440, 0.05, "sine", 0.045); beep(700, 0.1, "triangle", 0.035); }
  function sfxCombo(n) { beep(500 + n * 36, 0.07, "square", 0.035); beep(800 + n * 45, 0.1, "sine", 0.028); }
  function sfxDie() { beep(200, 0.25, "sawtooth", 0.055, 50); }
  function sfxWall() { beep(280, 0.05, "triangle", 0.03, 400); }
  function sfxWin() { beep(523, 0.1, "square", 0.03); beep(659, 0.12, "square", 0.03); beep(784, 0.2, "triangle", 0.035); }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function irand(a, b) { return (a + Math.random() * (b - a + 1)) | 0; }

  function getWorld() {
    return WORLD_BY_ID[selectedWorld] || WORLDS[0];
  }

  function jumpMul() { return 1 + upgLevel("jump") * 0.055; }
  function gripMul() { return Math.pow(0.92, upgLevel("grip")); } // lower friction power = more stop
  function magnetBonus() { return upgLevel("magnet") * 28; }
  function comboWindow() { return 2.0 + upgLevel("combo") * 0.35; }
  function luckMul() { return 1 + upgLevel("luck") * 0.12; }
  function speedMul() { return 1 + upgLevel("speed") * 0.06; }
  function startShield() { return upgLevel("shield") * 2.2; }

  // Particles
  function burst(x, y, color, n, kind) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 170;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50,
        life: 0.25 + Math.random() * 0.4, age: 0,
        color: color, size: 2 + Math.random() * 3.5, kind: kind || "spark"
      });
    }
  }
  function floatTxt(x, y, text, color, size) {
    floats.push({ x: x, y: y, text: text, color: color || "#f5d041", size: size || 14, life: 0.85, age: 0 });
  }
  function confetti(x, y) {
    var cols = ["#f5d041", "#7dd3fc", "#f472b6", "#86efac", "#c084fc"];
    for (var i = 0; i < 26; i++) burst(x, y, cols[i % cols.length], 1);
  }

  function initDecor() {
    snow = [];
    stars = [];
    for (var i = 0; i < 55; i++) {
      snow.push({ x: Math.random() * W, y: Math.random() * H, s: 1 + Math.random() * 2.2, sp: 18 + Math.random() * 45, ph: Math.random() * Math.PI * 2 });
    }
    for (var j = 0; j < 40; j++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 1.4, ph: Math.random() * Math.PI * 2 });
    }
  }

  function platTypeForHeight(h, world) {
    var r = Math.random();
    var peelB = world.peelBias || 0.12;
    var moveB = world.moveBias || 0.12;
    var crumbB = world.crumbleBias || 0.12;
    if (h < 30) return r < peelB * 0.5 ? "peel" : "ice";
    if (h < 100) {
      if (r < crumbB * 0.6) return "crumble";
      if (r < crumbB * 0.6 + peelB) return "peel";
      if (r < crumbB * 0.6 + peelB + 0.1) return "block";
      if (r < crumbB * 0.6 + peelB + 0.16) return "spring";
      return "ice";
    }
    if (r < crumbB) return "crumble";
    if (r < crumbB + moveB) return "move";
    if (r < crumbB + moveB + peelB) return "peel";
    if (r < crumbB + moveB + peelB + 0.1) return "spring";
    if (r < crumbB + moveB + peelB + 0.18) return "block";
    return "ice";
  }

  function makePlat(y, forcedX, forcedW, type) {
    var world = getWorld();
    var hMeters = Math.max(0, (startY - y) / 40);
    var wMin = Math.max(48, world.wMin - hMeters * 0.08);
    var wMax = Math.max(wMin + 12, world.wMax - hMeters * 0.1);
    var w = forcedW || rand(wMin, wMax);
    var margin = 18;
    var x = forcedX != null ? forcedX : rand(margin, W - w - margin);
    type = type || platTypeForHeight(hMeters, world);
    var spikeChance = (world.spikeBias || 0.06) + Math.min(0.1, hMeters / 900);
    return {
      x: x, y: y, w: w, h: PLAT_H,
      type: type,
      vx: type === "move" ? (Math.random() < 0.5 ? -1 : 1) * rand(45, 100) * (1 + hMeters / 400) : 0,
      x0: x, range: type === "move" ? rand(40, 100) : 0,
      crumble: type === "crumble" ? 0 : -1,
      broken: false,
      spike: hMeters > 50 && Math.random() < spikeChance * world.hazard,
      phase: Math.random() * Math.PI * 2
    };
  }

  function spawnRow(y) {
    var world = getWorld();
    var hMeters = Math.max(0, (startY - y) / 40);
    var p = makePlat(y);
    plats.push(p);

    if (hMeters > 25 && Math.random() < 0.2) {
      var w2 = rand(52, 90);
      var x2 = clamp(p.x + rand(-160, 160), 14, W - w2 - 14);
      plats.push(makePlat(y - rand(6, 22), x2, w2, Math.random() < 0.35 ? "peel" : "ice"));
    }

    var coinChance = world.coin * luckMul();
    if (Math.random() < coinChance) {
      var cn = 1 + (Math.random() < 0.35 ? 1 : 0) + (Math.random() < 0.12 ? 1 : 0);
      for (var i = 0; i < cn; i++) {
        coins.push({
          x: p.x + p.w * (0.2 + 0.6 * Math.random()),
          y: p.y - 24 - i * 18,
          r: 10, got: false, phase: Math.random() * Math.PI * 2, value: 1
        });
      }
    }
    // golden banana rare
    if (hMeters > 40 && Math.random() < 0.035 * luckMul()) {
      coins.push({
        x: p.x + p.w / 2, y: p.y - 36, r: 13, got: false,
        phase: Math.random() * Math.PI * 2, value: 5, gold: true
      });
    }

    if (hMeters > 12 && Math.random() < world.power) {
      var kinds = ["jump", "shield", "float", "magnet", "speed"];
      powers.push({
        x: p.x + p.w / 2, y: p.y - 30,
        kind: kinds[irand(0, kinds.length - 1)],
        r: 13, got: false, phase: Math.random() * Math.PI * 2
      });
    }
  }

  function seedWorld() {
    plats = []; coins = []; powers = []; hazards = [];
    particles = []; floats = [];
    plats.push({
      x: 40, y: H - 56, w: W - 80, h: 24, type: "block",
      vx: 0, x0: 40, range: 0, crumble: -1, broken: false, spike: false, phase: 0
    });
    player.x = W / 2 - PW / 2;
    player.y = H - 56 - PH;
    player.vx = 0; player.vy = 0;
    startY = player.y;
    camY = 0;
    nextPlatY = H - 56 - 72;
    for (var i = 0; i < 22; i++) {
      spawnRow(nextPlatY);
      var world = getWorld();
      var hMeters = Math.max(0, (startY - nextPlatY) / 40);
      var gap = world.gap0 + Math.min(world.gapMax, hMeters * world.gapScale) + rand(-8, 12);
      nextPlatY -= gap;
    }
  }

  function ensurePlats() {
    var world = getWorld();
    var top = camY - 60;
    while (nextPlatY > top - H) {
      spawnRow(nextPlatY);
      var hMeters = Math.max(0, (startY - nextPlatY) / 40);
      var gap = world.gap0 + Math.min(world.gapMax, hMeters * world.gapScale) + rand(-10, 14);
      nextPlatY -= gap;
    }
    var bottom = camY + H + 140;
    plats = plats.filter(function (p) { return p.y < bottom; });
    coins = coins.filter(function (c) { return !c.got && c.y < bottom; });
    powers = powers.filter(function (p) { return !p.got && p.y < bottom; });
    hazards = hazards.filter(function (h) { return h.y < bottom + 50; });
  }

  function spawnSnowball() {
    var world = getWorld();
    var hMeters = maxHeight;
    if (hMeters < 50) return;
    if (Math.random() > (0.01 + Math.min(0.03, hMeters / 3500)) * world.hazard) return;
    hazards.push({
      kind: "snow",
      x: rand(24, W - 24),
      y: camY - 36,
      vy: rand(130, 240) + hMeters * 0.35,
      r: 12 + Math.random() * 6,
      rot: 0
    });
  }

  function showOnly(el) {
    [menuOv, howOv, pauseOv, overOv, winOv].forEach(function (o) {
      if (o) o.classList.toggle("hidden", o !== el);
    });
  }

  function startGame(asEndless) {
    ensureAudio();
    state = "play";
    dead = false; won = false;
    endlessMode = !!asEndless || !!(getWorld().endless);
    maxHeight = 0; score = 0; coinsGot = 0; bankEarnedThisRun = 0;
    combo = 0; bestCombo = 0; comboTimer = 0; comboFlash = 0;
    superJumpT = 0; floatT = 0; magnetT = 0; speedT = 0; invulnT = 0;
    shieldT = startShield();
    grounded = false; groundPlat = null; coyoteT = 0; jumpBuf = 0;
    onWall = 0; wallCoyote = 0; camShake = 0; flash = 0;
    document.body.classList.add("climb-playing");
    seedWorld();
    initDecor();
    showOnly(null);
    if (hud) hud.hidden = false;
    comboEl.classList.remove("show");
    if (hudLevel) hudLevel.textContent = getWorld().name;
    updateHud();
    lastTs = 0;
  }

  function pauseGame() {
    if (state !== "play") return;
    state = "pause";
    pauseOv.classList.remove("hidden");
  }
  function resumeGame() {
    if (state !== "pause") return;
    state = "play";
    pauseOv.classList.add("hidden");
    lastTs = 0;
  }
  function goMenu() {
    state = "menu";
    dead = false; won = false;
    document.body.classList.remove("climb-playing");
    if (hud) hud.hidden = true;
    showOnly(menuOv);
    comboEl.classList.remove("show");
    refreshHub();
    refreshSide();
  }

  var PUNS = [
    "Don’t let your memes be dreams.",
    "Feeless fall… still hurts.",
    "Need more potassium.",
    "The jungle remembers.",
    "Banano never dies — MonKeys do.",
    "That was a rug-adjacent jump.",
    "Core intact. Pride: less so.",
    "Tip yourself some dignity BAN."
  ];
  var COMBO_PUNS = [
    "", "Nice peel", "Potassium", "Slick", "Chain rain",
    "Mega K⁺", "Blockchain", "Unstoppable", "Starship", "Legendary"
  ];

  function finalizeRun(didWin) {
    var h = Math.floor(maxHeight);
    var world = getWorld();
    var bankGain = coinsGot + Math.floor(h / 8) + (didWin ? 40 : 0) + Math.floor(bestCombo * 1.5);
    bankEarnedThisRun = bankGain;
    progress.bank = (progress.bank | 0) + bankGain;
    progress.runs = (progress.runs | 0) + 1;
    progress.bestScore = Math.max(progress.bestScore | 0, score);
    progress.bestHeight = Math.max(progress.bestHeight | 0, h);
    progress.bestCombo = Math.max(progress.bestCombo | 0, bestCombo);
    progress.lastWorld = selectedWorld;

    if (!progress.levelBest[world.id]) progress.levelBest[world.id] = { height: 0, score: 0 };
    progress.levelBest[world.id].height = Math.max(progress.levelBest[world.id].height | 0, h);
    progress.levelBest[world.id].score = Math.max(progress.levelBest[world.id].score | 0, score);

    if (didWin && !world.endless) {
      progress.cleared[world.id] = Date.now();
      // unlock next world
      var idx = WORLDS.indexOf(world);
      if (idx >= 0 && idx < WORLDS.length - 1) {
        var next = WORLDS[idx + 1];
        if (progress.unlocked.indexOf(next.id) < 0) progress.unlocked.push(next.id);
      }
    }
    ensureUnlocks();

    progress.leaderboard.push({
      score: score | 0,
      height: h,
      combo: bestCombo | 0,
      world: world.id,
      win: !!didWin,
      at: Date.now()
    });
    progress.leaderboard.sort(function (a, b) { return (b.score | 0) - (a.score | 0); });
    progress.leaderboard = progress.leaderboard.slice(0, 15);
    saveProgress(true);
  }

  function endGame() {
    if (dead || won) return;
    dead = true;
    state = "over";
    sfxDie();
    burst(player.x + PW / 2, player.y + PH / 2, "#f87171", 26, "spark");
    burst(player.x + PW / 2, player.y + PH / 2, "#f5d041", 14, "peel");
    finalizeRun(false);
    var h = Math.floor(maxHeight);
    document.getElementById("endH").textContent = String(h);
    document.getElementById("endScore").textContent = String(score);
    document.getElementById("endCoins").textContent = String(coinsGot);
    document.getElementById("endCombo").textContent = String(bestCombo);
    document.getElementById("endBank").textContent = "+" + bankEarnedThisRun + " BAN banked · Total " + progress.bank;
    document.getElementById("overPun").textContent = PUNS[irand(0, PUNS.length - 1)];
    var title = "Fall";
    if (h >= (progress.bestHeight | 0) && h > 0) title = "New height";
    else if (score >= (progress.bestScore | 0) && score > 0) title = "New high score";
    document.getElementById("overTitle").textContent = title;
    overOv.classList.remove("hidden");
    if (hud) hud.hidden = true;
    refreshSide();
  }

  function winGame() {
    if (dead || won) return;
    won = true;
    state = "win";
    sfxWin();
    confetti(player.x + PW / 2, player.y);
    confetti(W / 2, camY + H * 0.3);
    finalizeRun(true);
    var h = Math.floor(maxHeight);
    document.getElementById("winH").textContent = String(h);
    document.getElementById("winScore").textContent = String(score);
    document.getElementById("winCoins").textContent = String(coinsGot);
    document.getElementById("winCombo").textContent = String(bestCombo);
    document.getElementById("winBank").textContent = "+" + bankEarnedThisRun + " BAN banked · Total " + progress.bank;
    document.getElementById("winMsg").textContent = getWorld().name + " cleared. Progress saved.";
    document.getElementById("winTitle").textContent = "Summit";
    winOv.classList.remove("hidden");
    if (hud) hud.hidden = true;
    refreshSide();
  }

  function updateHud() {
    if (hudH) hudH.textContent = String(Math.floor(maxHeight));
    if (hudScore) hudScore.textContent = String(score);
    if (hudCoins) hudCoins.textContent = String(coinsGot);
    if (hudPow) {
      var bits = [];
      if (shieldT > 0) bits.push("🛡" + Math.ceil(shieldT));
      if (superJumpT > 0) bits.push("↑" + Math.ceil(superJumpT));
      if (floatT > 0) bits.push("☁" + Math.ceil(floatT));
      if (magnetT > 0) bits.push("🧲" + Math.ceil(magnetT));
      if (speedT > 0) bits.push("⚡" + Math.ceil(speedT));
      hudPow.textContent = bits.length ? bits.join(" ") : "—";
      hudPow.style.opacity = bits.length ? "1" : "0.45";
    }
  }

  function showCombo() {
    if (combo < 2) {
      comboEl.classList.remove("show");
      return;
    }
    var pun = COMBO_PUNS[Math.min(COMBO_PUNS.length - 1, combo)] || "Potassium";
    comboEl.innerHTML = "Combo ×" + combo + "<span class='sub'>" + pun + "</span>";
    comboEl.classList.add("show");
    comboFlash = 0.95;
  }

  function tryLand(p, prevY) {
    if (player.vy < 0) return false;
    if (p.broken) return false;
    var feet = player.y + PH;
    var prevFeet = prevY + PH;
    if (prevFeet > p.y + 4) return false;
    if (feet < p.y - 2 || feet > p.y + p.h + 10) return false;
    if (player.x + PW < p.x + 4 || player.x > p.x + p.w - 4) return false;

    if (p.spike && invulnT <= 0 && shieldT <= 0) {
      player.y = p.y - PH;
      player.vy = JUMP_V * 0.5 * jumpMul();
      combo = 0; comboTimer = 0; showCombo();
      invulnT = 0.85;
      flash = 0.28;
      camShake = 0.35;
      burst(player.x + PW / 2, player.y + PH, "#f87171", 12);
      beep(120, 0.1, "sawtooth", 0.035);
      return true;
    }
    if (p.spike && shieldT > 0) {
      p.spike = false;
      burst(p.x + p.w / 2, p.y, "#67e8f9", 14);
    }

    player.y = p.y - PH;
    player.vy = 0;
    grounded = true;
    groundPlat = p;
    coyoteT = COYOTE;
    sfxLand(combo);

    if (p.type === "spring") {
      player.vy = JUMP_V * 1.48 * jumpMul();
      grounded = false;
      groundPlat = null;
      burst(player.x + PW / 2, p.y, "#f5d041", 16, "peel");
      floatTxt(player.x + PW / 2, p.y - 12, "Boing!", "#f5d041", 16);
      sfxJump(combo + 2);
      addCombo(true);
      return true;
    }
    if (p.type === "crumble" && p.crumble < 0) p.crumble = 0;
    addCombo(false);
    player.squish = 0.72;
    player.stretch = 1.22;
    burst(player.x + PW / 2, p.y, getWorld().palette.ice, 7);
    return true;
  }

  function addCombo(spring) {
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    comboTimer = comboWindow();
    var world = getWorld();
    var bonus = Math.floor((12 + combo * 9 + (spring ? 24 : 0)) * world.scoreMul);
    score += bonus;
    if (combo >= 2) {
      showCombo();
      if (combo % 5 === 0) {
        sfxCombo(combo);
        confetti(player.x + PW / 2, player.y);
        floatTxt(player.x + PW / 2, player.y - 22, COMBO_PUNS[Math.min(9, combo)] || "K⁺!", "#f472b6", 15);
      }
    }
  }

  function update(dt) {
    animT += dt;
    if (state !== "play") {
      updateVfx(dt);
      return;
    }

    if (camShake > 0) camShake = Math.max(0, camShake - dt * 3);
    if (flash > 0) flash = Math.max(0, flash - dt);
    if (comboFlash > 0) {
      comboFlash -= dt;
      if (comboFlash <= 0) comboEl.classList.remove("show");
    }
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0 && combo > 0) {
        combo = 0;
        comboEl.classList.remove("show");
      }
    }

    if (shieldT > 0) shieldT -= dt;
    if (superJumpT > 0) superJumpT -= dt;
    if (floatT > 0) floatT -= dt;
    if (magnetT > 0) magnetT -= dt;
    if (speedT > 0) speedT -= dt;
    if (invulnT > 0) invulnT -= dt;

    var prevY = player.y;
    var accel = grounded ? MOVE_ACCEL : AIR_ACCEL;
    if (speedT > 0) accel *= 1.38;
    accel *= speedMul();

    var maxV = MAX_RUN * speedMul() * (speedT > 0 ? 1.32 : 1);
    if (keyL) { player.vx -= accel * dt; player.facing = -1; }
    if (keyR) { player.vx += accel * dt; player.facing = 1; }
    player.vx = clamp(player.vx, -maxV, maxV);

    if (grounded) {
      var fric = ICE_FRICTION;
      // grip upgrade tightens friction when not holding move
      if (!keyL && !keyR) {
        fric = Math.pow(ICE_FRICTION, 1 + upgLevel("grip") * 0.55);
        // convert gripMul into stronger stop: lower effective friction base
        var stop = Math.pow(0.94 * gripMul(), dt * 60);
        // blend: more upgrades = more stop when idle
        player.vx *= Math.pow(fric, dt * 60) * (1 - upgLevel("grip") * 0.02);
        if (upgLevel("grip") > 0) player.vx *= Math.pow(0.97, upgLevel("grip") * dt * 20);
      } else {
        player.vx *= Math.pow(fric, dt * 60 * 0.15);
      }
      if (groundPlat && groundPlat.type === "peel") {
        player.vx *= Math.pow(0.992, dt * 60);
      }
      if (groundPlat && groundPlat.type === "block" && !keyL && !keyR) {
        player.vx *= Math.pow(0.86, dt * 60);
      }
      // ride moving platforms
      if (groundPlat && groundPlat.type === "move") {
        player.x += groundPlat.vx * dt;
      }
    } else {
      player.vx *= Math.pow(AIR_DRAG, dt * 60);
    }

    if (jumpPressed) { jumpBuf = JUMP_BUF; jumpPressed = false; }
    if (jumpBuf > 0) jumpBuf -= dt;
    if (coyoteT > 0) coyoteT -= dt;
    if (wallCoyote > 0) wallCoyote -= dt;

    var canJump = grounded || coyoteT > 0;
    if (jumpBuf > 0 && canJump) {
      var jv = JUMP_V * jumpMul() * (superJumpT > 0 ? 1.3 : 1);
      player.vy = jv;
      grounded = false;
      groundPlat = null;
      coyoteT = 0;
      jumpBuf = 0;
      jumpHoldT = 0.17;
      player.squish = 1.18;
      player.stretch = 0.78;
      sfxJump(combo);
      burst(player.x + PW / 2, player.y + PH, "#f5d041", 8, "peel");
    } else if (jumpBuf > 0 && (onWall || wallCoyote > 0)) {
      var dir = onWall || wallCoyoteSide;
      player.vx = -dir * WALL_JUMP_X * (0.95 + upgLevel("jump") * 0.03);
      player.vy = WALL_JUMP_Y * jumpMul() * (superJumpT > 0 ? 1.15 : 1);
      player.facing = -dir;
      onWall = 0; wallCoyote = 0; jumpBuf = 0;
      grounded = false; groundPlat = null;
      jumpHoldT = 0.1;
      sfxWall();
      burst(player.x + PW / 2, player.y + PH / 2, getWorld().palette.ice, 12);
      if (combo >= 1) addCombo(false);
    }

    // variable jump height
    if (jumpHoldT > 0) {
      jumpHoldT -= dt;
      if (keyJ && player.vy < 0) {
        player.vy += -380 * jumpMul() * dt;
      }
    }

    // gravity
    var g = GRAVITY;
    if (floatT > 0 && player.vy > 0) g *= 0.32;
    if (onWall && player.vy > 0) {
      player.vy = Math.min(player.vy, WALL_SLIDE);
    }
    player.vy += g * dt;
    player.vy = Math.min(player.vy, MAX_FALL * (floatT > 0 ? 0.55 : 1));

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // walls
    onWall = 0;
    if (player.x < 8) {
      player.x = 8;
      if (player.vx < 0) player.vx = 0;
      if (!grounded && player.vy > 0) { onWall = -1; wallCoyote = 0.12; wallCoyoteSide = -1; }
    }
    if (player.x + PW > W - 8) {
      player.x = W - 8 - PW;
      if (player.vx > 0) player.vx = 0;
      if (!grounded && player.vy > 0) { onWall = 1; wallCoyote = 0.12; wallCoyoteSide = 1; }
    }

    // platforms
    grounded = false;
    groundPlat = null;
    for (var i = 0; i < plats.length; i++) {
      var p = plats[i];
      if (p.type === "move" && !p.broken) {
        p.x += p.vx * dt;
        if (p.x < p.x0 - p.range || p.x + p.w > p.x0 + p.w + p.range) p.vx *= -1;
        p.x = clamp(p.x, 10, W - p.w - 10);
      }
      if (p.type === "crumble" && p.crumble >= 0 && !p.broken) {
        p.crumble += dt;
        if (p.crumble > 0.55) {
          p.broken = true;
          burst(p.x + p.w / 2, p.y, "#fbbf24", 12, "peel");
        }
      }
      if (!p.broken) tryLand(p, prevY);
    }

    // coins
    var magR = (magnetT > 0 ? 130 : 0) + magnetBonus();
    for (var ci = 0; ci < coins.length; ci++) {
      var c = coins[ci];
      if (c.got) continue;
      var cx = player.x + PW / 2, cy = player.y + PH / 2;
      var dx = c.x - cx, dy = c.y - cy;
      var d2 = dx * dx + dy * dy;
      if (magR > 0 && d2 < magR * magR) {
        var d = Math.sqrt(d2) || 1;
        c.x -= (dx / d) * 280 * dt;
        c.y -= (dy / d) * 280 * dt;
      }
      if (Math.abs(c.x - cx) < c.r + PW * 0.35 && Math.abs(c.y - cy) < c.r + PH * 0.4) {
        c.got = true;
        var val = c.value || 1;
        coinsGot += val;
        score += Math.floor(25 * val * getWorld().scoreMul);
        sfxCoin();
        burst(c.x, c.y, c.gold ? "#fef08a" : "#f5d041", c.gold ? 14 : 8);
        if (c.gold) floatTxt(c.x, c.y - 10, "GOLD!", "#fef08a", 15);
      }
    }

    // powers
    for (var pi = 0; pi < powers.length; pi++) {
      var pw = powers[pi];
      if (pw.got) continue;
      if (Math.abs(pw.x - (player.x + PW / 2)) < 22 && Math.abs(pw.y - (player.y + PH / 2)) < 26) {
        pw.got = true;
        sfxPower();
        confetti(pw.x, pw.y);
        if (pw.kind === "jump") { superJumpT = Math.max(superJumpT, 7); floatTxt(pw.x, pw.y, "Super jump", "#f5d041", 13); }
        if (pw.kind === "shield") { shieldT = Math.max(shieldT, 8); floatTxt(pw.x, pw.y, "Shield", "#67e8f9", 13); }
        if (pw.kind === "float") { floatT = Math.max(floatT, 6); floatTxt(pw.x, pw.y, "Float", "#c4b5fd", 13); }
        if (pw.kind === "magnet") { magnetT = Math.max(magnetT, 8); floatTxt(pw.x, pw.y, "Magnet", "#fbbf24", 13); }
        if (pw.kind === "speed") { speedT = Math.max(speedT, 6); floatTxt(pw.x, pw.y, "Speed", "#86efac", 13); }
      }
    }

    // hazards
    for (var hi = 0; hi < hazards.length; hi++) {
      var hz = hazards[hi];
      hz.y += hz.vy * dt;
      hz.rot += dt * 4;
      var px = player.x + PW / 2, py = player.y + PH / 2;
      var hdx = hz.x - px, hdy = hz.y - py;
      if (hdx * hdx + hdy * hdy < (hz.r + 14) * (hz.r + 14)) {
        if (shieldT > 0 || invulnT > 0) {
          hz.y = camY + H + 200;
          burst(hz.x, hz.y, "#67e8f9", 10);
        } else {
          combo = 0; comboTimer = 0; showCombo();
          invulnT = 1;
          flash = 0.35;
          camShake = 0.4;
          player.vy = Math.min(player.vy, JUMP_V * 0.4);
          burst(px, py, "#f87171", 16);
          beep(100, 0.12, "sawtooth", 0.04);
        }
      }
    }
    spawnSnowball();

    // height / score from climb
    var height = Math.max(0, (startY - player.y) / 40);
    if (height > maxHeight) {
      var gain = height - maxHeight;
      maxHeight = height;
      score += Math.floor(gain * 10 * getWorld().scoreMul);
    }

    // camera — show more above player for bigger view
    var targetCam = player.y - H * 0.55;
    if (targetCam < camY) camY += (targetCam - camY) * Math.min(1, dt * 6);
    // gentle follow down only if far (but death is below screen)
    if (player.y > camY + H * 0.78) {
      camY += (player.y - H * 0.62 - camY) * Math.min(1, dt * 2.5);
    }

    ensurePlats();

    // win condition
    var world = getWorld();
    if (!endlessMode && world.goal > 0 && maxHeight >= world.goal && !won) {
      winGame();
      return;
    }

    // death — fell below view
    if (player.y > camY + H + 30) {
      endGame();
      return;
    }

    // squash recovery
    player.squish += (1 - player.squish) * Math.min(1, dt * 10);
    player.stretch += (1 - player.stretch) * Math.min(1, dt * 10);

    updateVfx(dt);
    updateHud();
  }

  function updateVfx(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt;
      if (p.age >= p.life) particles.splice(i, 1);
    }
    for (var j = floats.length - 1; j >= 0; j--) {
      var f = floats[j];
      f.age += dt;
      f.y -= 28 * dt;
      if (f.age >= f.life) floats.splice(j, 1);
    }
    for (var s = 0; s < snow.length; s++) {
      snow[s].y += snow[s].sp * dt;
      snow[s].x += Math.sin(animT + snow[s].ph) * 12 * dt;
      if (snow[s].y > H + 10) { snow[s].y = -10; snow[s].x = Math.random() * W; }
    }
  }

  // ── Draw ──
  function draw() {
    var world = getWorld();
    var pal = world.palette;
    var shx = camShake > 0 ? (Math.random() - 0.5) * 10 * camShake : 0;
    var shy = camShake > 0 ? (Math.random() - 0.5) * 10 * camShake : 0;

    // sky
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky0);
    g.addColorStop(1, pal.sky1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // stars / atmosphere
    ctx.save();
    for (var si = 0; si < stars.length; si++) {
      var st = stars[si];
      var a = 0.25 + 0.35 * Math.sin(animT * 2 + st.ph);
      ctx.globalAlpha = a;
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      ctx.arc(st.x, (st.y + animT * 3) % H, st.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // soft fog bands
    ctx.fillStyle = pal.fog;
    for (var band = 0; band < 5; band++) {
      var by = ((-camY * 0.15 + band * 180 + animT * 8) % (H + 100)) - 50;
      ctx.fillRect(0, by, W, 60);
    }

    // snow
    ctx.fillStyle = "rgba(224,242,254,0.55)";
    for (var sn = 0; sn < snow.length; sn++) {
      ctx.beginPath();
      ctx.arc(snow[sn].x, snow[sn].y, snow[sn].s, 0, Math.PI * 2);
      ctx.fill();
    }

    // side walls (tower edges)
    var wallG = ctx.createLinearGradient(0, 0, 28, 0);
    wallG.addColorStop(0, "rgba(255,255,255,0.06)");
    wallG.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wallG;
    ctx.fillRect(0, 0, 28, H);
    var wallG2 = ctx.createLinearGradient(W, 0, W - 28, 0);
    wallG2.addColorStop(0, "rgba(255,255,255,0.06)");
    wallG2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wallG2;
    ctx.fillRect(W - 28, 0, 28, H);

    ctx.save();
    ctx.translate(shx, shy - camY);

    // platforms
    for (var i = 0; i < plats.length; i++) {
      drawPlat(plats[i], pal);
    }

    // coins
    for (var ci = 0; ci < coins.length; ci++) {
      var c = coins[ci];
      if (c.got) continue;
      var bob = Math.sin(animT * 4 + c.phase) * 3;
      ctx.save();
      ctx.translate(c.x, c.y + bob);
      if (c.gold) {
        ctx.shadowColor = "#f5d041";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#fef08a";
      } else {
        ctx.fillStyle = "#f5d041";
      }
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#1a1400";
      ctx.font = "bold " + (c.gold ? 11 : 9) + "px Fredoka,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.gold ? "★" : "B", 0, 1);
      ctx.restore();
    }

    // powers
    for (var pi = 0; pi < powers.length; pi++) {
      var pw = powers[pi];
      if (pw.got) continue;
      var bob2 = Math.sin(animT * 3.5 + pw.phase) * 4;
      var icons = { jump: "↑", shield: "🛡", float: "☁", magnet: "🧲", speed: "⚡" };
      ctx.save();
      ctx.translate(pw.x, pw.y + bob2);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.arc(0, 0, pw.r + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = "14px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icons[pw.kind] || "?", 0, 1);
      ctx.restore();
    }

    // hazards
    for (var hi = 0; hi < hazards.length; hi++) {
      var hz = hazards[hi];
      ctx.save();
      ctx.translate(hz.x, hz.y);
      ctx.rotate(hz.rot);
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      ctx.arc(0, 0, hz.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(125,211,252,0.5)";
      ctx.beginPath();
      ctx.arc(-3, -3, hz.r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // player MonKey
    drawMonkey();

    // particles / floats in world space
    for (var pi2 = 0; pi2 < particles.length; pi2++) {
      var pr = particles[pi2];
      var life = 1 - pr.age / pr.life;
      ctx.globalAlpha = life;
      ctx.fillStyle = pr.color;
      if (pr.kind === "peel") {
        ctx.fillRect(pr.x, pr.y, pr.size * 1.5, pr.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.size * life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    for (var fi = 0; fi < floats.length; fi++) {
      var ft = floats[fi];
      var fl = 1 - ft.age / ft.life;
      ctx.globalAlpha = fl;
      ctx.fillStyle = ft.color;
      ctx.font = "600 " + ft.size + "px Fredoka,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // goal marker on side
    if (!endlessMode && getWorld().goal > 0) {
      var goalY = startY - getWorld().goal * 40;
      var gy = goalY - camY + shy;
      if (gy > -20 && gy < H + 20) {
        ctx.strokeStyle = "rgba(245,208,65,0.45)";
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(20, gy);
        ctx.lineTo(W - 20, gy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(245,208,65,0.85)";
        ctx.font = "600 12px Fredoka,sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("SUMMIT " + getWorld().goal + "m", W - 28, gy - 6);
      }
    }

    // flash
    if (flash > 0) {
      ctx.fillStyle = "rgba(248,113,113," + (flash * 0.35) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    // elegant vignette
    var vig = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, H * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // menu idle preview monkey on floor
    if (state === "menu") {
      // subtle title shimmer already in CSS; draw soft peels in bg
    }
  }

  function drawPlat(p, pal) {
    if (p.broken) return;
    var y = p.y;
    var crumple = p.type === "crumble" && p.crumble >= 0 ? Math.min(1, p.crumble / 0.55) : 0;
    ctx.save();
    if (crumple > 0) {
      ctx.globalAlpha = 1 - crumple * 0.5;
      ctx.translate(0, crumple * 4);
    }
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    roundRect(p.x + 2, y + 4, p.w, p.h, 6);
    ctx.fill();

    var col = pal.ice;
    if (p.type === "peel") col = "#f5d041";
    if (p.type === "block") col = "#94a3b8";
    if (p.type === "spring") col = "#86efac";
    if (p.type === "crumble") col = "#fdba74";
    if (p.type === "move") col = "#c4b5fd";

    var pg = ctx.createLinearGradient(p.x, y, p.x, y + p.h);
    pg.addColorStop(0, col);
    pg.addColorStop(1, shade(col, 0.75));
    ctx.fillStyle = pg;
    ctx.beginPath();
    roundRect(p.x, y, p.w, p.h, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(p.x + 6, y + 2, p.w - 12, 3);

    if (p.spike) {
      ctx.fillStyle = "#f87171";
      var spikes = Math.max(2, Math.floor(p.w / 16));
      for (var s = 0; s < spikes; s++) {
        var sx = p.x + 10 + s * (p.w - 20) / Math.max(1, spikes - 1);
        ctx.beginPath();
        ctx.moveTo(sx - 5, y);
        ctx.lineTo(sx, y - 10);
        ctx.lineTo(sx + 5, y);
        ctx.fill();
      }
    }
    if (p.type === "spring") {
      ctx.fillStyle = "#166534";
      ctx.fillRect(p.x + p.w * 0.35, y - 6, p.w * 0.3, 6);
    }
    ctx.restore();
  }

  function shade(hex, f) {
    // simple darken for known hex
    if (hex[0] !== "#") return hex;
    var n = parseInt(hex.slice(1), 16);
    var r = ((n >> 16) & 255) * f | 0;
    var g = ((n >> 8) & 255) * f | 0;
    var b = (n & 255) * f | 0;
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawMonkey() {
    var cx = player.x + PW / 2;
    var cy = player.y + PH / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(player.facing * player.stretch, player.squish);
    // invuln blink
    if (invulnT > 0 && Math.floor(animT * 20) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }
    // shield
    if (shieldT > 0) {
      ctx.strokeStyle = "rgba(103,232,249,0.65)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
    }
    // body
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4a3018";
    ctx.beginPath();
    ctx.arc(0, 6, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c9a06a";
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3b2a1a";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // ears
    ctx.fillStyle = "#c4a574";
    ctx.beginPath();
    ctx.arc(-12, -6, 5, 0, Math.PI * 2);
    ctx.arc(12, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-4, -3, 3.2, 0, Math.PI * 2);
    ctx.arc(4, -3, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(-3.5 + player.facing * 0.5, -3, 1.5, 0, Math.PI * 2);
    ctx.arc(4.5 + player.facing * 0.5, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // smile
    ctx.beginPath();
    ctx.arc(0, 2, 4, 0.15, Math.PI - 0.15);
    ctx.strokeStyle = "#3b2a1a";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // banana hat flair
    ctx.font = "14px serif";
    ctx.textAlign = "center";
    ctx.fillText("🍌", 0, -16);
    ctx.restore();
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    // fixed-ish substeps for physics stability
    var steps = dt > 0.02 ? 2 : 1;
    var sdt = dt / steps;
    for (var i = 0; i < steps; i++) update(sdt);
    draw();
    requestAnimationFrame(loop);
  }

  // ── Hub UI ──
  function setHubTab(which) {
    document.querySelectorAll(".hub-tab").forEach(function (t) {
      var on = t.getAttribute("data-hub") === which;
      t.classList.toggle("on", on);
    });
    var map = { levels: "hubLevels", upgrades: "hubUpgrades", board: "hubBoard" };
    Object.keys(map).forEach(function (k) {
      var el = document.getElementById(map[k]);
      if (el) el.classList.toggle("hidden", k !== which);
    });
  }

  function refreshHub() {
    ensureUnlocks();
    var meta = document.getElementById("menuMeta");
    if (meta) {
      meta.innerHTML =
        "<span>Bank <b>" + (progress.bank | 0) + "</b> BAN</span>" +
        "<span>Best <b>" + (progress.bestHeight | 0) + "</b>m</span>" +
        "<span>Score <b>" + (progress.bestScore | 0) + "</b></span>";
    }

    var levelsEl = document.getElementById("hubLevels");
    if (levelsEl) {
      var html = '<div class="level-grid">';
      for (var i = 0; i < WORLDS.length; i++) {
        var w = WORLDS[i];
        var open = isWorldUnlocked(w);
        var on = selectedWorld === w.id;
        var best = progress.levelBest[w.id];
        var cleared = !!progress.cleared[w.id];
        html += '<button type="button" class="level-card' + (on ? " on" : "") + '"' +
          (open ? "" : " disabled") + ' data-world="' + w.id + '">' +
          '<div class="lc-top"><span class="lc-ico">' + w.icon + "</span>" + w.name +
          (cleared ? " ✓" : "") + "</div>" +
          '<div class="lc-desc">' + (open ? w.tagline : "Unlock at " + w.unlock + "m best height") + "</div>" +
          '<div class="lc-best">' +
          (w.endless ? "Endless" : "Goal " + w.goal + "m") +
          (best ? " · Best " + (best.height | 0) + "m" : "") +
          "</div></button>";
      }
      html += "</div>";
      levelsEl.innerHTML = html;
      levelsEl.querySelectorAll(".level-card").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          selectedWorld = btn.getAttribute("data-world");
          progress.lastWorld = selectedWorld;
          saveProgress(false);
          refreshHub();
          refreshSide();
        });
      });
    }

    var upEl = document.getElementById("hubUpgrades");
    if (upEl) {
      var uh = '<div class="upgrade-list">';
      for (var u = 0; u < UPGRADE_DEFS.length; u++) {
        var def = UPGRADE_DEFS[u];
        var lv = upgLevel(def.id);
        var cost = upgCost(def);
        var maxed = cost == null;
        uh += '<div class="upgrade-row">' +
          "<div><div class='u-name'>" + def.icon + " " + def.name + "</div>" +
          "<div class='u-desc'>" + def.desc + "</div>" +
          "<div class='u-lvl'>Level " + lv + "/" + def.max + "</div></div>" +
          "<button type='button' data-upg='" + def.id + "'" + (maxed || progress.bank < cost ? " disabled" : "") + ">" +
          (maxed ? "Max" : cost + " BAN") + "</button></div>";
      }
      uh += "</div>";
      upEl.innerHTML = uh;
      upEl.querySelectorAll("button[data-upg]").forEach(function (b) {
        b.addEventListener("click", function () { buyUpgrade(b.getAttribute("data-upg")); });
      });
    }

    var boardEl = document.getElementById("hubBoard");
    if (boardEl) {
      if (!progress.leaderboard.length) {
        boardEl.innerHTML = '<div class="empty-hint">No climbs yet. Touch the sky.</div>';
      } else {
        var bh = '<div class="lb-list">';
        for (var li = 0; li < progress.leaderboard.length; li++) {
          var e = progress.leaderboard[li];
          var wn = WORLD_BY_ID[e.world] ? WORLD_BY_ID[e.world].name : e.world;
          bh += '<div class="lb-row"><span class="rank">#' + (li + 1) + "</span>" +
            "<div><div>" + wn + (e.win ? " · Clear" : "") + "</div>" +
            '<div class="meta">' + (e.height | 0) + "m · combo ×" + (e.combo | 0) + "</div></div>" +
            '<span class="score">' + (e.score | 0) + "</span></div>";
        }
        bh += "</div>";
        boardEl.innerHTML = bh;
      }
    }
  }

  function refreshSide() {
    var b = document.getElementById("sideBank");
    var h = document.getElementById("sideBestH");
    var s = document.getElementById("sideBestS");
    var w = document.getElementById("sideWorlds");
    var d = document.getElementById("sideWorldDesc");
    if (b) b.textContent = String(progress.bank | 0);
    if (h) h.textContent = (progress.bestHeight | 0) + "m";
    if (s) s.textContent = String(progress.bestScore | 0);
    if (w) w.textContent = progress.unlocked.length + "/" + WORLDS.length;
    var world = getWorld();
    if (d) d.textContent = world.name + " — " + world.tagline +
      (world.endless ? " No goal height." : " Summit at " + world.goal + "m.");
  }

  // Input
  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") { keyL = true; e.preventDefault(); }
    if (k === "ArrowRight" || k === "d" || k === "D") { keyR = true; e.preventDefault(); }
    if (k === " " || k === "ArrowUp" || k === "w" || k === "W") {
      if (!keyJ) jumpPressed = true;
      keyJ = true;
      e.preventDefault();
      ensureAudio();
    }
    if (k === "p" || k === "P" || k === "Escape") {
      if (state === "play") pauseGame();
      else if (state === "pause") resumeGame();
    }
  });
  window.addEventListener("keyup", function (e) {
    var k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") keyL = false;
    if (k === "ArrowRight" || k === "d" || k === "D") keyR = false;
    if (k === " " || k === "ArrowUp" || k === "w" || k === "W") keyJ = false;
  });

  function bindTouch(id, down, up) {
    var el = document.getElementById(id);
    if (!el) return;
    var start = function (e) { e.preventDefault(); ensureAudio(); down(); };
    var end = function (e) { e.preventDefault(); up(); };
    el.addEventListener("touchstart", start, { passive: false });
    el.addEventListener("touchend", end, { passive: false });
    el.addEventListener("touchcancel", end, { passive: false });
    el.addEventListener("mousedown", start);
    el.addEventListener("mouseup", end);
    el.addEventListener("mouseleave", end);
  }
  bindTouch("touchL", function () { keyL = true; }, function () { keyL = false; });
  bindTouch("touchR", function () { keyR = true; }, function () { keyR = false; });
  bindTouch("touchJ", function () { if (!keyJ) jumpPressed = true; keyJ = true; }, function () { keyJ = false; });

  // Buttons
  document.getElementById("btnPlay").addEventListener("click", function () { startGame(false); });
  document.getElementById("btnHow").addEventListener("click", function () { showOnly(howOv); });
  document.getElementById("btnHowBack").addEventListener("click", function () { showOnly(menuOv); });
  document.getElementById("btnResume").addEventListener("click", resumeGame);
  document.getElementById("btnPauseMenu").addEventListener("click", goMenu);
  document.getElementById("btnRetry").addEventListener("click", function () { startGame(endlessMode); });
  document.getElementById("btnOverMenu").addEventListener("click", goMenu);
  document.getElementById("btnWinMenu").addEventListener("click", goMenu);
  document.getElementById("btnWinEndless").addEventListener("click", function () { startGame(true); });

  document.querySelectorAll(".hub-tab").forEach(function (t) {
    t.addEventListener("click", function () { setHubTab(t.getAttribute("data-hub")); });
  });

  document.getElementById("btnExport").addEventListener("click", exportProgress);
  document.getElementById("btnImport").addEventListener("click", function () {
    document.getElementById("importFile").click();
  });
  document.getElementById("importFile").addEventListener("change", function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var ok = importProgress(String(reader.result || ""));
      if (saveStatusEl) saveStatusEl.textContent = ok ? "Imported" : "Import failed";
    };
    reader.readAsText(file);
    this.value = "";
  });
  document.getElementById("btnReset").addEventListener("click", function () {
    if (!confirm("Reset all climb progress, upgrades, and scores on this device?")) return;
    progress = defaultProgress();
    selectedWorld = "grove";
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(SAVE_BAK);
    } catch (e) {}
    saveProgress(true);
    refreshHub();
    refreshSide();
  });

  // Boot
  loadProgress();
  // migrate old tower key bank soft bonus if new
  try {
    var legacy = localStorage.getItem("bx-potassium-tower-v1");
    if (legacy && !(progress.runs > 0) && progress.bank === 0) {
      var lo = JSON.parse(legacy);
      if (lo && lo.bestHeight) {
        progress.bestHeight = Math.max(progress.bestHeight, lo.bestHeight | 0);
        progress.bestScore = Math.max(progress.bestScore, lo.bestScore | 0);
        progress.bestCombo = Math.max(progress.bestCombo, lo.bestCombo | 0);
        progress.bank = Math.min(200, Math.floor((lo.bestHeight | 0) / 2));
        ensureUnlocks();
        saveProgress(false);
      }
    }
  } catch (e) {}

  refreshHub();
  refreshSide();
  setHubTab("levels");
  initDecor();
  // draw idle frame
  camY = 0;
  seedWorld();
  requestAnimationFrame(loop);
})();
