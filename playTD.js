(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════
  // BANANO TD — Extreme Banana Defense
  // Layered bananas, 5-tier MonKeys, Starship-scale campaign
  // ═══════════════════════════════════════════════════════════

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d", { alpha: false });
  var W = canvas.width, H = canvas.height;
  var COLS = 21, ROWS = 13;
  var TW = W / COLS, TH = H / ROWS;
  var TWO_PI = Math.PI * 2;

  // DOM
  var hudBan = document.getElementById("hudBan");
  var hudLives = document.getElementById("hudLives");
  var hudWave = document.getElementById("hudWave");
  var hudPops = document.getElementById("hudPops");
  var shopEl = document.getElementById("shop");
  var selBox = document.getElementById("selBox");
  var btnUp = document.getElementById("btnUp");
  var btnSell = document.getElementById("btnSell");
  var btnWave = document.getElementById("btnWave");
  var btnPause = document.getElementById("btnPause");
  var toast = document.getElementById("toast");
  var startOv = document.getElementById("startOv");
  var winOv = document.getElementById("winOv");
  var loseOv = document.getElementById("loseOv");
  var pauseOv = document.getElementById("pauseOv");
  var hudWaveMax = document.getElementById("hudWaveMax");

  // Path — Potassium Canyon Trail
  var PATH_CELLS = [
    [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[5,5],[5,4],[5,3],[5,2],
    [6,2],[7,2],[8,2],[9,2],[10,2],[10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9],
    [11,9],[12,9],[13,9],[14,9],[14,8],[14,7],[14,6],[14,5],[14,4],[14,3],
    [15,3],[16,3],[17,3],[18,3],[18,4],[18,5],[18,6],[18,7],[18,8],[18,9],[18,10],
    [19,10],[20,10]
  ];
  var pathSet = {};
  var waypoints = [];
  for (var i = 0; i < PATH_CELLS.length; i++) {
    var pc = PATH_CELLS[i][0], pr = PATH_CELLS[i][1];
    pathSet[pc + "," + pr] = true;
    waypoints.push({ x: pc * TW + TW / 2, y: pr * TH + TH / 2 });
  }
  var pathLen = 0;
  var segLens = [0];
  for (var s = 1; s < waypoints.length; s++) {
    var dx = waypoints[s].x - waypoints[s - 1].x;
    var dy = waypoints[s].y - waypoints[s - 1].y;
    pathLen += Math.sqrt(dx * dx + dy * dy);
    segLens.push(pathLen);
  }

  // ── Banana layers (outer peel → inner) ──
  // Pop chain: star → purple → gold → ripe → green → gone
  var LAYERS = {
    green:  { id: "green",  name: "Unripe",   next: null,     r: 12, color: "#86efac", stroke: "#166534", tip: "#bbf7d0", value: 1, speed: 52 },
    ripe:   { id: "ripe",   name: "Ripe",     next: "green",  r: 13, color: "#facc15", stroke: "#a16207", tip: "#fef08a", value: 2, speed: 62 },
    gold:   { id: "gold",   name: "Golden",   next: "ripe",   r: 14, color: "#f59e0b", stroke: "#92400e", tip: "#fde68a", value: 3, speed: 74 },
    purple: { id: "purple", name: "Meme",     next: "gold",   r: 15, color: "#c084fc", stroke: "#6b21a8", tip: "#e9d5ff", value: 4, speed: 90 },
    star:   { id: "star",   name: "Cosmic",   next: "purple", r: 16, color: "#f472b6", stroke: "#9d174d", tip: "#fbcfe8", value: 5, speed: 108 }
  };
  var LAYER_ORDER = ["green", "ripe", "gold", "purple", "star"];

  // ── Towers · 5-tier upgrade paths ──
  var TOWER_DEFS = [
    {
      id: "dart", name: "Dart MonKey", icon: "🐵", role: "Primary",
      desc: "Rapid banana darts. Backbone of every defense.",
      cost: 175, range: 125, rof: 0.48, pierce: 1, pop: 1, splash: 0, slow: 0,
      camo: false, lead: false, color: "#f5d041",
      upCost: [120, 220, 400, 750, 1400],
      ups: [
        { name: "Sharp Tips", desc: "+pierce, snappier", pierce: 1, rof: -0.06 },
        { name: "Razor Rinds", desc: "+pop, +range", pop: 1, range: 18 },
        { name: "Twin Peel", desc: "Double shot", multishot: 1, pierce: 1 },
        { name: "Jungle Barrage", desc: "Faster triple stream", multishot: 1, rof: -0.1, pierce: 1 },
        { name: "Potassium Storm", desc: "Quad darts, shreds packs", multishot: 1, pop: 1, pierce: 2, range: 25 }
      ]
    },
    {
      id: "boomer", name: "Boomer K⁺", icon: "🪃", role: "Mid",
      desc: "Returning potassium blades — cleaves whole lines.",
      cost: 300, range: 105, rof: 0.88, pierce: 5, pop: 1, splash: 0, slow: 0,
      camo: false, lead: false, color: "#fb923c", boomerang: true,
      upCost: [180, 340, 620, 1100, 2000],
      ups: [
        { name: "Wide Arc", desc: "+3 pierce", pierce: 3 },
        { name: "K-Rang", desc: "+pop & pierce", pop: 1, pierce: 2 },
        { name: "Glaive Lord", desc: "Faster returns", pierce: 3, rof: -0.18, pop: 1 },
        { name: "Orbit Blades", desc: "Twin rangs", multishot: 1, pierce: 2 },
        { name: "MOAB Cleaver", desc: "Boss-shred orbit", pierce: 6, pop: 2, range: 30, lead: true }
      ]
    },
    {
      id: "sniper", name: "Sniper MonKey", icon: "🎯", role: "Support",
      desc: "Long-range. Sees camo. Cracks armor later.",
      cost: 350, range: 280, rof: 1.05, pierce: 1, pop: 2, splash: 0, slow: 0,
      camo: true, lead: false, color: "#86efac", preferStrong: true,
      upCost: [200, 420, 800, 1500, 2800],
      ups: [
        { name: "Night Scope", desc: "Faster aim", rof: -0.22, range: 20 },
        { name: "Armor Piercer", desc: "Pops lead + power", lead: true, pop: 2 },
        { name: "Elite Marksman", desc: "Shreds layers", pop: 3, rof: -0.18, range: 30 },
        { name: "Deadeye", desc: "Massive pop power", pop: 4, pierce: 2 },
        { name: "Orbital Strike", desc: "Starship sniper", pop: 8, pierce: 3, rof: -0.15, range: 40 }
      ]
    },
    {
      id: "bomb", name: "Bomb MonKey", icon: "💣", role: "Military",
      desc: "Peel grenades. Natural lead-pop splash.",
      cost: 520, range: 115, rof: 1.15, pierce: 1, pop: 1, splash: 58, slow: 0,
      camo: false, lead: true, color: "#f97316",
      upCost: [280, 550, 1000, 1800, 3200],
      ups: [
        { name: "Bigger Bombs", desc: "+splash & pop", splash: 18, pop: 1 },
        { name: "Cluster Peels", desc: "Faster volleys", rof: -0.28, pop: 1, splash: 12 },
        { name: "MOAB Mauler", desc: "Boss AOE", pop: 3, splash: 22, range: 20 },
        { name: "Carpet Bomb", desc: "Wide destruction", splash: 30, pop: 2, multishot: 1 },
        { name: "Starship Salvo", desc: "Orbital peel warheads", pop: 4, splash: 40, range: 35, rof: -0.2 }
      ]
    },
    {
      id: "ice", name: "Chill MonKey", icon: "🧊", role: "Magic",
      desc: "Frost-potassium aura slows the swarm.",
      cost: 380, range: 100, rof: 1.25, pierce: 1, pop: 0, splash: 75, slow: 0.5,
      camo: false, lead: false, color: "#67e8f9", freezePulse: true,
      upCost: [220, 450, 800, 1400, 2500],
      ups: [
        { name: "Permafrost", desc: "Harder slow", slow: 0.12, splash: 12 },
        { name: "Ice Shards", desc: "Slow + pops", pop: 1, splash: 10 },
        { name: "Absolute Zero", desc: "Deep freeze", slow: 0.15, splash: 25, rof: -0.3, pop: 1 },
        { name: "Cryo Field", desc: "Camo chill + range", camo: true, range: 25, slow: 0.08 },
        { name: "Nitrogen Core", desc: "Pack freezes solid", slow: 0.12, splash: 35, pop: 2, rof: -0.25, lead: true }
      ]
    },
    {
      id: "village", name: "Jungle Village", icon: "🏠", role: "Support",
      desc: "Buffs nearby MonKeys. Fuels airdrops.",
      cost: 900, range: 135, rof: 99, pierce: 0, pop: 0, splash: 0, slow: 0,
      camo: false, lead: false, color: "#c084fc", support: true,
      upCost: [500, 1000, 1800, 3000, 5000],
      ups: [
        { name: "Jungle Drums", desc: "+12% attack speed", auraRof: 0.12 },
        { name: "Radar Scanner", desc: "Nearby camo detect", auraCamo: true, auraRof: 0.06, range: 15 },
        { name: "Monkey Commerce", desc: "Round income", income: 70, auraRof: 0.06 },
        { name: "War Council", desc: "Big speed aura", auraRof: 0.15, range: 25 },
        { name: "Potassium Exchange", desc: "Elite income + buffs", income: 140, auraRof: 0.12, auraCamo: true, range: 20 }
      ]
    },
    {
      id: "super", name: "Super MonKey", icon: "🦸", role: "Hero",
      desc: "Meme-powered multi-banana fury.",
      cost: 2200, range: 145, rof: 0.11, pierce: 1, pop: 1, splash: 0, slow: 0,
      camo: true, lead: true, color: "#f472b6", multishot: 1,
      upCost: [1200, 2500, 4800, 9000, 16000],
      ups: [
        { name: "Laser Eyes", desc: "Pierce + speed", pierce: 2, rof: -0.02 },
        { name: "Robo Super", desc: "Triple stream", multishot: 2, pop: 1 },
        { name: "Plasma Core", desc: "Splash plasma", multishot: 1, pierce: 2, pop: 1, splash: 22 },
        { name: "Tech Terror", desc: "Quad plasma storm", multishot: 2, pierce: 2, pop: 2, splash: 18 },
        { name: "Starship Avatar", desc: "Unmatched DPS", multishot: 3, pierce: 4, pop: 3, splash: 28, range: 40, rof: -0.03 }
      ]
    },
    {
      id: "battery", name: "Starship Battery", icon: "🚀", role: "Ultimate",
      desc: "Orbital rail — slow, brutal single-target erase.",
      cost: 4500, range: 300, rof: 1.8, pierce: 1, pop: 12, splash: 0, slow: 0,
      camo: true, lead: true, color: "#38bdf8", preferStrong: true, rail: true,
      upCost: [2500, 5000, 9000, 15000, 25000],
      ups: [
        { name: "Capacitor Bank", desc: "Faster charge", rof: -0.35 },
        { name: "Rail Expansion", desc: "Pierce through packs", pierce: 3, pop: 4 },
        { name: "Cluster Warhead", desc: "Splash on impact", splash: 40, pop: 4 },
        { name: "Multi-Vector", desc: "Twin rails", multishot: 1, pierce: 2, pop: 4 },
        { name: "Full Stack Raptor", desc: "Starship delete button", multishot: 2, pierce: 4, pop: 10, splash: 50, rof: -0.4, range: 40 }
      ]
    }
  ];
  var TOWER_BY_ID = {};
  for (var ti = 0; ti < TOWER_DEFS.length; ti++) TOWER_BY_ID[TOWER_DEFS[ti].id] = TOWER_DEFS[ti];
  var MAX_TIER = 5;

  // State
  var MAX_WAVE = 80;
  var START_BAN = 750;
  var START_LIVES = 250;
  var ban = START_BAN, lives = START_LIVES, wave = 0, pops = 0, banEarned = 0;
  var running = false, paused = false, gameOver = false;
  var speed = 1;
  var selectedShop = "dart";
  var selectedTower = null;
  var towers = [];
  var threats = [];
  var projectiles = [];
  var particles = [];
  var floats = [];
  var decor = [];
  var spawnQueue = [];
  var spawnTimer = 0;
  var waveActive = false;
  var hover = null;
  var lastTs = 0;
  var animT = 0;
  var toastT = 0;
  var airdropT = 0;
  var totalBuilt = 0;
  var shake = 0;
  var mapCache = null;
  var mapDirty = true;
  var MAX_PARTICLES = 220;
  var MAX_FLOATS = 48;
  var quality = 1; // 1 normal, 0.5 reduced FX under load

  // Audio
  var actx = null;
  function ensureAudio() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (actx && actx.state === "suspended") actx.resume();
  }
  function beep(f, d, type, v) {
    if (!actx) return;
    var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = type || "square";
    o.frequency.value = f;
    g.gain.setValueAtTime(v || 0.035, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t + d + 0.02);
  }
  function sfxPop() { beep(520 + Math.random() * 380, 0.035, "square", 0.025); }
  function sfxPlace() { beep(320, 0.06, "triangle", 0.04); beep(480, 0.08, "triangle", 0.028); }
  function sfxUp() { beep(520, 0.05, "square", 0.035); beep(780, 0.1, "sine", 0.03); }
  function sfxWave() { beep(240, 0.1, "sawtooth", 0.03); beep(360, 0.12, "triangle", 0.025); }
  function sfxLeak() { beep(110, 0.18, "sawtooth", 0.045); }
  function sfxWin() { beep(523, 0.1, "square", 0.035); beep(659, 0.12, "square", 0.035); beep(784, 0.22, "triangle", 0.04); }
  function sfxBoss() { beep(80, 0.25, "sawtooth", 0.05); beep(160, 0.2, "square", 0.03); }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
  function isPath(c, r) { return !!pathSet[c + "," + r]; }
  function inBounds(c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function posAlong(distAlong) {
    distAlong = clamp(distAlong, 0, pathLen);
    for (var i = 1; i < segLens.length; i++) {
      if (distAlong <= segLens[i]) {
        var segStart = segLens[i - 1];
        var seg = segLens[i] - segStart;
        var t = seg > 0 ? (distAlong - segStart) / seg : 0;
        var a = waypoints[i - 1], b = waypoints[i];
        return {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          ang: Math.atan2(b.y - a.y, b.x - a.x)
        };
      }
    }
    var last = waypoints[waypoints.length - 1];
    return { x: last.x, y: last.y, ang: 0 };
  }

  function towerAt(c, r) {
    for (var i = 0; i < towers.length; i++) if (towers[i].c === c && towers[i].r === r) return towers[i];
    return null;
  }

  function burst(x, y, color, n) {
    n = Math.ceil(n * quality);
    if (particles.length > MAX_PARTICLES) n = Math.min(n, 3);
    for (var i = 0; i < n; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      var a = Math.random() * TWO_PI, s = 50 + Math.random() * 180;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
        life: 0.2 + Math.random() * 0.35, age: 0,
        color: color, size: 2 + Math.random() * 3.5,
        kind: Math.random() < 0.35 ? "peel" : "spark",
        rot: Math.random() * TWO_PI
      });
    }
  }

  function floatTxt(x, y, text, color, size) {
    if (floats.length >= MAX_FLOATS) floats.shift();
    floats.push({ x: x, y: y, text: text, color: color || "#ffe566", size: size || 13, life: 0.65, age: 0 });
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    toastT = 1.6;
  }

  function confettiBurst() {
    var n = Math.floor(40 * quality);
    for (var i = 0; i < n; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      particles.push({
        x: W * 0.5 + (Math.random() - 0.5) * 220,
        y: H * 0.32,
        vx: (Math.random() - 0.5) * 280,
        vy: -90 - Math.random() * 200,
        life: 0.7 + Math.random() * 0.5,
        age: 0,
        color: ["#f5d041", "#86efac", "#f472b6", "#67e8f9", "#fb923c", "#c084fc"][i % 6],
        size: 3 + Math.random() * 4,
        kind: "spark",
        rot: 0
      });
    }
  }

  function initDecor() {
    decor = [];
    for (var i = 0; i < 36; i++) {
      var c = (Math.random() * COLS) | 0, r = (Math.random() * ROWS) | 0;
      if (isPath(c, r)) continue;
      // keep clear of path neighbors slightly
      decor.push({
        x: c * TW + TW * 0.5 + (Math.random() - 0.5) * 10,
        y: r * TH + TH * 0.55,
        kind: Math.random() < 0.55 ? "tree" : "orb",
        phase: Math.random() * TWO_PI,
        scale: 0.85 + Math.random() * 0.4
      });
    }
    mapDirty = true;
  }

  function getStatsNoAura(t) {
    var d = t.def;
    var range = d.range, auraRof = 0, auraCamo = false, income = 0;
    for (var i = 0; i < t.tier; i++) {
      var u = d.ups[i];
      if (!u) continue;
      if (u.range) range += u.range;
      if (u.auraRof) auraRof += u.auraRof;
      if (u.auraCamo) auraCamo = true;
      if (u.income) income += u.income;
    }
    return { range: range, auraRof: auraRof, auraCamo: auraCamo, income: income };
  }

  function getStats(t) {
    var d = t.def;
    var range = d.range, rof = d.rof, pierce = d.pierce, pop = d.pop;
    var splash = d.splash, slow = d.slow, camo = d.camo, lead = d.lead;
    var multishot = d.multishot || 0;
    var auraRof = 0, auraCamo = false, income = 0;

    for (var i = 0; i < t.tier; i++) {
      var u = d.ups[i];
      if (!u) continue;
      if (u.range) range += u.range;
      if (u.rof) rof += u.rof;
      if (u.pierce) pierce += u.pierce;
      if (u.pop) pop += u.pop;
      if (u.splash) splash += u.splash;
      if (u.slow) slow += u.slow;
      if (u.camo) camo = true;
      if (u.lead) lead = true;
      if (u.multishot) multishot += u.multishot;
      if (u.auraRof) auraRof += u.auraRof;
      if (u.auraCamo) auraCamo = true;
      if (u.income) income += u.income;
    }
    var rofMul = 1;
    for (var j = 0; j < towers.length; j++) {
      var v = towers[j];
      if (!v.def.support || v === t) continue;
      var vs = getStatsNoAura(v);
      if (dist(t.x, t.y, v.x, v.y) <= vs.range) {
        rofMul += vs.auraRof;
        if (vs.auraCamo) camo = true;
      }
    }
    rof = Math.max(0.04, rof / rofMul);
    return {
      range: range, rof: rof, pierce: pierce, pop: Math.max(0, pop),
      splash: splash, slow: Math.min(0.92, slow), camo: camo, lead: lead,
      multishot: multishot, auraRof: auraRof, auraCamo: auraCamo, income: income
    };
  }

  function spentOn(t) {
    var s = t.def.cost;
    for (var i = 0; i < t.tier; i++) s += t.def.upCost[i];
    return s;
  }

  // ── Threats ──
  function makeLayerThreat(layerId, distAlong, flags) {
    flags = flags || {};
    var L = LAYERS[layerId] || LAYERS.green;
    return {
      kind: "layer", layer: L.id, dist: distAlong, x: 0, y: 0, ang: 0,
      r: L.r, speed: L.speed * (flags.speedMul || 1),
      camo: !!flags.camo, regrow: !!flags.regrow, lead: !!flags.lead,
      regrowT: 0, alive: true, hp: 1, maxHp: 1, value: L.value,
      freezeT: 0, slowMul: 1, wobble: Math.random() * TWO_PI, uid: Math.random()
    };
  }

  function makeSpecial(kind, distAlong, scale) {
    scale = scale || 1;
    if (kind === "ceramic") {
      return {
        kind: "ceramic", layer: null, dist: distAlong, x: 0, y: 0, ang: 0,
        r: 18, speed: 46, camo: false, regrow: false, lead: false,
        alive: true, hp: Math.floor(12 * scale), maxHp: Math.floor(12 * scale),
        value: 14, freezeT: 0, slowMul: 1, children: "star", childCount: 2,
        wobble: Math.random() * TWO_PI, uid: Math.random()
      };
    }
    if (kind === "boss") {
      return {
        kind: "boss", layer: null, dist: distAlong, x: 0, y: 0, ang: 0,
        r: 30, speed: 26, camo: false, regrow: false, lead: true,
        alive: true, hp: Math.floor(220 * scale), maxHp: Math.floor(220 * scale),
        value: 120, freezeT: 0, slowMul: 1, children: "ceramic", childCount: 4,
        wobble: Math.random() * TWO_PI, uid: Math.random()
      };
    }
    if (kind === "whale" || kind === "starship") {
      return {
        kind: "starship", layer: null, dist: distAlong, x: 0, y: 0, ang: 0,
        r: 38, speed: 18, camo: false, regrow: false, lead: true,
        alive: true, hp: Math.floor(650 * scale), maxHp: Math.floor(650 * scale),
        value: 320, freezeT: 0, slowMul: 1, children: "boss", childCount: 2,
        wobble: Math.random() * TWO_PI, uid: Math.random()
      };
    }
    if (kind === "superstarship") {
      return {
        kind: "superstarship", layer: null, dist: distAlong, x: 0, y: 0, ang: 0,
        r: 46, speed: 14, camo: false, regrow: false, lead: true,
        alive: true, hp: Math.floor(1600 * scale), maxHp: Math.floor(1600 * scale),
        value: 800, freezeT: 0, slowMul: 1, children: "starship", childCount: 2,
        wobble: Math.random() * TWO_PI, uid: Math.random()
      };
    }
    return makeLayerThreat("green", distAlong, {});
  }

  function syncThreatPos(th) {
    var p = posAlong(th.dist);
    th.x = p.x;
    th.y = p.y;
    th.ang = p.ang;
  }

  function addBan(n, x, y) {
    ban += n;
    banEarned += n;
    if (x != null) floatTxt(x, y, "+" + n, "#ffe566", 12);
  }

  function popLayerEntity(th, popsLeft, canLead) {
    if (!th.alive || popsLeft <= 0) return popsLeft;

    if (th.kind !== "layer") {
      if (th.lead && !canLead) return 0;
      var dmg = popsLeft;
      th.hp -= dmg;
      pops += dmg;
      burst(th.x, th.y, "#f5d041", 3 + Math.min(6, dmg));
      if (th.hp <= 0) {
        th.alive = false;
        addBan(th.value, th.x, th.y - 12);
        sfxPop();
        shake = Math.max(shake, th.kind === "superstarship" ? 0.45 : th.kind === "starship" ? 0.32 : 0.18);
        var childKind = th.children;
        var n = th.childCount || 1;
        for (var i = 0; i < n; i++) {
          var child;
          if (childKind === "ceramic") child = makeSpecial("ceramic", Math.max(0, th.dist - i * 8));
          else if (childKind === "boss") child = makeSpecial("boss", Math.max(0, th.dist - i * 10));
          else if (childKind === "starship") child = makeSpecial("starship", Math.max(0, th.dist - i * 12));
          else child = makeLayerThreat(childKind || "star", Math.max(0, th.dist - i * 6), {});
          syncThreatPos(child);
          threats.push(child);
        }
        burst(th.x, th.y, th.kind === "superstarship" ? "#38bdf8" : th.kind === "starship" ? "#f472b6" : "#fb923c", 22);
        floatTxt(th.x, th.y, th.kind === "superstarship" ? "MEGA POP!" : "POP!", "#fff", 16);
      }
      return 0;
    }

    if (th.lead && !canLead) return popsLeft;

    while (popsLeft > 0 && th.alive) {
      var L = LAYERS[th.layer];
      if (!L) { th.alive = false; break; }
      addBan(L.value, null, null);
      pops += 1;
      popsLeft -= 1;
      sfxPop();
      burst(th.x, th.y, L.color, 5);
      if (L.next) {
        th.layer = L.next;
        var N = LAYERS[th.layer];
        th.r = N.r;
        th.speed = N.speed * (th.regrow ? 0.95 : 1);
        th.value = N.value;
      } else {
        th.alive = false;
        floatTxt(th.x, th.y - 8, "POP", L.color, 11);
      }
    }
    return popsLeft;
  }

  function damageAt(x, y, popPower, pierce, splash, slow, canCamo, canLead) {
    var hits = 0;
    var targets = [];
    for (var i = 0; i < threats.length; i++) {
      var th = threats[i];
      if (!th.alive) continue;
      if (th.camo && !canCamo) continue;
      var d = dist(x, y, th.x, th.y);
      var rad = splash > 0 ? splash : th.r + 10;
      if (d <= rad) targets.push({ th: th, dist: th.dist });
    }
    if (!targets.length) return 0;

    if (splash > 0) {
      for (var j = 0; j < targets.length; j++) {
        popLayerEntity(targets[j].th, popPower, canLead);
        if (slow > 0) {
          targets[j].th.slowMul = Math.min(targets[j].th.slowMul, 1 - slow);
          targets[j].th.freezeT = Math.max(targets[j].th.freezeT, 1.15);
        }
        hits++;
      }
      burst(x, y, "#fb923c", 12);
      return hits;
    }

    targets.sort(function (a, b) { return b.dist - a.dist; });
    var remainingPierce = pierce;
    for (var k = 0; k < targets.length && remainingPierce > 0; k++) {
      popLayerEntity(targets[k].th, popPower, canLead);
      if (slow > 0) {
        targets[k].th.slowMul = Math.min(targets[k].th.slowMul, 1 - slow);
        targets[k].th.freezeT = Math.max(targets[k].th.freezeT, 1.0);
      }
      remainingPierce--;
      hits++;
    }
    return hits;
  }

  // ── Waves: 80-wave Starship campaign ──
  function buildWave(n) {
    var q = [];
    var scale = 1 + Math.max(0, n - 40) * 0.035;

    function add(layer, count, gap, flags) {
      for (var i = 0; i < count; i++) q.push({ t: layer, gap: gap, flags: flags || {} });
    }
    function addSpecial(kind, count, gap) {
      for (var i = 0; i < count; i++) q.push({ t: kind, special: true, gap: gap, scale: scale });
    }

    // Act I — Tutorial peel (1–10)
    if (n <= 3) {
      add("green", 10 + n * 5, 0.5);
    } else if (n <= 6) {
      add("green", 12, 0.38); add("ripe", 10 + n, 0.42);
    } else if (n <= 10) {
      add("ripe", 14, 0.32); add("gold", 10 + (n - 6), 0.38); add("green", 8, 0.28);
    }
    // Act II — Speed & camo (11–20)
    else if (n <= 15) {
      add("gold", 16, 0.28); add("purple", 10, 0.34); add("ripe", 12, 0.26);
      if (n >= 12) add("ripe", 8, 0.28, { camo: true });
    } else if (n <= 20) {
      add("purple", 16, 0.24); add("star", 10, 0.3); add("gold", 14, 0.22);
      add("ripe", 10, 0.26, { camo: true });
      add("gold", 6, 0.32, { regrow: true });
      if (n === 20) addSpecial("boss", 1, 1.2);
    }
    // Act III — Armor & ceramics (21–35)
    else if (n <= 28) {
      add("star", 18, 0.2); add("purple", 16, 0.22);
      addSpecial("ceramic", 2 + (n - 20), 0.7);
      add("gold", 12, 0.22, { camo: true });
      add("purple", 8, 0.28, { regrow: true });
      if (n % 5 === 0) addSpecial("boss", 1, 1);
    } else if (n <= 35) {
      addSpecial("ceramic", 6 + (n - 28), 0.5);
      add("star", 22, 0.16, { regrow: true });
      add("purple", 14, 0.18, { camo: true });
      if (n === 30) addSpecial("starship", 1, 1.4);
      if (n % 5 === 0) addSpecial("boss", 1, 0.9);
    }
    // Act IV — Starship pressure (36–55)
    else if (n <= 45) {
      addSpecial("ceramic", 10, 0.38);
      add("star", 28, 0.14, { camo: true, regrow: true });
      add("purple", 20, 0.16);
      addSpecial("boss", 1 + ((n - 36) / 5 | 0), 1);
      if (n === 40 || n === 45) addSpecial("starship", 1, 1.3);
    } else if (n <= 55) {
      addSpecial("ceramic", 14, 0.32);
      add("star", 34, 0.12, { camo: true });
      add("star", 16, 0.14, { regrow: true, camo: true });
      addSpecial("boss", 2, 0.85);
      if (n % 5 === 0) addSpecial("starship", 1, 1.2);
      // lead greens
      for (var L = 0; L < 6; L++) q.push({ t: "gold", gap: 0.4, flags: { lead: true } });
    }
    // Act V — Extreme (56–70)
    else if (n <= 70) {
      addSpecial("ceramic", 18, 0.26);
      add("star", 40, 0.1, { camo: true, regrow: true });
      addSpecial("boss", 3, 0.7);
      addSpecial("starship", 1 + ((n - 56) / 7 | 0), 1.1);
      if (n === 60 || n === 70) addSpecial("superstarship", 1, 1.3);
      for (var L2 = 0; L2 < 8; L2++) q.push({ t: "purple", gap: 0.35, flags: { lead: true, camo: true } });
    }
    // Act VI — Full stack (71–80)
    else {
      addSpecial("ceramic", 22, 0.22);
      add("star", 50, 0.08, { camo: true, regrow: true });
      addSpecial("boss", 4, 0.55);
      addSpecial("starship", 2, 0.9);
      if (n >= 75) addSpecial("superstarship", 1, 1 + (n - 75) * 0.15);
      if (n === 80) {
        addSpecial("superstarship", 2, 1.5);
        addSpecial("starship", 3, 0.8);
        showToast && 0;
      }
      for (var L3 = 0; L3 < 12; L3++) q.push({ t: "star", gap: 0.25, flags: { lead: true, camo: true, regrow: true } });
    }

    // Periodic lead intros mid-game
    if (n >= 18 && n < 56 && n % 4 === 0) {
      for (var li = 0; li < 5; li++) q.push({ t: "gold", gap: 0.45, flags: { lead: true } });
    }

    // Slight denser late game gap shrink already baked in
    return q;
  }

  function startWave() {
    if (!running || gameOver || paused || waveActive || wave >= MAX_WAVE) return;
    wave += 1;
    spawnQueue = buildWave(wave);
    spawnTimer = 0.35;
    waveActive = true;
    airdropT = 5 + Math.random() * 10;
    var label = "WAVE " + wave;
    if (wave === 20) label = "BOSS · MEGA BUNCH";
    if (wave === 30) label = "STARSHIP INBOUND";
    if (wave === 40) label = "ORBITAL THREAT";
    if (wave === 60) label = "FULL STACK ASSAULT";
    if (wave === 80) label = "FINAL · RAPTOR PROTOCOL";
    if (wave % 10 === 0 && wave !== 20 && wave !== 30 && wave !== 40 && wave !== 60 && wave !== 80) label = "BOSS WAVE " + wave;
    showToast(label);
    if (wave === 30 || wave === 60 || wave === 80) sfxBoss();
    else sfxWave();
    refreshUI();
  }

  function spawnOne(item) {
    var th;
    if (item.special) th = makeSpecial(item.t, 0, item.scale || 1);
    else th = makeLayerThreat(item.t, 0, item.flags || {});
    if (item.flags) {
      if (item.flags.lead) th.lead = true;
      if (item.flags.camo) th.camo = true;
      if (item.flags.regrow) th.regrow = true;
      if (item.flags.speedMul) th.speed *= item.flags.speedMul;
    }
    syncThreatPos(th);
    threats.push(th);
  }

  function placeTower(c, r) {
    if (!running || gameOver || paused) return;
    if (!inBounds(c, r) || isPath(c, r) || towerAt(c, r)) return;
    var def = TOWER_BY_ID[selectedShop];
    if (!def || ban < def.cost) return;
    ban -= def.cost;
    var t = {
      c: c, r: r,
      x: c * TW + TW / 2,
      y: r * TH + TH / 2,
      def: def, tier: 0, cd: 0, angle: 0
    };
    towers.push(t);
    selectedTower = t;
    totalBuilt++;
    sfxPlace();
    burst(t.x, t.y, def.color, 10);
    floatTxt(t.x, t.y - 16, "-" + def.cost, "#f5d041");
    refreshUI();
  }

  function upgradeTower() {
    if (!selectedTower || gameOver) return;
    var t = selectedTower;
    if (t.tier >= MAX_TIER) return;
    var cost = t.def.upCost[t.tier];
    if (ban < cost) return;
    ban -= cost;
    t.tier++;
    sfxUp();
    burst(t.x, t.y, t.def.color, 16);
    floatTxt(t.x, t.y - 18, t.def.ups[t.tier - 1].name, "#86efac", 12);
    if (t.tier >= MAX_TIER) {
      confettiBurst();
      floatTxt(t.x, t.y - 32, "MAX PATH", "#f472b6", 14);
    }
    refreshUI();
  }

  function sellTower() {
    if (!selectedTower || gameOver) return;
    var val = Math.floor(spentOn(selectedTower) * 0.72);
    ban += val;
    burst(selectedTower.x, selectedTower.y, "#f87171", 12);
    floatTxt(selectedTower.x, selectedTower.y, "+" + val, "#86efac");
    towers = towers.filter(function (x) { return x !== selectedTower; });
    selectedTower = null;
    beep(200, 0.08, "triangle", 0.035);
    refreshUI();
  }

  function findTarget(tower, st) {
    var best = null, bestScore = -1;
    for (var i = 0; i < threats.length; i++) {
      var th = threats[i];
      if (!th.alive) continue;
      if (th.camo && !st.camo) continue;
      if (th.lead && !st.lead && th.kind === "layer") continue;
      if ((th.kind === "ceramic" || th.kind === "boss" || th.kind === "starship" || th.kind === "superstarship") && th.lead && !st.lead) continue;
      var d = dist(tower.x, tower.y, th.x, th.y);
      if (d > st.range) continue;
      var score = th.dist;
      if (tower.def.preferStrong) {
        score += th.hp * 4;
        if (th.kind !== "layer") score += 80;
        else score += LAYER_ORDER.indexOf(th.layer) * 12;
      }
      if (score > bestScore) { bestScore = score; best = th; }
    }
    return best;
  }

  function fire(tower, target, st) {
    var shots = 1 + (st.multishot || 0);
    var baseSpd = tower.def.boomerang ? 230 : tower.def.rail ? 620 : 400;
    for (var s = 0; s < shots; s++) {
      var ang = Math.atan2(target.y - tower.y, target.x - tower.x) + (s - (shots - 1) / 2) * 0.1;
      tower.angle = ang;
      if (tower.def.freezePulse) {
        damageAt(tower.x, tower.y, st.pop, 99, st.splash || st.range * 0.72, st.slow, st.camo, st.lead);
        burst(tower.x, tower.y, "#67e8f9", 8);
        continue;
      }
      projectiles.push({
        x: tower.x, y: tower.y,
        vx: Math.cos(ang) * baseSpd,
        vy: Math.sin(ang) * baseSpd,
        life: tower.def.boomerang ? 1.45 : tower.def.rail ? 0.55 : 0.85,
        age: 0,
        pierceLeft: st.pierce,
        pop: st.pop,
        splash: st.splash,
        slow: st.slow,
        camo: st.camo,
        lead: st.lead,
        color: tower.def.color,
        boomer: !!tower.def.boomerang,
        rail: !!tower.def.rail,
        home: tower.def.boomerang ? { x: tower.x, y: tower.y } : null,
        phase: 0,
        hitIds: {},
        kind: tower.def.id,
        trail: []
      });
    }
    beep(tower.def.rail ? 90 : tower.def.id === "bomb" ? 120 : 400, 0.03, "square", 0.018);
  }

  function update(dt) {
    animT += dt;
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toast.classList.remove("show");
    }
    if (shake > 0) shake = Math.max(0, shake - dt * 2.2);
    if (!running || gameOver || paused) return;

    // Adaptive quality under load
    var load = threats.length + projectiles.length;
    quality = load > 90 ? 0.45 : load > 55 ? 0.7 : 1;

    var d = dt * speed;

    if (waveActive && spawnQueue.length) {
      spawnTimer -= d;
      if (spawnTimer <= 0) {
        var item = spawnQueue.shift();
        spawnOne(item);
        spawnTimer = item.gap || 0.4;
      }
    }

    if (waveActive && airdropT > 0) {
      airdropT -= d;
      if (airdropT <= 0) {
        var drop = 30 + ((Math.random() * 70) | 0) + Math.floor(wave * 0.6);
        for (var vi = 0; vi < towers.length; vi++) {
          if (towers[vi].def.support) drop += getStats(towers[vi]).income || 15;
        }
        addBan(drop, W / 2, 80);
        showToast("🪂 AIRDROP +" + drop + " BAN");
        confettiBurst();
      }
    }

    // Threats
    for (var i = threats.length - 1; i >= 0; i--) {
      var th = threats[i];
      if (!th.alive) { threats.splice(i, 1); continue; }

      if (th.freezeT > 0) th.freezeT -= d;
      var spd = th.speed * (th.freezeT > 0 ? th.slowMul : 1);
      if (th.freezeT <= 0) th.slowMul = 1;

      th.dist += spd * d;
      th.wobble += d * 4;
      syncThreatPos(th);

      if (th.regrow && th.kind === "layer" && th.layer !== "star") {
        th.regrowT += d;
        if (th.regrowT > 3.2) {
          th.regrowT = 0;
          var idx = LAYER_ORDER.indexOf(th.layer);
          if (idx >= 0 && idx < LAYER_ORDER.length - 1) {
            th.layer = LAYER_ORDER[idx + 1];
            var Lg = LAYERS[th.layer];
            th.r = Lg.r; th.speed = Lg.speed; th.value = Lg.value;
          }
        }
      }

      if (th.dist >= pathLen) {
        th.alive = false;
        threats.splice(i, 1);
        var loss = 1;
        if (th.kind === "superstarship") loss = 80;
        else if (th.kind === "starship") loss = 55;
        else if (th.kind === "boss") loss = 28;
        else if (th.kind === "ceramic") loss = 12;
        else if (th.kind === "layer") loss = LAYER_ORDER.indexOf(th.layer) + 1;
        lives -= loss;
        sfxLeak();
        shake = Math.max(shake, 0.2);
        floatTxt(th.x, th.y, "-" + loss + " ❤️", "#f87171", 14);
        if (lives <= 0) {
          lives = 0;
          endLose();
          return;
        }
        refreshUI();
      }
    }

    // Towers
    for (var t = 0; t < towers.length; t++) {
      var tower = towers[t];
      if (tower.def.support) continue;
      var st = getStats(tower);
      if (tower.cd > 0) tower.cd -= d;
      if (tower.cd <= 0) {
        var target = findTarget(tower, st);
        if (target) {
          fire(tower, target, st);
          tower.cd = st.rof;
        }
      }
    }

    // Projectiles
    for (var p = projectiles.length - 1; p >= 0; p--) {
      var pr = projectiles[p];
      pr.age += d;

      if (quality > 0.6 && pr.trail) {
        pr.trail.push({ x: pr.x, y: pr.y });
        if (pr.trail.length > 6) pr.trail.shift();
      }

      if (pr.boomer) {
        pr.phase += d;
        if (pr.phase < 0.55) {
          pr.x += pr.vx * d;
          pr.y += pr.vy * d;
        } else {
          var hx = pr.home.x - pr.x, hy = pr.home.y - pr.y;
          var hd = Math.sqrt(hx * hx + hy * hy) || 1;
          pr.x += (hx / hd) * 290 * d;
          pr.y += (hy / hd) * 290 * d;
          if (hd < 12) pr.age = pr.life;
        }
      } else {
        pr.x += pr.vx * d;
        pr.y += pr.vy * d;
      }

      for (var ti = 0; ti < threats.length; ti++) {
        var th2 = threats[ti];
        if (!th2.alive) continue;
        if (th2.camo && !pr.camo) continue;
        if (pr.hitIds[ti]) continue;
        var hitR = th2.r + (pr.rail ? 12 : 8);
        if (dist(pr.x, pr.y, th2.x, th2.y) <= hitR) {
          pr.hitIds[ti] = true;
          if (pr.splash > 0) {
            damageAt(pr.x, pr.y, pr.pop, 99, pr.splash, pr.slow, pr.camo, pr.lead);
            if (pr.rail) shake = Math.max(shake, 0.12);
            pr.age = pr.life;
            break;
          } else {
            popLayerEntity(th2, pr.pop, pr.lead);
            if (pr.slow > 0) {
              th2.slowMul = Math.min(th2.slowMul, 1 - pr.slow);
              th2.freezeT = Math.max(th2.freezeT, 0.85);
            }
            pr.pierceLeft--;
            if (pr.pierceLeft <= 0) { pr.age = pr.life; break; }
          }
        }
      }

      if (pr.age >= pr.life || pr.x < -50 || pr.y < -50 || pr.x > W + 50 || pr.y > H + 50) {
        projectiles.splice(p, 1);
      }
    }

    // FX
    for (var n = particles.length - 1; n >= 0; n--) {
      var pt = particles[n];
      pt.age += d;
      pt.x += pt.vx * d;
      pt.y += pt.vy * d;
      pt.vy += 240 * d;
      pt.rot += d * 8;
      if (pt.age >= pt.life) particles.splice(n, 1);
    }
    for (var f = floats.length - 1; f >= 0; f--) {
      floats[f].age += d;
      floats[f].y -= 32 * d;
      if (floats[f].age >= floats[f].life) floats.splice(f, 1);
    }

    // Wave clear
    if (waveActive && spawnQueue.length === 0 && threats.length === 0) {
      waveActive = false;
      var bonus = 55 + wave * 6 + Math.floor(wave * wave * 0.08);
      for (var vj = 0; vj < towers.length; vj++) {
        if (towers[vj].def.support) bonus += getStats(towers[vj]).income || 0;
      }
      addBan(bonus, W / 2, 100);
      showToast("ROUND CLEAR  ·  +" + bonus + " BAN");
      if (wave % 5 === 0) confettiBurst();
      refreshUI();
      if (wave >= MAX_WAVE) endWin();
    }
  }

  // ── Drawing helpers ──
  function drawBananaShape(x, y, r, fill, stroke, tip, ang, lead, camo) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.sin(animT * 3 + x * 0.01) * 0.08);
    ctx.globalAlpha = camo ? 0.5 : 1;

    // soft shadow
    ctx.beginPath();
    ctx.ellipse(2, r * 0.55, r * 0.7, r * 0.28, 0.2, 0, TWO_PI);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fill();

    // crescent body
    ctx.beginPath();
    ctx.moveTo(-r * 0.15, -r * 0.95);
    ctx.bezierCurveTo(r * 0.95, -r * 0.7, r * 1.05, r * 0.55, r * 0.1, r * 0.95);
    ctx.bezierCurveTo(r * 0.55, r * 0.35, r * 0.45, -r * 0.35, -r * 0.15, -r * 0.95);
    ctx.closePath();

    var grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, tip || fill);
    grad.addColorStop(0.45, fill);
    grad.addColorStop(1, stroke);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // gloss
    ctx.beginPath();
    ctx.moveTo(-r * 0.05, -r * 0.55);
    ctx.bezierCurveTo(r * 0.35, -r * 0.4, r * 0.4, r * 0.05, r * 0.15, r * 0.35);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // stem
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, -r * 0.92);
    ctx.lineTo(-r * 0.22, -r * 1.15);
    ctx.lineTo(r * 0.05, -r * 0.95);
    ctx.fillStyle = "#3f2a14";
    ctx.fill();

    if (lead) {
      ctx.strokeStyle = "rgba(148,163,184,0.95)";
      ctx.lineWidth = 3;
      ctx.stroke();
      // rivets
      ctx.fillStyle = "#94a3b8";
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(r * 0.25, -r * 0.3 + i * r * 0.35, 1.6, 0, TWO_PI);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function buildMapCache() {
    if (!mapCache) {
      mapCache = document.createElement("canvas");
      mapCache.width = W;
      mapCache.height = H;
    }
    var m = mapCache.getContext("2d");
    // deep jungle base
    var bg = m.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1a4d2e");
    bg.addColorStop(0.5, "#2d6b3c");
    bg.addColorStop(1, "#163d28");
    m.fillStyle = bg;
    m.fillRect(0, 0, W, H);

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = c * TW, y = r * TH;
        if (isPath(c, r)) {
          m.fillStyle = (c + r) % 2 ? "rgba(196,165,116,0.55)" : "rgba(180,140,90,0.5)";
          m.fillRect(x, y, TW + 0.5, TH + 0.5);
        } else {
          m.fillStyle = (c + r) % 2 ? "rgba(55,140,72,0.45)" : "rgba(40,120,60,0.4)";
          m.fillRect(x, y, TW + 0.5, TH + 0.5);
        }
      }
    }

    // path ribbon
    m.lineCap = "round";
    m.lineJoin = "round";
    m.strokeStyle = "rgba(60, 40, 20, 0.55)";
    m.lineWidth = Math.min(TW, TH) * 0.78;
    m.beginPath();
    for (var i = 0; i < waypoints.length; i++) {
      if (i === 0) m.moveTo(waypoints[i].x, waypoints[i].y);
      else m.lineTo(waypoints[i].x, waypoints[i].y);
    }
    m.stroke();

    m.strokeStyle = "rgba(201, 162, 95, 0.9)";
    m.lineWidth = Math.min(TW, TH) * 0.58;
    m.beginPath();
    for (i = 0; i < waypoints.length; i++) {
      if (i === 0) m.moveTo(waypoints[i].x, waypoints[i].y);
      else m.lineTo(waypoints[i].x, waypoints[i].y);
    }
    m.stroke();

    // glowing vine dashes
    m.strokeStyle = "rgba(245, 208, 65, 0.35)";
    m.lineWidth = 2.5;
    m.setLineDash([10, 12]);
    m.beginPath();
    for (i = 0; i < waypoints.length; i++) {
      if (i === 0) m.moveTo(waypoints[i].x, waypoints[i].y);
      else m.lineTo(waypoints[i].x, waypoints[i].y);
    }
    m.stroke();
    m.setLineDash([]);

    // static decor trees (orbs animated live)
    for (var d = 0; d < decor.length; d++) {
      var de = decor[d];
      if (de.kind !== "tree") continue;
      m.save();
      m.translate(de.x, de.y);
      m.scale(de.scale, de.scale);
      // trunk
      m.fillStyle = "#5b3a1a";
      m.fillRect(-3, -4, 6, 16);
      // canopy
      m.beginPath();
      m.arc(0, -10, 12, 0, TWO_PI);
      m.arc(-8, -4, 9, 0, TWO_PI);
      m.arc(8, -4, 9, 0, TWO_PI);
      m.fillStyle = "#1f7a3a";
      m.fill();
      m.beginPath();
      m.arc(-2, -12, 6, 0, TWO_PI);
      m.fillStyle = "#2f9e4f";
      m.fill();
      // tiny bananas in canopy
      m.fillStyle = "#f5d041";
      m.beginPath();
      m.ellipse(6, -6, 3, 5, 0.5, 0, TWO_PI);
      m.fill();
      m.restore();
    }

    mapDirty = false;
  }

  function drawMapLive() {
    if (mapDirty || !mapCache) buildMapCache();
    ctx.drawImage(mapCache, 0, 0);

    // floating potassium orbs
    for (var d = 0; d < decor.length; d++) {
      var de = decor[d];
      if (de.kind !== "orb") continue;
      var bob = Math.sin(animT * 2.2 + de.phase) * 4;
      var glow = 0.45 + Math.sin(animT * 3 + de.phase) * 0.25;
      ctx.beginPath();
      ctx.arc(de.x, de.y + bob, 5, 0, TWO_PI);
      ctx.fillStyle = "rgba(245,208,65," + glow + ")";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(de.x, de.y + bob, 10, 0, TWO_PI);
      ctx.fillStyle = "rgba(245,208,65,0.12)";
      ctx.fill();
    }

    // spawn portal
    var sp = waypoints[0], core = waypoints[waypoints.length - 1];
    var pulse = 10 + Math.sin(animT * 4) * 3;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, pulse + 8, 0, TWO_PI);
    ctx.fillStyle = "rgba(168,85,247,0.2)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, pulse, 0, TWO_PI);
    ctx.strokeStyle = "rgba(192,132,252,0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#e9d5ff";
    ctx.font = "bold 11px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPAWN", sp.x, sp.y);

    // core
    var cg = 18 + Math.sin(animT * 3) * 3;
    ctx.beginPath();
    ctx.arc(core.x, core.y, cg + 10, 0, TWO_PI);
    ctx.fillStyle = "rgba(245,208,65,0.18)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(core.x, core.y, cg, 0, TWO_PI);
    var coreGrad = ctx.createRadialGradient(core.x - 4, core.y - 4, 2, core.x, core.y, cg);
    coreGrad.addColorStop(0, "#ffe566");
    coreGrad.addColorStop(0.6, "#f5d041");
    coreGrad.addColorStop(1, "#c9a227");
    ctx.fillStyle = coreGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#1a1400";
    ctx.font = "bold 10px Fredoka, sans-serif";
    ctx.fillText("CORE", core.x, core.y);
  }

  function drawHover() {
    if (!hover || !running || gameOver || selectedTower) return;
    var def = TOWER_BY_ID[selectedShop];
    if (!def) return;
    var c = hover.c, r = hover.r;
    var valid = inBounds(c, r) && !isPath(c, r) && !towerAt(c, r);
    ctx.fillStyle = valid ? "rgba(255,229,102,0.28)" : "rgba(248,113,113,0.32)";
    ctx.fillRect(c * TW + 2, r * TH + 2, TW - 4, TH - 4);
    if (valid) {
      ctx.beginPath();
      ctx.arc(c * TW + TW / 2, r * TH + TH / 2, def.range, 0, TWO_PI);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawMonkey(t) {
    var st = getStats(t);
    var sel = t === selectedTower;
    if (sel) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, st.range, 0, TWO_PI);
      ctx.fillStyle = "rgba(255,229,102,0.07)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,229,102,0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (t.def.support) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, st.range, 0, TWO_PI);
      ctx.strokeStyle = "rgba(192,132,252,0.28)";
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    var scale = 1 + t.tier * 0.06;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.ellipse(0, 13, 14, 5, 0, 0, TWO_PI);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fill();

    // pad
    ctx.beginPath();
    ctx.arc(0, 5, 15, 0, TWO_PI);
    ctx.fillStyle = "#4a3018";
    ctx.fill();
    ctx.strokeStyle = t.def.color;
    ctx.lineWidth = sel ? 3 : 2;
    ctx.stroke();

    // face
    ctx.beginPath();
    ctx.arc(0, -2, 13, 0, TWO_PI);
    var face = ctx.createRadialGradient(-3, -5, 2, 0, 0, 14);
    face.addColorStop(0, "#e2c08a");
    face.addColorStop(1, "#b8894e");
    ctx.fillStyle = face;
    ctx.fill();
    ctx.strokeStyle = "#3b2a1a";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // ears
    ctx.beginPath();
    ctx.arc(-12, -6, 5, 0, TWO_PI);
    ctx.arc(12, -6, 5, 0, TWO_PI);
    ctx.fillStyle = "#c4a574";
    ctx.fill();
    ctx.stroke();

    // eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-4, -4, 3.3, 0, TWO_PI);
    ctx.arc(4, -4, 3.3, 0, TWO_PI);
    ctx.fill();
    var look = Math.cos(t.angle) * 1.1;
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(-3.5 + look, -4, 1.6, 0, TWO_PI);
    ctx.arc(4.5 + look, -4, 1.6, 0, TWO_PI);
    ctx.fill();

    // smile
    ctx.beginPath();
    ctx.arc(0, 1, 4.5, 0.2, Math.PI - 0.2);
    ctx.strokeStyle = "#3b2a1a";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // role badge
    ctx.font = "13px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var badge = {
      sniper: "🎯", bomb: "💣", ice: "🧊", village: "🏠",
      super: "🦸", boomer: "🪃", battery: "🚀", dart: "🍌"
    };
    ctx.fillText(badge[t.def.id] || "🍌", 0, -18);

    // tier pips (5)
    for (var p = 0; p < t.tier; p++) {
      ctx.beginPath();
      ctx.arc(-12 + p * 6, 15, 2.4, 0, TWO_PI);
      ctx.fillStyle = t.def.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (!t.def.support && !t.def.freezePulse) {
      ctx.rotate(t.angle);
      if (t.def.rail) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(6, -2.5, 18 + t.tier * 2, 5);
        ctx.fillStyle = "#e0f2fe";
        ctx.fillRect(20 + t.tier, -1.5, 8, 3);
      } else {
        ctx.fillStyle = t.def.color;
        ctx.fillRect(8, -3, 12 + t.tier * 2, 6);
      }
    }
    ctx.restore();
  }

  function drawThreat(th) {
    if (!th.alive) return;
    var ang = th.ang + Math.PI / 2 + Math.sin(th.wobble) * 0.15;

    if (th.kind === "layer") {
      var L = LAYERS[th.layer] || LAYERS.green;
      drawBananaShape(th.x, th.y, th.r, L.color, L.stroke, L.tip, ang, th.lead, th.camo);
      if (th.regrow) {
        ctx.font = "10px serif";
        ctx.textAlign = "center";
        ctx.globalAlpha = th.camo ? 0.5 : 1;
        ctx.fillText("♻️", th.x + th.r * 0.55, th.y - th.r * 0.55);
        ctx.globalAlpha = 1;
      }
    } else {
      // armored / boss bananas
      var col, stroke, label, r = th.r;
      if (th.kind === "ceramic") { col = "#d6d3d1"; stroke = "#57534e"; label = null; }
      else if (th.kind === "boss") { col = "#a855f7"; stroke = "#4c1d95"; label = "MEGA"; }
      else if (th.kind === "starship") { col = "#f472b6"; stroke = "#9d174d"; label = "SHIP"; }
      else { col = "#38bdf8"; stroke = "#0c4a6e"; label = "STACK"; }

      drawBananaShape(th.x, th.y, r, col, stroke, "#fff", ang, th.lead, false);

      // armor ring
      ctx.beginPath();
      ctx.ellipse(th.x, th.y, r * 0.95, r * 1.05, ang, 0, TWO_PI);
      ctx.strokeStyle = th.kind === "ceramic" ? "rgba(120,113,108,0.9)" : "rgba(255,255,255,0.35)";
      ctx.lineWidth = th.kind === "ceramic" ? 4 : 2.5;
      ctx.stroke();

      if (label) {
        ctx.font = "bold 9px Fredoka, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 3;
        ctx.strokeText(label, th.x, th.y);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, th.x, th.y);
      }

      // HP bar
      var bw = r * 2.1, pct = clamp(th.hp / th.maxHp, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(th.x - bw / 2, th.y - r - 12, bw, 5);
      var hpCol = pct > 0.5 ? "#86efac" : pct > 0.25 ? "#facc15" : "#f87171";
      ctx.fillStyle = hpCol;
      ctx.fillRect(th.x - bw / 2, th.y - r - 12, bw * pct, 5);
    }

    if (th.freezeT > 0) {
      ctx.strokeStyle = "rgba(103,232,249,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(th.x, th.y, th.r + 5, 0, TWO_PI);
      ctx.stroke();
      // ice crystals
      ctx.fillStyle = "rgba(186,230,253,0.7)";
      for (var ic = 0; ic < 3; ic++) {
        var ia = animT * 2 + ic * 2.1;
        ctx.beginPath();
        ctx.arc(th.x + Math.cos(ia) * (th.r + 3), th.y + Math.sin(ia) * (th.r + 3), 2, 0, TWO_PI);
        ctx.fill();
      }
    }
  }

  function drawProjectiles() {
    for (var i = 0; i < projectiles.length; i++) {
      var pr = projectiles[i];
      // trail
      if (pr.trail && pr.trail.length > 1) {
        ctx.strokeStyle = pr.rail ? "rgba(56,189,248,0.45)" : "rgba(245,208,65,0.3)";
        ctx.lineWidth = pr.rail ? 3 : 2;
        ctx.beginPath();
        for (var t = 0; t < pr.trail.length; t++) {
          if (t === 0) ctx.moveTo(pr.trail[t].x, pr.trail[t].y);
          else ctx.lineTo(pr.trail[t].x, pr.trail[t].y);
        }
        ctx.stroke();
      }

      if (pr.kind === "dart" || pr.kind === "super" || pr.kind === "sniper") {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.rotate(Math.atan2(pr.vy, pr.vx));
        // drawn mini banana dart
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.quadraticCurveTo(0, -4, -8, -1);
        ctx.quadraticCurveTo(0, 4, 8, 0);
        ctx.fillStyle = pr.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      } else if (pr.kind === "boomer") {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.rotate(animT * 14);
        ctx.strokeStyle = pr.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 8, Math.PI + 0.2, TWO_PI - 0.2);
        ctx.stroke();
        ctx.restore();
      } else if (pr.kind === "bomb") {
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, 7, 0, TWO_PI);
        ctx.fillStyle = "#1a1a1a";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pr.x - 1, pr.y - 1, 2.5, 0, TWO_PI);
        ctx.fillStyle = "#f97316";
        ctx.fill();
      } else if (pr.kind === "battery" || pr.rail) {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.rotate(Math.atan2(pr.vy, pr.vx));
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.fillRect(-10, -2, 20, 4);
        ctx.fillStyle = "#e0f2fe";
        ctx.fillRect(4, -1.5, 10, 3);
        ctx.shadowBlur = 0;
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, 5, 0, TWO_PI);
        ctx.fillStyle = pr.color;
        ctx.fill();
      }
    }
  }

  function drawFX() {
    for (var i = 0; i < particles.length; i++) {
      var pt = particles[i];
      var a = 1 - pt.age / pt.life;
      ctx.globalAlpha = a;
      if (pt.kind === "peel") {
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot || 0);
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 7, 0.3, 0, TWO_PI);
        ctx.fillStyle = pt.color;
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * a, 0, TWO_PI);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (var f = 0; f < floats.length; f++) {
      var fl = floats[f];
      ctx.globalAlpha = 1 - fl.age / fl.life;
      ctx.font = "700 " + fl.size + "px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 3;
      ctx.strokeText(fl.text, fl.x, fl.y);
      ctx.fillStyle = fl.color;
      ctx.fillText(fl.text, fl.x, fl.y);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // screen shake
    var sx = 0, sy = 0;
    if (shake > 0) {
      sx = (Math.random() - 0.5) * shake * 14;
      sy = (Math.random() - 0.5) * shake * 14;
    }
    ctx.translate(sx, sy);

    ctx.fillStyle = "#1a4d2e";
    ctx.fillRect(-10, -10, W + 20, H + 20);

    drawMapLive();
    drawHover();
    for (var t = 0; t < towers.length; t++) drawMonkey(towers[t]);
    for (var i = 0; i < threats.length; i++) drawThreat(threats[i]);
    drawProjectiles();
    drawFX();

    // vignette
    var vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = vig;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.05) dt = 0.05;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // ── UI ──
  function buildShop() {
    shopEl.innerHTML = "";
    for (var i = 0; i < TOWER_DEFS.length; i++) {
      var d = TOWER_DEFS[i];
      var b = document.createElement("button");
      b.type = "button";
      b.className = "shop-btn" + (selectedShop === d.id ? " on" : "");
      b.innerHTML = '<span class="ico">' + d.icon + '</span><span class="nm">' + d.name + '</span><span class="cs">' + d.cost + " BAN</span>";
      b.disabled = !running || gameOver || ban < d.cost;
      b.addEventListener("click", (function (id) {
        return function () {
          selectedShop = id;
          selectedTower = null;
          refreshUI();
        };
      })(d.id));
      shopEl.appendChild(b);
    }
  }

  function refreshUI() {
    hudBan.textContent = String(Math.floor(ban));
    hudLives.textContent = String(Math.max(0, lives));
    hudWave.textContent = String(wave);
    if (hudWaveMax) hudWaveMax.textContent = String(MAX_WAVE);
    hudPops.textContent = String(pops);
    buildShop();

    if (selectedTower) {
      var t = selectedTower;
      var st = getStats(t);
      var next = t.tier < MAX_TIER ? t.def.ups[t.tier] : null;
      var cost = t.tier < MAX_TIER ? t.def.upCost[t.tier] : 0;
      var html = "<strong>" + t.def.icon + " " + t.def.name + "</strong> · Tier " + t.tier + "/" + MAX_TIER + "<br>";
      html += t.def.desc + "<br>";
      if (!t.def.support) {
        html += "Range " + Math.floor(st.range) + " · Pop " + st.pop + " · Pierce " + st.pierce;
        if (st.splash) html += " · Splash " + Math.floor(st.splash);
        if (st.camo) html += " · 👁️ Camo";
        if (st.lead) html += " · 🔩 Armor";
      } else {
        html += "Buff aura " + Math.floor(st.range) + " · Village support";
        if (st.income) html += " · Income +" + st.income;
      }
      if (next) html += "<br>Next: <strong>" + next.name + "</strong> — " + next.desc + " (" + cost + " BAN)";
      else html += "<br>⭐ Max path unlocked — Starship-grade MonKey.";
      selBox.innerHTML = html;
      btnUp.disabled = t.tier >= MAX_TIER || ban < cost || gameOver;
      btnUp.textContent = t.tier >= MAX_TIER ? "Max Path" : "Upgrade (" + cost + ")";
      btnSell.disabled = gameOver;
      btnSell.textContent = "Sell (+" + Math.floor(spentOn(t) * 0.72) + ")";
    } else {
      var def = TOWER_BY_ID[selectedShop];
      selBox.innerHTML = def
        ? "<strong>" + def.icon + " " + def.name + "</strong> · " + def.cost + " BAN<br>" + def.desc + "<br><em>" + def.role + " · 5-tier path</em>"
        : "Pick a MonKey from the shop.";
      btnUp.disabled = true;
      btnUp.textContent = "Upgrade";
      btnSell.disabled = true;
      btnSell.textContent = "Sell";
    }
    btnWave.disabled = !running || gameOver || paused || waveActive || wave >= MAX_WAVE;
  }

  function resetGame() {
    ban = START_BAN; lives = START_LIVES; wave = 0; pops = 0; banEarned = 0;
    running = true; paused = false; gameOver = false;
    selectedShop = "dart"; selectedTower = null;
    towers = []; threats = []; projectiles = []; particles = []; floats = [];
    spawnQueue = []; spawnTimer = 0; waveActive = false; totalBuilt = 0; shake = 0;
    initDecor();
    startOv.classList.add("hidden");
    winOv.classList.add("hidden");
    loseOv.classList.add("hidden");
    pauseOv.classList.add("hidden");
    showToast("POP THE BANANAS · DEFEND THE CORE");
    refreshUI();
    sfxPlace();
  }

  function endWin() {
    gameOver = true; running = false;
    document.getElementById("winMsg").textContent =
      MAX_WAVE + " waves cleared! Pops " + pops + " · BAN earned " + banEarned +
      " · MonKeys " + totalBuilt + ". Starship-grade defense. Potassium forever!";
    winOv.classList.remove("hidden");
    confettiBurst();
    confettiBurst();
    sfxWin();
  }
  function endLose() {
    gameOver = true; running = false; waveActive = false;
    document.getElementById("loseMsg").textContent =
      "Reached wave " + wave + "/" + MAX_WAVE + " · Pops " + pops +
      " · BAN earned " + banEarned + ". Rebuild and go full stack!";
    loseOv.classList.remove("hidden");
    sfxLeak();
  }

  function canvasPos(evt) {
    var rect = canvas.getBoundingClientRect();
    var cx, cy;
    if (evt.touches && evt.touches[0]) { cx = evt.touches[0].clientX; cy = evt.touches[0].clientY; }
    else if (evt.changedTouches && evt.changedTouches[0]) { cx = evt.changedTouches[0].clientX; cy = evt.changedTouches[0].clientY; }
    else { cx = evt.clientX; cy = evt.clientY; }
    var x = ((cx - rect.left) / rect.width) * W;
    var y = ((cy - rect.top) / rect.height) * H;
    return { x: x, y: y, c: Math.floor(x / TW), r: Math.floor(y / TH) };
  }

  canvas.addEventListener("mousemove", function (e) {
    var p = canvasPos(e);
    hover = inBounds(p.c, p.r) ? { c: p.c, r: p.r } : null;
  });
  canvas.addEventListener("mouseleave", function () { hover = null; });

  function onPointer(e) {
    e.preventDefault();
    ensureAudio();
    if (!running || gameOver || paused) return;
    var p = canvasPos(e);
    if (!inBounds(p.c, p.r)) return;
    var existing = towerAt(p.c, p.r);
    if (existing) {
      selectedTower = existing;
      refreshUI();
      return;
    }
    placeTower(p.c, p.r);
  }
  canvas.addEventListener("mousedown", onPointer);
  canvas.addEventListener("touchstart", onPointer, { passive: false });

  document.querySelectorAll(".spd").forEach(function (b) {
    b.addEventListener("click", function () {
      speed = parseFloat(b.getAttribute("data-spd"));
      document.querySelectorAll(".spd").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
    });
  });

  btnUp.addEventListener("click", function () { ensureAudio(); upgradeTower(); });
  btnSell.addEventListener("click", function () { ensureAudio(); sellTower(); });
  btnWave.addEventListener("click", function () { ensureAudio(); startWave(); });
  btnPause.addEventListener("click", function () {
    if (!running || gameOver) return;
    paused = !paused;
    pauseOv.classList.toggle("hidden", !paused);
  });
  document.getElementById("btnResume").addEventListener("click", function () {
    paused = false;
    pauseOv.classList.add("hidden");
  });
  document.getElementById("btnStart").addEventListener("click", function () { ensureAudio(); resetGame(); });
  document.getElementById("btnWin").addEventListener("click", function () { ensureAudio(); resetGame(); });
  document.getElementById("btnLose").addEventListener("click", function () { ensureAudio(); resetGame(); });

  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === " " || e.code === "Space") {
      e.preventDefault();
      ensureAudio();
      if (!running) resetGame();
      else startWave();
    }
    if (k === "p" || k === "P") {
      if (!running || gameOver) return;
      paused = !paused;
      pauseOv.classList.toggle("hidden", !paused);
    }
    if (k === "u" || k === "U") { ensureAudio(); upgradeTower(); }
    if (k === "s" || k === "S") { ensureAudio(); sellTower(); }
    if (k === "Escape") { selectedTower = null; refreshUI(); }
    var keys = {
      "1": "dart", "2": "boomer", "3": "sniper", "4": "bomb",
      "5": "ice", "6": "village", "7": "super", "8": "battery"
    };
    if (keys[k]) { selectedShop = keys[k]; selectedTower = null; refreshUI(); }
  });

  if (hudWaveMax) hudWaveMax.textContent = String(MAX_WAVE);
  initDecor();
  buildShop();
  refreshUI();
  requestAnimationFrame(loop);
})();
