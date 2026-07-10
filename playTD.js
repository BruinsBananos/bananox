(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════
  // BANANO TD — EPIC FUN EDITION
  // Dual paths · targeting · fever · events · rage · juice · optimized
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
  var hudRoundEarn = document.getElementById("hudRoundEarn");
  var hudStreak = document.getElementById("hudStreak");
  var hudFever = document.getElementById("hudFever");
  var hudEvent = document.getElementById("hudEvent");
  var roundOv = document.getElementById("roundOv");
  var roundSummaryEl = document.getElementById("roundSummary");
  var btnRoundContinue = document.getElementById("btnRoundContinue");
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
  var btnAbilityRage = document.getElementById("btnAbilityRage");
  var btnAutoWave = document.getElementById("btnAutoWave");
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
    },
    spiral: {
      name: "Peel Spiral",
      short: "Spiral",
      build: function () {
        var p = [];
        lineH(12, 0, 20, p);
        lineV(20, 12, 4, p);
        lineH(4, 20, 8, p);
        lineV(8, 4, 18, p);
        lineH(18, 8, 28, p);
        lineV(28, 18, 6, p);
        lineH(6, 28, 34, p);
        lineV(34, 6, 20, p);
        lineH(20, 34, 39, p);
        return dedupe(p);
      }
    },
    fork: {
      name: "Twin Fork Trail",
      short: "Fork",
      build: function () {
        // Single long path with a mid-map detour (classic single-track fork feel)
        var p = [];
        lineH(6, 0, 10, p);
        lineV(10, 6, 16, p);
        lineH(16, 10, 18, p);
        lineV(18, 16, 4, p);
        lineH(4, 18, 26, p);
        lineV(26, 4, 19, p);
        lineH(19, 26, 32, p);
        lineV(32, 19, 10, p);
        lineH(10, 32, 39, p);
        return dedupe(p);
      }
    },
    gauntlet: {
      name: "Gauntlet Gorge",
      short: "Gauntlet",
      build: function () {
        // Dense zig-zag — high pressure, lots of crossfire angles
        var p = [];
        lineH(2, 0, 6, p);
        lineV(6, 2, 22, p);
        lineH(22, 6, 12, p);
        lineV(12, 22, 2, p);
        lineH(2, 12, 18, p);
        lineV(18, 2, 22, p);
        lineH(22, 18, 24, p);
        lineV(24, 22, 2, p);
        lineH(2, 24, 30, p);
        lineV(30, 2, 22, p);
        lineH(22, 30, 36, p);
        lineV(36, 22, 12, p);
        lineH(12, 36, 39, p);
        return dedupe(p);
      }
    }
  };

  // ── Game modes (fun first — no more full campaign wipes) ──
  var TOUR_ROUTE = ["canyon", "helix", "spiral", "fork", "runway", "gauntlet"];
  var MODES = {
    classic: {
      name: "Classic", short: "Classic",
      tagline: "One map. 150 waves. Pure tower defense.",
      waves: 150, dens: 1, ban: 1, startBan: 0,
      pickMap: true, tour: false, eventScale: 1, jackpot: 1
    },
    tour: {
      name: "World Tour", short: "Tour",
      tagline: "Maps rotate every 20 waves — MonKeys relocate, upgrades stay.",
      waves: 120, dens: 1.08, ban: 1.18, startBan: 150,
      pickMap: false, tour: true, tourEvery: 20, eventScale: 0.9, jackpot: 1.15
    },
    rush: {
      name: "Fever Rush", short: "Rush",
      tagline: "80 dense waves, fat bounties, free Fever to start. Go loud.",
      waves: 80, dens: 1.42, ban: 1.55, startBan: 300,
      pickMap: true, tour: false, eventScale: 0.75, jackpot: 1.9, feverStart: 12
    },
    party: {
      name: "Party", short: "Party",
      tagline: "Events on loop. Jackpots rain. 100 waves of pure juice.",
      waves: 100, dens: 1.22, ban: 1.35, startBan: 200,
      pickMap: true, tour: false, eventScale: 0.4, jackpot: 1.7
    }
  };
  var playMode = "classic";
  var tourStop = 0;

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

  // Banana layers — bounty = BAN paid per layer popped (live income)
  var LAYERS = {
    green:  { id: "green",  name: "Unripe",  next: null,     r: 13, color: "#86efac", stroke: "#166534", tip: "#bbf7d0", value: 2, speed: 50 },
    ripe:   { id: "ripe",   name: "Ripe",    next: "green",  r: 14, color: "#facc15", stroke: "#a16207", tip: "#fef08a", value: 3, speed: 60 },
    gold:   { id: "gold",   name: "Golden",  next: "ripe",   r: 15, color: "#f59e0b", stroke: "#92400e", tip: "#fde68a", value: 5, speed: 72 },
    purple: { id: "purple", name: "Meme",    next: "gold",   r: 16, color: "#c084fc", stroke: "#6b21a8", tip: "#e9d5ff", value: 7, speed: 88 },
    star:   { id: "star",   name: "Cosmic",  next: "purple", r: 17, color: "#f472b6", stroke: "#9d174d", tip: "#fbcfe8", value: 9, speed: 105 },
    zebra:  { id: "zebra",  name: "Zebra",   next: "star",   r: 18, color: "#f8fafc", stroke: "#0f172a", tip: "#e2e8f0", value: 12, speed: 96 },
    // Rare jackpot banana — peels into zebra, pays absurd BAN
    golden: { id: "golden", name: "JACKPOT", next: "zebra",  r: 20, color: "#fef08a", stroke: "#ca8a04", tip: "#fffbeb", value: 40, speed: 70 }
  };
  var LAYER_ORDER = ["green", "ripe", "gold", "purple", "star", "zebra", "golden"];

  // 9 towers · BTD-style dual paths (Top / Bottom)
  // Rule: either path up to 2 freely; only ONE path may go to 3 and 4
  var TOWER_DEFS = [
    {
      id: "dart", name: "Dart MonKey", icon: "🐵", role: "Primary",
      desc: "Rapid banana darts. Your always-on backbone.",
      cost: 175, range: 170, rof: 0.46, pierce: 1, pop: 1, splash: 0, slow: 0,
      camo: false, lead: false, color: "#f5d041",
      pathNames: ["Sharp Path", "Frenzy Path"],
      paths: [
        [
          { name: "Sharp Tips", desc: "+1 pierce, snappier shots", cost: 140, pierce: 1, rof: -0.06 },
          { name: "Razor Rinds", desc: "+pop power and range", cost: 280, pop: 1, range: 25 },
          { name: "Spike Storm", desc: "High pierce banana spikes", cost: 900, pierce: 4, pop: 1, range: 20 },
          { name: "Potassium Javelin", desc: "Snipes lines of bananas", cost: 2200, pierce: 8, pop: 2, range: 40, preferStrong: true }
        ],
        [
          { name: "Quick Hands", desc: "Faster throwing", cost: 160, rof: -0.1 },
          { name: "Twin Peel", desc: "Fire two darts", cost: 350, multishot: 1 },
          { name: "Triple Threat", desc: "Three-dart volleys", cost: 1100, multishot: 1, rof: -0.05, pierce: 1 },
          { name: "Monkey Fan Club", desc: "Quad shredders at blur speed", cost: 2800, multishot: 2, rof: -0.08, pierce: 1, pop: 1 }
        ]
      ]
    },
    {
      id: "boomer", name: "Boomer K+", icon: "🪃", role: "Mid",
      desc: "Returning blades — farms long path lines.",
      cost: 320, range: 150, rof: 0.85, pierce: 6, pop: 1, splash: 0, slow: 0,
      camo: false, lead: false, color: "#fb923c", boomerang: true,
      pathNames: ["Glaive Path", "Chase Path"],
      paths: [
        [
          { name: "Wide Arc", desc: "+3 pierce", cost: 220, pierce: 3 },
          { name: "K-Rang", desc: "+pop and pierce", cost: 400, pop: 1, pierce: 2 },
          { name: "Glaive Ricochet", desc: "Huge multi-hit glaives", cost: 1200, pierce: 6, pop: 1, rof: -0.1 },
          { name: "MOAB Cleaver", desc: "Boss-shred orbit blades", cost: 2800, pierce: 10, pop: 3, lead: true, range: 30 }
        ],
        [
          { name: "Red Hot Rangs", desc: "Faster spin", cost: 200, rof: -0.15 },
          { name: "Bionic Boomer", desc: "Twin returning blades", cost: 450, multishot: 1 },
          { name: "Turbo Charge", desc: "Blazing throw rate", cost: 1400, rof: -0.25, pierce: 2 },
          { name: "Perma-Charge", desc: "Permanent turbo multi-rang", cost: 3200, multishot: 1, rof: -0.2, pierce: 3, pop: 1 }
        ]
      ]
    },
    {
      id: "sniper", name: "Sniper MonKey", icon: "🎯", role: "Support",
      desc: "Map-range eyes. Camo native. Armor later.",
      cost: 380, range: 420, rof: 1.0, pierce: 1, pop: 2, splash: 0, slow: 0,
      camo: true, lead: false, color: "#86efac", preferStrong: true,
      pathNames: ["Deadeye Path", "Supply Path"],
      paths: [
        [
          { name: "Full Metal Jacket", desc: "Pops lead, more power", cost: 300, lead: true, pop: 2 },
          { name: "Point Five Oh", desc: "Huge single-target damage", cost: 700, pop: 4, range: 30 },
          { name: "Deadly Precision", desc: "Shreds ceramics", cost: 1800, pop: 6, pierce: 1 },
          { name: "Cripple MOAB", desc: "Boss-melting rail shots", cost: 4000, pop: 12, pierce: 2, range: 50 }
        ],
        [
          { name: "Night Vision", desc: "Faster aim", cost: 250, rof: -0.25, range: 30 },
          { name: "Shrapnel Shot", desc: "Splash on impact", cost: 550, splash: 35, pop: 1 },
          { name: "Bouncing Bullet", desc: "Pierce through packs", cost: 1600, pierce: 4, rof: -0.1 },
          { name: "Supply Drop", desc: "Income + rapid fire", cost: 3500, income: 100, rof: -0.2, pierce: 2 }
        ]
      ]
    },
    {
      id: "bomb", name: "Bomb MonKey", icon: "💣", role: "Military",
      desc: "Peel grenades with natural armor pop.",
      cost: 550, range: 160, rof: 1.1, pierce: 1, pop: 1, splash: 78, slow: 0,
      camo: false, lead: true, color: "#f97316",
      pathNames: ["Blast Path", "Missile Path"],
      paths: [
        [
          { name: "Bigger Bombs", desc: "More splash and pop", cost: 350, splash: 25, pop: 1 },
          { name: "Heavy Shells", desc: "Stronger blasts", cost: 650, pop: 2, splash: 15 },
          { name: "Really Big Bombs", desc: "Massive AOE", cost: 1600, splash: 40, pop: 2, range: 20 },
          { name: "Bloon Impact", desc: "Stun-slow blasts", cost: 3800, splash: 50, pop: 3, slow: 0.35 }
        ],
        [
          { name: "Faster Reload", desc: "Quicker bombs", cost: 280, rof: -0.25 },
          { name: "Missile Launcher", desc: "Long-range missiles", cost: 600, range: 50, rof: -0.1 },
          { name: "MOAB Mauler", desc: "Boss-hunter missiles", cost: 1500, pop: 5, preferStrong: true, range: 30 },
          { name: "MOAB Eliminator", desc: "Deletes super-heavy targets", cost: 4200, pop: 10, multishot: 1, range: 40 }
        ]
      ]
    },
    {
      id: "ice", name: "Chill MonKey", icon: "🧊", role: "Magic",
      desc: "Frost aura — control the mega path.",
      cost: 400, range: 145, rof: 1.2, pierce: 1, pop: 0, splash: 100, slow: 0.52,
      camo: false, lead: false, color: "#67e8f9", freezePulse: true,
      pathNames: ["Freeze Path", "Impale Path"],
      paths: [
        [
          { name: "Permafrost", desc: "Harder slow", cost: 250, slow: 0.12, splash: 15 },
          { name: "Deep Freeze", desc: "Longer freeze", cost: 500, slow: 0.1, rof: -0.15 },
          { name: "Arctic Wind", desc: "Huge freeze radius", cost: 1400, splash: 45, range: 30, slow: 0.08 },
          { name: "Absolute Zero", desc: "Near-stop freeze field", cost: 3200, splash: 55, slow: 0.15, pop: 1, camo: true }
        ],
        [
          { name: "Ice Shards", desc: "Slow that also pops", cost: 280, pop: 1 },
          { name: "Shatter", desc: "More pop on freeze pulse", cost: 550, pop: 1, splash: 15 },
          { name: "Icicle Impale", desc: "Camo + lead shards", cost: 1500, camo: true, lead: true, pop: 2 },
          { name: "Snowstorm", desc: "Map-wide chill pops", cost: 3600, splash: 80, pop: 2, range: 40, rof: -0.25 }
        ]
      ]
    },
    {
      id: "farm", name: "Banana Farm", icon: "🌴", role: "Economy",
      desc: "Passive BAN income every round clear.",
      cost: 750, range: 90, rof: 99, pierce: 0, pop: 0, splash: 0, slow: 0,
      camo: false, lead: false, color: "#84cc16", farm: true, support: true,
      pathNames: ["Harvest Path", "Bank Path"],
      paths: [
        [
          { name: "More Trees", desc: "+round income", cost: 400, income: 45 },
          { name: "Irrigation", desc: "Bigger harvest", cost: 800, income: 70 },
          { name: "Marketplace", desc: "Strong income", cost: 1800, income: 120 },
          { name: "Banana Republic", desc: "Empire harvest", cost: 4000, income: 250 }
        ],
        [
          { name: "Banana Saver", desc: "Steady passive", cost: 450, income: 40 },
          { name: "Monkey Bank", desc: "Stored interest bonus", cost: 900, income: 80 },
          { name: "IMF Loan", desc: "Huge cash injection", cost: 2000, income: 150 },
          { name: "Monkey Wall Street", desc: "Insane end-round income", cost: 4500, income: 320 }
        ]
      ]
    },
    {
      id: "village", name: "Jungle Village", icon: "🏠", role: "Support",
      desc: "Buffs nearby MonKeys. Fuels airdrops.",
      cost: 1000, range: 190, rof: 99, pierce: 0, pop: 0, splash: 0, slow: 0,
      camo: false, lead: false, color: "#c084fc", support: true,
      pathNames: ["Support Path", "Trade Path"],
      paths: [
        [
          { name: "Jungle Drums", desc: "+12% attack speed aura", cost: 500, auraRof: 0.12 },
          { name: "Radar Scanner", desc: "Camo detect for nearby", cost: 1000, auraCamo: true, auraRof: 0.06, range: 20 },
          { name: "Call to Arms", desc: "Big attack speed aura", cost: 2200, auraRof: 0.2, range: 30 },
          { name: "Homeland Defense", desc: "Massive buff bubble", cost: 5000, auraRof: 0.28, auraCamo: true, range: 40 }
        ],
        [
          { name: "Banana Farmer", desc: "Small income", cost: 450, income: 50 },
          { name: "Monkey Commerce", desc: "Round income", cost: 950, income: 100 },
          { name: "Marketplace Hub", desc: "Strong economy aura", cost: 2100, income: 180, range: 15 },
          { name: "Trade Empire", desc: "Village mint", cost: 4800, income: 350, auraRof: 0.08 }
        ]
      ]
    },
    {
      id: "super", name: "Super MonKey", icon: "🦸", role: "Hero",
      desc: "Meme-powered multi-banana fury.",
      cost: 2400, range: 200, rof: 0.1, pierce: 1, pop: 1, splash: 0, slow: 0,
      camo: true, lead: true, color: "#f472b6", multishot: 1,
      pathNames: ["Plasma Path", "Robo Path"],
      paths: [
        [
          { name: "Laser Shockwave", desc: "+pierce", cost: 1200, pierce: 2 },
          { name: "Plasma Blasts", desc: "Splash plasma", cost: 2800, splash: 30, pop: 1, pierce: 1 },
          { name: "Sun Avatar", desc: "Blazing multi-beam", cost: 7000, multishot: 2, pierce: 2, pop: 2, splash: 20 },
          { name: "Sun Temple", desc: "Unmatched DPS shrine", cost: 16000, multishot: 3, pierce: 4, pop: 3, splash: 35, range: 50 }
        ],
        [
          { name: "Robo Super", desc: "Faster triple stream", cost: 1400, multishot: 1, rof: -0.02 },
          { name: "Tech Terror", desc: "Quad storm", cost: 3200, multishot: 2, pierce: 1, pop: 1 },
          { name: "The Anti-Bloon", desc: "Delete button beam", cost: 8000, multishot: 2, pierce: 3, pop: 4, splash: 25 },
          { name: "Legend of the Night", desc: "Dark super multi-shot", cost: 18000, multishot: 3, pierce: 3, pop: 3, rof: -0.03, range: 40 }
        ]
      ]
    },
    {
      id: "battery", name: "Starship Battery", icon: "🚀", role: "Ultimate",
      desc: "Orbital rail — deletes bosses for a living.",
      cost: 4800, range: 460, rof: 1.7, pierce: 1, pop: 14, splash: 0, slow: 0,
      camo: true, lead: true, color: "#38bdf8", preferStrong: true, rail: true,
      pathNames: ["Rail Path", "Salvo Path"],
      paths: [
        [
          { name: "Capacitor Bank", desc: "Faster charge", cost: 2400, rof: -0.35 },
          { name: "Rail Expansion", desc: "Pierce packs", cost: 4800, pierce: 3, pop: 4 },
          { name: "Hyper Rail", desc: "Devastating pierce", cost: 11000, pierce: 5, pop: 8, range: 40 },
          { name: "Full Stack Raptor", desc: "Boss delete beam", cost: 24000, pierce: 8, pop: 16, range: 60, rof: -0.2 }
        ],
        [
          { name: "Cluster Tip", desc: "Splash on impact", cost: 2600, splash: 45, pop: 3 },
          { name: "Multi-Vector", desc: "Twin rails", cost: 5200, multishot: 1, pop: 3 },
          { name: "Barrage Array", desc: "Triple orbital", cost: 12000, multishot: 2, splash: 30, pop: 4 },
          { name: "Starfall Battery", desc: "Sky falls on bananas", cost: 26000, multishot: 3, splash: 55, pop: 8, rof: -0.25 }
        ]
      ]
    }
  ];

  var TOWER_BY_ID = {};
  for (var ti = 0; ti < TOWER_DEFS.length; ti++) TOWER_BY_ID[TOWER_DEFS[ti].id] = TOWER_DEFS[ti];
  var MAX_PATH = 4; // upgrades per path (BTD-style)
  var MAX_WAVE = 150;

  function getMode() {
    return MODES[playMode] || MODES.classic;
  }
  function syncWaveCap() {
    MAX_WAVE = endless ? 99999 : (getMode().waves || 150);
  }
  function modeEventCdBase() {
    return (6 + Math.random() * 8) * (getMode().eventScale || 1);
  }

  // Difficulty
  var DIFFS = {
    normal:   { name: "Normal",   ban: 900, lives: 300, scale: 1,    dens: 1,    reward: 1 },
    hard:     { name: "Hard",     ban: 750, lives: 200, scale: 1.35, dens: 1.15, reward: 1.3 },
    starship: { name: "Starship", ban: 650, lives: 140, scale: 1.75, dens: 1.3,  reward: 1.6 }
  };
  var difficulty = "normal";

  // State
  var ban = 900, lives = 300, wave = 0, pops = 0, banEarned = 0;
  var running = false, paused = false, gameOver = false;
  var speed = 1;
  var selectedShop = "dart";
  var selectedTower = null;
  var towers = [], threats = [], projectiles = [], particles = [], floats = [], decor = [];
  var spawnQueue = [], spawnTimer = 0, waveActive = false;
  var hover = null, lastTs = 0, animT = 0, toastT = 0, airdropT = 0;
  var totalBuilt = 0, shake = 0;
  var mapCache = null, mapDirty = true;
  var MAX_PARTICLES = 220, MAX_FLOATS = 48, quality = 1;
  var nextUid = 1;
  var frameStatsId = 0;     // per-frame getStats cache
  var uiBanSnap = -1;       // avoid thrashing shop DOM
  var uiShopSnap = "";
  var TARGET_MODES = ["first", "last", "strong", "close"];
  var TARGET_LABEL = { first: "First", last: "Last", strong: "Strong", close: "Close" };

  // Live round economy
  var roundKillBan = 0;   // BAN earned from kills this wave (already paid out live)
  var roundKills = 0;
  var roundLeak = false;
  var killStreak = 0;
  var killStreakT = 0;
  var floatBanThrottle = 0; // reduce float spam when many pops
  var lastRoundSummary = null;
  var chapterPending = false;

  // Fun systems
  var feverT = 0;           // double bounty + faster towers
  var rageT = 0;            // Monkey Rage ability — attack speed
  var eventT = 0;           // active random event timer
  var eventKind = null;     // "double" | "slowmo" | "rain" | "frenzy"
  var eventCd = 12;         // seconds until next event can roll
  var autoWave = false;
  var autoWaveDelay = 0;
  var hitFlash = 0;         // yellow screen juice
  var comboAnnouncer = "";
  var comboAnnouncerT = 0;
  var bestStreakRun = 0;
  var goldensPopped = 0;
  var endless = false;      // continues past MAX_WAVE
  var muted = false;
  // ─────────────────────────────────────────────────────────────
  // ProgressSave — guest local progress (localStorage only)
  // Public API: loadRecords, saveRecords, exportProgress, importProgress,
  //             resetProgress, getProgressSummary, checkBadges, computeRunScore
  //
  // Storage keys:
  //   bananox_td_v1      — primary JSON blob
  //   bananox_td_v1.bak  — previous good copy (dual-slot safety)
  //
  // Schema (schemaVersion 3):
  //   schemaVersion, updatedAt, lastPlayedAt, lastMapId, lastMode, lastDifficulty
  //   records: { bestWave, bestStreak, bestPops, games, goldens, missions, bestScore }
  //   maps:    { [mapId]: { bestWave, bestStreak, clears, bestScore } }
  //   modes:   { [modeId]: { bestWave, wins, plays, bestScore } }
  //   badges:  { [badgeId]: unlockedAtMs }
  //   leaderboard: [{ score, wave, pops, mode, map, difficulty, won, at }]  (top 20 local)
  //   stats:   { abilityUses, perfectWaves, totalWins, totalPops }
  //   unlockedMaps, settings: { muted, autoWave }
  //
  // NOT saved: mid-wave entities, live BAN/lives of an active run (session only).
  // Cloud accounts can later sync this same JSON blob.
  // ─────────────────────────────────────────────────────────────
  var SAVE_KEY = "bananox_td_v1";
  var SAVE_BAK = "bananox_td_v1.bak";
  var SAVE_SCHEMA = 3;
  var LB_MAX = 20;
  var saveTimer = null;
  var lastSavedAt = 0;
  var saveFlashT = 0;
  var storageOk = true;

  var records = {
    bestWave: 0, bestStreak: 0, bestPops: 0, games: 0,
    goldens: 0, missions: 0, bestScore: 0
  };
  var mapRecords = {};   // mapId -> { bestWave, bestStreak, clears, bestScore }
  var modeRecords = {};  // modeId -> { bestWave, wins, plays, bestScore }
  var badgesUnlocked = {}; // badgeId -> timestamp
  var leaderboard = [];  // top local scores
  var metaStats = { abilityUses: 0, perfectWaves: 0, totalWins: 0, totalPops: 0 };
  var unlockedMaps = ["canyon", "helix", "spiral", "fork", "runway", "gauntlet"];
  var progressMeta = {
    lastMapId: "canyon",
    lastMode: "classic",
    lastDifficulty: "normal",
    lastPlayedAt: 0,
    updatedAt: 0
  };
  // Per-run meta (not all persisted mid-run; finalized on end)
  var runPerfectWaves = 0;
  var runAbilityUses = 0;
  var runBadgeQueue = [];
  var badgeToastT = 0;
  var lastRunScore = 0;
  var lastRunBadges = []; // badges earned this run (persist until next resetGame)

  function defaultProgress() {
    return {
      schemaVersion: SAVE_SCHEMA,
      updatedAt: 0,
      lastPlayedAt: 0,
      lastMapId: "canyon",
      lastMode: "classic",
      lastDifficulty: "normal",
      records: {
        bestWave: 0, bestStreak: 0, bestPops: 0, games: 0,
        goldens: 0, missions: 0, bestScore: 0
      },
      maps: {},
      modes: {},
      badges: {},
      leaderboard: [],
      stats: { abilityUses: 0, perfectWaves: 0, totalWins: 0, totalPops: 0 },
      unlockedMaps: ["canyon", "helix", "spiral", "fork", "runway", "gauntlet"],
      settings: { muted: false, autoWave: false }
    };
  }

  function safeInt(v, d) {
    var n = parseInt(v, 10);
    return isFinite(n) ? n : (d || 0);
  }

  function migrateProgress(raw) {
    // v1: flat { bestWave, bestStreak, bestPops, games }
    if (!raw || typeof raw !== "object") return defaultProgress();
    if (!raw.schemaVersion || raw.schemaVersion < 2) {
      var d = defaultProgress();
      d.records.bestWave = safeInt(raw.bestWave, 0);
      d.records.bestStreak = safeInt(raw.bestStreak, 0);
      d.records.bestPops = safeInt(raw.bestPops, 0);
      d.records.games = safeInt(raw.games, 0);
      if (raw.records) {
        d.records.bestWave = Math.max(d.records.bestWave, safeInt(raw.records.bestWave, 0));
        d.records.bestStreak = Math.max(d.records.bestStreak, safeInt(raw.records.bestStreak, 0));
        d.records.bestPops = Math.max(d.records.bestPops, safeInt(raw.records.bestPops, 0));
        d.records.games = Math.max(d.records.games, safeInt(raw.records.games, 0));
      }
      d.schemaVersion = SAVE_SCHEMA;
      return d;
    }
    // v2 → v3: add badges, leaderboard, stats, bestScore fields
    if (raw.schemaVersion < 3) {
      raw.badges = raw.badges || {};
      raw.leaderboard = Array.isArray(raw.leaderboard) ? raw.leaderboard : [];
      raw.stats = raw.stats || { abilityUses: 0, perfectWaves: 0, totalWins: 0, totalPops: 0 };
      if (raw.records && raw.records.bestScore == null) raw.records.bestScore = 0;
      raw.schemaVersion = SAVE_SCHEMA;
    }
    return raw;
  }

  function validateProgress(p) {
    if (!p || typeof p !== "object") return null;
    var out = defaultProgress();
    out.schemaVersion = SAVE_SCHEMA;
    out.updatedAt = safeInt(p.updatedAt, 0);
    out.lastPlayedAt = safeInt(p.lastPlayedAt, 0);
    out.lastMapId = typeof p.lastMapId === "string" && MAPS[p.lastMapId] ? p.lastMapId : "canyon";
    out.lastMode = typeof p.lastMode === "string" && MODES[p.lastMode] ? p.lastMode : "classic";
    out.lastDifficulty = typeof p.lastDifficulty === "string" && DIFFS[p.lastDifficulty] ? p.lastDifficulty : "normal";
    var r = p.records || p;
    out.records.bestWave = Math.max(0, safeInt(r.bestWave, 0));
    out.records.bestStreak = Math.max(0, safeInt(r.bestStreak, 0));
    out.records.bestPops = Math.max(0, safeInt(r.bestPops, 0));
    out.records.games = Math.max(0, safeInt(r.games, 0));
    out.records.goldens = Math.max(0, safeInt(r.goldens, 0));
    out.records.missions = Math.max(0, safeInt(r.missions, 0));
    out.records.bestScore = Math.max(0, safeInt(r.bestScore, 0));
    out.maps = {};
    if (p.maps && typeof p.maps === "object") {
      Object.keys(p.maps).forEach(function (id) {
        if (!MAPS[id]) return;
        var m = p.maps[id] || {};
        out.maps[id] = {
          bestWave: Math.max(0, safeInt(m.bestWave, 0)),
          bestStreak: Math.max(0, safeInt(m.bestStreak, 0)),
          clears: Math.max(0, safeInt(m.clears, 0)),
          bestScore: Math.max(0, safeInt(m.bestScore, 0))
        };
      });
    }
    out.modes = {};
    if (p.modes && typeof p.modes === "object") {
      Object.keys(p.modes).forEach(function (id) {
        if (!MODES[id]) return;
        var m = p.modes[id] || {};
        out.modes[id] = {
          bestWave: Math.max(0, safeInt(m.bestWave, 0)),
          wins: Math.max(0, safeInt(m.wins, 0)),
          plays: Math.max(0, safeInt(m.plays, 0)),
          bestScore: Math.max(0, safeInt(m.bestScore, 0))
        };
      });
    }
    out.badges = {};
    if (p.badges && typeof p.badges === "object") {
      Object.keys(p.badges).forEach(function (id) {
        var ts = safeInt(p.badges[id], 0);
        if (ts > 0) out.badges[id] = ts;
      });
    }
    out.leaderboard = [];
    if (Array.isArray(p.leaderboard)) {
      for (var li = 0; li < p.leaderboard.length && out.leaderboard.length < LB_MAX; li++) {
        var e = p.leaderboard[li];
        if (!e || typeof e !== "object") continue;
        out.leaderboard.push({
          score: Math.max(0, safeInt(e.score, 0)),
          wave: Math.max(0, safeInt(e.wave, 0)),
          pops: Math.max(0, safeInt(e.pops, 0)),
          mode: typeof e.mode === "string" && MODES[e.mode] ? e.mode : "classic",
          map: typeof e.map === "string" && MAPS[e.map] ? e.map : "canyon",
          difficulty: typeof e.difficulty === "string" && DIFFS[e.difficulty] ? e.difficulty : "normal",
          won: !!e.won,
          at: safeInt(e.at, 0)
        });
      }
      out.leaderboard.sort(function (a, b) { return b.score - a.score; });
    }
    var st = p.stats || {};
    out.stats.abilityUses = Math.max(0, safeInt(st.abilityUses, 0));
    out.stats.perfectWaves = Math.max(0, safeInt(st.perfectWaves, 0));
    out.stats.totalWins = Math.max(0, safeInt(st.totalWins, 0));
    out.stats.totalPops = Math.max(0, safeInt(st.totalPops, 0));
    if (Array.isArray(p.unlockedMaps) && p.unlockedMaps.length) {
      out.unlockedMaps = p.unlockedMaps.filter(function (id) { return !!MAPS[id]; });
      if (!out.unlockedMaps.length) out.unlockedMaps = defaultProgress().unlockedMaps.slice();
    }
    var s = p.settings || {};
    out.settings.muted = !!s.muted;
    out.settings.autoWave = !!s.autoWave;
    return out;
  }

  function applyProgress(p) {
    if (!p) return;
    records.bestWave = p.records.bestWave;
    records.bestStreak = p.records.bestStreak;
    records.bestPops = p.records.bestPops;
    records.games = p.records.games;
    records.goldens = p.records.goldens;
    records.missions = p.records.missions;
    records.bestScore = p.records.bestScore || 0;
    mapRecords = p.maps || {};
    modeRecords = p.modes || {};
    badgesUnlocked = p.badges ? JSON.parse(JSON.stringify(p.badges)) : {};
    leaderboard = Array.isArray(p.leaderboard) ? p.leaderboard.slice() : [];
    metaStats = {
      abilityUses: (p.stats && p.stats.abilityUses) || 0,
      perfectWaves: (p.stats && p.stats.perfectWaves) || 0,
      totalWins: (p.stats && p.stats.totalWins) || 0,
      totalPops: (p.stats && p.stats.totalPops) || 0
    };
    unlockedMaps = p.unlockedMaps.slice();
    progressMeta.lastMapId = p.lastMapId;
    progressMeta.lastMode = p.lastMode;
    progressMeta.lastDifficulty = p.lastDifficulty;
    progressMeta.lastPlayedAt = p.lastPlayedAt;
    progressMeta.updatedAt = p.updatedAt;
    muted = !!p.settings.muted;
    autoWave = !!p.settings.autoWave;
    lastSavedAt = p.updatedAt || 0;
  }

  function buildProgressPayload() {
    // Pull latest session highs into records before serializing
    if (typeof wave === "number" && wave > records.bestWave) records.bestWave = wave;
    if (typeof bestStreakRun === "number" && bestStreakRun > records.bestStreak) records.bestStreak = bestStreakRun;
    if (typeof pops === "number" && pops > records.bestPops) records.bestPops = pops;
    if (typeof goldensPopped === "number" && goldensPopped > records.goldens) records.goldens = goldensPopped;
    if (typeof missionsDone === "number" && missionsDone > records.missions) records.missions = missionsDone;

    // Per-map / per-mode session update (compact)
    if (running || wave > 0) {
      var mid = currentMap || progressMeta.lastMapId;
      if (MAPS[mid]) {
        if (!mapRecords[mid]) mapRecords[mid] = { bestWave: 0, bestStreak: 0, clears: 0, bestScore: 0 };
        if (wave > mapRecords[mid].bestWave) mapRecords[mid].bestWave = wave;
        if (bestStreakRun > mapRecords[mid].bestStreak) mapRecords[mid].bestStreak = bestStreakRun;
      }
      var moid = playMode || progressMeta.lastMode;
      if (MODES[moid]) {
        if (!modeRecords[moid]) modeRecords[moid] = { bestWave: 0, wins: 0, plays: 0, bestScore: 0 };
        if (wave > modeRecords[moid].bestWave) modeRecords[moid].bestWave = wave;
      }
    }

    var now = Date.now();
    var payload = {
      schemaVersion: SAVE_SCHEMA,
      updatedAt: now,
      lastPlayedAt: now,
      lastMapId: currentMap || progressMeta.lastMapId || "canyon",
      lastMode: playMode || progressMeta.lastMode || "classic",
      lastDifficulty: difficulty || progressMeta.lastDifficulty || "normal",
      records: {
        bestWave: records.bestWave | 0,
        bestStreak: records.bestStreak | 0,
        bestPops: records.bestPops | 0,
        games: records.games | 0,
        goldens: records.goldens | 0,
        missions: records.missions | 0,
        bestScore: records.bestScore | 0
      },
      maps: mapRecords,
      modes: modeRecords,
      badges: badgesUnlocked,
      leaderboard: leaderboard.slice(0, LB_MAX),
      stats: {
        abilityUses: metaStats.abilityUses | 0,
        perfectWaves: metaStats.perfectWaves | 0,
        totalWins: metaStats.totalWins | 0,
        totalPops: metaStats.totalPops | 0
      },
      unlockedMaps: unlockedMaps.slice(),
      settings: {
        muted: !!muted,
        autoWave: !!autoWave
      }
    };
    return validateProgress(payload);
  }

  function writeStorage(key, str) {
    try {
      localStorage.setItem(key, str);
      return true;
    } catch (e) {
      storageOk = false;
      return false;
    }
  }

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      storageOk = false;
      return null;
    }
  }

  function parseSaveRaw(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
      var o = JSON.parse(raw);
      return validateProgress(migrateProgress(o));
    } catch (e) {
      return null;
    }
  }

  /** Load progress on startup. Falls back to .bak, then defaults. Never throws. */
  function loadRecords() {
    var primary = parseSaveRaw(readStorage(SAVE_KEY));
    if (!primary) {
      primary = parseSaveRaw(readStorage(SAVE_BAK));
      if (primary) {
        // Restore primary from backup
        try {
          writeStorage(SAVE_KEY, JSON.stringify(primary));
        } catch (e) {}
      }
    }
    if (!primary) primary = defaultProgress();
    applyProgress(primary);
    return primary;
  }

  /**
   * Persist progress (dual-slot: rotate current → .bak, then write primary).
   * @param {boolean} [immediate] skip debounce
   */
  function saveRecords(immediate) {
    if (immediate) {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      return commitSave();
    }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveTimer = null;
      commitSave();
    }, 450);
    return true;
  }

  function commitSave() {
    var payload = buildProgressPayload();
    if (!payload) return false;
    var str;
    try {
      str = JSON.stringify(payload);
    } catch (e) {
      return false;
    }
    // Dual-slot: keep last good as .bak
    try {
      var prev = readStorage(SAVE_KEY);
      if (prev && parseSaveRaw(prev)) writeStorage(SAVE_BAK, prev);
    } catch (e2) {}
    var ok = writeStorage(SAVE_KEY, str);
    if (ok) {
      lastSavedAt = payload.updatedAt;
      progressMeta.updatedAt = payload.updatedAt;
      progressMeta.lastPlayedAt = payload.lastPlayedAt;
      saveFlashT = 1.6;
      updateSaveUI();
    }
    return ok;
  }

  function mergeProgress(a, b) {
    // Merge-friendly: take max for scores, union unlocks/badges, prefer newer timestamps for "last*"
    var A = validateProgress(migrateProgress(a)) || defaultProgress();
    var B = validateProgress(migrateProgress(b)) || defaultProgress();
    var out = defaultProgress();
    out.records.bestWave = Math.max(A.records.bestWave, B.records.bestWave);
    out.records.bestStreak = Math.max(A.records.bestStreak, B.records.bestStreak);
    out.records.bestPops = Math.max(A.records.bestPops, B.records.bestPops);
    out.records.games = Math.max(A.records.games, B.records.games);
    out.records.goldens = Math.max(A.records.goldens, B.records.goldens);
    out.records.missions = Math.max(A.records.missions, B.records.missions);
    out.records.bestScore = Math.max(A.records.bestScore || 0, B.records.bestScore || 0);
    var mapIds = {};
    Object.keys(A.maps).forEach(function (k) { mapIds[k] = 1; });
    Object.keys(B.maps).forEach(function (k) { mapIds[k] = 1; });
    Object.keys(mapIds).forEach(function (id) {
      var am = A.maps[id] || { bestWave: 0, bestStreak: 0, clears: 0, bestScore: 0 };
      var bm = B.maps[id] || { bestWave: 0, bestStreak: 0, clears: 0, bestScore: 0 };
      out.maps[id] = {
        bestWave: Math.max(am.bestWave, bm.bestWave),
        bestStreak: Math.max(am.bestStreak, bm.bestStreak),
        clears: Math.max(am.clears, bm.clears),
        bestScore: Math.max(am.bestScore || 0, bm.bestScore || 0)
      };
    });
    var modeIds = {};
    Object.keys(A.modes).forEach(function (k) { modeIds[k] = 1; });
    Object.keys(B.modes).forEach(function (k) { modeIds[k] = 1; });
    Object.keys(modeIds).forEach(function (id) {
      var am = A.modes[id] || { bestWave: 0, wins: 0, plays: 0, bestScore: 0 };
      var bm = B.modes[id] || { bestWave: 0, wins: 0, plays: 0, bestScore: 0 };
      out.modes[id] = {
        bestWave: Math.max(am.bestWave, bm.bestWave),
        wins: Math.max(am.wins, bm.wins),
        plays: Math.max(am.plays, bm.plays),
        bestScore: Math.max(am.bestScore || 0, bm.bestScore || 0)
      };
    });
    var unlock = {};
    A.unlockedMaps.forEach(function (id) { unlock[id] = 1; });
    B.unlockedMaps.forEach(function (id) { unlock[id] = 1; });
    out.unlockedMaps = Object.keys(unlock);
    // Union badges (earliest unlock time wins)
    Object.keys(A.badges || {}).forEach(function (id) {
      out.badges[id] = A.badges[id];
    });
    Object.keys(B.badges || {}).forEach(function (id) {
      if (!out.badges[id] || (B.badges[id] && B.badges[id] < out.badges[id])) {
        out.badges[id] = B.badges[id];
      }
    });
    // Merge leaderboards, keep top LB_MAX by score
    var allLb = (A.leaderboard || []).concat(B.leaderboard || []);
    allLb.sort(function (x, y) { return (y.score || 0) - (x.score || 0); });
    out.leaderboard = allLb.slice(0, LB_MAX);
    out.stats.abilityUses = Math.max(A.stats.abilityUses, B.stats.abilityUses);
    out.stats.perfectWaves = Math.max(A.stats.perfectWaves, B.stats.perfectWaves);
    out.stats.totalWins = Math.max(A.stats.totalWins, B.stats.totalWins);
    out.stats.totalPops = Math.max(A.stats.totalPops, B.stats.totalPops);
    // Prefer newer file for "last*" and settings
    var newer = (B.updatedAt || 0) >= (A.updatedAt || 0) ? B : A;
    out.lastMapId = newer.lastMapId;
    out.lastMode = newer.lastMode;
    out.lastDifficulty = newer.lastDifficulty;
    out.lastPlayedAt = Math.max(A.lastPlayedAt, B.lastPlayedAt);
    out.updatedAt = Math.max(A.updatedAt, B.updatedAt);
    out.settings.muted = newer.settings.muted;
    out.settings.autoWave = newer.settings.autoWave;
    return out;
  }

  /** Export JSON string for backup / device move. */
  function exportProgress() {
    var payload = buildProgressPayload();
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Import JSON string. Merges with current (max scores).
   * @returns {{ok:boolean, message:string}}
   */
  function importProgress(jsonStr) {
    var incoming = parseSaveRaw(typeof jsonStr === "string" ? jsonStr : "");
    if (!incoming) return { ok: false, message: "Invalid save data" };
    var current = buildProgressPayload() || defaultProgress();
    var merged = mergeProgress(current, incoming);
    applyProgress(merged);
    commitSave();
    applyLoadedPrefsToUI();
    refreshRecordsLabel();
    if (typeof refreshHubUI === "function") refreshHubUI();
    return { ok: true, message: "Progress imported" };
  }

  /** Wipe progress after caller confirms. */
  function resetProgress() {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(SAVE_BAK);
    } catch (e) {}
    applyProgress(defaultProgress());
    lastSavedAt = 0;
    applyLoadedPrefsToUI();
    refreshRecordsLabel();
    updateSaveUI();
    if (typeof refreshHubUI === "function") refreshHubUI();
    return true;
  }

  function getProgressSummary() {
    return {
      bestWave: records.bestWave | 0,
      bestStreak: records.bestStreak | 0,
      bestPops: records.bestPops | 0,
      games: records.games | 0,
      goldens: records.goldens | 0,
      bestScore: records.bestScore | 0,
      badges: Object.keys(badgesUnlocked).length,
      badgesTotal: BADGE_DEFS.length,
      lastMapId: progressMeta.lastMapId,
      lastMode: progressMeta.lastMode,
      lastSavedAt: lastSavedAt,
      storageOk: storageOk
    };
  }

  function noteMapClear(mapId) {
    if (!MAPS[mapId]) return;
    if (!mapRecords[mapId]) mapRecords[mapId] = { bestWave: 0, bestStreak: 0, clears: 0, bestScore: 0 };
    mapRecords[mapId].clears = (mapRecords[mapId].clears | 0) + 1;
  }

  function noteModePlay(modeId) {
    if (!MODES[modeId]) return;
    if (!modeRecords[modeId]) modeRecords[modeId] = { bestWave: 0, wins: 0, plays: 0, bestScore: 0 };
    modeRecords[modeId].plays = (modeRecords[modeId].plays | 0) + 1;
  }

  function noteModeWin(modeId) {
    if (!MODES[modeId]) return;
    if (!modeRecords[modeId]) modeRecords[modeId] = { bestWave: 0, wins: 0, plays: 0, bestScore: 0 };
    modeRecords[modeId].wins = (modeRecords[modeId].wins | 0) + 1;
  }

  // ── Badges (30 goals across easy → legendary) ──
  var BADGE_DEFS = [
    { id: "first_peel", icon: "🍌", name: "First Peel", desc: "Finish any run", tier: "easy" },
    { id: "wave_10", icon: "🔟", name: "Wave 10", desc: "Reach wave 10", tier: "easy" },
    { id: "wave_25", icon: "🌊", name: "Quarter Stack", desc: "Reach wave 25", tier: "easy" },
    { id: "builder", icon: "🏗️", name: "Builder", desc: "Place 10 MonKeys in one run", tier: "easy" },
    { id: "jackpot", icon: "✨", name: "Jackpot", desc: "Pop a golden banana", tier: "easy" },
    { id: "streak_25", icon: "🔥", name: "On a Roll", desc: "Kill streak ×25", tier: "easy" },
    { id: "mission_1", icon: "📋", name: "Side Quest", desc: "Complete a mission", tier: "easy" },
    { id: "ability_1", icon: "⚡", name: "Power User", desc: "Use any ability", tier: "easy" },
    { id: "wave_50", icon: "5️⃣", name: "Half Century", desc: "Reach wave 50", tier: "medium" },
    { id: "wave_75", icon: "🏔️", name: "High Ground", desc: "Reach wave 75", tier: "medium" },
    { id: "first_win", icon: "🏆", name: "Core Secure", desc: "Win any mode", tier: "medium" },
    { id: "golden_5", icon: "💎", name: "Treasure Hunt", desc: "5 jackpots lifetime", tier: "medium" },
    { id: "streak_50", icon: "☄️", name: "Fever Pitch", desc: "Kill streak ×50", tier: "medium" },
    { id: "perfect_10", icon: "🛡️", name: "Iron Core", desc: "10 perfect waves in one run", tier: "medium" },
    { id: "hard_40", icon: "💪", name: "Hardened", desc: "Wave 40 on Hard+", tier: "medium" },
    { id: "all_maps", icon: "🗺️", name: "Tourist", desc: "Play all 6 maps", tier: "medium" },
    { id: "modes_all", icon: "🎲", name: "Variety Pack", desc: "Play every mode", tier: "medium" },
    { id: "abilities_25", icon: "🌩️", name: "Storm Chaser", desc: "Use abilities 25 times", tier: "medium" },
    { id: "wave_100", icon: "💯", name: "Century", desc: "Reach wave 100", tier: "hard" },
    { id: "classic_clear", icon: "👑", name: "Classic Champ", desc: "Win Classic mode", tier: "hard" },
    { id: "tour_clear", icon: "🌍", name: "World Tourist", desc: "Win World Tour", tier: "hard" },
    { id: "rush_clear", icon: "🚀", name: "Fever Finisher", desc: "Win Fever Rush", tier: "hard" },
    { id: "party_clear", icon: "🎉", name: "Party Animal", desc: "Win Party mode", tier: "hard" },
    { id: "starship_40", icon: "🛸", name: "Starship Cadet", desc: "Wave 40 on Starship", tier: "hard" },
    { id: "golden_25", icon: "🌟", name: "Midas Touch", desc: "25 jackpots lifetime", tier: "hard" },
    { id: "streak_100", icon: "⚡", name: "Unstoppable", desc: "Kill streak ×100", tier: "hard" },
    { id: "wave_150", icon: "🌈", name: "End of the Line", desc: "Reach wave 150", tier: "legend" },
    { id: "starship_win", icon: "🚀", name: "Starship Ace", desc: "Win on Starship difficulty", tier: "legend" },
    { id: "badge_half", icon: "⭐", name: "Collector", desc: "Unlock 15 badges", tier: "legend" },
    { id: "badge_all", icon: "🍌", name: "Potassium God", desc: "Unlock every other badge", tier: "legend" }
  ];

  function mapStars(mapId) {
    var bw = (mapRecords[mapId] && mapRecords[mapId].bestWave) || 0;
    if (bw >= 150) return 4;
    if (bw >= 100) return 3;
    if (bw >= 50) return 2;
    if (bw >= 25) return 1;
    return 0;
  }

  function starString(n) {
    var s = "";
    for (var i = 0; i < 4; i++) s += i < n ? "★" : "☆";
    return s;
  }

  /** Run score — higher is better. Diff/mode multiply for prestige. */
  function computeRunScore(opts) {
    opts = opts || {};
    var w = opts.wave != null ? opts.wave : wave;
    var p = opts.pops != null ? opts.pops : pops;
    var earned = opts.banEarned != null ? opts.banEarned : banEarned;
    var streak = opts.streak != null ? opts.streak : bestStreakRun;
    var gold = opts.goldens != null ? opts.goldens : goldensPopped;
    var won = !!opts.won;
    var diff = opts.difficulty || difficulty;
    var mode = opts.mode || playMode;
    var diffMul = diff === "starship" ? 1.85 : diff === "hard" ? 1.4 : 1;
    var modeMul = mode === "rush" ? 1.15 : mode === "party" ? 1.1 : mode === "tour" ? 1.12 : 1;
    var base = w * 1000 + p * 2 + Math.floor(earned * 0.08) + streak * 40 + gold * 600 + (won ? 8000 : 0);
    return Math.max(0, Math.floor(base * diffMul * modeMul));
  }

  function pushLeaderboardEntry(entry) {
    if (!entry || !(entry.score > 0)) return;
    leaderboard.push({
      score: entry.score | 0,
      wave: entry.wave | 0,
      pops: entry.pops | 0,
      mode: entry.mode || playMode,
      map: entry.map || currentMap,
      difficulty: entry.difficulty || difficulty,
      won: !!entry.won,
      at: entry.at || Date.now()
    });
    leaderboard.sort(function (a, b) { return b.score - a.score; });
    if (leaderboard.length > LB_MAX) leaderboard.length = LB_MAX;
  }

  function unlockBadge(id) {
    if (!id || badgesUnlocked[id]) return false;
    var def = null;
    for (var i = 0; i < BADGE_DEFS.length; i++) {
      if (BADGE_DEFS[i].id === id) { def = BADGE_DEFS[i]; break; }
    }
    if (!def) return false;
    badgesUnlocked[id] = Date.now();
    runBadgeQueue.push(def);
    // De-dupe in lastRunBadges
    var already = false;
    for (var j = 0; j < lastRunBadges.length; j++) {
      if (lastRunBadges[j].id === id) { already = true; break; }
    }
    if (!already) lastRunBadges.push(def);
    queueBadgeToast(def);
    // Persist soon so refresh/crash keeps the badge
    saveRecords();
    return true;
  }

  function queueBadgeToast(def) {
    var el = document.getElementById("badgeToast");
    if (!el) return;
    el.textContent = def.icon + " Badge unlocked: " + def.name;
    el.classList.add("show");
    badgeToastT = 2.8;
  }

  function tickBadgeToast(dt) {
    if (badgeToastT <= 0) return;
    badgeToastT -= dt;
    if (badgeToastT <= 0) {
      var el = document.getElementById("badgeToast");
      if (el) el.classList.remove("show");
      // show next queued badge if any still pending display
      if (runBadgeQueue.length > 1) {
        // already showing first; remaining shown on next unlock call
      }
    }
  }

  function countMapsPlayed() {
    var n = 0;
    Object.keys(MAPS).forEach(function (id) {
      if (mapRecords[id] && mapRecords[id].bestWave > 0) n++;
    });
    return n;
  }

  function countModesPlayed() {
    var n = 0;
    Object.keys(MODES).forEach(function (id) {
      if (modeRecords[id] && modeRecords[id].plays > 0) n++;
    });
    return n;
  }

  /**
   * Evaluate badge unlocks from current progress + optional run context.
   * @param {{won?:boolean}} ctx
   * @returns {object[]} newly unlocked badge defs
   */
  function checkBadges(ctx) {
    ctx = ctx || {};
    var w = wave | 0;
    var won = !!ctx.won;

    if ((records.games | 0) >= 1 || w > 0) unlockBadge("first_peel");
    if (w >= 10) unlockBadge("wave_10");
    if (w >= 25) unlockBadge("wave_25");
    if (w >= 50) unlockBadge("wave_50");
    if (w >= 75) unlockBadge("wave_75");
    if (w >= 100) unlockBadge("wave_100");
    if (w >= 150) unlockBadge("wave_150");
    if (totalBuilt >= 10) unlockBadge("builder");
    if ((goldensPopped | 0) >= 1 || (records.goldens | 0) >= 1) unlockBadge("jackpot");
    if ((records.goldens | 0) >= 5) unlockBadge("golden_5");
    if ((records.goldens | 0) >= 25) unlockBadge("golden_25");
    if ((bestStreakRun | 0) >= 25 || (records.bestStreak | 0) >= 25) unlockBadge("streak_25");
    if ((bestStreakRun | 0) >= 50 || (records.bestStreak | 0) >= 50) unlockBadge("streak_50");
    if ((bestStreakRun | 0) >= 100 || (records.bestStreak | 0) >= 100) unlockBadge("streak_100");
    if ((missionsDone | 0) >= 1 || (records.missions | 0) >= 1) unlockBadge("mission_1");
    if ((runAbilityUses | 0) >= 1 || (metaStats.abilityUses | 0) >= 1) unlockBadge("ability_1");
    if ((metaStats.abilityUses | 0) >= 25) unlockBadge("abilities_25");
    if ((runPerfectWaves | 0) >= 10) unlockBadge("perfect_10");
    if (w >= 40 && (difficulty === "hard" || difficulty === "starship")) unlockBadge("hard_40");
    if (w >= 40 && difficulty === "starship") unlockBadge("starship_40");
    if (countMapsPlayed() >= 6) unlockBadge("all_maps");
    if (countModesPlayed() >= 4) unlockBadge("modes_all");

    if (won || (metaStats.totalWins | 0) >= 1) unlockBadge("first_win");
    if (won && playMode === "classic") unlockBadge("classic_clear");
    if (won && playMode === "tour") unlockBadge("tour_clear");
    if (won && playMode === "rush") unlockBadge("rush_clear");
    if (won && playMode === "party") unlockBadge("party_clear");
    if (won && difficulty === "starship") unlockBadge("starship_win");

    // Collector badges after others
    var unlocked = Object.keys(badgesUnlocked).length;
    if (unlocked >= 15) unlockBadge("badge_half");
    // badge_all: all except itself
    var nonLegendAll = BADGE_DEFS.filter(function (b) { return b.id !== "badge_all"; });
    var haveAll = nonLegendAll.every(function (b) { return !!badgesUnlocked[b.id]; });
    if (haveAll) unlockBadge("badge_all");

    return lastRunBadges.slice(); // all badges earned this run
  }

  function getNextBadgeGoal() {
    for (var i = 0; i < BADGE_DEFS.length; i++) {
      if (!badgesUnlocked[BADGE_DEFS[i].id]) return BADGE_DEFS[i];
    }
    return null;
  }

  function formatScore(n) {
    n = n | 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 10000) return Math.floor(n / 1000) + "k";
    return String(n);
  }

  function refreshHubUI() {
    var statsEl = document.getElementById("hubStats");
    var nextEl = document.getElementById("hubNext");
    var badgesEl = document.getElementById("hubBadges");
    var boardEl = document.getElementById("hubBoard");
    var s = getProgressSummary();
    if (statsEl) {
      statsEl.innerHTML =
        "<span>Best wave <b>" + s.bestWave + "</b></span>" +
        "<span>Best score <b>" + formatScore(s.bestScore) + "</b></span>" +
        "<span>Badges <b>" + s.badges + "/" + s.badgesTotal + "</b></span>" +
        "<span>Runs <b>" + s.games + "</b></span>";
    }
    if (nextEl) {
      var goal = getNextBadgeGoal();
      if (goal) {
        nextEl.innerHTML = "Next goal: <span>" + goal.icon + " " + goal.name + "</span> — " + goal.desc;
      } else {
        nextEl.innerHTML = "Next goal: <span>All badges unlocked</span> — legend status achieved.";
      }
    }
    if (badgesEl) {
      var html = '<div class="badge-grid">';
      for (var i = 0; i < BADGE_DEFS.length; i++) {
        var b = BADGE_DEFS[i];
        var on = !!badgesUnlocked[b.id];
        html += '<div class="badge-card' + (on ? " on" : "") + '" title="' + b.desc + '">' +
          '<div class="b-ico">' + b.icon + "</div>" +
          '<div class="b-name">' + b.name + "</div>" +
          '<div class="b-desc">' + b.desc + "</div></div>";
      }
      html += "</div>";
      badgesEl.innerHTML = html;
    }
    if (boardEl) {
      if (!leaderboard.length) {
        boardEl.innerHTML = '<div class="lb-empty">No scores yet. Finish a run to post a local high score.</div>';
      } else {
        var lh = '<div class="lb-list">';
        for (var j = 0; j < leaderboard.length; j++) {
          var e = leaderboard[j];
          var mapName = MAPS[e.map] ? MAPS[e.map].short : e.map;
          var modeName = MODES[e.mode] ? MODES[e.mode].short : e.mode;
          var diffName = DIFFS[e.difficulty] ? DIFFS[e.difficulty].name : e.difficulty;
          lh += '<div class="lb-row">' +
            '<span class="rank">#' + (j + 1) + "</span>" +
            '<div><div>' + modeName + " · " + mapName + (e.won ? " · Win" : "") + "</div>" +
            '<div class="meta">W' + e.wave + " · " + diffName + " · " + (e.pops | 0) + " pops</div></div>" +
            '<span class="score">' + formatScore(e.score) + "</span></div>";
        }
        lh += "</div>";
        boardEl.innerHTML = lh;
      }
    }
    // Map mastery stars on map cards
    document.querySelectorAll("#mapPick .map-card").forEach(function (card) {
      var mid = card.getAttribute("data-map");
      var stars = mapStars(mid);
      var el = card.querySelector(".map-stars");
      if (!el) {
        el = document.createElement("span");
        el.className = "map-stars";
        card.appendChild(el);
      }
      el.textContent = stars ? starString(stars) : "";
    });
    refreshRecordsLabel();
  }

  function setHubTab(which) {
    document.querySelectorAll(".hub-tab").forEach(function (t) {
      var on = t.getAttribute("data-hub") === which;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    var badgesEl = document.getElementById("hubBadges");
    var boardEl = document.getElementById("hubBoard");
    if (badgesEl) badgesEl.classList.toggle("hidden", which !== "badges");
    if (boardEl) boardEl.classList.toggle("hidden", which !== "board");
  }

  /**
   * Finalize a run: score, leaderboard, badges, records. Call from win/lose.
   * @param {{won:boolean}} ctx
   */
  function finalizeRun(ctx) {
    ctx = ctx || { won: false };
    var won = !!ctx.won;
    var score = computeRunScore({ won: won });
    lastRunScore = score;

    if (score > (records.bestScore | 0)) records.bestScore = score;
    if (wave > records.bestWave) records.bestWave = wave;
    if (bestStreakRun > records.bestStreak) records.bestStreak = bestStreakRun;
    if (pops > records.bestPops) records.bestPops = pops;
    if (goldensPopped > records.goldens) records.goldens = goldensPopped;
    if (missionsDone > records.missions) records.missions = missionsDone;

    metaStats.totalPops = (metaStats.totalPops | 0) + (pops | 0);
    if (won) metaStats.totalWins = (metaStats.totalWins | 0) + 1;

    var mid = currentMap;
    if (MAPS[mid]) {
      if (!mapRecords[mid]) mapRecords[mid] = { bestWave: 0, bestStreak: 0, clears: 0, bestScore: 0 };
      if (wave > mapRecords[mid].bestWave) mapRecords[mid].bestWave = wave;
      if (bestStreakRun > mapRecords[mid].bestStreak) mapRecords[mid].bestStreak = bestStreakRun;
      if (score > (mapRecords[mid].bestScore | 0)) mapRecords[mid].bestScore = score;
    }
    var moid = playMode;
    if (MODES[moid]) {
      if (!modeRecords[moid]) modeRecords[moid] = { bestWave: 0, wins: 0, plays: 0, bestScore: 0 };
      if (wave > modeRecords[moid].bestWave) modeRecords[moid].bestWave = wave;
      if (score > (modeRecords[moid].bestScore | 0)) modeRecords[moid].bestScore = score;
    }

    pushLeaderboardEntry({
      score: score,
      wave: wave,
      pops: pops,
      mode: playMode,
      map: currentMap,
      difficulty: difficulty,
      won: won,
      at: Date.now()
    });

    var newly = checkBadges({ won: won });
    var badgeLine = newly.length
      ? "New badges: " + newly.map(function (b) { return b.icon + " " + b.name; }).join(" · ")
      : (Object.keys(badgesUnlocked).length
        ? "Badges " + Object.keys(badgesUnlocked).length + "/" + BADGE_DEFS.length
        : "");

    var scoreLine = "Score " + formatScore(score) +
      (score >= (records.bestScore | 0) && score > 0 ? " · Personal best!" : "");

    return { score: score, scoreLine: scoreLine, badgeLine: badgeLine, newBadges: newly };
  }

  function showRunMeta(won) {
    var scoreEl = document.getElementById(won ? "winScore" : "loseScore");
    var badgeEl = document.getElementById(won ? "winBadges" : "loseBadges");
    if (scoreEl) scoreEl.textContent = lastRunScore ? "Score " + formatScore(lastRunScore) : "";
    if (badgeEl) {
      if (lastRunBadges.length) {
        badgeEl.textContent = "New: " + lastRunBadges.map(function (b) {
          return b.icon + " " + b.name;
        }).join(" · ");
      } else {
        badgeEl.textContent = "";
      }
    }
  }

  function applyLoadedPrefsToUI() {
    var btn = document.getElementById("btnMute");
    if (btn) {
      btn.textContent = muted ? "Muted" : "Sound";
      btn.classList.toggle("on", muted);
      btn.title = muted ? "Unmute (M)" : "Mute (M)";
    }
    if (btnAutoWave) {
      btnAutoWave.classList.toggle("on", autoWave);
      btnAutoWave.textContent = autoWave ? "Auto on" : "Auto";
    }
    // Restore last mode / map / difficulty on menu
    if (!running) {
      if (progressMeta.lastMode && MODES[progressMeta.lastMode]) {
        playMode = progressMeta.lastMode;
        document.querySelectorAll("#modePick .chip-btn").forEach(function (b) {
          b.classList.toggle("on", b.getAttribute("data-mode") === playMode);
        });
      }
      if (progressMeta.lastMapId && MAPS[progressMeta.lastMapId]) {
        currentMap = progressMeta.lastMapId;
        document.querySelectorAll("#mapPick .chip-btn, #mapPick .map-card").forEach(function (b) {
          b.classList.toggle("on", b.getAttribute("data-map") === currentMap);
        });
      }
      if (progressMeta.lastDifficulty && DIFFS[progressMeta.lastDifficulty]) {
        difficulty = progressMeta.lastDifficulty;
        document.querySelectorAll("#diffPick .chip-btn").forEach(function (b) {
          b.classList.toggle("on", b.getAttribute("data-diff") === difficulty);
        });
      }
      if (typeof updateModeUI === "function") updateModeUI();
      if (typeof rebuildPath === "function") { rebuildPath(); initDecor(); }
    }
  }

  function refreshRecordsLabel() {
    var el = document.getElementById("tdRecords");
    if (!el) return;
    var s = getProgressSummary();
    if (s.bestWave || s.bestStreak || s.games || s.badges) {
      el.textContent = "Best wave " + s.bestWave +
        " · Score " + formatScore(s.bestScore) +
        " · Badges " + s.badges + "/" + s.badgesTotal +
        (s.games ? " · Runs " + s.games : "");
      el.classList.remove("hidden");
    } else {
      el.textContent = storageOk ? "Progress, badges & scores save on this device" : "Storage unavailable — progress won't persist";
      el.classList.remove("hidden");
    }
  }

  function updateSaveUI() {
    var el = document.getElementById("tdSaveStatus");
    if (!el) return;
    if (!storageOk) {
      el.textContent = "Save unavailable";
      el.classList.add("warn");
      return;
    }
    el.classList.remove("warn");
    if (saveFlashT > 0) {
      el.textContent = "Saved";
      el.classList.add("flash");
    } else if (lastSavedAt) {
      el.textContent = "Saved " + formatSaveAge(lastSavedAt);
      el.classList.remove("flash");
    } else {
      el.textContent = "";
    }
  }

  function formatSaveAge(ts) {
    var sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (sec < 5) return "just now";
    if (sec < 60) return sec + "s ago";
    if (sec < 3600) return Math.floor(sec / 60) + "m ago";
    if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
    return Math.floor(sec / 86400) + "d ago";
  }

  function downloadProgressFile() {
    try {
      var blob = new Blob([exportProgress()], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "bananox-td-progress.json";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      showToast("Progress exported");
    } catch (e) {
      showToast("Export failed");
    }
  }

  function promptImportProgress() {
    var input = document.getElementById("tdImportFile");
    if (input) input.click();
  }

  function confirmResetProgress() {
    if (!confirm("Reset all Banano TD progress on this device?\n\nHigh scores, badges, leaderboard, map records, and settings will be wiped. This cannot be undone (export first if you want a backup).")) {
      return;
    }
    resetProgress();
    refreshHubUI();
    showToast("Progress reset");
  }

  // Abilities (cooldowns in seconds)
  var abilities = {
    storm:  { cd: 0, maxCd: 22, cost: 0 },
    freeze: { cd: 0, maxCd: 18, cost: 0 },
    cash:   { cd: 0, maxCd: 28, cost: 0 },
    rage:   { cd: 0, maxCd: 32, cost: 0 }
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
    if (muted || !actx) return;
    var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = type || "square"; o.frequency.value = f;
    g.gain.setValueAtTime(v || 0.03, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t + d + 0.02);
  }
  function toggleMute() {
    muted = !muted;
    var btn = document.getElementById("btnMute");
    if (btn) {
      btn.textContent = muted ? "Muted" : "Sound";
      btn.classList.toggle("on", muted);
      btn.title = muted ? "Unmute (M)" : "Mute (M)";
    }
    showToast(muted ? "Muted" : "Sound on");
    saveRecords();
  }
  loadRecords();
  function sfxPop() { beep(520 + Math.random() * 380, 0.03, "square", 0.022); }
  function sfxPlace() { beep(320, 0.06, "triangle", 0.035); beep(480, 0.08, "triangle", 0.025); }
  function sfxUp() { beep(520, 0.05, "square", 0.03); beep(780, 0.1, "sine", 0.028); }
  function sfxWave() { beep(240, 0.1, "sawtooth", 0.028); beep(360, 0.12, "triangle", 0.022); }
  function sfxLeak() { beep(110, 0.18, "sawtooth", 0.04); }
  function sfxWin() { beep(523, 0.1, "square", 0.03); beep(659, 0.12, "square", 0.03); beep(784, 0.22, "triangle", 0.035); }
  function sfxBoss() { beep(70, 0.3, "sawtooth", 0.05); beep(140, 0.25, "square", 0.035); beep(280, 0.2, "triangle", 0.03); }
  function sfxAbility() { beep(600, 0.08, "sine", 0.04); beep(900, 0.12, "triangle", 0.03); }
  function sfxFever() { beep(400, 0.08, "sawtooth", 0.04); beep(600, 0.1, "square", 0.035); beep(900, 0.14, "sine", 0.03); }
  function sfxJackpot() { beep(660, 0.08, "square", 0.05); beep(880, 0.1, "square", 0.04); beep(1320, 0.16, "triangle", 0.045); }
  function sfxStreak(n) { beep(300 + n * 12, 0.05, "square", 0.03); if (n % 10 === 0) beep(800, 0.1, "sine", 0.035); }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
  function distSq(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
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
    if (particles.length > MAX_PARTICLES - 12) {
      particles.splice(0, Math.min(n + 6, particles.length >> 2));
    }
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
    for (var i = 0; i < Math.floor(32 * quality) && particles.length < MAX_PARTICLES; i++) {
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

  
  function totalTier(t) {
    return (t.paths ? t.paths[0] + t.paths[1] : (t.tier || 0));
  }
  function canBuyPath(t, pathIdx) {
    if (!t.paths || !t.def.paths) return false;
    var cur = t.paths[pathIdx];
    if (cur >= MAX_PATH) return false;
    var next = cur + 1;
    var other = t.paths[1 - pathIdx];
    // BTD rule: cannot have both paths above 2
    if (next > 2 && other > 2) return false;
    return !!t.def.paths[pathIdx][cur];
  }
  function nextUpgrade(t, pathIdx) {
    if (!canBuyPath(t, pathIdx)) return null;
    return t.def.paths[pathIdx][t.paths[pathIdx]];
  }
  function applyAllPathUpgrades(t, fn) {
    if (!t.def.paths || !t.paths) return;
    for (var p = 0; p < 2; p++) {
      for (var i = 0; i < t.paths[p]; i++) {
        var u = t.def.paths[p][i];
        if (u) fn(u);
      }
    }
  }
  function applyUpgradeToStats(st, u) {
    if (u.range) st.range += u.range;
    if (u.rof) st.rof += u.rof;
    if (u.pierce) st.pierce += u.pierce;
    if (u.pop) st.pop += u.pop;
    if (u.splash) st.splash += u.splash;
    if (u.slow) st.slow += u.slow;
    if (u.camo) st.camo = true;
    if (u.lead) st.lead = true;
    if (u.multishot) st.multishot += u.multishot;
    if (u.auraRof) st.auraRof += u.auraRof;
    if (u.auraCamo) st.auraCamo = true;
    if (u.income) st.income += u.income;
    if (u.preferStrong) st.preferStrong = true;
  }

  function getStatsNoAura(t) {
    var d = t.def, range = d.range, auraRof = 0, auraCamo = false, income = 0;
    if (d.farm) income += 25;
    applyAllPathUpgrades(t, function (u) {
      if (u.range) range += u.range;
      if (u.auraRof) auraRof += u.auraRof;
      if (u.auraCamo) auraCamo = true;
      if (u.income) income += u.income;
    });
    return { range: range, auraRof: auraRof, auraCamo: auraCamo, income: income };
  }

  function getStats(t) {
    // Per-frame cache: update + draw both call this
    if (t._fid === frameStatsId && t._st) return t._st;
    var d = t.def;
    var st = {
      range: d.range, rof: d.rof, pierce: d.pierce, pop: d.pop,
      splash: d.splash, slow: d.slow, camo: d.camo, lead: d.lead,
      multishot: d.multishot || 0, auraRof: 0, auraCamo: false,
      income: d.farm ? 25 : 0, preferStrong: !!d.preferStrong
    };
    applyAllPathUpgrades(t, function (u) { applyUpgradeToStats(st, u); });
    var rofMul = 1;
    for (var j = 0; j < towers.length; j++) {
      var v = towers[j];
      if (!v.def.support || v.def.farm || v === t) continue;
      var vs = getStatsNoAura(v);
      if (distSq(t.x, t.y, v.x, v.y) <= vs.range * vs.range) {
        rofMul += vs.auraRof;
        if (vs.auraCamo) st.camo = true;
      }
    }
    st.rof = Math.max(0.04, st.rof / rofMul);
    if (feverT > 0) st.rof = Math.max(0.035, st.rof * 0.72);
    if (rageT > 0) st.rof = Math.max(0.03, st.rof * 0.55);
    if (eventKind === "frenzy") st.rof = Math.max(0.03, st.rof * 0.65);
    st.pop = Math.max(0, st.pop);
    st.slow = Math.min(0.92, st.slow);
    t._fid = frameStatsId;
    t._st = st;
    return st;
  }

  function spentOn(t) {
    var sum = t.def.cost;
    if (t.def.paths && t.paths) {
      for (var p = 0; p < 2; p++) {
        for (var i = 0; i < t.paths[p]; i++) {
          if (t.def.paths[p][i]) sum += t.def.paths[p][i].cost;
        }
      }
    }
    return sum;
  }

  function interestPreview() {
    // Bank interest: 12% of BAN, capped by difficulty
    var cap = difficulty === "starship" ? 500 : difficulty === "hard" ? 380 : 300;
    return Math.min(cap, Math.floor(ban * 0.12));
  }

  function killBounty(base) {
    // Live kill payout scales with wave + streak + fever/events
    var streakMul = 1 + Math.min(0.75, killStreak * 0.025);
    var waveMul = 1 + wave * 0.012;
    var mult = DIFFS[difficulty].reward * streakMul * waveMul * (getMode().ban || 1);
    if (feverT > 0) mult *= 2;
    if (eventKind === "double") mult *= 2;
    if (eventKind === "frenzy") mult *= 1.5;
    return Math.max(1, Math.floor(base * mult));
  }

  function specialBounty(th) {
    var base = th.value || 10;
    // Boss kills pay out hard so you feel rich mid-round
    if (th.kind === "superstarship") base = Math.max(base, 900);
    else if (th.kind === "starship") base = Math.max(base, 400);
    else if (th.kind === "boss") base = Math.max(base, 180);
    else if (th.kind === "ceramic") base = Math.max(base, 28);
    return killBounty(base);
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
      freezeT: 0, slowMul: 1, wobble: Math.random() * TWO_PI, uid: nextUid++
    };
  }

  function makeSpecial(kind, distAlong, scale) {
    var sc = (scale || 1) * DIFFS[difficulty].scale;
    var uid = nextUid++;
    if (kind === "ceramic") {
      return {
        kind: "ceramic", dist: distAlong, x: 0, y: 0, ang: 0, r: 19, speed: 44,
        camo: false, lead: false, alive: true, uid: uid,
        hp: Math.floor(14 * sc), maxHp: Math.floor(14 * sc), value: 32,
        freezeT: 0, slowMul: 1, children: "zebra", childCount: 2, wobble: Math.random() * TWO_PI
      };
    }
    if (kind === "boss") {
      return {
        kind: "boss", dist: distAlong, x: 0, y: 0, ang: 0, r: 32, speed: 24,
        camo: false, lead: true, alive: true, uid: uid,
        hp: Math.floor(260 * sc), maxHp: Math.floor(260 * sc), value: 220,
        freezeT: 0, slowMul: 1, children: "ceramic", childCount: 4, wobble: Math.random() * TWO_PI
      };
    }
    if (kind === "starship") {
      return {
        kind: "starship", dist: distAlong, x: 0, y: 0, ang: 0, r: 40, speed: 16,
        camo: false, lead: true, alive: true, uid: uid,
        hp: Math.floor(800 * sc), maxHp: Math.floor(800 * sc), value: 500,
        freezeT: 0, slowMul: 1, children: "boss", childCount: 2, wobble: Math.random() * TWO_PI
      };
    }
    if (kind === "superstarship") {
      return {
        kind: "superstarship", dist: distAlong, x: 0, y: 0, ang: 0, r: 48, speed: 12,
        camo: false, lead: true, alive: true, uid: uid,
        hp: Math.floor(2000 * sc), maxHp: Math.floor(2000 * sc), value: 1200,
        freezeT: 0, slowMul: 1, children: "starship", childCount: 2, wobble: Math.random() * TWO_PI
      };
    }
    return makeLayerThreat("green", distAlong, {});
  }

  function syncThreatPos(th) {
    var p = posAlong(th.dist);
    th.x = p.x; th.y = p.y; th.ang = p.ang;
  }

  function addBan(n, x, y, opts) {
    opts = opts || {};
    n = Math.floor(n);
    if (n <= 0) return 0;
    ban += n;
    banEarned += n;
    if (opts.kill) {
      roundKillBan += n;
      roundKills++;
      killStreak++;
      killStreakT = 3.2;
      if (killStreak > bestStreakRun) bestStreakRun = killStreak;
      if (mission && mission.type === "streak" && waveActive) {
        missionProgress = Math.max(missionProgress, killStreak);
      }
      // Streak milestones → FEVER
      if (killStreak === 15 || killStreak === 30 || killStreak === 50 || (killStreak > 0 && killStreak % 25 === 0)) {
        triggerFever(4 + Math.min(6, Math.floor(killStreak / 15)));
        sfxStreak(killStreak);
        announce("STREAK x" + killStreak + "!", 1.4);
      } else if (killStreak > 0 && killStreak % 10 === 0) {
        sfxStreak(killStreak);
        hitFlash = 0.12;
      }
    }
    // Always show float for kills / bonuses when position given
    if (x != null && y != null) {
      if (!opts.kill || floatBanThrottle <= 0 || n >= 8 || opts.forceFloat) {
        floatTxt(x, y, "+" + n, opts.color || "#ffe566", opts.size || (n >= 20 ? 15 : 12));
        if (opts.kill) floatBanThrottle = 0.05;
      }
    }
    if (hudRoundEarn) hudRoundEarn.textContent = "Round +" + Math.floor(roundKillBan);
    if (hudStreak) {
      hudStreak.textContent = killStreak >= 5 ? "Streak x" + killStreak : "Streak —";
      hudStreak.style.opacity = killStreak >= 5 ? "1" : "0.45";
    }
    if (hudBan) hudBan.textContent = String(Math.floor(ban));
    return n;
  }

  function popLayerEntity(th, popsLeft, canLead) {
    if (!th.alive || popsLeft <= 0) return popsLeft;
    if (th.kind !== "layer") {
      if (th.lead && !canLead) return 0;
      th.hp -= popsLeft; pops += popsLeft;
      burst(th.x, th.y, "#f5d041", 3 + Math.min(6, popsLeft));
      if (th.hp <= 0) {
        th.alive = false;
        var pay = specialBounty(th);
        addBan(pay, th.x, th.y - 14, { kill: true, forceFloat: true, size: 16, color: "#ffe566" });
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
        burst(th.x, th.y, th.kind === "superstarship" ? "#38bdf8" : "#fb923c", 28);
        floatTxt(th.x, th.y + 6, th.kind === "superstarship" ? "MEGA POP!" : "POP!", "#fff", 14);
        hitFlash = 0.18;
        confettiBurst();
      }
      return 0;
    }
    if (th.lead && !canLead) return popsLeft;
    while (popsLeft > 0 && th.alive) {
      var L = LAYERS[th.layer];
      if (!L) { th.alive = false; break; }
      var wasGolden = th.layer === "golden";
      var bounty = killBounty(L.value);
      addBan(bounty, th.x, th.y - 10, { kill: true, color: wasGolden ? "#fef08a" : L.color, forceFloat: wasGolden, size: wasGolden ? 18 : 12 });
      pops += 1; popsLeft -= 1; sfxPop();
      burst(th.x, th.y, L.color, wasGolden ? 16 : 5);
      trackMission("pop", th.layer);
      if (wasGolden) {
        goldensPopped++;
        if (goldensPopped > records.goldens) records.goldens = goldensPopped;
        unlockBadge("jackpot");
        if (records.goldens >= 5) unlockBadge("golden_5");
        if (records.goldens >= 25) unlockBadge("golden_25");
        sfxJackpot();
        announce("JACKPOT BANANA!", 1.2);
        confettiBurst();
        hitFlash = 0.25;
      }
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

  function triggerFever(sec) {
    feverT = Math.max(feverT, sec);
    sfxFever();
    showToast("🍌 BANANA FEVER · 2× BOUNTIES");
    hitFlash = 0.3;
    confettiBurst();
    if (hudFever) {
      hudFever.classList.add("on");
      hudFever.textContent = "FEVER!";
    }
  }

  function announce(msg, t) {
    comboAnnouncer = msg;
    comboAnnouncerT = t || 1.2;
  }

  function startEvent(kind, duration) {
    eventKind = kind;
    eventT = duration;
    eventCd = 18 + Math.random() * 14;
    var labels = {
      double: "💸 DOUBLE BOUNTY!",
      slowmo: "🧊 SLOW-MO SWARM!",
      rain: "🌧️ BAN RAIN!",
      frenzy: "🐵 MONKEY FRENZY!"
    };
    showToast(labels[kind] || "EVENT!");
    sfxAbility();
    if (kind === "rain") {
      var rain = 80 + wave * 3 + ((Math.random() * 60) | 0);
      addBan(rain, W / 2, 100, { forceFloat: true, size: 17, color: "#86efac" });
    }
    if (kind === "slowmo") {
      for (var i = 0; i < threats.length; i++) {
        if (!threats[i].alive) continue;
        threats[i].slowMul = Math.min(threats[i].slowMul, 0.4);
        threats[i].freezeT = Math.max(threats[i].freezeT, duration);
      }
    }
    updateEventHud();
  }

  function rollEvent() {
    if (!waveActive || eventT > 0 || eventCd > 0) return;
    var mode = getMode();
    // Party / Rush fire events more often
    var skipChance = 0.35 * (mode.eventScale || 1);
    if (Math.random() > (1 - skipChance)) { eventCd = modeEventCdBase(); return; }
    var kinds = ["double", "slowmo", "rain", "frenzy"];
    if (mode.eventScale && mode.eventScale < 0.6 && Math.random() < 0.25) {
      kinds.push("double", "frenzy"); // party bias
    }
    startEvent(kinds[(Math.random() * kinds.length) | 0], 6 + Math.random() * 4);
  }

  function updateEventHud() {
    if (!hudEvent) return;
    if (eventT > 0 && eventKind) {
      var names = { double: "2× BAN", slowmo: "Slow-mo", rain: "BAN rain", frenzy: "Frenzy" };
      hudEvent.textContent = (names[eventKind] || "Event") + " " + Math.ceil(eventT) + "s";
      hudEvent.classList.add("on");
    } else {
      hudEvent.textContent = "Event";
      hudEvent.classList.remove("on");
    }
  }

  function damageAt(x, y, popPower, pierce, splash, slow, canCamo, canLead) {
    var hits = 0, targets = [];
    var rad = splash > 0 ? splash : 0;
    var radSq = rad * rad;
    for (var i = 0; i < threats.length; i++) {
      var th = threats[i];
      if (!th.alive) continue;
      if (th.camo && !canCamo) continue;
      var need = splash > 0 ? radSq : (th.r + 10) * (th.r + 10);
      if (distSq(x, y, th.x, th.y) <= need) targets.push({ th: th, dist: th.dist });
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
      { id: "pops", text: "Pop <em>100</em> banana layers this round", need: 100, type: "pop", reward: 160 },
      { id: "cash", text: "Earn <em>300 BAN</em> from kill bounties this round", need: 300, type: "ban", reward: 180 },
      { id: "camo", text: "Destroy <em>15</em> camo bananas", need: 15, type: "camo", reward: 200 },
      { id: "no_leak", text: "Clear the round with <em>0 leaks</em>", need: 1, type: "noleak", reward: 220 },
      { id: "boss", text: "Crush a <em>boss-class</em> banana", need: 1, type: "boss", reward: 260 },
      { id: "streak", text: "Hit a <em>20</em> kill streak", need: 20, type: "streak", reward: 200 }
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
    if (mission.type === "streak") missionProgress = Math.max(missionProgress, killStreak);
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
      missionBox.innerHTML = "Kill bananas for live BAN. Clear rounds for big bonuses. Missions pay extra.";
      return;
    }
    var prog = missionProgress;
    if (mission.type === "ban") prog = Math.floor(roundKillBan);
    if (mission.type === "streak") prog = Math.max(missionProgress, killStreak);
    if (mission.type === "noleak") prog = mission._leaked ? 0 : 1;
    var need = mission.need;
    var done = mission.type === "noleak" ? !mission._leaked : prog >= need;
    missionBox.innerHTML = mission.text + "<br><em>" + Math.min(prog, need) + " / " + need + "</em>" +
      (done ? " · Claim on round clear" : "") +
      " · Reward <em>" + mission.reward + " BAN</em>";
  }

  function buildWave(n) {
    var q = [];
    var dens = DIFFS[difficulty].dens * (getMode().dens || 1);
    var scale = 1 + Math.max(0, n - 40) * 0.045;
    var jpMul = getMode().jackpot || 1;

    function add(layer, count, gap, flags) {
      count = Math.max(1, Math.round(count * dens));
      for (var i = 0; i < count; i++) q.push({ t: layer, gap: gap / dens, flags: flags || {} });
    }
    function addSpecial(kind, count, gap) {
      for (var i = 0; i < count; i++) q.push({ t: kind, special: true, gap: gap, scale: scale });
    }

    if (n <= 4) add("green", 14 + n * 6, 0.45);
    else if (n <= 8) { add("green", 16, 0.34); add("ripe", 14 + n, 0.38); }
    else if (n <= 12) { add("ripe", 18, 0.28); add("gold", 14, 0.32); add("green", 12, 0.24); }
    else if (n <= 18) {
      add("gold", 20, 0.24); add("purple", 14, 0.28); add("ripe", 16, 0.22);
      if (n >= 14) add("ripe", 12, 0.24, { camo: true });
    } else if (n <= 25) {
      add("purple", 20, 0.2); add("star", 14, 0.26); add("gold", 18, 0.18);
      add("ripe", 14, 0.22, { camo: true }); add("gold", 10, 0.28, { regrow: true });
      if (n === 20 || n === 25) addSpecial("boss", 1, 1.1);
    } else if (n <= 40) {
      add("star", 22, 0.16); add("zebra", 12, 0.24); addSpecial("ceramic", 4 + (n - 25), 0.55);
      add("gold", 16, 0.18, { camo: true }); add("purple", 12, 0.22, { regrow: true });
      if (n % 5 === 0) addSpecial("boss", 1, 0.9);
      if (n === 40) addSpecial("starship", 1, 1.15);
    } else if (n <= 60) {
      addSpecial("ceramic", 10, 0.38); add("zebra", 20, 0.14); add("star", 28, 0.12, { camo: true });
      addSpecial("boss", 1 + ((n - 40) / 8 | 0), 0.85);
      if (n === 50 || n === 60) addSpecial("starship", 1, 1.15);
      for (var L = 0; L < 8; L++) q.push({ t: "gold", gap: 0.35, flags: { lead: true } });
    } else if (n <= 85) {
      addSpecial("ceramic", 16, 0.28); add("zebra", 26, 0.11, { camo: true, regrow: true });
      addSpecial("boss", 2, 0.7); addSpecial("starship", 1 + ((n - 60) / 12 | 0), 1.0);
      if (n === 75 || n === 85) addSpecial("superstarship", 1, 1.2);
      for (var L2 = 0; L2 < 12; L2++) q.push({ t: "purple", gap: 0.28, flags: { lead: true, camo: true } });
    } else if (n <= 110) {
      addSpecial("ceramic", 20, 0.22); add("zebra", 34, 0.09, { camo: true, regrow: true });
      addSpecial("boss", 3, 0.55); addSpecial("starship", 2, 0.8);
      if (n % 10 === 0) addSpecial("superstarship", 1, 1.25);
      for (var L3 = 0; L3 < 14; L3++) q.push({ t: "zebra", gap: 0.2, flags: { lead: true, camo: true } });
    } else if (n <= 130) {
      addSpecial("ceramic", 24, 0.18); add("zebra", 42, 0.08, { camo: true, regrow: true });
      addSpecial("boss", 4, 0.48); addSpecial("starship", 3, 0.7);
      addSpecial("superstarship", 1 + ((n - 110) / 15 | 0), 1.3);
      for (var L4 = 0; L4 < 16; L4++) q.push({ t: "zebra", gap: 0.16, flags: { lead: true, camo: true, regrow: true } });
    } else {
      // Endgame 131–150
      addSpecial("ceramic", 28, 0.15); add("zebra", 50, 0.07, { camo: true, regrow: true });
      addSpecial("boss", 5, 0.4); addSpecial("starship", 4, 0.55);
      addSpecial("superstarship", n >= 145 ? 3 : 2, 1.5 + (n - 130) * 0.05);
      for (var L5 = 0; L5 < 20; L5++) q.push({ t: "zebra", gap: 0.14, flags: { lead: true, camo: true, regrow: true } });
    }
    if (n >= 18 && n < 70 && n % 4 === 0) {
      for (var li = 0; li < 8; li++) q.push({ t: "gold", gap: 0.38, flags: { lead: true } });
    }
    // Jackpot bananas — rare, juicy (mode can juice this)
    if (n >= 8 && Math.random() < (0.22 + Math.min(0.25, n * 0.002)) * jpMul) {
      add("golden", 1 + (n > 40 && Math.random() < 0.35 * jpMul ? 1 : 0), 1.1);
    }
    if (n % 15 === 0) add("golden", 2, 0.8);
    if (jpMul > 1.4 && n % 8 === 0) add("golden", 1, 0.9);
    return q;
  }

  function startWave() {
    if (!running || gameOver || paused || waveActive) return;
    if (!endless && wave >= MAX_WAVE) return;
    if (chapterPending || (roundOv && !roundOv.classList.contains("hidden"))) return;
    wave += 1;
    spawnQueue = buildWave(wave);
    spawnTimer = 0.25;
    waveActive = true;
    airdropT = 5 + Math.random() * 10;
    eventCd = modeEventCdBase();
    roundKillBan = 0;
    roundKills = 0;
    roundLeak = false;
    // Keep a bit of streak momentum between waves if fever
    if (feverT <= 0) killStreak = Math.floor(killStreak * 0.35);
    if (wave % 5 === 1) rollMission();
    else if (!mission) rollMission();

    var mode = getMode();
    var label = "WAVE " + wave + (endless ? " ∞" : " / " + MAX_WAVE);
    if (mode.tour) {
      var stop = Math.min(tourStop, TOUR_ROUTE.length - 1);
      var localW = ((wave - 1) % (mode.tourEvery || 20)) + 1;
      label = MAPS[TOUR_ROUTE[stop]].short + " · W" + localW + " · Tour " + (stop + 1) + "/" + TOUR_ROUTE.length;
    }
    if (wave === 25) label = "BOSS · MEGA BUNCH";
    if (wave === 50) label = "STARSHIP INBOUND";
    if (wave === 75) label = "FULL STACK ASSAULT";
    if (wave === 100) label = "ORBITAL SIEGE";
    if (wave === MAX_WAVE && !endless) label = "FINAL WAVE · " + mode.short.toUpperCase();
    if (endless && wave > (getMode().waves || 150)) label = "ENDLESS · WAVE " + wave;
    showToast(label);
    if (wave === 25 || wave === 50 || wave === 100 || wave === MAX_WAVE || (wave > 0 && wave % 25 === 0)) {
      sfxBoss();
      shake = 0.4;
      hitFlash = 0.2;
      announce(wave >= MAX_WAVE && !endless ? "FINAL WAVE!" : "BOSS WAVE!", 1.6);
    } else sfxWave();
    // Rush / party mid-run juice
    if (mode.feverStart && wave > 1 && wave % 15 === 0 && feverT <= 0) {
      triggerFever(5);
    }
    refreshUI();
  }

  function finishRoundEconomy() {
    // End-of-round bonus breakdown (kill money already paid live)
    var rewardMul = DIFFS[difficulty].reward * (getMode().ban || 1);
    var clearBase = Math.floor((100 + wave * 14 + wave * wave * 0.1) * rewardMul);
    var perfect = roundLeak ? 0 : Math.floor((50 + wave * 8) * rewardMul);
    var farmInc = 0;
    for (var vj = 0; vj < towers.length; vj++) {
      if (towers[vj].def.support || towers[vj].def.farm) farmInc += getStats(towers[vj]).income || 0;
    }
    farmInc = Math.floor(farmInc * rewardMul);
    var interest = interestPreview();
    var streakBonus = killStreak >= 15 ? Math.floor(30 + killStreak * 2) : (killStreak >= 8 ? 20 : 0);
    streakBonus = Math.floor(streakBonus * rewardMul);

    var missionPay = 0;
    if (mission) {
      var prog = missionProgress;
      if (mission.type === "ban") prog = Math.floor(roundKillBan);
      if (mission.type === "streak") prog = Math.max(prog, killStreak);
      var ok = mission.type === "noleak" ? !roundLeak : prog >= mission.need;
      if (ok) missionPay = Math.floor(mission.reward * rewardMul);
    }

    addBan(clearBase, W / 2, 90, { forceFloat: true, color: "#f5d041", size: 16 });
    if (perfect > 0) {
      addBan(perfect, W / 2, 120, { forceFloat: true, color: "#86efac", size: 14 });
      runPerfectWaves = (runPerfectWaves | 0) + 1;
      metaStats.perfectWaves = (metaStats.perfectWaves | 0) + 1;
      if (runPerfectWaves >= 10) unlockBadge("perfect_10");
    }
    if (farmInc > 0) addBan(farmInc, W / 2, 150, { forceFloat: true, color: "#84cc16", size: 13 });
    if (interest > 0) addBan(interest, W / 2, 175, { forceFloat: true, color: "#67e8f9", size: 13 });
    if (streakBonus > 0) addBan(streakBonus, W / 2, 200, { forceFloat: true, color: "#fb923c", size: 13 });
    if (missionPay > 0) {
      addBan(missionPay, W / 2, 225, { forceFloat: true, color: "#c084fc", size: 14 });
      missionsDone++;
      mission = null;
      unlockBadge("mission_1");
    } else {
      mission = null;
    }
    // Milestone badges mid-run (wave thresholds, streaks)
    if (wave >= 10) unlockBadge("wave_10");
    if (wave >= 25) unlockBadge("wave_25");
    if (wave >= 50) unlockBadge("wave_50");
    if (wave >= 75) unlockBadge("wave_75");
    if (wave >= 100) unlockBadge("wave_100");
    if (wave >= 150) unlockBadge("wave_150");
    if (bestStreakRun >= 25) unlockBadge("streak_25");
    if (bestStreakRun >= 50) unlockBadge("streak_50");
    if (bestStreakRun >= 100) unlockBadge("streak_100");
    if (totalBuilt >= 10) unlockBadge("builder");
    if (goldensPopped >= 1) unlockBadge("jackpot");
    saveRecords();

    var totalBonus = clearBase + perfect + farmInc + interest + streakBonus + missionPay;
    lastRoundSummary = {
      wave: wave,
      kills: roundKills,
      killBan: Math.floor(roundKillBan),
      clear: clearBase,
      perfect: perfect,
      farm: farmInc,
      interest: interest,
      streak: streakBonus,
      mission: missionPay,
      totalBonus: totalBonus,
      totalRound: Math.floor(roundKillBan) + totalBonus
    };

    showRoundSummary(lastRoundSummary);
    if (wave % 5 === 0) confettiBurst();
    abilities.storm.cd = Math.max(0, abilities.storm.cd - 8);
    abilities.freeze.cd = Math.max(0, abilities.freeze.cd - 8);
    abilities.cash.cd = Math.max(0, abilities.cash.cd - 6);
    killStreak = 0;
    saveRecords(true); // wave complete — durable save
    refreshUI();
  }

  function showRoundSummary(s) {
    if (!roundOv || !roundSummaryEl) {
      showToast("ROUND " + s.wave + " CLEAR · +" + s.totalBonus + " bonus (kills +" + s.killBan + ")");
      afterRoundSummary();
      return;
    }
    var html = "";
    html += "<div class='rs-row'><span>🍌 Kill bounties (live)</span><b>+" + s.killBan + "</b></div>";
    html += "<div class='rs-row'><span>🏁 Clear bonus</span><b>+" + s.clear + "</b></div>";
    if (s.perfect) html += "<div class='rs-row perfect'><span>✨ Perfect (no leaks)</span><b>+" + s.perfect + "</b></div>";
    if (s.farm) html += "<div class='rs-row'><span>🌴 Farm / village</span><b>+" + s.farm + "</b></div>";
    if (s.interest) html += "<div class='rs-row'><span>💰 Bank interest</span><b>+" + s.interest + "</b></div>";
    if (s.streak) html += "<div class='rs-row'><span>🔥 Streak bonus</span><b>+" + s.streak + "</b></div>";
    if (s.mission) html += "<div class='rs-row'><span>🎯 Mission</span><b>+" + s.mission + "</b></div>";
    html += "<div class='rs-total'><span>Round total</span><b>+" + s.totalRound + " BAN</b></div>";
    html += "<div class='rs-meta'>" + s.kills + " pops · Wave " + s.wave + "/" + MAX_WAVE + "</div>";
    roundSummaryEl.innerHTML = html;
    roundOv.classList.remove("hidden");
    paused = true; // hold the game until continue
    // Auto-advance for flow — still skippable with Space / button
    setTimeout(function () {
      if (roundOv && !roundOv.classList.contains("hidden") && running && !gameOver) {
        dismissRoundSummary();
      }
    }, 2800);
  }

  function afterRoundSummary() {
    if (!endless && wave >= MAX_WAVE) {
      endWin();
      return;
    }
    // World Tour: hop maps without wiping progress — relocate towers
    var mode = getMode();
    if (mode.tour && mode.tourEvery && wave % mode.tourEvery === 0 && wave < MAX_WAVE) {
      worldTourHop();
    }
    if (autoWave && (endless || wave < MAX_WAVE)) {
      autoWaveDelay = 0.85;
    }
  }

  function dismissRoundSummary() {
    if (roundOv) roundOv.classList.add("hidden");
    paused = false;
    afterRoundSummary();
    refreshUI();
  }

  function blueprintSpent(bp) {
    var def = TOWER_BY_ID[bp.id];
    if (!def) return 0;
    var sum = def.cost;
    if (def.paths && bp.paths) {
      for (var p = 0; p < 2; p++) {
        for (var i = 0; i < (bp.paths[p] || 0); i++) {
          if (def.paths[p][i]) sum += def.paths[p][i].cost;
        }
      }
    }
    return sum;
  }

  function findRedeployCell() {
    var best = null, bestScore = 1e15;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (isPath(c, r) || towerAt(c, r)) continue;
        var minD = 1e15;
        for (var i = 0; i < PATH_CELLS.length; i++) {
          var dx = PATH_CELLS[i][0] - c, dy = PATH_CELLS[i][1] - r;
          var d = dx * dx + dy * dy;
          if (d < minD) minD = d;
        }
        // Prefer near the path with a little noise so packs spread out
        var score = minD + Math.random() * 3;
        if (score < bestScore) {
          bestScore = score;
          best = { c: c, r: r };
        }
      }
    }
    return best;
  }

  // World Tour hop — keep upgrades, BAN, lives; relocate MonKeys to the new map
  function worldTourHop() {
    var pack = [];
    for (var i = 0; i < towers.length; i++) {
      var t = towers[i];
      pack.push({
        id: t.def.id,
        paths: [t.paths[0], t.paths[1]],
        target: t.target || "first"
      });
    }
    threats = [];
    projectiles = [];
    particles = [];
    floats = [];
    spawnQueue = [];
    selectedTower = null;
    clearPlaceMode();
    towers = [];

    tourStop = Math.min(tourStop + 1, TOUR_ROUTE.length - 1);
    currentMap = TOUR_ROUTE[tourStop];
    rebuildPath();
    initDecor();

    var redeployed = 0, refunded = 0, refundBan = 0;
    for (var j = 0; j < pack.length; j++) {
      var bp = pack[j];
      var def = TOWER_BY_ID[bp.id];
      if (!def) continue;
      var spot = findRedeployCell();
      if (!spot) {
        var val = blueprintSpent(bp);
        ban += val;
        refundBan += val;
        refunded++;
        continue;
      }
      towers.push({
        c: spot.c, r: spot.r,
        x: spot.c * TW + TW / 2, y: spot.r * TH + TH / 2,
        def: def,
        paths: [bp.paths[0] || 0, bp.paths[1] || 0],
        cd: 0, angle: 0,
        target: bp.target,
        flashT: 0.55
      });
      redeployed++;
    }

    var hopBonus = 500 + tourStop * 280 + redeployed * 45;
    addBan(hopBonus, W / 2, H * 0.42, { forceFloat: true, size: 18, color: "#f472b6" });
    confettiBurst();
    sfxAbility();
    frameStatsId++;
    announce(MAPS[currentMap].name.toUpperCase() + "!", 1.55);
    var msg = "WORLD TOUR · " + MAPS[currentMap].name + " · " + redeployed + " relocated";
    if (refunded) msg += " · " + refunded + " refunded (+" + Math.floor(refundBan) + ")";
    msg += " · +" + hopBonus + " BAN";
    showToast(msg);
    document.querySelectorAll("#mapPick .chip-btn, #mapPick .map-card").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-map") === currentMap);
    });
    if (hudMapName) {
      hudMapName.textContent = MAPS[currentMap].short + " · Tour";
    }
    saveRecords(true); // map hop / progress
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

  function clearPlaceMode() {
    if (selectedShop != null) {
      selectedShop = null;
      uiShopSnap = "";
    }
  }

  function placeTower(c, r, keepPlacing) {
    if (!running || gameOver || paused) return false;
    if (!selectedShop) return false;
    if (!inBounds(c, r) || isPath(c, r) || towerAt(c, r)) return false;
    var def = TOWER_BY_ID[selectedShop];
    if (!def || ban < def.cost) return false;
    ban -= def.cost;
    var t = {
      c: c, r: r, x: c * TW + TW / 2, y: r * TH + TH / 2,
      def: def, paths: [0, 0], cd: 0, angle: 0,
      target: def.preferStrong ? "strong" : "first",
      flashT: 0.35
    };
    towers.push(t); selectedTower = t; totalBuilt++;
    sfxPlace(); burst(t.x, t.y, def.color, 10);
    floatTxt(t.x, t.y - 16, "-" + def.cost, "#f5d041");
    frameStatsId++; // invalidate aura caches for nearby towers
    // Default: leave place mode so next click selects/upgrades, not spam-builds
    // Hold Ctrl/Cmd to keep placing the same tower type
    if (!keepPlacing) clearPlaceMode();
    refreshUI();
    return true;
  }

  function upgradeTower(pathIdx) {
    if (!selectedTower || gameOver) return;
    if (pathIdx !== 0 && pathIdx !== 1) pathIdx = 0;
    var t = selectedTower;
    if (!canBuyPath(t, pathIdx)) return;
    var up = nextUpgrade(t, pathIdx);
    if (!up || ban < up.cost) return;
    ban -= up.cost;
    t.paths[pathIdx]++;
    t.flashT = 0.45;
    t._fid = -1; // force stat recompute
    sfxUp(); burst(t.x, t.y, pathIdx === 0 ? "#ffe566" : "#67e8f9", 18);
    floatTxt(t.x, t.y - 18, up.name, pathIdx === 0 ? "#ffe566" : "#67e8f9", 12);
    // Specializing into deep tiers (3+) locks the other path
    if (t.paths[pathIdx] === 3) {
      confettiBurst();
      var pname = (t.def.pathNames && t.def.pathNames[pathIdx]) || (pathIdx === 0 ? "Top" : "Bottom");
      announce(pname.toUpperCase() + "!", 1.35);
      floatTxt(t.x, t.y - 36, "SPECIALIZED", "#f472b6", 13);
      shake = Math.max(shake, 0.12);
    }
    if (t.paths[pathIdx] >= MAX_PATH) {
      confettiBurst();
      floatTxt(t.x, t.y - 32, "PATH MAX!", "#f472b6", 14);
      announce("PATH COMPLETE!", 1.1);
    }
    frameStatsId++;
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
    frameStatsId++;
    beep(200, 0.08, "triangle", 0.03);
    refreshUI();
  }

  function noteAbilityUse() {
    runAbilityUses = (runAbilityUses | 0) + 1;
    metaStats.abilityUses = (metaStats.abilityUses | 0) + 1;
    if (runAbilityUses === 1) unlockBadge("ability_1");
    if (metaStats.abilityUses >= 25) unlockBadge("abilities_25");
  }

  // Abilities
  function useStorm() {
    if (!running || gameOver || paused || abilities.storm.cd > 0) return;
    if (roundOv && !roundOv.classList.contains("hidden")) return;
    abilities.storm.cd = abilities.storm.maxCd;
    noteAbilityUse();
    sfxAbility();
    showToast("⚡ PEEL STORM");
    shake = 0.45;
    hitFlash = 0.2;
    for (var i = 0; i < threats.length; i++) {
      var th = threats[i];
      if (!th.alive) continue;
      popLayerEntity(th, th.kind === "layer" ? 4 : 24, true);
      burst(th.x, th.y, "#f5d041", 8);
    }
    confettiBurst();
    refreshUI();
  }
  function useFreeze() {
    if (!running || gameOver || paused || abilities.freeze.cd > 0) return;
    if (roundOv && !roundOv.classList.contains("hidden")) return;
    abilities.freeze.cd = abilities.freeze.maxCd;
    noteAbilityUse();
    sfxAbility();
    showToast("🧊 CRYO RAIN");
    for (var i = 0; i < threats.length; i++) {
      if (!threats[i].alive) continue;
      threats[i].slowMul = 0.2;
      threats[i].freezeT = Math.max(threats[i].freezeT, 4.2);
      burst(threats[i].x, threats[i].y, "#67e8f9", 5);
    }
    refreshUI();
  }
  function useCash() {
    if (!running || gameOver || paused || abilities.cash.cd > 0) return;
    if (roundOv && !roundOv.classList.contains("hidden")) return;
    abilities.cash.cd = abilities.cash.maxCd;
    noteAbilityUse();
    sfxAbility();
    var drop = 220 + wave * 6 + missionsDone * 20 + Math.floor(killStreak * 3);
    addBan(drop, W / 2, 90, { forceFloat: true, size: 16 });
    showToast("🪂 EMERGENCY DROP +" + drop);
    confettiBurst();
    refreshUI();
  }
  function useRage() {
    if (!running || gameOver || paused || abilities.rage.cd > 0) return;
    if (roundOv && !roundOv.classList.contains("hidden")) return;
    abilities.rage.cd = abilities.rage.maxCd;
    noteAbilityUse();
    rageT = 9;
    sfxFever();
    showToast("🐵 MONKEY RAGE · MAX FIRE RATE");
    hitFlash = 0.25;
    confettiBurst();
    announce("RAGE MODE!", 1.3);
    refreshUI();
  }

  function cycleTarget(tower) {
    if (!tower) return;
    var i = TARGET_MODES.indexOf(tower.target || "first");
    if (i < 0) i = 0;
    tower.target = TARGET_MODES[(i + 1) % TARGET_MODES.length];
    floatTxt(tower.x, tower.y - 22, TARGET_LABEL[tower.target], "#c084fc", 12);
    beep(440 + i * 40, 0.04, "triangle", 0.02);
    refreshUI();
  }

  function findTarget(tower, st) {
    var best = null, bestScore = -1e15;
    var mode = tower.target || "first";
    var rangeSq = st.range * st.range;
    for (var i = 0; i < threats.length; i++) {
      var th = threats[i];
      if (!th.alive) continue;
      if (th.camo && !st.camo) continue;
      if (th.lead && !st.lead && th.kind === "layer") continue;
      if ((th.kind === "ceramic" || th.kind === "boss" || th.kind === "starship" || th.kind === "superstarship") && th.lead && !st.lead) continue;
      var dsq = distSq(tower.x, tower.y, th.x, th.y);
      if (dsq > rangeSq) continue;
      var score;
      if (mode === "last") score = -th.dist;
      else if (mode === "close") score = -dsq;
      else if (mode === "strong") {
        score = th.hp * 5;
        if (th.kind !== "layer") score += 120;
        else score += LAYER_ORDER.indexOf(th.layer) * 14;
        score += th.dist * 0.002; // tie-break: farther along path
      } else {
        score = th.dist; // first = furthest along path
      }
      if (score > bestScore) { bestScore = score; best = th; }
    }
    return best;
  }

  function fire(tower, target, st) {
    var shots = 1 + (st.multishot || 0);
    var baseSpd = tower.def.boomerang ? 240 : tower.def.rail ? 680 : 420;
    // Crit juice
    var crit = Math.random() < (0.08 + (feverT > 0 ? 0.1 : 0) + (rageT > 0 ? 0.08 : 0));
    var pop = st.pop + (crit ? Math.max(1, Math.ceil(st.pop * 0.5)) : 0);
    if (crit) {
      burst(tower.x, tower.y, "#fff", 4);
      floatTxt(target.x, target.y - 18, "CRIT!", "#fff", 11);
    }
    for (var s = 0; s < shots; s++) {
      var ang = Math.atan2(target.y - tower.y, target.x - tower.x) + (s - (shots - 1) / 2) * 0.1;
      tower.angle = ang;
      if (tower.def.freezePulse) {
        damageAt(tower.x, tower.y, pop, 99, st.splash || st.range * 0.72, st.slow, st.camo, st.lead);
        burst(tower.x, tower.y, "#67e8f9", 8);
        continue;
      }
      if (tower.def.farm) continue;
      projectiles.push({
        x: tower.x, y: tower.y,
        vx: Math.cos(ang) * baseSpd, vy: Math.sin(ang) * baseSpd,
        life: tower.def.boomerang ? 1.5 : tower.def.rail ? 0.55 : 0.9,
        age: 0, pierceLeft: st.pierce + (crit ? 1 : 0), pop: pop, splash: st.splash, slow: st.slow,
        camo: st.camo, lead: st.lead, color: crit ? "#ffffff" : tower.def.color,
        boomer: !!tower.def.boomerang, rail: !!tower.def.rail,
        home: tower.def.boomerang ? { x: tower.x, y: tower.y } : null,
        phase: 0, hitIds: {}, kind: tower.def.id, trail: quality > 0.55 ? [] : null, crit: crit
      });
    }
    beep(tower.def.rail ? 90 : tower.def.id === "bomb" ? 120 : 400, 0.025, "square", 0.015);
  }

  function update(dt) {
    animT += dt;
    frameStatsId++; // invalidate per-frame stats cache
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) toast.classList.remove("show"); }
    tickBadgeToast(dt);
    if (saveFlashT > 0) {
      saveFlashT -= dt;
      if (saveFlashT <= 0) updateSaveUI();
    }
    if (shake > 0) shake = Math.max(0, shake - dt * 2.2);

    // ability CDs + juice timers
    if (running && !gameOver && !paused) {
      ["storm", "freeze", "cash", "rage"].forEach(function (k) {
        if (abilities[k] && abilities[k].cd > 0) abilities[k].cd = Math.max(0, abilities[k].cd - dt);
      });
      if (floatBanThrottle > 0) floatBanThrottle -= dt;
      if (killStreakT > 0) {
        killStreakT -= dt;
        if (killStreakT <= 0) killStreak = Math.max(0, killStreak - 5);
      }
      if (feverT > 0) {
        feverT -= dt;
        if (feverT <= 0 && hudFever) { hudFever.classList.remove("on"); hudFever.textContent = "FEVER"; }
      }
      if (rageT > 0) rageT -= dt;
      if (eventT > 0) {
        eventT -= dt;
        if (eventT <= 0) { eventKind = null; updateEventHud(); }
        else updateEventHud();
      } else if (eventCd > 0) {
        eventCd -= dt;
      } else {
        rollEvent();
      }
      if (hitFlash > 0) hitFlash = Math.max(0, hitFlash - dt);
      if (comboAnnouncerT > 0) comboAnnouncerT -= dt;
      if (autoWaveDelay > 0) {
        autoWaveDelay -= dt;
        if (autoWaveDelay <= 0 && autoWave && !waveActive && !gameOver) startWave();
      }
    }

    if (!running || gameOver || paused) return;

    var load = threats.length + projectiles.length;
    quality = load > 120 ? 0.4 : load > 70 ? 0.65 : 1;
    // Slow-mo event reduces effective sim speed slightly for drama
    var speedMul = speed;
    if (eventKind === "slowmo") speedMul = Math.max(1, speed * 0.75);
    var d = dt * speedMul;

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
        drop = Math.floor(drop * DIFFS[difficulty].reward * (getMode().ban || 1));
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
        roundLeak = true;
        if (mission) mission._leaked = true;
        killStreak = 0;
        sfxLeak(); shake = Math.max(shake, 0.22);
        floatTxt(th.x, th.y, "-" + loss + " ❤️", "#f87171", 14);
        if (lives <= 0) { lives = 0; endLose(); return; }
        refreshUI();
      }
    }

    for (var t = 0; t < towers.length; t++) {
      var tower = towers[t];
      if (tower.flashT > 0) tower.flashT = Math.max(0, tower.flashT - d);
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
      if (pr.trail) {
        pr.trail.push({ x: pr.x, y: pr.y });
        if (pr.trail.length > 6) pr.trail.shift();
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

      var hitPad = pr.rail ? 14 : 9;
      for (var ti = 0; ti < threats.length; ti++) {
        var th2 = threats[ti];
        if (!th2.alive || (th2.camo && !pr.camo) || pr.hitIds[th2.uid]) continue;
        var hitR = th2.r + hitPad;
        if (distSq(pr.x, pr.y, th2.x, th2.y) <= hitR * hitR) {
          pr.hitIds[th2.uid] = true;
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
      finishRoundEconomy();
    }
  }

  // ── Draw (banana shapes + cached map) ──
  function drawBananaShape(x, y, r, fill, stroke, tip, ang, lead, camo) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + (quality > 0.55 ? Math.sin(animT * 3 + x * 0.01) * 0.08 : 0));
    ctx.globalAlpha = camo ? 0.5 : 1;
    // Fast path under load — solid banana, still readable
    if (quality < 0.55) {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.75, r * 1.05, 0.15, 0, TWO_PI);
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = stroke; ctx.lineWidth = 1.8; ctx.stroke();
      if (lead) { ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2.5; ctx.stroke(); }
      ctx.restore();
      return;
    }
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
    if (!hover || !running || gameOver) return;
    var c = hover.c, r = hover.r;
    if (!inBounds(c, r)) return;
    var occupied = towerAt(c, r);
    // Always show crisp cell under cursor (fixes “where will it drop?”)
    var x = c * TW, y = r * TH;
    var valid = !isPath(c, r) && !occupied;
    ctx.save();
    // Soft outer glow
    ctx.strokeStyle = valid ? "rgba(255,229,102,0.85)" : "rgba(248,113,113,0.9)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, TW - 3, TH - 3);
    ctx.fillStyle = valid ? "rgba(255,229,102,0.22)" : "rgba(248,113,113,0.25)";
    ctx.fillRect(x + 3, y + 3, TW - 6, TH - 6);
    // Crosshair center
    var cx = x + TW / 2, cy = y + TH / 2;
    ctx.strokeStyle = valid ? "rgba(255,255,255,0.55)" : "rgba(255,180,180,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
    ctx.stroke();

    // Placement ghost only while a shop tower is armed for placing
    if (selectedShop && (!selectedTower || !occupied)) {
      var def = TOWER_BY_ID[selectedShop];
      if (def && valid) {
        ctx.beginPath();
        ctx.arc(cx, cy, def.range, 0, TWO_PI);
        ctx.fillStyle = "rgba(255,229,102,0.06)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.55;
        ctx.font = "22px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(def.icon, cx, cy);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  function drawMonkey(t) {
    var st = getStats(t), sel = t === selectedTower;
    var deepTop = t.paths && t.paths[0] >= 3;
    var deepBot = t.paths && t.paths[1] >= 3;
    if (sel) {
      ctx.beginPath(); ctx.arc(t.x, t.y, st.range, 0, TWO_PI);
      ctx.fillStyle = "rgba(255,229,102,0.07)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,229,102,0.5)"; ctx.lineWidth = 2; ctx.stroke();
    }
    if (t.def.support && !t.def.farm) {
      ctx.beginPath(); ctx.arc(t.x, t.y, st.range, 0, TWO_PI);
      ctx.strokeStyle = "rgba(192,132,252,0.28)"; ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]);
    }
    // Specialized path aura
    if (deepTop || deepBot) {
      var glow = 0.12 + Math.sin(animT * 5 + t.x) * 0.04;
      ctx.beginPath(); ctx.arc(t.x, t.y, 28, 0, TWO_PI);
      ctx.fillStyle = deepTop ? "rgba(255,229,102," + glow + ")" : "rgba(103,232,249," + glow + ")";
      ctx.fill();
    }
    var scale = 1 + totalTier(t) * 0.04 + (t.flashT > 0 ? t.flashT * 0.25 : 0);
    ctx.save(); ctx.translate(t.x, t.y); ctx.scale(scale, scale);
    if (t.flashT > 0) {
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, TWO_PI);
      ctx.fillStyle = "rgba(255,255,255," + (t.flashT * 0.35) + ")"; ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(0, 13, 14, 5, 0, 0, TWO_PI); ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 5, 15, 0, TWO_PI); ctx.fillStyle = "#4a3018"; ctx.fill();
    ctx.strokeStyle = t.def.color; ctx.lineWidth = sel ? 3 : 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -2, 13, 0, TWO_PI);
    if (quality > 0.55) {
      var face = ctx.createRadialGradient(-3, -5, 2, 0, 0, 14);
      face.addColorStop(0, "#e2c08a"); face.addColorStop(1, "#b8894e");
      ctx.fillStyle = face;
    } else {
      ctx.fillStyle = "#c9a06a";
    }
    ctx.fill(); ctx.strokeStyle = "#3b2a1a"; ctx.lineWidth = 1.8; ctx.stroke();
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
    // Path pips: top path left (gold), bottom path right (cyan)
    for (var p0 = 0; p0 < (t.paths ? t.paths[0] : 0); p0++) {
      ctx.beginPath(); ctx.arc(-14 + p0 * 5, 15, p0 >= 2 ? 2.6 : 2.2, 0, TWO_PI);
      ctx.fillStyle = p0 >= 2 ? "#f472b6" : "#ffe566"; ctx.fill();
    }
    for (var p1 = 0; p1 < (t.paths ? t.paths[1] : 0); p1++) {
      ctx.beginPath(); ctx.arc(2 + p1 * 5, 15, p1 >= 2 ? 2.6 : 2.2, 0, TWO_PI);
      ctx.fillStyle = p1 >= 2 ? "#c084fc" : "#67e8f9"; ctx.fill();
    }
    if (!t.def.support && !t.def.freezePulse && !t.def.farm) {
      ctx.rotate(t.angle);
      if (t.def.rail) {
        ctx.fillStyle = "#38bdf8"; ctx.fillRect(6, -2.5, 18 + totalTier(t) * 2, 5);
        ctx.fillStyle = "#e0f2fe"; ctx.fillRect(20 + totalTier(t), -1.5, 8, 3);
      } else {
        ctx.fillStyle = t.def.color; ctx.fillRect(8, -3, 12 + totalTier(t) * 2, 6);
      }
    }
    if (t.def.farm) {
      ctx.fillStyle = "rgba(132,204,22,0.25)";
      ctx.beginPath(); ctx.arc(0, 0, 18, 0, TWO_PI); ctx.fill();
    }
    ctx.restore();
    // Target priority label when selected
    if (sel && !t.def.farm && !(t.def.support && !t.def.freezePulse)) {
      ctx.font = "bold 10px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      var tl = TARGET_LABEL[t.target || "first"] || "First";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 3;
      ctx.strokeText(tl, t.x, t.y + 20);
      ctx.fillStyle = "#e9d5ff";
      ctx.fillText(tl, t.x, t.y + 20);
    }
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

    // Fever / rage edge glow
    if (feverT > 0 || rageT > 0) {
      var pulse = 0.12 + Math.sin(animT * 8) * 0.06;
      var eg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.7);
      eg.addColorStop(0, "rgba(0,0,0,0)");
      eg.addColorStop(1, feverT > 0 ? "rgba(245,208,65," + pulse + ")" : "rgba(244,114,182," + pulse + ")");
      ctx.fillStyle = eg;
      ctx.fillRect(-12, -12, W + 24, H + 24);
    }

    var vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.82);
    vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = vig; ctx.fillRect(-12, -12, W + 24, H + 24);

    // Hit flash
    if (hitFlash > 0) {
      ctx.fillStyle = "rgba(255,229,102," + (hitFlash * 0.45) + ")";
      ctx.fillRect(-12, -12, W + 24, H + 24);
    }

    // Big announcer text
    if (comboAnnouncerT > 0 && comboAnnouncer) {
      var a = Math.min(1, comboAnnouncerT * 2);
      ctx.save();
      ctx.globalAlpha = a;
      var popScale = 1 + (1 - Math.min(1, comboAnnouncerT)) * 0.15;
      ctx.translate(W / 2, H * 0.28);
      ctx.scale(popScale, popScale);
      ctx.font = "800 42px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 8;
      ctx.strokeText(comboAnnouncer, 0, 0);
      ctx.fillStyle = feverT > 0 ? "#ffe566" : "#fff8d6";
      ctx.fillText(comboAnnouncer, 0, 0);
      ctx.restore();
    }

    // Mini status when playing
    if (running && !gameOver && quality > 0.4) {
      ctx.font = "600 12px Fredoka, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#fff8d6";
      var tip = autoWave ? "AUTO" : "Space → wave";
      if (selectedShop) tip = "Click to place · hold Ctrl to place more";
      else if (selectedTower) tip = "Z/X upgrade · Tab target · click tower to select";
      ctx.fillText(tip, 12, 10);
      ctx.globalAlpha = 1;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = (ts - lastTs) / 1000; lastTs = ts;
    if (dt > 0.05) dt = 0.05;
    update(dt); draw();
    requestAnimationFrame(loop);
  }

  // UI — procedural tower portraits (no external assets)
  var portraitCache = {};
  function towerPortrait(def, size) {
    size = size || 72;
    var key = def.id + "_" + size;
    if (portraitCache[key]) return portraitCache[key];
    var c = document.createElement("canvas");
    c.width = size; c.height = size;
    var g = c.getContext("2d");
    // Background plate
    var bg = g.createLinearGradient(0, 0, size, size);
    bg.addColorStop(0, "#1a3d28");
    bg.addColorStop(1, "#0c1a12");
    g.fillStyle = bg;
    roundRectPath(g, 4, 4, size - 8, size - 8, 14);
    g.fill();
    g.strokeStyle = def.color;
    g.lineWidth = 3;
    g.stroke();
    // Soft glow
    g.beginPath();
    g.arc(size / 2, size / 2 + 2, size * 0.28, 0, Math.PI * 2);
    g.fillStyle = def.color;
    g.globalAlpha = 0.2;
    g.fill();
    g.globalAlpha = 1;
    // Monkey body
    g.beginPath();
    g.arc(size / 2, size / 2 + 4, size * 0.22, 0, Math.PI * 2);
    var face = g.createRadialGradient(size / 2 - 4, size / 2, 2, size / 2, size / 2 + 4, size * 0.24);
    face.addColorStop(0, "#e8c9a0");
    face.addColorStop(1, "#b8894e");
    g.fillStyle = face;
    g.fill();
    g.strokeStyle = "#3b2a1a";
    g.lineWidth = 1.5;
    g.stroke();
    // Ears
    g.beginPath();
    g.arc(size / 2 - size * 0.18, size / 2 - 2, size * 0.08, 0, Math.PI * 2);
    g.arc(size / 2 + size * 0.18, size / 2 - 2, size * 0.08, 0, Math.PI * 2);
    g.fillStyle = "#c4a574";
    g.fill();
    // Eyes
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(size / 2 - 5, size / 2 + 2, 3.2, 0, Math.PI * 2);
    g.arc(size / 2 + 5, size / 2 + 2, 3.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#111";
    g.beginPath();
    g.arc(size / 2 - 4.5, size / 2 + 2, 1.5, 0, Math.PI * 2);
    g.arc(size / 2 + 5.5, size / 2 + 2, 1.5, 0, Math.PI * 2);
    g.fill();
    // Role badge
    g.font = Math.floor(size * 0.28) + "px serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(def.icon, size / 2, size * 0.22);
    // Color bar
    g.fillStyle = def.color;
    g.fillRect(10, size - 12, size - 20, 4);
    portraitCache[key] = c.toDataURL("image/png");
    return portraitCache[key];
  }
  function roundRectPath(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function upgradePathHtml(tOrDef, isPlaced) {
    var def = isPlaced ? tOrDef.def : tOrDef;
    var paths = isPlaced ? tOrDef.paths : [0, 0];
    var names = def.pathNames || ["Top", "Bottom"];
    var html = '<div class="dual-paths">';
    for (var p = 0; p < 2; p++) {
      var lockedDeep = paths[1 - p] > 2;
      var rank = paths[p];
      var nu = def.paths[p] && def.paths[p][rank] ? def.paths[p][rank] : null;
      var canBuy = isPlaced && canBuyPath(tOrDef, p) && !!nu;
      var canAfford = canBuy && ban >= nu.cost && !gameOver;
      var capped = (lockedDeep && rank >= 2) || !nu;
      html += '<div class="path-col' + (capped ? " capped" : "") + '">';
      html += '<div class="path-title"><span>' + names[p] + '</span>' +
        '<span class="path-rank">' + rank + "/" + MAX_PATH + "</span></div>";
      if (!nu) {
        html += '<div class="path-next maxed"><strong>Maxed</strong><small>Path complete</small></div>';
      } else if (lockedDeep && rank >= 2) {
        html += '<div class="path-next locked"><strong>' + nu.name + "</strong><small>Other path specialized</small></div>";
      } else {
        html += '<div class="path-next"><strong>' + nu.name + "</strong><small>" + nu.desc + "</small></div>";
        if (isPlaced) {
          html += '<button type="button" class="path-buy' + (canAfford ? " can" : "") +
            '" data-path="' + p + '"' + (canBuy && !gameOver ? "" : " disabled") + ">" +
            (canBuy ? (nu.cost + " BAN") : "Locked") + "</button>";
        } else {
          html += '<div class="path-rank" style="text-align:right">' + nu.cost + " BAN</div>";
        }
      }
      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  function setPlayingUI(on) {
    document.body.classList.toggle("td-playing", !!on);
    var side = document.getElementById("tdSide");
    if (side) side.setAttribute("aria-hidden", on ? "false" : "true");
  }

  function buildShop(force) {
    var snap = selectedShop + "|" + Math.floor(ban) + "|" + (running ? 1 : 0) + "|" + (gameOver ? 1 : 0);
    if (!force && snap === uiShopSnap && shopEl.children.length === TOWER_DEFS.length) {
      // cheap disable refresh only
      for (var si = 0; si < shopEl.children.length; si++) {
        var btn = shopEl.children[si];
        var id = btn.getAttribute("data-id");
        var dd = TOWER_BY_ID[id];
        if (!dd) continue;
        btn.disabled = !running || gameOver || ban < dd.cost;
        btn.classList.toggle("on", selectedShop === id);
      }
      return;
    }
    uiShopSnap = snap;
    shopEl.innerHTML = "";
    for (var i = 0; i < TOWER_DEFS.length; i++) {
      var d = TOWER_DEFS[i];
      var b = document.createElement("button");
      b.type = "button";
      b.className = "shop-btn" + (selectedShop === d.id ? " on" : "");
      b.setAttribute("data-id", d.id);
      b.innerHTML =
        '<span class="shop-ico" aria-hidden="true">' + d.icon + "</span>" +
        '<span class="shop-meta"><span class="nm">' + d.name + "</span>" +
        '<span class="role">' + d.role + "</span></span>" +
        '<span class="cs">' + d.cost + "</span>";
      b.disabled = !running || gameOver || ban < d.cost;
      b.title = d.desc + " · [" + (i + 1) + "]";
      b.addEventListener("click", (function (id) {
        return function () {
          // Toggle: click same shop item again to cancel place mode
          if (selectedShop === id) {
            clearPlaceMode();
            selectedTower = null;
          } else {
            selectedShop = id;
            selectedTower = null;
          }
          uiShopSnap = "";
          refreshUI();
        };
      })(d.id));
      shopEl.appendChild(b);
    }
  }

  function refreshAbilities() {
    function label(btn, key, name) {
      if (!btn) return;
      var a = abilities[key];
      if (!a) return;
      var hold = roundOv && !roundOv.classList.contains("hidden");
      var ready = a.cd <= 0 && running && !gameOver && !paused && !hold;
      btn.disabled = !ready;
      btn.classList.toggle("ready", ready);
      btn.textContent = ready ? name : name.split(" ")[0] + " " + Math.ceil(a.cd) + "s";
    }
    label(btnAbilityStorm, "storm", "Storm");
    label(btnAbilityFreeze, "freeze", "Cryo");
    label(btnAbilityCash, "cash", "Drop");
    label(btnAbilityRage, "rage", "Rage");
    if (btnAutoWave) {
      btnAutoWave.classList.toggle("on", autoWave);
      btnAutoWave.textContent = autoWave ? "Auto on" : "Auto";
    }
    if (hudFever) {
      if (feverT > 0) {
        hudFever.textContent = "Fever " + Math.ceil(feverT) + "s";
        hudFever.classList.add("on");
      } else {
        hudFever.textContent = "Fever";
        hudFever.classList.remove("on");
      }
    }
  }

  function refreshUI() {
    setPlayingUI(running && !gameOver);
    hudBan.textContent = String(Math.floor(ban));
    hudLives.textContent = String(Math.max(0, lives));
    hudWave.textContent = String(wave);
    if (hudWaveMax) hudWaveMax.textContent = String(MAX_WAVE);
    hudPops.textContent = String(pops);
    if (hudInterest) hudInterest.textContent = "Interest +" + interestPreview();
    if (hudRoundEarn) hudRoundEarn.textContent = "Round +" + Math.floor(roundKillBan);
    if (hudStreak) {
      hudStreak.textContent = killStreak >= 5 ? "Streak x" + killStreak : "Streak —";
      hudStreak.style.opacity = killStreak >= 5 ? "1" : "0.45";
    }
    if (hudMapName) {
      var modeTag = getMode().short + " · " + DIFFS[difficulty].name;
      hudMapName.textContent = MAPS[currentMap].short + " · " + modeTag;
    }
    if (running && !gameOver) {
      buildShop();
      refreshAbilities();
      updateMissionUI();
    }

    if (!running || gameOver) {
      if (btnSell) { btnSell.disabled = true; btnSell.textContent = "Sell"; }
      if (btnWave) btnWave.disabled = true;
      return;
    }

    if (selectedTower) {
      var t = selectedTower, st = getStats(t);
      var tgt = t.target || "first";
      var html = '<div class="sel-head"><span class="sel-ico" aria-hidden="true">' + t.def.icon + "</span>" +
        "<div><strong>" + t.def.name + "</strong><br><span class='role-tag'>" +
        t.paths[0] + "–" + t.paths[1] + " · " + t.def.role + "</span></div></div>";
      if (t.def.farm) html += "<div class='sel-stats'>Income <b>" + st.income + "</b> / round</div>";
      else if (!t.def.support || t.def.freezePulse) {
        html += "<div class='sel-stats'><b>" + Math.floor(st.range) + "</b> range · <b>" + st.pop +
          "</b> pop · <b>" + st.pierce + "</b> pierce";
        if (st.camo) html += " · camo";
        if (st.lead) html += " · lead";
        html += "</div>";
      } else html += "<div class='sel-stats'>Aura <b>" + Math.floor(st.range) + "</b>" +
        (st.income ? " · Income <b>+" + st.income + "</b>" : "") + "</div>";
      if (!t.def.farm && !(t.def.support && !t.def.freezePulse)) {
        html += '<div class="target-row" role="group" aria-label="Target priority">';
        for (var tm = 0; tm < TARGET_MODES.length; tm++) {
          var mode = TARGET_MODES[tm];
          html += '<button type="button" class="tgt-btn' + (tgt === mode ? " on" : "") +
            '" data-tgt="' + mode + '">' + TARGET_LABEL[mode] + "</button>";
        }
        html += "</div>";
      }
      html += upgradePathHtml(t, true);
      selBox.innerHTML = html;
      selBox.querySelectorAll(".path-buy").forEach(function (btn) {
        btn.addEventListener("click", function () {
          ensureAudio();
          upgradeTower(parseInt(btn.getAttribute("data-path"), 10));
        });
      });
      selBox.querySelectorAll(".tgt-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          ensureAudio();
          if (selectedTower) {
            selectedTower.target = btn.getAttribute("data-tgt");
            floatTxt(selectedTower.x, selectedTower.y - 22, TARGET_LABEL[selectedTower.target], "#c084fc", 12);
            refreshUI();
          }
        });
      });
      if (btnUp) { btnUp.style.display = "none"; }
      btnSell.disabled = gameOver;
      btnSell.textContent = "Sell +" + Math.floor(spentOn(t) * 0.72);
    } else {
      var def = TOWER_BY_ID[selectedShop];
      if (def) {
        selBox.innerHTML = '<div class="sel-head"><span class="sel-ico" aria-hidden="true">' + def.icon + "</span>" +
          "<div><strong>" + def.name + "</strong><br><span class='role-tag'>" + def.role +
          " · " + def.cost + " BAN</span></div></div>" +
          '<p class="sel-desc">' + def.desc + "</p>" +
          upgradePathHtml(def, false) +
          '<p class="sel-hint">Click grass to place · hold Ctrl to place more</p>';
      } else {
        selBox.innerHTML = selectedTower
          ? ""
          : "Select a tower on the map, or pick one from the shop to place.";
      }
      if (btnUp) { btnUp.style.display = "none"; btnUp.disabled = true; }
      btnSell.disabled = true; btnSell.textContent = "Sell";
    }
    var hold = chapterPending || (roundOv && !roundOv.classList.contains("hidden"));
    btnWave.disabled = !running || gameOver || paused || waveActive || wave >= MAX_WAVE || hold;
  }

  function resetGame() {
    var d = DIFFS[difficulty];
    var mode = getMode();
    endless = false;
    syncWaveCap();
    tourStop = 0;
    if (mode.tour) {
      currentMap = TOUR_ROUTE[0];
      document.querySelectorAll("#mapPick .chip-btn, #mapPick .map-card").forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-map") === currentMap);
      });
    }
    ban = d.ban + (mode.startBan || 0);
    lives = d.lives; wave = 0; pops = 0; banEarned = 0;
    running = true; paused = false; gameOver = false;
    setPlayingUI(true);
    selectedShop = "dart"; selectedTower = null;
    towers = []; threats = []; projectiles = []; particles = []; floats = [];
    spawnQueue = []; spawnTimer = 0; waveActive = false; totalBuilt = 0; shake = 0;
    missionsDone = 0; mission = null;
    roundKillBan = 0; roundKills = 0; roundLeak = false; killStreak = 0;
    chapterPending = false; lastRoundSummary = null;
    feverT = mode.feverStart || 0; rageT = 0; eventT = 0; eventKind = null; eventCd = modeEventCdBase();
    autoWaveDelay = 0; hitFlash = 0; comboAnnouncerT = 0; bestStreakRun = 0; goldensPopped = 0;
    runPerfectWaves = 0; runAbilityUses = 0; runBadgeQueue = [];
    lastRunScore = 0; lastRunBadges = []; badgeToastT = 0;
    var bToast = document.getElementById("badgeToast");
    if (bToast) bToast.classList.remove("show");
    abilities.storm.cd = 0; abilities.freeze.cd = 0; abilities.cash.cd = 0; abilities.rage.cd = 0;
    rebuildPath(); initDecor();
    startOv.classList.add("hidden"); winOv.classList.add("hidden");
    loseOv.classList.add("hidden"); pauseOv.classList.add("hidden");
    if (roundOv) roundOv.classList.add("hidden");
    if (feverT > 0) {
      if (hudFever) { hudFever.classList.add("on"); hudFever.textContent = "Fever " + Math.ceil(feverT) + "s"; }
    }
    var label = mode.name.toUpperCase() + " · " + MAPS[currentMap].name.toUpperCase() + " · " + d.name.toUpperCase();
    showToast(label);
    if (mode.tour) announce("WORLD TOUR!", 1.3);
    if (mode.feverStart) announce("FEVER RUSH!", 1.2);
    if (playMode === "party") announce("PARTY TIME!", 1.2);
    noteModePlay(playMode);
    saveRecords(true);
    refreshUI(); sfxPlace();
  }

  function endWin() {
    gameOver = true; running = false; paused = false;
    setPlayingUI(false);
    if (roundOv) roundOv.classList.add("hidden");
    var mode = getMode();
    document.getElementById("winMsg").textContent =
      mode.name + " clear — " + wave + " waves on " + MAPS[currentMap].name +
      " (" + DIFFS[difficulty].name + "). Pops " + pops + " · BAN earned " + Math.floor(banEarned) +
      " · Best streak x" + bestStreakRun + " · Jackpots " + goldensPopped +
      " · MonKeys " + totalBuilt + ". Legendary.";
    winOv.classList.remove("hidden");
    var endlessBtn = document.getElementById("btnEndless");
    if (endlessBtn) endlessBtn.classList.remove("hidden");
    confettiBurst(); confettiBurst(); confettiBurst(); sfxWin();
    records.games = (records.games | 0) + 1;
    noteMapClear(currentMap);
    noteModeWin(playMode);
    finalizeRun({ won: true });
    showRunMeta(true);
    saveRecords(true);
    refreshHubUI();
  }

  function startEndless() {
    endless = true;
    syncWaveCap();
    gameOver = false;
    running = true;
    paused = false;
    setPlayingUI(true);
    winOv.classList.add("hidden");
    showToast("ENDLESS · HOW FAR CAN YOU GO?");
    confettiBurst();
    autoWaveDelay = 1.2;
    refreshUI();
  }
  function endLose() {
    gameOver = true; running = false; waveActive = false; paused = false;
    setPlayingUI(false);
    if (roundOv) roundOv.classList.add("hidden");
    document.getElementById("loseMsg").textContent =
      "Wave " + wave + "/" + MAX_WAVE + " on " + MAPS[currentMap].short + " · Pops " + pops +
      " · BAN earned " + Math.floor(banEarned) + ". Refuel and relaunch.";
    loseOv.classList.remove("hidden"); sfxLeak();
    records.games = (records.games | 0) + 1;
    finalizeRun({ won: false });
    showRunMeta(false);
    saveRecords(true);
    refreshHubUI();
  }

  // Map pointer → game coords, correctly handling letterboxing / object-fit
  function canvasPos(evt) {
    var rect = canvas.getBoundingClientRect();
    var cx, cy;
    if (evt.touches && evt.touches[0]) { cx = evt.touches[0].clientX; cy = evt.touches[0].clientY; }
    else if (evt.changedTouches && evt.changedTouches[0]) { cx = evt.changedTouches[0].clientX; cy = evt.changedTouches[0].clientY; }
    else { cx = evt.clientX; cy = evt.clientY; }
    // Uniform scale (contain) + centering offsets
    var scale = Math.min(rect.width / W, rect.height / H);
    if (!(scale > 0)) scale = 1;
    var dispW = W * scale;
    var dispH = H * scale;
    var offX = (rect.width - dispW) / 2;
    var offY = (rect.height - dispH) / 2;
    var x = (cx - rect.left - offX) / scale;
    var y = (cy - rect.top - offY) / scale;
    x = clamp(x, 0, W - 0.001);
    y = clamp(y, 0, H - 0.001);
    return {
      x: x,
      y: y,
      c: Math.floor(x / TW),
      r: Math.floor(y / TH),
      inCanvas: cx >= rect.left + offX && cx <= rect.left + offX + dispW &&
                cy >= rect.top + offY && cy <= rect.top + offY + dispH
    };
  }

  canvas.addEventListener("mousemove", function (e) {
    var p = canvasPos(e);
    if (!p.inCanvas) { hover = null; return; }
    hover = inBounds(p.c, p.r) ? { c: p.c, r: p.r, x: p.x, y: p.y } : null;
  });
  canvas.addEventListener("mouseleave", function () { hover = null; });
  function onPointer(e) {
    e.preventDefault(); ensureAudio();
    if (!running || gameOver || paused) return;
    if (roundOv && !roundOv.classList.contains("hidden")) return;
    var p = canvasPos(e);
    if (!p.inCanvas || !inBounds(p.c, p.r)) return;
    var existing = towerAt(p.c, p.r);
    if (existing) {
      // Selecting a tower always exits place mode
      clearPlaceMode();
      // Click same tower again → cycle target priority (BTD-style)
      if (selectedTower === existing && !existing.def.farm && !(existing.def.support && !existing.def.freezePulse)) {
        cycleTarget(existing);
      } else {
        selectedTower = existing;
        refreshUI();
      }
      return;
    }
    // Empty tile: place only if a shop tower is armed
    if (selectedShop) {
      var keepPlacing = !!(e.ctrlKey || e.metaKey);
      placeTower(p.c, p.r, keepPlacing);
      return;
    }
    // Normal click on empty grass — deselect
    if (selectedTower) {
      selectedTower = null;
      refreshUI();
    }
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
  document.querySelectorAll("#mapPick .chip-btn, #mapPick .map-card").forEach(function (b) {
    b.addEventListener("click", function () {
      if (running && !gameOver) return;
      currentMap = b.getAttribute("data-map");
      document.querySelectorAll("#mapPick .chip-btn, #mapPick .map-card").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      rebuildPath(); initDecor();
      progressMeta.lastMapId = currentMap;
      saveRecords();
      refreshUI();
    });
  });
  document.querySelectorAll("#diffPick .chip-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      if (running && !gameOver) return;
      difficulty = b.getAttribute("data-diff");
      document.querySelectorAll("#diffPick .chip-btn").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      progressMeta.lastDifficulty = difficulty;
      saveRecords();
      refreshUI();
    });
  });

  if (btnUp) btnUp.addEventListener("click", function () { ensureAudio(); if (selectedTower) { if (canBuyPath(selectedTower, 0)) upgradeTower(0); else upgradeTower(1); } });
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
    ensureAudio(); startOv.classList.remove("hidden"); winOv.classList.add("hidden"); running = false; gameOver = false; setPlayingUI(false); refreshHubUI(); refreshUI();
  });
  document.getElementById("btnLose").addEventListener("click", function () {
    ensureAudio(); startOv.classList.remove("hidden"); loseOv.classList.add("hidden"); running = false; gameOver = false; setPlayingUI(false); refreshHubUI(); refreshUI();
  });

  if (btnAbilityStorm) btnAbilityStorm.addEventListener("click", function () { ensureAudio(); useStorm(); });
  if (btnAbilityFreeze) btnAbilityFreeze.addEventListener("click", function () { ensureAudio(); useFreeze(); });
  if (btnAbilityCash) btnAbilityCash.addEventListener("click", function () { ensureAudio(); useCash(); });
  if (btnAbilityRage) btnAbilityRage.addEventListener("click", function () { ensureAudio(); useRage(); });
  if (btnAutoWave) btnAutoWave.addEventListener("click", function () {
    autoWave = !autoWave;
    if (btnAutoWave) {
      btnAutoWave.classList.toggle("on", autoWave);
      btnAutoWave.textContent = autoWave ? "Auto on" : "Auto";
    }
    if (autoWave && running && !waveActive && !gameOver && !(roundOv && !roundOv.classList.contains("hidden"))) {
      autoWaveDelay = 0.4;
    }
    showToast(autoWave ? "AUTO-WAVE ON" : "AUTO-WAVE OFF");
    saveRecords();
  });
  if (btnRoundContinue) btnRoundContinue.addEventListener("click", function () { ensureAudio(); dismissRoundSummary(); });
  var btnEndless = document.getElementById("btnEndless");
  if (btnEndless) btnEndless.addEventListener("click", function () { ensureAudio(); startEndless(); });

  function updateModeUI() {
    var mode = getMode();
    var mapPick = document.getElementById("mapPick");
    var mapRow = mapPick ? mapPick.closest(".setup-row") : null;
    if (mapPick) {
      mapPick.style.opacity = mode.pickMap ? "1" : "0.45";
      mapPick.style.pointerEvents = mode.pickMap ? "" : "none";
    }
    if (mapRow) {
      var lab = mapRow.querySelector("label");
      if (lab) lab.textContent = mode.pickMap ? "Map" : "Map (Tour picks for you)";
    }
    var desc = document.getElementById("modeDesc");
    if (desc) desc.textContent = mode.tagline;
    syncWaveCap();
    if (hudWaveMax) hudWaveMax.textContent = String(MAX_WAVE);
  }

  document.querySelectorAll("#modePick .chip-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      if (running && !gameOver) return;
      playMode = b.getAttribute("data-mode") || "classic";
      document.querySelectorAll("#modePick .chip-btn").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      progressMeta.lastMode = playMode;
      updateModeUI();
      saveRecords();
      refreshUI();
    });
  });
  updateModeUI();

  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === " " || e.code === "Space") {
      e.preventDefault(); ensureAudio();
      if (roundOv && !roundOv.classList.contains("hidden")) { dismissRoundSummary(); return; }
      if (!running) { /* wait for start button with map pick */ }
      else startWave();
    }
    if (k === "p" || k === "P") {
      if (!running || gameOver) return;
      paused = !paused; pauseOv.classList.toggle("hidden", !paused);
    }
    if (k === "u" || k === "U") { ensureAudio(); if (selectedTower) { if (canBuyPath(selectedTower, 0)) upgradeTower(0); else if (canBuyPath(selectedTower, 1)) upgradeTower(1); } }
    if (k === "z" || k === "Z") { ensureAudio(); if (selectedTower) upgradeTower(0); }
    if (k === "x" || k === "X") { ensureAudio(); if (selectedTower) upgradeTower(1); }
    if (k === "Tab") { e.preventDefault(); ensureAudio(); if (selectedTower) cycleTarget(selectedTower); }
    if (k === "m" || k === "M") { ensureAudio(); toggleMute(); }
    if (k === "s" || k === "S") { ensureAudio(); sellTower(); }
    if (k === "q" || k === "Q") { ensureAudio(); useStorm(); }
    if (k === "e" || k === "E") { ensureAudio(); useFreeze(); }
    if (k === "r" || k === "R") { ensureAudio(); useCash(); }
    if (k === "f" || k === "F") { ensureAudio(); useRage(); }
    if (k === "a" || k === "A") {
      if (!e.ctrlKey && !e.metaKey) {
        // don't steal typing — only when playing
        if (running) {
          autoWave = !autoWave;
          if (btnAutoWave) {
            btnAutoWave.classList.toggle("on", autoWave);
            btnAutoWave.textContent = autoWave ? "Auto on" : "Auto";
          }
          showToast(autoWave ? "AUTO-WAVE ON" : "AUTO-WAVE OFF");
          saveRecords();
        }
      }
    }
    if (k === "Escape") { selectedTower = null; clearPlaceMode(); refreshUI(); }
    // 10x speed for the chaotic
    if (k === "0") {
      speed = 10;
      document.querySelectorAll(".spd").forEach(function (x) { x.classList.remove("on"); });
      var s10 = document.querySelector('.spd[data-spd="10"]');
      if (s10) s10.classList.add("on");
      showToast("10× CHAOS SPEED");
    }
    var keys = {
      "1": "dart", "2": "boomer", "3": "sniper", "4": "bomb", "5": "ice",
      "6": "farm", "7": "village", "8": "super", "9": "battery"
    };
    if (keys[k]) {
      // Arm place mode for that tower (toggle off if already selected)
      if (selectedShop === keys[k]) clearPlaceMode();
      else { selectedShop = keys[k]; selectedTower = null; }
      uiShopSnap = "";
      refreshUI();
    }
  });

  // ability UI tick
  setInterval(function () { if (running) refreshAbilities(); }, 250);

  var btnMute = document.getElementById("btnMute");
  if (btnMute) btnMute.addEventListener("click", function () { ensureAudio(); toggleMute(); });

  // Apply loaded prefs (mute/map/mode) + hub
  applyLoadedPrefsToUI();
  refreshRecordsLabel();
  updateSaveUI();
  refreshHubUI();
  setHubTab("badges");

  document.querySelectorAll(".hub-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      setHubTab(tab.getAttribute("data-hub") || "badges");
    });
  });

  // Progress UI buttons
  var btnExport = document.getElementById("btnExportProgress");
  var btnImport = document.getElementById("btnImportProgress");
  var btnReset = document.getElementById("btnResetProgress");
  var importFile = document.getElementById("tdImportFile");
  if (btnExport) btnExport.addEventListener("click", function () { downloadProgressFile(); });
  if (btnImport) btnImport.addEventListener("click", function () { promptImportProgress(); });
  if (btnReset) btnReset.addEventListener("click", function () { confirmResetProgress(); });
  if (importFile) {
    importFile.addEventListener("change", function () {
      var file = importFile.files && importFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var res = importProgress(String(reader.result || ""));
        showToast(res.message);
        if (res.ok) { refreshHubUI(); refreshUI(); }
        importFile.value = "";
      };
      reader.onerror = function () {
        showToast("Import failed");
        importFile.value = "";
      };
      reader.readAsText(file);
    });
  }

  // Flush save when leaving the page / backgrounding the tab
  function flushSaveOnLeave() {
    try { saveRecords(true); } catch (e) {}
  }
  window.addEventListener("pagehide", flushSaveOnLeave);
  window.addEventListener("beforeunload", flushSaveOnLeave);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flushSaveOnLeave();
  });

  rebuildPath();
  initDecor();
  buildShop(true);
  refreshUI();
  requestAnimationFrame(loop);
})();
