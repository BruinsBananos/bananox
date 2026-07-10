(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════
  // BANANO TD — EPIC EDITION
  // Huge map · 3 battlefields · 100 waves · abilities · 9 towers
  // ═══════════════════════════════════════════════════════════

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d", { alpha: false });
  // Massive battlefield — fills a large browser window
  var W = 1600, H = 1000;
  canvas.width = W;
  canvas.height = H;
  var COLS = 40, ROWS = 25;
  var TW = W / COLS, TH = H / ROWS; // 40×40 tiles
  var TWO_PI = Math.PI * 2;

  // DOM
  var hudBan = document.getElementById("hudBan");
  var hudLives = document.getElementById("hudLives");
  var hudWave = document.getElementById("hudWave");
  var hudPops = document.getElementById("hudPops");
  var hudWaveMax = document.getElementById("hudWaveMax");
  var hudInterest = document.getElementById("hudInterest");
  var hudMapName = document.getElementById("hudMapName");
  var shopEl = document.getElementById("shop");
  var selBox = document.getElementById("selBox");
  var missionBox = document.getElementById("missionBox");
  var btnUp = document.getElementById("btnUp");
  var btnSell = document.getElementById("btnSell");
  var btnWave = document.getElementById("btnWave");
  var btnPause = document.getElementById("btnPause");
  var btnAbilityStorm = document.getElementById("btnAbilityStorm");
  var btnAbilityFreeze = document.getElementById("btnAbilityFreeze");
  var btnAbilityCash = document.getElementById("btnAbilityCash");
  var toast = document.getElementById("toast");
  var startOv = document.getElementById("startOv");
  var winOv = document.getElementById("winOv");
  var loseOv = document.getElementById("loseOv");
  var pauseOv = document.getElementById("pauseOv");

  // ── Path builders ──
  function lineH(r, c0, c1, out) {
    var step = c0 <= c1 ? 1 : -1;
    for (var c = c0; c !== c1 + step; c += step) out.push([c, r]);
  }
  function lineV(c, r0, r1, out) {
    var step = r0 <= r1 ? 1 : -1;
    for (var r = r0; r !== r1 + step; r += step) out.push([c, r]);
  }
  function dedupe(cells) {
    var out = [], last = "";
    for (var i = 0; i < cells.length; i++) {
      var k = cells[i][0] + "," + cells[i][1];
      if (k !== last) { out.push(cells[i]); last = k; }
    }
    return out;
  }

  var MAPS = {
    canyon: {
      name: "Potassium Canyon",
      short: "Canyon",
      build: function () {
        // Long serpentine across the 40×25 grid — tons of build space beside the path
        var p = [];
        lineH(12, 0, 9, p);
        lineV(9, 12, 3, p);
        lineH(3, 9, 18, p);
        lineV(18, 3, 20, p);
        lineH(20, 18, 28, p);
        lineV(28, 20, 6, p);
        lineH(6, 28, 35, p);
        lineV(35, 6, 18, p);
        lineH(18, 35, 39, p);
        return dedupe(p);
      }
    },
    helix: {
      name: "Double Helix",
      short: "Helix",
      build: function () {
        var p = [];
        lineH(2, 0, 12, p);
        lineV(12, 2, 11, p);
        lineH(11, 12, 5, p);
        lineV(5, 11, 18, p);
        lineH(18, 5, 22, p);
        lineV(22, 18, 4, p);
        lineH(4, 22, 33, p);
        lineV(33, 4, 21, p);
        lineH(21, 33, 39, p);
        return dedupe(p);
      }
    },
    runway: {
      name: "Starship Runway",
      short: "Runway",
      build: function () {
        var p = [];
        lineV(3, 0, 21, p);
        lineH(21, 3, 14, p);
        lineV(14, 21, 2, p);
        lineH(2, 14, 26, p);
        lineV(26, 2, 21, p);
        lineH(21, 26, 36, p);
        lineV(36, 21, 8, p);
        lineH(8, 36, 39, p);
        return dedupe(p);
      }
    }
  };

  var pathSet = {};
  var PATH_CELLS = [];
  var waypoints = [];
  var pathLen = 0;
  var segLens = [0];
  var currentMap = "canyon";

  function rebuildPath() {
    PATH_CELLS = MAPS[currentMap].build();
    pathSet = {};
    waypoints = [];
    for (var i = 0; i < PATH_CELLS.length; i++) {
      var pc = PATH_CELLS[i][0], pr = PATH_CELLS[i][1];
      pathSet[pc + "," + pr] = true;
      waypoints.push({ x: pc * TW + TW / 2, y: pr * TH + TH / 2 });
    }
    pathLen = 0;
    segLens = [0];
    for (var s = 1; s < waypoints.length; s++) {
      var dx = waypoints[s].x - waypoints[s - 1].x;
      var dy = waypoints[s].y - waypoints[s - 1].y;
      pathLen += Math.sqrt(dx * dx + dy * dy);
      segLens.push(pathLen);
    }
    mapDirty = true;
  }

  // Banana layers
  var LAYERS = {
    green:  { id: "green",  name: "Unripe",  next: null,     r: 13, color: "#86efac", stroke: "#166534", tip: "#bbf7d0", value: 1, speed: 50 },
    ripe:   { id: "ripe",   name: "Ripe",    next: "green",  r: 14, color: "#facc15", stroke: "#a16207", tip: "#fef08a", value: 2, speed: 60 },
    gold:   { id: "gold",   name: "Golden",  next: "ripe",   r: 15, color: "#f59e0b", stroke: "#92400e", tip: "#fde68a", value: 3, speed: 72 },
    purple: { id: "purple", name: "Meme",    next: "gold",   r: 16, color: "#c084fc", stroke: "#6b21a8", tip: "#e9d5ff", value: 4, speed: 88 },
    star:   { id: "star",   name: "Cosmic",  next: "purple", r: 17, color: "#f472b6", stroke: "#9d174d", tip: "#fbcfe8", value: 5, speed: 105 },
    zebra:  { id: "zebra",  name: "Zebra",   next: "star",   r: 18, color: "#f8fafc", stroke: "#0f172a", tip: "#e2e8f0", value: 7, speed: 96 }
  };
  var LAYER_ORDER = ["green", "ripe", "gold", "purple", "star", "zebra"];

  // 9 towers · 5 tiers · ranges tuned for large map
  var TOWER_DEFS = [
    {
      id: "dart", name: "Dart MonKey", icon: "🐵", role: "Primary",
      desc: "Rapid banana darts. Your always-on backbone.",
      cost: 175, range: 170, rof: 0.46, pierce: 1, pop: 1, splash: 0, slow: 0,
      camo: false, lead: false, color: "#f5d041",
      upCost: [120, 240, 420, 800, 1500],
      ups: [
        { name: "Sharp Tips", desc: "+pierce, faster", pierce: 1, rof: -0.06 },
        { name: "Razor Rinds", desc: "+pop, +range", pop: 1, range: 22 },
        { name: "Twin Peel", desc: "Double shot", multishot: 1, pierce: 1 },
        { name: "Jungle Barrage", desc: "Triple stream", multishot: 1, rof: -0.1, pierce: 1 },
        { name: "Potassium Storm", desc: "Quad shredders", multishot: 1, pop: 1, pierce: 2, range: 30 }
      ]
    },
    {
      id: "boomer", name: "Boomer K⁺", icon: "🪃", role: "Mid",
      desc: "Returning blades — farms long path lines.",
      cost: 320, range: 150, rof: 0.85, pierce: 6, pop: 1, splash: 0, slow: 0,
      camo: false, lead: false, color: "#fb923c", boomerang: true,
      upCost: [190, 360, 650, 1200, 2200],
      ups: [
        { name: "Wide Arc", desc: "+3 pierce", pierce: 3 },
        { name: "K-Rang", desc: "+pop & pierce", pop: 1, pierce: 2 },
        { name: "Glaive Lord", desc: "Faster returns", pierce: 3, rof: -0.18, pop: 1 },
        { name: "Orbit Blades", desc: "Twin rangs", multishot: 1, pierce: 2 },
        { name: "MOAB Cleaver", desc: "Boss shred orbit", pierce: 7, pop: 2, range: 35, lead: true }
      ]
    },
    {
      id: "sniper", name: "Sniper MonKey", icon: "🎯", role: "Support",
      desc: "Map-range eyes. Camo native. Armor later.",
      cost: 380, range: 420, rof: 1.0, pierce: 1, pop: 2, splash: 0, slow: 0,
      camo: true, lead: false, color: "#86efac", preferStrong: true,
      upCost: [220, 450, 850, 1600, 3000],
      ups: [
        { name: "Night Scope", desc: "Faster aim", rof: -0.22, range: 30 },
        { name: "Armor Piercer", desc: "Pops lead", lead: true, pop: 2 },
        { name: "Elite Marksman", desc: "Layer shred", pop: 3, rof: -0.18, range: 40 },
        { name: "Deadeye", desc: "Huge pop power", pop: 5, pierce: 2 },
        { name: "Orbital Strike", desc: "Starship sniper", pop: 10, pierce: 3, rof: -0.15, range: 50 }
      ]
    },
    {
      id: "bomb", name: "Bomb MonKey", icon: "💣", role: "Military",
      desc: "Peel grenades with natural armor pop.",
      cost: 550, range: 160, rof: 1.1, pierce: 1, pop: 1, splash: 78, slow: 0,
      camo: false, lead: true, color: "#f97316",
      upCost: [300, 580, 1050, 1900, 3400],
      ups: [
        { name: "Bigger Bombs", desc: "+splash & pop", splash: 20, pop: 1 },
        { name: "Cluster Peels", desc: "Faster volleys", rof: -0.28, pop: 1, splash: 14 },
        { name: "MOAB Mauler", desc: "Boss AOE", pop: 3, splash: 24, range: 25 },
        { name: "Carpet Bomb", desc: "Wide destruction", splash: 34, pop: 2, multishot: 1 },
        { name: "Starship Salvo", desc: "Orbital warheads", pop: 4, splash: 48, range: 40, rof: -0.2 }
      ]
    },
    {
      id: "ice", name: "Chill MonKey", icon: "🧊", role: "Magic",
      desc: "Frost aura — control the mega path.",
      cost: 400, range: 145, rof: 1.2, pierce: 1, pop: 0, splash: 100, slow: 0.52,
      camo: false, lead: false, color: "#67e8f9", freezePulse: true,
      upCost: [240, 480, 850, 1500, 2700],
      ups: [
        { name: "Permafrost", desc: "Harder slow", slow: 0.12, splash: 14 },
        { name: "Ice Shards", desc: "Slow + pops", pop: 1, splash: 12 },
        { name: "Absolute Zero", desc: "Deep freeze", slow: 0.15, splash: 28, rof: -0.3, pop: 1 },
        { name: "Cryo Field", desc: "Camo chill", camo: true, range: 30, slow: 0.08 },
        { name: "Nitrogen Core", desc: "Pack freezes solid", slow: 0.12, splash: 40, pop: 2, rof: -0.25, lead: true }
      ]
    },
    {
      id: "farm", name: "Banana Farm", icon: "🌴", role: "Economy",
      desc: "Passive BAN income every round clear.",
      cost: 750, range: 90, rof: 99, pierce: 0, pop: 0, splash: 0, slow: 0,
      camo: false, lead: false, color: "#84cc16", farm: true, support: true,
      upCost: [450, 900, 1600, 2800, 4800],
      ups: [
        { name: "More Trees", desc: "+round income", income: 40 },
        { name: "Irrigation", desc: "Bigger harvest", income: 55 },
        { name: "Marketplace", desc: "Strong income", income: 90 },
        { name: "Export Hub", desc: "Huge harvest", income: 140 },
        { name: "Potassium Bank", desc: "Empire income", income: 220 }
      ]
    },
    {
      id: "village", name: "Jungle Village", icon: "🏠", role: "Support",
      desc: "Buffs nearby MonKeys. Fuels airdrops.",
      cost: 1000, range: 190, rof: 99, pierce: 0, pop: 0, splash: 0, slow: 0,
      camo: false, lead: false, color: "#c084fc", support: true,
      upCost: [550, 1100, 1900, 3200, 5200],
      ups: [
        { name: "Jungle Drums", desc: "+12% attack speed", auraRof: 0.12 },
        { name: "Radar Scanner", desc: "Nearby camo detect", auraCamo: true, auraRof: 0.06, range: 20 },
        { name: "Monkey Commerce", desc: "Round income", income: 80, auraRof: 0.06 },
        { name: "War Council", desc: "Big speed aura", auraRof: 0.16, range: 30 },
        { name: "Potassium Exchange", desc: "Elite buffs", income: 150, auraRof: 0.12, auraCamo: true, range: 25 }
      ]
    },
    {
      id: "super", name: "Super MonKey", icon: "🦸", role: "Hero",
      desc: "Meme-powered multi-banana fury.",
      cost: 2400, range: 200, rof: 0.1, pierce: 1, pop: 1, splash: 0, slow: 0,
      camo: true, lead: true, color: "#f472b6", multishot: 1,
      upCost: [1300, 2600, 5000, 9500, 17000],
      ups: [
        { name: "Laser Eyes", desc: "Pierce + speed", pierce: 2, rof: -0.02 },
        { name: "Robo Super", desc: "Triple stream", multishot: 2, pop: 1 },
        { name: "Plasma Core", desc: "Splash plasma", multishot: 1, pierce: 2, pop: 1, splash: 26 },
        { name: "Tech Terror", desc: "Quad storm", multishot: 2, pierce: 2, pop: 2, splash: 20 },
        { name: "Starship Avatar", desc: "Unmatched DPS", multishot: 3, pierce: 4, pop: 3, splash: 32, range: 45, rof: -0.03 }
      ]
    },
    {
      id: "battery", name: "Starship Battery", icon: "🚀", role: "Ultimate",
      desc: "Orbital rail — deletes bosses for a living.",
      cost: 4800, range: 460, rof: 1.7, pierce: 1, pop: 14, splash: 0, slow: 0,
      camo: true, lead: true, color: "#38bdf8", preferStrong: true, rail: true,
      upCost: [2600, 5200, 9500, 16000, 28000],
      ups: [
        { name: "Capacitor Bank", desc: "Faster charge", rof: -0.35 },
        { name: "Rail Expansion", desc: "Pierce packs", pierce: 3, pop: 4 },
        { name: "Cluster Warhead", desc: "Splash impact", splash: 48, pop: 4 },
        { name: "Multi-Vector", desc: "Twin rails", multishot: 1, pierce: 2, pop: 5 },
        { name: "Full Stack Raptor", desc: "Delete button", multishot: 2, pierce: 4, pop: 12, splash: 55, rof: -0.4, range: 50 }
      ]
    }
  ];
  var TOWER_BY_ID = {};
  for (var ti = 0; ti < TOWER_DEFS.length; ti++) TOWER_BY_ID[TOWER_DEFS[ti].id] = TOWER_DEFS[ti];
  var MAX_TIER = 5;
  var MAX_WAVE = 100;

  // Difficulty
  var DIFFS = {
    normal:   { name: "Normal",   ban: 850, lives: 300, scale: 1,    dens: 1,    reward: 1 },
    hard:     { name: "Hard",     ban: 700, lives: 200, scale: 1.35, dens: 1.15, reward: 1.25 },
    starship: { name: "Starship", ban: 600, lives: 140, scale: 1.75, dens: 1.3,  reward: 1.55 }
  };
  var difficulty = "normal";

  // State
  var ban = 850, lives = 300, wave = 0, pops = 0, banEarned = 0;
  var running = false, paused = false, gameOver = false;
  var speed = 1;
  var selectedShop = "dart";
  var selectedTower = null;
  var towers = [], threats = [], projectiles = [], particles = [], floats = [], decor = [];
  var spawnQueue = [], spawnTimer = 0, waveActive = false;
  var hover = null, lastTs = 0, animT = 0, toastT = 0, airdropT = 0;
  var totalBuilt = 0, shake = 0;
  var mapCache = null, mapDirty = true;
  var MAX_PARTICLES = 280, MAX_FLOATS = 56, quality = 1;

  // Abilities (cooldowns in seconds, charge via waves)
  var abilities = {
    storm:  { cd: 0, maxCd: 28, cost: 0, charges: 1 },
    freeze: { cd: 0, maxCd: 24, cost: 0, charges: 1 },
    cash:   { cd: 0, maxCd: 35, cost: 0, charges: 1 }
  };

  // Missions
  var mission = null;
  var missionProgress = 0;
  var missionsDone = 0;

  // Audio
  var actx = null;
  function ensureAudio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (actx && actx.state === "suspended") actx.resume();
  }
  function beep(f, d, type, v) {
    if (!actx) return;
    var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = type || "square"; o.frequency.value = f;
    g.gain.setValueAtTime(v || 0.03, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t + d + 0.02);
  }
  function sfxPop() { beep(520 + Math.random() * 380, 0.03, "square", 0.022); }
  function sfxPlace() { beep(320, 0.06, "triangle", 0.035); beep(480, 0.08, "triangle", 0.025); }
  function sfxUp() { beep(520, 0.05, "square", 0.03); beep(780, 0.1, "sine", 0.028); }
  function sfxWave() { beep(240, 0.1, "sawtooth", 0.028); }
  function sfxLeak() { beep(110, 0.18, "sawtooth", 0.04); }
  function sfxWin() { beep(523, 0.1, "square", 0.03); beep(659, 0.12, "square", 0.03); beep(784, 0.22, "triangle", 0.035); }
  function sfxBoss() { beep(80, 0.25, "sawtooth", 0.045); }
  function sfxAbility() { beep(600, 0.08, "sine", 0.04); beep(900, 0.12, "triangle", 0.03); }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
  function isPath(c, r) { return !!pathSet[c + "," + r]; }
  function inBounds(c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS; }

  function posAlong(distAlong) {
    distAlong = clamp(distAlong, 0, pathLen);
    for (var i = 1; i < segLens.length; i++) {
      if (distAlong <= segLens[i]) {
        var segStart = segLens[i - 1];
        var seg = segLens[i] - segStart;
        var t = seg > 0 ? (distAlong - segStart) / seg : 0;
        var a = waypoints[i - 1], b = waypoints[i];
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ang: Math.atan2(b.y - a.y, b.x - a.x) };
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
    for (var i = 0; i < n && particles.length < MAX_PARTICLES; i++) {
      var a = Math.random() * TWO_PI, s = 50 + Math.random() * 180;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
        life: 0.2 + Math.random() * 0.35, age: 0, color: color,
        size: 2 + Math.random() * 3.5, kind: Math.random() < 0.35 ? "peel" : "spark", rot: Math.random() * TWO_PI
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
    toastT = 1.7;
  }
  function confettiBurst() {
    for (var i = 0; i < Math.floor(48 * quality) && particles.length < MAX_PARTICLES; i++) {
      particles.push({
        x: W * 0.5 + (Math.random() - 0.5) * 280, y: H * 0.3,
        vx: (Math.random() - 0.5) * 300, vy: -100 - Math.random() * 220,
        life: 0.7 + Math.random() * 0.5, age: 0,
        color: ["#f5d041", "#86efac", "#f472b6", "#67e8f9", "#fb923c", "#c084fc"][i % 6],
        size: 3 + Math.random() * 4, kind: "spark", rot: 0
      });
    }
  }

  function initDecor() {
    decor = [];
    for (var i = 0; i < 90; i++) {
      var c = (Math.random() * COLS) | 0, r = (Math.random() * ROWS) | 0;
      if (isPath(c, r)) continue;
      decor.push({
        x: c * TW + TW * 0.5 + (Math.random() - 0.5) * 12,
        y: r * TH + TH * 0.55,
        kind: Math.random() < 0.55 ? "tree" : "orb",
        phase: Math.random() * TWO_PI,
        scale: 0.85 + Math.random() * 0.45
      });
    }
    mapDirty = true;
  }

  function getStatsNoAura(t) {
    var d = t.def, range = d.range, auraRof = 0, auraCamo = false, income = 0;
    for (var i = 0; i < t.tier; i++) {
      var u = d.ups[i]; if (!u) continue;
      if (u.range) range += u.range;
      if (u.auraRof) auraRof += u.auraRof;
      if (u.auraCamo) auraCamo = true;
      if (u.income) income += u.income;
    }
    // base farm income
    if (d.farm) income += 25;
    return { range: range, auraRof: auraRof, auraCamo: auraCamo, income: income };
  }

  function getStats(t) {
    var d = t.def;
    var range = d.range, rof = d.rof, pierce = d.pierce, pop = d.pop;
    var splash = d.splash, slow = d.slow, camo = d.camo, lead = d.lead;
    var multishot = d.multishot || 0, auraRof = 0, auraCamo = false, income = d.farm ? 25 : 0;
    for (var i = 0; i < t.tier; i++) {
      var u = d.ups[i]; if (!u) continue;
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
      if (!v.def.support || v.def.farm || v === t) continue;
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

  function interestPreview() {
    //  Bank interest: 10% of BAN, capped
    var cap = difficulty === "starship" ? 400 : difficulty === "hard" ? 300 : 250;
    return Math.min(cap, Math.floor(ban * 0.1));
  }

  function makeLayerThreat(layerId, distAlong, flags) {
    flags = flags || {};
    var L = LAYERS[layerId] || LAYERS.green;
    var sc = DIFFS[difficulty].scale;
    return {
      kind: "layer", layer: L.id, dist: distAlong, x: 0, y: 0, ang: 0,
      r: L.r, speed: L.speed * (flags.speedMul || 1) * (0.92 + sc * 0.08),
      camo: !!flags.camo, regrow: !!flags.regrow, lead: !!flags.lead,
      regrowT: 0, alive: true, hp: 1, maxHp: 1, value: L.value,
      freezeT: 0, slowMul: 1, wobble: Math.random() * TWO_PI, uid: Math.random()
    };
  }

  function makeSpecial(kind, distAlong, scale) {
    var sc = (scale || 1) * DIFFS[difficulty].scale;
    if (kind === "ceramic") {
      return {
        kind: "ceramic", dist: distAlong, x: 0, y: 0, ang: 0, r: 19, speed: 44,
        camo: false, lead: false, alive: true,
        hp: Math.floor(14 * sc), maxHp: Math.floor(14 * sc), value: 16,
        freezeT: 0, slowMul: 1, children: "zebra", childCount: 2, wobble: Math.random() * TWO_PI
      };
    }
    if (kind === "boss") {
      return {
        kind: "boss", dist: distAlong, x: 0, y: 0, ang: 0, r: 32, speed: 24,
        camo: false, lead: true, alive: true,
        hp: Math.floor(260 * sc), maxHp: Math.floor(260 * sc), value: 140,
        freezeT: 0, slowMul: 1, children: "ceramic", childCount: 4, wobble: Math.random() * TWO_PI
      };
    }
    if (kind === "starship") {
      return {
        kind: "starship", dist: distAlong, x: 0, y: 0, ang: 0, r: 40, speed: 16,
        camo: false, lead: true, alive: true,
        hp: Math.floor(800 * sc), maxHp: Math.floor(800 * sc), value: 360,
        freezeT: 0, slowMul: 1, children: "boss", childCount: 2, wobble: Math.random() * TWO_PI
      };
    }
    if (kind === "superstarship") {
      return {
        kind: "superstarship", dist: distAlong, x: 0, y: 0, ang: 0, r: 48, speed: 12,
        camo: false, lead: true, alive: true,
        hp: Math.floor(2000 * sc), maxHp: Math.floor(2000 * sc), value: 900,
        freezeT: 0, slowMul: 1, children: "starship", childCount: 2, wobble: Math.random() * TWO_PI
      };
    }
    return makeLayerThreat("green", distAlong, {});
  }

  function syncThreatPos(th) {
    var p = posAlong(th.dist);
    th.x = p.x; th.y = p.y; th.ang = p.ang;
  }

  function addBan(n, x, y) {
    ban += n; banEarned += n;
    if (x != null) floatTxt(x, y, "+" + n, "#ffe566", 12);
  }

  function popLayerEntity(th, popsLeft, canLead) {
    if (!th.alive || popsLeft <= 0) return popsLeft;
    if (th.kind !== "layer") {
      if (th.lead && !canLead) return 0;
      th.hp -= popsLeft; pops += popsLeft;
      burst(th.x, th.y, "#f5d041", 3 + Math.min(6, popsLeft));
      if (th.hp <= 0) {
        th.alive = false;
        addBan(th.value, th.x, th.y - 12);
        sfxPop();
        shake = Math.max(shake, th.kind === "superstarship" ? 0.5 : th.kind === "starship" ? 0.35 : 0.18);
        trackMission("boss", th.kind);
        var childKind = th.children, n = th.childCount || 1;
        for (var i = 0; i < n; i++) {
          var child;
          if (childKind === "ceramic") child = makeSpecial("ceramic", Math.max(0, th.dist - i * 8));
          else if (childKind === "boss") child = makeSpecial("boss", Math.max(0, th.dist - i * 10));
          else if (childKind === "starship") child = makeSpecial("starship", Math.max(0, th.dist - i * 12));
          else child = makeLayerThreat(childKind || "zebra", Math.max(0, th.dist - i * 6), {});
          syncThreatPos(child); threats.push(child);
        }
        burst(th.x, th.y, th.kind === "superstarship" ? "#38bdf8" : "#fb923c", 24);
        floatTxt(th.x, th.y, th.kind === "superstarship" ? "MEGA POP!" : "POP!", "#fff", 16);
      }
      return 0;
    }
    if (th.lead && !canLead) return popsLeft;
    while (popsLeft > 0 && th.alive) {
      var L = LAYERS[th.layer];
      if (!L) { th.alive = false; break; }
      addBan(L.value, null, null); pops += 1; popsLeft -= 1; sfxPop();
      burst(th.x, th.y, L.color, 5);
      trackMission("pop", th.layer);
      if (L.next) {
        th.layer = L.next;
        var N = LAYERS[th.layer];
        th.r = N.r; th.speed = N.speed * (th.regrow ? 0.95 : 1); th.value = N.value;
      } else {
        th.alive = false;
        floatTxt(th.x, th.y - 8, "POP", L.color, 11);
      }
    }
    return popsLeft;
  }

  function damageAt(x, y, popPower, pierce, splash, slow, canCamo, canLead) {
    var hits = 0, targets = [];
    for (var i = 0; i < threats.length; i++) {
      var th = threats[i];
      if (!th.alive) continue;
      if (th.camo && !canCamo) continue;
      var d = dist(x, y, th.x, th.y);
      if (d <= (splash > 0 ? splash : th.r + 10)) targets.push({ th: th, dist: th.dist });
    }
    if (!targets.length) return 0;
    if (splash > 0) {
      for (var j = 0; j < targets.length; j++) {
        popLayerEntity(targets[j].th, popPower, canLead);
        if (slow > 0) {
          targets[j].th.slowMul = Math.min(targets[j].th.slowMul, 1 - slow);
          targets[j].th.freezeT = Math.max(targets[j].th.freezeT, 1.2);
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
      remainingPierce--; hits++;
    }
    return hits;
  }

  // ── Missions ──
  function rollMission() {
    var pool = [
      { id: "pops", text: "Pop <em>80</em> banana layers this round", need: 80, type: "pop", reward: 120 },
      { id: "cash", text: "Earn <em>200 BAN</em> from pops this round", need: 200, type: "ban", reward: 100 },
      { id: "camo", text: "Destroy <em>12</em> camo bananas", need: 12, type: "camo", reward: 140 },
      { id: "no_leak", text: "Clear the round with <em>0 leaks</em>", need: 1, type: "noleak", reward: 160 },
      { id: "boss", text: "Crush a <em>boss-class</em> banana", need: 1, type: "boss", reward: 180 }
    ];
    mission = pool[(Math.random() * pool.length) | 0];
    missionProgress = 0;
    mission._banStart = banEarned;
    mission._leaked = false;
    updateMissionUI();
  }

  function trackMission(kind, detail) {
    if (!mission || !waveActive) return;
    if (mission.type === "pop" && kind === "pop") missionProgress++;
    if (mission.type === "camo" && kind === "pop" && detail) {
      // counted in leak? actually we need camo flag - track when popping camo threats
    }
    if (mission.type === "boss" && kind === "boss") {
      if (detail === "boss" || detail === "starship" || detail === "superstarship") missionProgress = 1;
    }
    updateMissionUI();
  }

  function noteCamoPop() {
    if (mission && mission.type === "camo" && waveActive) {
      missionProgress++;
      updateMissionUI();
    }
  }

  // patch popLayer for camo tracking
  var _popLayerEntity = popLayerEntity;
  popLayerEntity = function (th, popsLeft, canLead) {
    var wasAlive = th.alive;
    var wasCamo = th.camo;
    var left = _popLayerEntity(th, popsLeft, canLead);
    if (wasAlive && wasCamo && (!th.alive || th.kind === "layer")) noteCamoPop();
    return left;
  };

  function updateMissionUI() {
    if (!missionBox) return;
    if (!mission) {
      missionBox.innerHTML = "Complete rounds to unlock side missions for bonus BAN.";
      return;
    }
    var prog = missionProgress;
    if (mission.type === "ban") prog = Math.max(0, banEarned - (mission._banStart || 0));
    if (mission.type === "noleak") prog = mission._leaked ? 0 : 1;
    var need = mission.need;
    var done = mission.type === "noleak" ? !mission._leaked && !waveActive && prog : prog >= need;
    missionBox.innerHTML = mission.text + "<br><em>" + Math.min(prog, need) + " / " + need + "</em>" +
      (done && !waveActive ? " · ✅ Ready to claim on clear" : "") +
      " · Reward <em>" + mission.reward + " BAN</em>";
  }

  function completeMissionIfAny() {
    if (!mission) return 0;
    var prog = missionProgress;
    if (mission.type === "ban") prog = Math.max(0, banEarned - (mission._banStart || 0));
    var ok = false;
    if (mission.type === "noleak") ok = !mission._leaked;
    else ok = prog >= mission.need;
    if (ok) {
      var reward = Math.floor(mission.reward * DIFFS[difficulty].reward);
      addBan(reward, W / 2, 140);
      showToast("MISSION COMPLETE · +" + reward + " BAN");
      missionsDone++;
      confettiBurst();
      mission = null;
      return reward;
    }
    mission = null;
    updateMissionUI();
    return 0;
  }

  // ── Waves (100) ──
  function buildWave(n) {
    var q = [];
    var dens = DIFFS[difficulty].dens;
    var scale = 1 + Math.max(0, n - 40) * 0.04;

    function add(layer, count, gap, flags) {
      count = Math.max(1, Math.round(count * dens));
      for (var i = 0; i < count; i++) q.push({ t: layer, gap: gap / dens, flags: flags || {} });
    }
    function addSpecial(kind, count, gap) {
      for (var i = 0; i < count; i++) q.push({ t: kind, special: true, gap: gap, scale: scale });
    }

    if (n <= 4) add("green", 12 + n * 6, 0.48);
    else if (n <= 8) { add("green", 14, 0.36); add("ripe", 12 + n, 0.4); }
    else if (n <= 12) { add("ripe", 16, 0.3); add("gold", 12, 0.34); add("green", 10, 0.26); }
    else if (n <= 18) {
      add("gold", 18, 0.26); add("purple", 12, 0.3); add("ripe", 14, 0.24);
      if (n >= 14) add("ripe", 10, 0.26, { camo: true });
    } else if (n <= 25) {
      add("purple", 18, 0.22); add("star", 12, 0.28); add("gold", 16, 0.2);
      add("ripe", 12, 0.24, { camo: true }); add("gold", 8, 0.3, { regrow: true });
      if (n === 20 || n === 25) addSpecial("boss", 1, 1.1);
    } else if (n <= 35) {
      add("star", 20, 0.18); add("zebra", 8, 0.28); addSpecial("ceramic", 3 + (n - 25), 0.65);
      add("gold", 14, 0.2, { camo: true }); add("purple", 10, 0.24, { regrow: true });
      if (n % 5 === 0) addSpecial("boss", 1, 0.95);
    } else if (n <= 50) {
      addSpecial("ceramic", 8, 0.42); add("zebra", 16, 0.16); add("star", 24, 0.14, { camo: true });
      addSpecial("boss", 1 + ((n - 36) / 7 | 0), 0.9);
      if (n === 40 || n === 50) addSpecial("starship", 1, 1.2);
      for (var L = 0; L < 6; L++) q.push({ t: "gold", gap: 0.38, flags: { lead: true } });
    } else if (n <= 70) {
      addSpecial("ceramic", 14, 0.3); add("zebra", 22, 0.12, { camo: true, regrow: true });
      addSpecial("boss", 2, 0.75); addSpecial("starship", 1 + ((n - 50) / 10 | 0), 1.05);
      if (n === 60 || n === 70) addSpecial("superstarship", 1, 1.25);
      for (var L2 = 0; L2 < 10; L2++) q.push({ t: "purple", gap: 0.3, flags: { lead: true, camo: true } });
    } else if (n <= 90) {
      addSpecial("ceramic", 18, 0.24); add("zebra", 30, 0.1, { camo: true, regrow: true });
      addSpecial("boss", 3, 0.6); addSpecial("starship", 2, 0.85);
      if (n % 10 === 0) addSpecial("superstarship", 1, 1.3);
      for (var L3 = 0; L3 < 12; L3++) q.push({ t: "zebra", gap: 0.22, flags: { lead: true, camo: true } });
    } else {
      addSpecial("ceramic", 24, 0.2); add("zebra", 40, 0.08, { camo: true, regrow: true });
      addSpecial("boss", 4, 0.5); addSpecial("starship", 3, 0.7);
      addSpecial("superstarship", n === 100 ? 3 : 1, 1.4 + (n - 90) * 0.08);
      for (var L4 = 0; L4 < 16; L4++) q.push({ t: "zebra", gap: 0.18, flags: { lead: true, camo: true, regrow: true } });
    }
    if (n >= 18 && n < 55 && n % 4 === 0) {
      for (var li = 0; li < 6; li++) q.push({ t: "gold", gap: 0.4, flags: { lead: true } });
    }
    return q;
  }

  function startWave() {
    if (!running || gameOver || paused || waveActive || wave >= MAX_WAVE) return;
    wave += 1;
    spawnQueue = buildWave(wave);
    spawnTimer = 0.3;
    waveActive = true;
    airdropT = 6 + Math.random() * 12;
    if (wave % 5 === 1) rollMission();
    else if (!mission) rollMission();

    var label = "WAVE " + wave;
    if (wave === 20) label = "BOSS · MEGA BUNCH";
    if (wave === 40) label = "STARSHIP INBOUND";
    if (wave === 60) label = "FULL STACK ASSAULT";
    if (wave === 80) label = "ORBITAL SIEGE";
    if (wave === 100) label = "FINAL · RAPTOR PROTOCOL";
    showToast(label);
    if (wave === 40 || wave === 60 || wave === 100) sfxBoss(); else sfxWave();
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
    var t = { c: c, r: r, x: c * TW + TW / 2, y: r * TH + TH / 2, def: def, tier: 0, cd: 0, angle: 0 };
    towers.push(t); selectedTower = t; totalBuilt++;
    sfxPlace(); burst(t.x, t.y, def.color, 10);
    floatTxt(t.x, t.y - 16, "-" + def.cost, "#f5d041");
    refreshUI();
  }

  function upgradeTower() {
    if (!selectedTower || gameOver) return;
    var t = selectedTower;
    if (t.tier >= MAX_TIER) return;
    var cost = t.def.upCost[t.tier];
    if (ban < cost) return;
    ban -= cost; t.tier++;
    sfxUp(); burst(t.x, t.y, t.def.color, 16);
    floatTxt(t.x, t.y - 18, t.def.ups[t.tier - 1].name, "#86efac", 12);
    if (t.tier >= MAX_TIER) { confettiBurst(); floatTxt(t.x, t.y - 32, "MAX PATH", "#f472b6", 14); }
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
    beep(200, 0.08, "triangle", 0.03);
    refreshUI();
  }

  // Abilities
  function useStorm() {
    if (!running || gameOver || paused || abilities.storm.cd > 0) return;
    abilities.storm.cd = abilities.storm.maxCd;
    sfxAbility();
    showToast("⚡ PEEL STORM");
    shake = 0.35;
    for (var i = 0; i < threats.length; i++) {
      var th = threats[i];
      if (!th.alive) continue;
      popLayerEntity(th, th.kind === "layer" ? 3 : 18, true);
      burst(th.x, th.y, "#f5d041", 6);
    }
    confettiBurst();
    refreshUI();
  }
  function useFreeze() {
    if (!running || gameOver || paused || abilities.freeze.cd > 0) return;
    abilities.freeze.cd = abilities.freeze.maxCd;
    sfxAbility();
    showToast("🧊 CRYO RAIN");
    for (var i = 0; i < threats.length; i++) {
      if (!threats[i].alive) continue;
      threats[i].slowMul = 0.25;
      threats[i].freezeT = Math.max(threats[i].freezeT, 3.5);
      burst(threats[i].x, threats[i].y, "#67e8f9", 4);
    }
    refreshUI();
  }
  function useCash() {
    if (!running || gameOver || paused || abilities.cash.cd > 0) return;
    abilities.cash.cd = abilities.cash.maxCd;
    sfxAbility();
    var drop = 180 + wave * 4 + missionsDone * 15;
    addBan(drop, W / 2, 90);
    showToast("🪂 EMERGENCY DROP +" + drop);
    confettiBurst();
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
        if (th.kind !== "layer") score += 90;
        else score += LAYER_ORDER.indexOf(th.layer) * 12;
      }
      if (score > bestScore) { bestScore = score; best = th; }
    }
    return best;
  }

  function fire(tower, target, st) {
    var shots = 1 + (st.multishot || 0);
    var baseSpd = tower.def.boomerang ? 240 : tower.def.rail ? 680 : 420;
    for (var s = 0; s < shots; s++) {
      var ang = Math.atan2(target.y - tower.y, target.x - tower.x) + (s - (shots - 1) / 2) * 0.1;
      tower.angle = ang;
      if (tower.def.freezePulse) {
        damageAt(tower.x, tower.y, st.pop, 99, st.splash || st.range * 0.72, st.slow, st.camo, st.lead);
        burst(tower.x, tower.y, "#67e8f9", 8);
        continue;
      }
      if (tower.def.farm) continue;
      projectiles.push({
        x: tower.x, y: tower.y,
        vx: Math.cos(ang) * baseSpd, vy: Math.sin(ang) * baseSpd,
        life: tower.def.boomerang ? 1.5 : tower.def.rail ? 0.55 : 0.9,
        age: 0, pierceLeft: st.pierce, pop: st.pop, splash: st.splash, slow: st.slow,
        camo: st.camo, lead: st.lead, color: tower.def.color,
        boomer: !!tower.def.boomerang, rail: !!tower.def.rail,
        home: tower.def.boomerang ? { x: tower.x, y: tower.y } : null,
        phase: 0, hitIds: {}, kind: tower.def.id, trail: []
      });
    }
    beep(tower.def.rail ? 90 : tower.def.id === "bomb" ? 120 : 400, 0.025, "square", 0.015);
  }

  function update(dt) {
    animT += dt;
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) toast.classList.remove("show"); }
    if (shake > 0) shake = Math.max(0, shake - dt * 2.2);

    // ability CDs always tick while running
    if (running && !gameOver && !paused) {
      ["storm", "freeze", "cash"].forEach(function (k) {
        if (abilities[k].cd > 0) abilities[k].cd = Math.max(0, abilities[k].cd - dt);
      });
    }

    if (!running || gameOver || paused) return;

    var load = threats.length + projectiles.length;
    quality = load > 120 ? 0.4 : load > 70 ? 0.65 : 1;
    var d = dt * speed;

    if (waveActive && spawnQueue.length) {
      spawnTimer -= d;
      if (spawnTimer <= 0) {
        var item = spawnQueue.shift();
        spawnOne(item);
        spawnTimer = item.gap || 0.35;
      }
    }

    if (waveActive && airdropT > 0) {
      airdropT -= d;
      if (airdropT <= 0) {
        var drop = 40 + ((Math.random() * 80) | 0) + Math.floor(wave * 0.8);
        for (var vi = 0; vi < towers.length; vi++) {
          if (towers[vi].def.support) drop += getStats(towers[vi]).income || 0;
        }
        drop = Math.floor(drop * DIFFS[difficulty].reward);
        addBan(drop, W / 2, 80);
        showToast("🪂 AIRDROP +" + drop + " BAN");
        confettiBurst();
      }
    }

    for (var i = threats.length - 1; i >= 0; i--) {
      var th = threats[i];
      if (!th.alive) { threats.splice(i, 1); continue; }
      if (th.freezeT > 0) th.freezeT -= d;
      var spd = th.speed * (th.freezeT > 0 ? th.slowMul : 1);
      if (th.freezeT <= 0) th.slowMul = 1;
      th.dist += spd * d;
      th.wobble += d * 4;
      syncThreatPos(th);

      if (th.regrow && th.kind === "layer" && th.layer !== "zebra") {
        th.regrowT += d;
        if (th.regrowT > 3.0) {
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
        th.alive = false; threats.splice(i, 1);
        var loss = 1;
        if (th.kind === "superstarship") loss = 90;
        else if (th.kind === "starship") loss = 60;
        else if (th.kind === "boss") loss = 30;
        else if (th.kind === "ceramic") loss = 14;
        else if (th.kind === "layer") loss = LAYER_ORDER.indexOf(th.layer) + 1;
        lives -= loss;
        if (mission) mission._leaked = true;
        sfxLeak(); shake = Math.max(shake, 0.22);
        floatTxt(th.x, th.y, "-" + loss + " ❤️", "#f87171", 14);
        if (lives <= 0) { lives = 0; endLose(); return; }
        refreshUI();
      }
    }

    for (var t = 0; t < towers.length; t++) {
      var tower = towers[t];
      if (tower.def.farm) continue;
      if (tower.def.support && !tower.def.freezePulse) continue;
      var st = getStats(tower);
      if (tower.def.support && tower.def.freezePulse) {
        // chill still fires
      } else if (tower.def.support) continue;
      if (tower.cd > 0) tower.cd -= d;
      if (tower.cd <= 0) {
        var target = findTarget(tower, st);
        if (target) { fire(tower, target, st); tower.cd = st.rof; }
      }
    }

    for (var p = projectiles.length - 1; p >= 0; p--) {
      var pr = projectiles[p];
      pr.age += d;
      if (quality > 0.55 && pr.trail) {
        pr.trail.push({ x: pr.x, y: pr.y });
        if (pr.trail.length > 7) pr.trail.shift();
      }
      if (pr.boomer) {
        pr.phase += d;
        if (pr.phase < 0.55) { pr.x += pr.vx * d; pr.y += pr.vy * d; }
        else {
          var hx = pr.home.x - pr.x, hy = pr.home.y - pr.y;
          var hd = Math.sqrt(hx * hx + hy * hy) || 1;
          pr.x += (hx / hd) * 300 * d; pr.y += (hy / hd) * 300 * d;
          if (hd < 12) pr.age = pr.life;
        }
      } else { pr.x += pr.vx * d; pr.y += pr.vy * d; }

      for (var ti = 0; ti < threats.length; ti++) {
        var th2 = threats[ti];
        if (!th2.alive || (th2.camo && !pr.camo) || pr.hitIds[ti]) continue;
        if (dist(pr.x, pr.y, th2.x, th2.y) <= th2.r + (pr.rail ? 14 : 9)) {
          pr.hitIds[ti] = true;
          if (pr.splash > 0) {
            damageAt(pr.x, pr.y, pr.pop, 99, pr.splash, pr.slow, pr.camo, pr.lead);
            if (pr.rail) shake = Math.max(shake, 0.12);
            pr.age = pr.life; break;
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
      if (pr.age >= pr.life || pr.x < -60 || pr.y < -60 || pr.x > W + 60 || pr.y > H + 60) projectiles.splice(p, 1);
    }

    for (var n = particles.length - 1; n >= 0; n--) {
      var pt = particles[n];
      pt.age += d; pt.x += pt.vx * d; pt.y += pt.vy * d; pt.vy += 240 * d; pt.rot += d * 8;
      if (pt.age >= pt.life) particles.splice(n, 1);
    }
    for (var f = floats.length - 1; f >= 0; f--) {
      floats[f].age += d; floats[f].y -= 34 * d;
      if (floats[f].age >= floats[f].life) floats.splice(f, 1);
    }

    if (waveActive && spawnQueue.length === 0 && threats.length === 0) {
      waveActive = false;
      var bonus = 60 + wave * 7 + Math.floor(wave * wave * 0.06);
      for (var vj = 0; vj < towers.length; vj++) {
        if (towers[vj].def.support) bonus += getStats(towers[vj]).income || 0;
      }
      var interest = interestPreview();
      bonus = Math.floor(bonus * DIFFS[difficulty].reward);
      addBan(bonus, W / 2, 100);
      if (interest > 0) addBan(interest, W / 2, 130);
      completeMissionIfAny();
      showToast("ROUND CLEAR · +" + bonus + " BAN" + (interest ? " · 💰 +" + interest : ""));
      if (wave % 5 === 0) confettiBurst();
      // refund a bit of ability CD on clear
      abilities.storm.cd = Math.max(0, abilities.storm.cd - 8);
      abilities.freeze.cd = Math.max(0, abilities.freeze.cd - 8);
      abilities.cash.cd = Math.max(0, abilities.cash.cd - 6);
      refreshUI();
      if (wave >= MAX_WAVE) endWin();
    }
  }

  // ── Draw (banana shapes + cached map) ──
  function drawBananaShape(x, y, r, fill, stroke, tip, ang, lead, camo) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.sin(animT * 3 + x * 0.01) * 0.08);
    ctx.globalAlpha = camo ? 0.5 : 1;
    ctx.beginPath();
    ctx.ellipse(2, r * 0.55, r * 0.7, r * 0.28, 0.2, 0, TWO_PI);
    ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.15, -r * 0.95);
    ctx.bezierCurveTo(r * 0.95, -r * 0.7, r * 1.05, r * 0.55, r * 0.1, r * 0.95);
    ctx.bezierCurveTo(r * 0.55, r * 0.35, r * 0.45, -r * 0.35, -r * 0.15, -r * 0.95);
    ctx.closePath();
    var grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, tip || fill); grad.addColorStop(0.45, fill); grad.addColorStop(1, stroke);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.05, -r * 0.55);
    ctx.bezierCurveTo(r * 0.35, -r * 0.4, r * 0.4, r * 0.05, r * 0.15, r * 0.35);
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, -r * 0.92);
    ctx.lineTo(-r * 0.22, -r * 1.15);
    ctx.lineTo(r * 0.05, -r * 0.95);
    ctx.fillStyle = "#3f2a14"; ctx.fill();
    if (lead) {
      ctx.strokeStyle = "rgba(148,163,184,0.95)"; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      for (var i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.3 + i * r * 0.35, 1.6, 0, TWO_PI); ctx.fill();
      }
    }
    if (fill === "#f8fafc") {
      // zebra stripes
      ctx.strokeStyle = "rgba(15,23,42,0.55)"; ctx.lineWidth = 2;
      for (var z = 0; z < 4; z++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.1, -r * 0.6 + z * r * 0.35);
        ctx.quadraticCurveTo(r * 0.4, -r * 0.5 + z * r * 0.35, r * 0.55, -r * 0.2 + z * r * 0.3);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function buildMapCache() {
    if (!mapCache) { mapCache = document.createElement("canvas"); mapCache.width = W; mapCache.height = H; }
    var m = mapCache.getContext("2d");
    var bg = m.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#143d28"); bg.addColorStop(0.5, "#1f5a36"); bg.addColorStop(1, "#0f2e1f");
    m.fillStyle = bg; m.fillRect(0, 0, W, H);

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = c * TW, y = r * TH;
        if (isPath(c, r)) m.fillStyle = (c + r) % 2 ? "rgba(196,165,116,0.5)" : "rgba(180,140,90,0.45)";
        else m.fillStyle = (c + r) % 2 ? "rgba(55,150,78,0.42)" : "rgba(38,120,58,0.38)";
        m.fillRect(x, y, TW + 0.5, TH + 0.5);
      }
    }

    m.lineCap = "round"; m.lineJoin = "round";
    m.strokeStyle = "rgba(55, 35, 15, 0.55)"; m.lineWidth = Math.min(TW, TH) * 0.82;
    m.beginPath();
    for (var i = 0; i < waypoints.length; i++) {
      if (i === 0) m.moveTo(waypoints[i].x, waypoints[i].y); else m.lineTo(waypoints[i].x, waypoints[i].y);
    }
    m.stroke();
    m.strokeStyle = "rgba(210, 170, 105, 0.95)"; m.lineWidth = Math.min(TW, TH) * 0.6;
    m.beginPath();
    for (i = 0; i < waypoints.length; i++) {
      if (i === 0) m.moveTo(waypoints[i].x, waypoints[i].y); else m.lineTo(waypoints[i].x, waypoints[i].y);
    }
    m.stroke();
    m.strokeStyle = "rgba(245, 208, 65, 0.38)"; m.lineWidth = 2.5; m.setLineDash([12, 14]);
    m.beginPath();
    for (i = 0; i < waypoints.length; i++) {
      if (i === 0) m.moveTo(waypoints[i].x, waypoints[i].y); else m.lineTo(waypoints[i].x, waypoints[i].y);
    }
    m.stroke(); m.setLineDash([]);

    for (var d = 0; d < decor.length; d++) {
      var de = decor[d];
      if (de.kind !== "tree") continue;
      m.save(); m.translate(de.x, de.y); m.scale(de.scale, de.scale);
      m.fillStyle = "#5b3a1a"; m.fillRect(-3, -4, 6, 16);
      m.beginPath(); m.arc(0, -10, 12, 0, TWO_PI); m.arc(-8, -4, 9, 0, TWO_PI); m.arc(8, -4, 9, 0, TWO_PI);
      m.fillStyle = "#1f7a3a"; m.fill();
      m.beginPath(); m.arc(-2, -12, 6, 0, TWO_PI); m.fillStyle = "#2f9e4f"; m.fill();
      m.fillStyle = "#f5d041"; m.beginPath(); m.ellipse(6, -6, 3, 5, 0.5, 0, TWO_PI); m.fill();
      m.restore();
    }
    mapDirty = false;
  }

  function drawMapLive() {
    if (mapDirty || !mapCache) buildMapCache();
    ctx.drawImage(mapCache, 0, 0);
    for (var d = 0; d < decor.length; d++) {
      var de = decor[d];
      if (de.kind !== "orb") continue;
      var bob = Math.sin(animT * 2.2 + de.phase) * 4;
      var glow = 0.45 + Math.sin(animT * 3 + de.phase) * 0.25;
      ctx.beginPath(); ctx.arc(de.x, de.y + bob, 5, 0, TWO_PI);
      ctx.fillStyle = "rgba(245,208,65," + glow + ")"; ctx.fill();
      ctx.beginPath(); ctx.arc(de.x, de.y + bob, 11, 0, TWO_PI);
      ctx.fillStyle = "rgba(245,208,65,0.12)"; ctx.fill();
    }
    var sp = waypoints[0], core = waypoints[waypoints.length - 1];
    var pulse = 12 + Math.sin(animT * 4) * 3;
    ctx.beginPath(); ctx.arc(sp.x, sp.y, pulse + 10, 0, TWO_PI);
    ctx.fillStyle = "rgba(168,85,247,0.18)"; ctx.fill();
    ctx.beginPath(); ctx.arc(sp.x, sp.y, pulse, 0, TWO_PI);
    ctx.strokeStyle = "rgba(192,132,252,0.85)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#e9d5ff"; ctx.font = "bold 12px Fredoka, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("SPAWN", sp.x, sp.y);

    var cg = 22 + Math.sin(animT * 3) * 3;
    ctx.beginPath(); ctx.arc(core.x, core.y, cg + 14, 0, TWO_PI);
    ctx.fillStyle = "rgba(245,208,65,0.16)"; ctx.fill();
    ctx.beginPath(); ctx.arc(core.x, core.y, cg, 0, TWO_PI);
    var coreGrad = ctx.createRadialGradient(core.x - 5, core.y - 5, 2, core.x, core.y, cg);
    coreGrad.addColorStop(0, "#ffe566"); coreGrad.addColorStop(0.55, "#f5d041"); coreGrad.addColorStop(1, "#c9a227");
    ctx.fillStyle = coreGrad; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#1a1400"; ctx.font = "bold 11px Fredoka, sans-serif"; ctx.fillText("CORE", core.x, core.y);
  }

  function drawHover() {
    if (!hover || !running || gameOver || selectedTower) return;
    var def = TOWER_BY_ID[selectedShop]; if (!def) return;
    var c = hover.c, r = hover.r;
    var valid = inBounds(c, r) && !isPath(c, r) && !towerAt(c, r);
    ctx.fillStyle = valid ? "rgba(255,229,102,0.28)" : "rgba(248,113,113,0.32)";
    ctx.fillRect(c * TW + 2, r * TH + 2, TW - 4, TH - 4);
    if (valid) {
      ctx.beginPath(); ctx.arc(c * TW + TW / 2, r * TH + TH / 2, def.range, 0, TWO_PI);
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function drawMonkey(t) {
    var st = getStats(t), sel = t === selectedTower;
    if (sel) {
      ctx.beginPath(); ctx.arc(t.x, t.y, st.range, 0, TWO_PI);
      ctx.fillStyle = "rgba(255,229,102,0.07)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,229,102,0.5)"; ctx.lineWidth = 2; ctx.stroke();
    }
    if (t.def.support && !t.def.farm) {
      ctx.beginPath(); ctx.arc(t.x, t.y, st.range, 0, TWO_PI);
      ctx.strokeStyle = "rgba(192,132,252,0.28)"; ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]);
    }
    var scale = 1 + t.tier * 0.055;
    ctx.save(); ctx.translate(t.x, t.y); ctx.scale(scale, scale);
    ctx.beginPath(); ctx.ellipse(0, 13, 14, 5, 0, 0, TWO_PI); ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 5, 15, 0, TWO_PI); ctx.fillStyle = "#4a3018"; ctx.fill();
    ctx.strokeStyle = t.def.color; ctx.lineWidth = sel ? 3 : 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -2, 13, 0, TWO_PI);
    var face = ctx.createRadialGradient(-3, -5, 2, 0, 0, 14);
    face.addColorStop(0, "#e2c08a"); face.addColorStop(1, "#b8894e");
    ctx.fillStyle = face; ctx.fill(); ctx.strokeStyle = "#3b2a1a"; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath(); ctx.arc(-12, -6, 5, 0, TWO_PI); ctx.arc(12, -6, 5, 0, TWO_PI);
    ctx.fillStyle = "#c4a574"; ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-4, -4, 3.3, 0, TWO_PI); ctx.arc(4, -4, 3.3, 0, TWO_PI); ctx.fill();
    var look = Math.cos(t.angle) * 1.1;
    ctx.fillStyle = "#111"; ctx.beginPath();
    ctx.arc(-3.5 + look, -4, 1.6, 0, TWO_PI); ctx.arc(4.5 + look, -4, 1.6, 0, TWO_PI); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 1, 4.5, 0.2, Math.PI - 0.2);
    ctx.strokeStyle = "#3b2a1a"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.font = "13px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var badge = { sniper: "🎯", bomb: "💣", ice: "🧊", village: "🏠", super: "🦸", boomer: "🪃", battery: "🚀", dart: "🍌", farm: "🌴" };
    ctx.fillText(badge[t.def.id] || "🍌", 0, -18);
    for (var p = 0; p < t.tier; p++) {
      ctx.beginPath(); ctx.arc(-12 + p * 6, 15, 2.4, 0, TWO_PI);
      ctx.fillStyle = t.def.color; ctx.fill();
    }
    if (!t.def.support && !t.def.freezePulse && !t.def.farm) {
      ctx.rotate(t.angle);
      if (t.def.rail) {
        ctx.fillStyle = "#38bdf8"; ctx.fillRect(6, -2.5, 18 + t.tier * 2, 5);
        ctx.fillStyle = "#e0f2fe"; ctx.fillRect(20 + t.tier, -1.5, 8, 3);
      } else {
        ctx.fillStyle = t.def.color; ctx.fillRect(8, -3, 12 + t.tier * 2, 6);
      }
    }
    if (t.def.farm) {
      ctx.fillStyle = "rgba(132,204,22,0.25)";
      ctx.beginPath(); ctx.arc(0, 0, 18, 0, TWO_PI); ctx.fill();
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
        ctx.font = "10px serif"; ctx.textAlign = "center"; ctx.globalAlpha = th.camo ? 0.5 : 1;
        ctx.fillText("♻️", th.x + th.r * 0.55, th.y - th.r * 0.55); ctx.globalAlpha = 1;
      }
    } else {
      var col = th.kind === "ceramic" ? "#d6d3d1" : th.kind === "boss" ? "#a855f7" : th.kind === "starship" ? "#f472b6" : "#38bdf8";
      var stroke = th.kind === "ceramic" ? "#57534e" : th.kind === "boss" ? "#4c1d95" : th.kind === "starship" ? "#9d174d" : "#0c4a6e";
      var label = th.kind === "ceramic" ? null : th.kind === "boss" ? "MEGA" : th.kind === "starship" ? "SHIP" : "STACK";
      drawBananaShape(th.x, th.y, th.r, col, stroke, "#fff", ang, th.lead, false);
      ctx.beginPath(); ctx.ellipse(th.x, th.y, th.r * 0.95, th.r * 1.05, ang, 0, TWO_PI);
      ctx.strokeStyle = th.kind === "ceramic" ? "rgba(120,113,108,0.9)" : "rgba(255,255,255,0.35)";
      ctx.lineWidth = th.kind === "ceramic" ? 4 : 2.5; ctx.stroke();
      if (label) {
        ctx.font = "bold 10px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 3; ctx.strokeText(label, th.x, th.y);
        ctx.fillStyle = "#fff"; ctx.fillText(label, th.x, th.y);
      }
      var bw = th.r * 2.1, pct = clamp(th.hp / th.maxHp, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(th.x - bw / 2, th.y - th.r - 12, bw, 5);
      ctx.fillStyle = pct > 0.5 ? "#86efac" : pct > 0.25 ? "#facc15" : "#f87171";
      ctx.fillRect(th.x - bw / 2, th.y - th.r - 12, bw * pct, 5);
    }
    if (th.freezeT > 0) {
      ctx.strokeStyle = "rgba(103,232,249,0.85)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(th.x, th.y, th.r + 5, 0, TWO_PI); ctx.stroke();
    }
  }

  function drawProjectiles() {
    for (var i = 0; i < projectiles.length; i++) {
      var pr = projectiles[i];
      if (pr.trail && pr.trail.length > 1) {
        ctx.strokeStyle = pr.rail ? "rgba(56,189,248,0.45)" : "rgba(245,208,65,0.3)";
        ctx.lineWidth = pr.rail ? 3 : 2; ctx.beginPath();
        for (var t = 0; t < pr.trail.length; t++) {
          if (t === 0) ctx.moveTo(pr.trail[t].x, pr.trail[t].y); else ctx.lineTo(pr.trail[t].x, pr.trail[t].y);
        }
        ctx.stroke();
      }
      if (pr.kind === "dart" || pr.kind === "super" || pr.kind === "sniper") {
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(Math.atan2(pr.vy, pr.vx));
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.quadraticCurveTo(0, -4, -8, -1); ctx.quadraticCurveTo(0, 4, 8, 0);
        ctx.fillStyle = pr.color; ctx.fill(); ctx.restore();
      } else if (pr.kind === "boomer") {
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(animT * 14);
        ctx.strokeStyle = pr.color; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(0, 0, 8, 0.2, Math.PI - 0.2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 8, Math.PI + 0.2, TWO_PI - 0.2); ctx.stroke();
        ctx.restore();
      } else if (pr.kind === "bomb") {
        ctx.beginPath(); ctx.arc(pr.x, pr.y, 7, 0, TWO_PI); ctx.fillStyle = "#1a1a1a"; ctx.fill();
        ctx.beginPath(); ctx.arc(pr.x - 1, pr.y - 1, 2.5, 0, TWO_PI); ctx.fillStyle = "#f97316"; ctx.fill();
      } else if (pr.kind === "battery" || pr.rail) {
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(Math.atan2(pr.vy, pr.vx));
        ctx.fillStyle = "#38bdf8"; ctx.shadowColor = "#38bdf8"; ctx.shadowBlur = 12;
        ctx.fillRect(-10, -2, 20, 4); ctx.fillStyle = "#e0f2fe"; ctx.fillRect(4, -1.5, 10, 3);
        ctx.shadowBlur = 0; ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(pr.x, pr.y, 5, 0, TWO_PI); ctx.fillStyle = pr.color; ctx.fill();
      }
    }
  }

  function drawFX() {
    for (var i = 0; i < particles.length; i++) {
      var pt = particles[i], a = 1 - pt.age / pt.life;
      ctx.globalAlpha = a;
      if (pt.kind === "peel") {
        ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot || 0);
        ctx.beginPath(); ctx.ellipse(0, 0, 4, 7, 0.3, 0, TWO_PI); ctx.fillStyle = pt.color; ctx.fill(); ctx.restore();
      } else {
        ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * a, 0, TWO_PI); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (var f = 0; f < floats.length; f++) {
      var fl = floats[f];
      ctx.globalAlpha = 1 - fl.age / fl.life;
      ctx.font = "700 " + fl.size + "px Fredoka, sans-serif"; ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineWidth = 3; ctx.strokeText(fl.text, fl.x, fl.y);
      ctx.fillStyle = fl.color; ctx.fillText(fl.text, fl.x, fl.y);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var sx = 0, sy = 0;
    if (shake > 0) { sx = (Math.random() - 0.5) * shake * 16; sy = (Math.random() - 0.5) * shake * 16; }
    ctx.translate(sx, sy);
    ctx.fillStyle = "#143d28"; ctx.fillRect(-12, -12, W + 24, H + 24);
    drawMapLive(); drawHover();
    for (var t = 0; t < towers.length; t++) drawMonkey(towers[t]);
    for (var i = 0; i < threats.length; i++) drawThreat(threats[i]);
    drawProjectiles(); drawFX();
    var vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.82);
    vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = vig; ctx.fillRect(-12, -12, W + 24, H + 24);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = (ts - lastTs) / 1000; lastTs = ts;
    if (dt > 0.05) dt = 0.05;
    update(dt); draw();
    requestAnimationFrame(loop);
  }

  // UI
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
        return function () { selectedShop = id; selectedTower = null; refreshUI(); };
      })(d.id));
      shopEl.appendChild(b);
    }
  }

  function refreshAbilities() {
    function label(btn, key, name) {
      if (!btn) return;
      var a = abilities[key];
      var ready = a.cd <= 0 && running && !gameOver && !paused;
      btn.disabled = !ready;
      btn.classList.toggle("ready", ready);
      btn.textContent = ready ? name : name + " " + Math.ceil(a.cd) + "s";
    }
    label(btnAbilityStorm, "storm", "⚡ Storm");
    label(btnAbilityFreeze, "freeze", "🧊 Cryo");
    label(btnAbilityCash, "cash", "🪂 Drop");
  }

  function refreshUI() {
    hudBan.textContent = String(Math.floor(ban));
    hudLives.textContent = String(Math.max(0, lives));
    hudWave.textContent = String(wave);
    if (hudWaveMax) hudWaveMax.textContent = String(MAX_WAVE);
    hudPops.textContent = String(pops);
    if (hudInterest) hudInterest.textContent = "💰 +" + interestPreview();
    if (hudMapName) hudMapName.textContent = MAPS[currentMap].short + " · " + DIFFS[difficulty].name;
    buildShop();
    refreshAbilities();
    updateMissionUI();

    if (selectedTower) {
      var t = selectedTower, st = getStats(t);
      var next = t.tier < MAX_TIER ? t.def.ups[t.tier] : null;
      var cost = t.tier < MAX_TIER ? t.def.upCost[t.tier] : 0;
      var html = "<strong>" + t.def.icon + " " + t.def.name + "</strong> · Tier " + t.tier + "/" + MAX_TIER + "<br>" + t.def.desc + "<br>";
      if (t.def.farm) html += "Farm income " + st.income + " BAN / round";
      else if (!t.def.support || t.def.freezePulse) {
        html += "Range " + Math.floor(st.range) + " · Pop " + st.pop + " · Pierce " + st.pierce;
        if (st.splash) html += " · Splash " + Math.floor(st.splash);
        if (st.camo) html += " · 👁️";
        if (st.lead) html += " · 🔩";
      } else html += "Aura " + Math.floor(st.range) + (st.income ? " · Income +" + st.income : "");
      if (next) html += "<br>Next: <strong>" + next.name + "</strong> — " + next.desc + " (" + cost + ")";
      else html += "<br>⭐ Max path — Raptor ready.";
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
      btnUp.disabled = true; btnUp.textContent = "Upgrade";
      btnSell.disabled = true; btnSell.textContent = "Sell";
    }
    btnWave.disabled = !running || gameOver || paused || waveActive || wave >= MAX_WAVE;
  }

  function resetGame() {
    var d = DIFFS[difficulty];
    ban = d.ban; lives = d.lives; wave = 0; pops = 0; banEarned = 0;
    running = true; paused = false; gameOver = false;
    selectedShop = "dart"; selectedTower = null;
    towers = []; threats = []; projectiles = []; particles = []; floats = [];
    spawnQueue = []; spawnTimer = 0; waveActive = false; totalBuilt = 0; shake = 0;
    missionsDone = 0; mission = null;
    abilities.storm.cd = 0; abilities.freeze.cd = 0; abilities.cash.cd = 0;
    rebuildPath(); initDecor();
    startOv.classList.add("hidden"); winOv.classList.add("hidden");
    loseOv.classList.add("hidden"); pauseOv.classList.add("hidden");
    showToast(MAPS[currentMap].name.toUpperCase() + " · " + d.name.toUpperCase());
    refreshUI(); sfxPlace();
  }

  function endWin() {
    gameOver = true; running = false;
    document.getElementById("winMsg").textContent =
      MAX_WAVE + " waves on " + MAPS[currentMap].name + " (" + DIFFS[difficulty].name + ")! Pops " +
      pops + " · BAN " + banEarned + " · MonKeys " + totalBuilt + " · Missions " + missionsDone + ". Legendary.";
    winOv.classList.remove("hidden"); confettiBurst(); confettiBurst(); sfxWin();
  }
  function endLose() {
    gameOver = true; running = false; waveActive = false;
    document.getElementById("loseMsg").textContent =
      "Wave " + wave + "/" + MAX_WAVE + " on " + MAPS[currentMap].short + " · Pops " + pops +
      " · BAN " + banEarned + ". Refuel and relaunch.";
    loseOv.classList.remove("hidden"); sfxLeak();
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
    var p = canvasPos(e); hover = inBounds(p.c, p.r) ? { c: p.c, r: p.r } : null;
  });
  canvas.addEventListener("mouseleave", function () { hover = null; });
  function onPointer(e) {
    e.preventDefault(); ensureAudio();
    if (!running || gameOver || paused) return;
    var p = canvasPos(e); if (!inBounds(p.c, p.r)) return;
    var existing = towerAt(p.c, p.r);
    if (existing) { selectedTower = existing; refreshUI(); return; }
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

  // Map / difficulty picks (start screen)
  document.querySelectorAll("#mapPick .chip-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      if (running && !gameOver) return;
      currentMap = b.getAttribute("data-map");
      document.querySelectorAll("#mapPick .chip-btn").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      rebuildPath(); initDecor();
      refreshUI();
    });
  });
  document.querySelectorAll("#diffPick .chip-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      if (running && !gameOver) return;
      difficulty = b.getAttribute("data-diff");
      document.querySelectorAll("#diffPick .chip-btn").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      refreshUI();
    });
  });

  btnUp.addEventListener("click", function () { ensureAudio(); upgradeTower(); });
  btnSell.addEventListener("click", function () { ensureAudio(); sellTower(); });
  btnWave.addEventListener("click", function () { ensureAudio(); startWave(); });
  btnPause.addEventListener("click", function () {
    if (!running || gameOver) return;
    paused = !paused; pauseOv.classList.toggle("hidden", !paused);
  });
  document.getElementById("btnResume").addEventListener("click", function () {
    paused = false; pauseOv.classList.add("hidden");
  });
  document.getElementById("btnStart").addEventListener("click", function () { ensureAudio(); resetGame(); });
  document.getElementById("btnWin").addEventListener("click", function () {
    ensureAudio(); startOv.classList.remove("hidden"); winOv.classList.add("hidden"); running = false; gameOver = false; refreshUI();
  });
  document.getElementById("btnLose").addEventListener("click", function () {
    ensureAudio(); startOv.classList.remove("hidden"); loseOv.classList.add("hidden"); running = false; gameOver = false; refreshUI();
  });

  if (btnAbilityStorm) btnAbilityStorm.addEventListener("click", function () { ensureAudio(); useStorm(); });
  if (btnAbilityFreeze) btnAbilityFreeze.addEventListener("click", function () { ensureAudio(); useFreeze(); });
  if (btnAbilityCash) btnAbilityCash.addEventListener("click", function () { ensureAudio(); useCash(); });

  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === " " || e.code === "Space") {
      e.preventDefault(); ensureAudio();
      if (!running) { /* wait for start button with map pick */ }
      else startWave();
    }
    if (k === "p" || k === "P") {
      if (!running || gameOver) return;
      paused = !paused; pauseOv.classList.toggle("hidden", !paused);
    }
    if (k === "u" || k === "U") { ensureAudio(); upgradeTower(); }
    if (k === "s" || k === "S") { ensureAudio(); sellTower(); }
    if (k === "q" || k === "Q") { ensureAudio(); useStorm(); }
    if (k === "e" || k === "E") { ensureAudio(); useFreeze(); }
    if (k === "r" || k === "R") { ensureAudio(); useCash(); }
    if (k === "Escape") { selectedTower = null; refreshUI(); }
    var keys = {
      "1": "dart", "2": "boomer", "3": "sniper", "4": "bomb", "5": "ice",
      "6": "farm", "7": "village", "8": "super", "9": "battery"
    };
    if (keys[k]) { selectedShop = keys[k]; selectedTower = null; refreshUI(); }
  });

  // ability UI tick
  setInterval(function () { if (running) refreshAbilities(); }, 250);

  rebuildPath();
  initDecor();
  buildShop();
  refreshUI();
  requestAnimationFrame(loop);
})();
