/**
 * BANANO DEFENSE — Protect the Potassium!
 * Single-file IIFE: constants → helpers → audio → state/DOM → game logic → render → input → loop
 * @version banano_defense_v1 (localStorage SAVE_KEY)
 */
(() => {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════════════════════

  const TILE = 40;
  const COLS = 24;
  const ROWS = 16;
  const W = COLS * TILE;
  const H = ROWS * TILE;
  const CAMPAIGN_WAVES = 50;
  const SELL_REFUND = 0.6;
  const AIRDROP_CD = 28;
  const RAGE_CD = 42;
  const COMBO_WINDOW = 1.8;
  const WAVE_BONUS_BASE = 30;
  const WAVE_BONUS_PER = 10;
  const WAVE_INTEREST_RATE = 0.02;
  const WAVE_INTEREST_CAP = 250;
  const PERFECT_WAVE_MULT = 1.35;
  const COMBO_GOLD_CAP = 1.25;
  const SAVE_KEY = "banano_defense_v1";

  const PATH_TILES = [
    { x: 0, y: 7 }, { x: 5, y: 7 }, { x: 5, y: 3 }, { x: 11, y: 3 },
    { x: 11, y: 11 }, { x: 17, y: 11 }, { x: 17, y: 5 }, { x: 21, y: 5 },
    { x: 21, y: 9 }, { x: 23, y: 9 },
  ];

  const TARGET_MODES = ["first", "last", "strong", "close"];
  const TARGET_MODE_LABELS = {
    first: { label: "First", tip: "Farthest along the BAN path" },
    last: { label: "Last", tip: "Newest on the path — closest to spawn" },
    strong: { label: "Strong", tip: "Highest HP" },
    close: { label: "Close", tip: "Nearest to this tower" },
  };
  const TOWER_SELECT_RADIUS = 24;
  const TOWER_SHOP_KEYS = ["cannon", "sniper", "splash", "frost", "tesla", "monkey", "hammer"];
  const DEFAULT_SETTINGS = { showAllRanges: false, reduceParticles: false, volume: 0.32, showDebug: false, muted: false };

  const MEMES = [
    "Rich in potassium! 🍌",
    "Feeless. Instant. Delicious.",
    "Don't feed the FUD!",
    "Paperhands detected 📄",
    "This is the way of the monKey",
    "Block-lettuce secured",
    "HODL the peel!",
    "BAN go brrr",
    "Airdrop incoming!",
    "Folding @ home energy",
    "Normies welcome 🐵",
    "Meme economy online",
    "Yellow is the new green",
    "Peel the bears!",
    "Kalium vibes only",
    "DAG technology tastes better",
    "No fees, just bananas",
    "Jungle law: more BAN",
    "Rugpull? Not today!",
    "Potassium overdose!",
    "monKeys together strong",
    "WAGMI (We're All Getting More Inedible-fruit)",
    "Touch grass? Touch banana leaves.",
    "FUD is just unpeeled fear",
    "Stake your claim in the canopy",
    "Gas fees? We don't do that here.",
    "Diamond hands, banana grip.",
    "Regulatory fog can't stop potassium.",
    "Double BAN drops hit different.",
    "The jungle provides. Feelessly.",
  ];

  const WAVE_EVENTS = {
    7:  { id: "rush", name: "Paperhand Rush", spawnScale: 0.55, meme: "They sold the bottom! Sprint incoming! 📄" },
    12: { id: "double_ban", name: "Double BAN Drop", meme: "Feeless yields doubled this wave! 🍌🍌" },
    18: { id: "fog", name: "Regulatory Fog", rangeMod: 0.82, fogDuration: 14, meme: "Can't see the FUD… tower range reduced! 🌫️" },
    22: { id: "miniboss", name: "Sneaky Rug", extraBoss: 1, meme: "Bonus Rugpull sneaking in! 🔨" },
    28: { id: "rush", name: "FUD Sprint", spawnScale: 0.5, meme: "Fast feet — peel faster, monKey! 🏃" },
    35: { id: "fog", name: "Compliance Fog", rangeMod: 0.8, fogDuration: 16, meme: "Regulators hate fun. You love potassium." },
    42: { id: "double_ban", name: "Airdrop Echo", meme: "Echo airdrop vibes — double BAN peels! 🪂" },
    48: { id: "miniboss", name: "Pre-Peel Panic", extraBoss: 1, meme: "Rugpull rehearsal before THE GREAT PEEL!" },
  };

  const WIN_MESSAGES = [
    "The Banano is safe. FUD has been peeled. The troop celebrates!",
    "Wallet secured. Potassium levels: CRITICAL (the good kind).",
    "Rugpulls rejected. Jungle law upheld. BAN flows feelessly.",
  ];
  const LOSE_MESSAGES = [
    "The FUD breached the jungle. Rebuild and HODL harder.",
    "Paperhands reached the wallet. Touch banana leaves and try again.",
    "Gas fees and FUD won this round. The monKeys believe in you.",
  ];

  const WAVE_NAMES = {
    5: "First Rug Attempt",
    10: "Paperhand Stampede",
    15: "Bear Market Bloom",
    20: "Exchange Outage",
    25: "Whale Migration",
    30: "Scam Season",
    35: "Regulatory Fog",
    40: "Black Thursday",
    45: "Final FUD Siege",
    50: "THE GREAT PEEL",
  };

  // ── Towers ─────────────────────────────────────────────────────────────────

  const TOWER_DEFS = {
    cannon: {
      id: "cannon", name: "Peeler", icon: "🍌", cost: 50,
      range: 115, damage: 24, fireRate: 1.0, color: "#fbdd11",
      projectileSpeed: 450, description: "Classic banana blaster",
      upgradeCost: 40, dmgScale: 1.5, rangeScale: 1.08, rateScale: 1.14,
      critChance: 0.1, unlock: null,
    },
    sniper: {
      id: "sniper", name: "Yellow Rail", icon: "🎯", cost: 100,
      range: 245, damage: 75, fireRate: 0.42, color: "#ff9f1c",
      projectileSpeed: 1200, description: "Long-range ban-beam",
      upgradeCost: 80, dmgScale: 1.55, rangeScale: 1.06, rateScale: 1.12,
      critChance: 0.24, beam: true, pierce: 1, unlock: null,
    },
    splash: {
      id: "splash", name: "Potassium Bomb", icon: "💥", cost: 125,
      range: 140, damage: 38, fireRate: 0.5, color: "#ff6b35",
      projectileSpeed: 280, splashRadius: 68, description: "Arcing peel AOE — great vs swarms",
      upgradeCost: 90, dmgScale: 1.42, rangeScale: 1.08, rateScale: 1.12,
      critChance: 0.06, arc: true, unlock: null,
    },
    frost: {
      id: "frost", name: "Chill Ban", icon: "🧊", cost: 85,
      range: 112, damage: 16, fireRate: 1.15, color: "#7ec8e3",
      projectileSpeed: 400, slowFactor: 0.38, slowDuration: 2.5,
      description: "Heavy slow — peel time from fast FUD",
      upgradeCost: 60, dmgScale: 1.38, rangeScale: 1.1, rateScale: 1.15,
      critChance: 0.07, unlock: null,
    },
    tesla: {
      id: "tesla", name: "Zapban", icon: "⚡", cost: 155,
      range: 125, damage: 22, fireRate: 0.88, color: "#c4f542",
      description: "Chain-lightning potassium",
      upgradeCost: 100, dmgScale: 1.4, rangeScale: 1.07, rateScale: 1.12,
      critChance: 0.1, chain: 3, chainFalloff: 0.65, instant: true, unlock: null,
    },
    monkey: {
      id: "monkey", name: "monKey Thrower", icon: "🐵", cost: 160,
      range: 130, damage: 13, fireRate: 2.2, color: "#c4956a",
      projectileSpeed: 500, description: "Rapid banana barrage",
      upgradeCost: 110, dmgScale: 1.35, rangeScale: 1.08, rateScale: 1.18,
      critChance: 0.12, multishot: 2, unlock: "unlock_monkey",
    },
    hammer: {
      id: "hammer", name: "Banhammer", icon: "🔨", cost: 200,
      range: 100, damage: 110, fireRate: 0.35, color: "#ff4d94",
      projectileSpeed: 380, splashRadius: 52, description: "Mod smash — bosses & clusters",
      upgradeCost: 140, dmgScale: 1.5, rangeScale: 1.06, rateScale: 1.1,
      critChance: 0.15, arc: true, unlock: "unlock_hammer",
    },
  };

  const ENEMY_DEFS = {
    paper:  { name: "Paperhands", hp: 55,  speed: 58,  reward: 8,  radius: 12, color: "#e8d5a3", lives: 1 },
    fud:    { name: "FUD Bot",    hp: 40,  speed: 95,  reward: 10, radius: 10, color: "#ff7a7a", lives: 1 },
    bear:   { name: "Bear",       hp: 260, speed: 30,  reward: 28, radius: 17, color: "#a67c52", lives: 2 },
    spam:   { name: "Scam Spam",  hp: 28,  speed: 90,  reward: 5,  radius: 8,  color: "#c49bff", lives: 1 },
    whale:  { name: "Whale",      hp: 520, speed: 24,  reward: 45, radius: 20, color: "#5b9bff", lives: 3 },
    bot:    { name: "Sniper Bot", hp: 70,  speed: 70,  reward: 14, radius: 11, color: "#7dffb3", lives: 1 },
    shill:  { name: "Shill",      hp: 100, speed: 50,  reward: 16, radius: 13, color: "#ffb347", lives: 1, healRate: 14, healRange: 75 },
    boss:   { name: "Rugpull",    hp: 1400, speed: 25, reward: 140, radius: 26, color: "#ff4d94", lives: 6 },
    tick:   { name: "Gas Fee Tick", hp: 34, speed: 108, reward: 12, radius: 9, color: "#9effc4", lives: 1, goldSteal: 40 },
    hodler: { name: "Diamond HODLer", hp: 190, speed: 34, reward: 22, radius: 14, color: "#88d4ff", lives: 1, regen: 0.28 },
  };

  const BOSS_PHASE_CFG = {
    1: { name: "Seed Round", threshold: 1, dr: 0, speedMult: 1, color: "#ff4d94", label: "P1" },
    2: { name: "Liquidity Lock", threshold: 0.65, dr: 0.12, speedMult: 1.14, color: "#e03078", label: "P2" },
    3: { name: "Rug Moment", threshold: 0.32, dr: 0.08, speedMult: 1.26, color: "#b80055", label: "P3",
      pulseInterval: 6.5, telegraph: 1.05, spawns: ["paper", "paper", "spam"] },
  };

  // ── Achievements ───────────────────────────────────────────────────────────

  const ACHIEVEMENTS = [
    { id: "first_peel", name: "First Peel", desc: "Smash your first hostile meme", icon: "🍌", check: (s) => s.kills >= 1 },
    { id: "peel_50", name: "Snack Time", desc: "Peel 50 enemies in one run", icon: "🍿", check: (s) => s.kills >= 50 },
    { id: "peel_200", name: "Potassium Fiend", desc: "Peel 200 enemies in one run", icon: "💪", check: (s) => s.kills >= 200 },
    { id: "peel_500", name: "Jungle Butcher", desc: "Peel 500 enemies in one run", icon: "🗡️", check: (s) => s.kills >= 500 },
    { id: "lifetime_1k", name: "Career Peeler", desc: "1,000 lifetime peels", icon: "📈", check: (_, m) => m.lifetimeKills >= 1000 },
    { id: "lifetime_5k", name: "Banano Legend", desc: "5,000 lifetime peels", icon: "👑", check: (_, m) => m.lifetimeKills >= 5000 },
    { id: "combo_10", name: "On a Roll", desc: "Hit a 10× peel combo", icon: "🔥", check: (s) => s.bestCombo >= 10 },
    { id: "combo_25", name: "BAN go brrr", desc: "Hit a 25× peel combo", icon: "🚀", check: (s) => s.bestCombo >= 25 },
    { id: "combo_50", name: "Meme Frenzy", desc: "Hit a 50× peel combo", icon: "😵", check: (s) => s.bestCombo >= 50 },
    { id: "perfect_1", name: "Clean Chain", desc: "Clear a wave with zero leaks", icon: "✨", check: (s) => s.perfectWaves >= 1 },
    { id: "perfect_5", name: "Iron Canopy", desc: "5 perfect waves in one run", icon: "🛡️", check: (s) => s.perfectWaves >= 5 },
    { id: "perfect_15", name: "Fortress monKey", desc: "15 perfect waves in one run", icon: "🏰", check: (s) => s.perfectWaves >= 15 },
    { id: "wave_10", name: "Survived FUD", desc: "Reach wave 10", icon: "🌊", check: (s) => s.wave >= 10 },
    { id: "wave_20", name: "Still HODLing", desc: "Reach wave 20", icon: "💎", check: (s) => s.wave >= 20 },
    { id: "wave_30", name: "Diamond Hands", desc: "Reach wave 30", icon: "💎", check: (s) => s.wave >= 30 },
    { id: "wave_40", name: "Jungle Elder", desc: "Reach wave 40", icon: "🧓", check: (s) => s.wave >= 40 },
    { id: "wave_50", name: "Campaign Champ", desc: "Clear wave 50 (campaign win)", icon: "🏆", check: (s) => s.wonCampaign && s.mode === "campaign" },
    { id: "boss_1", name: "Rug Remover", desc: "Defeat a Rugpull boss", icon: "🔨", check: (s) => s.bossKills >= 1 },
    { id: "boss_5", name: "Mod Squad", desc: "Defeat 5 Rugpulls in one run", icon: "👮", check: (s) => s.bossKills >= 5 },
    { id: "max_tower", name: "Fully Ripe", desc: "Upgrade any tower to level 3", icon: "⭐", check: (s) => s.maxedTowers >= 1 },
    { id: "tower_army", name: "Full Troop", desc: "Have 12 towers on the map", icon: "🪖", check: (s) => s.towersBuilt >= 12 },
    { id: "airdrop_3", name: "Airdrop Enjoyer", desc: "Use Banano Airdrop 3 times", icon: "🪂", check: (s) => s.airdrops >= 3 },
    { id: "rage_3", name: "Unhinged monKey", desc: "Use Jungle Rage 3 times", icon: "🙉", check: (s) => s.rages >= 3 },
    { id: "rich", name: "BAN Whale", desc: "Hold 2,000 BAN at once", icon: "🐋", check: (s) => s.gold >= 2000 },
    { id: "spent", name: "Stimulus Package", desc: "Spend 5,000 BAN in one run", icon: "💸", check: (s) => s.spent >= 5000 },
    { id: "crit_fest", name: "Critical Potassium", desc: "Land 50 crits in one run", icon: "💥", check: (s) => s.crits >= 50 },
    { id: "unlock_monkey", name: "monKey Business", desc: "Reach wave 15 to unlock monKey Thrower", icon: "🐵", check: (s) => s.wave >= 15, unlocks: "monkey" },
    { id: "unlock_hammer", name: "Banhammer Unlocked", desc: "Defeat 3 bosses to unlock Banhammer", icon: "🔨", check: (s) => s.bossKills >= 3 || s.lifetimeBosses >= 3, unlocks: "hammer" },
    { id: "endless_15", name: "Endless Energy", desc: "Reach wave 15 in Endless", icon: "♾️", check: (s) => s.mode === "endless" && s.wave >= 15 },
    { id: "endless_30", name: "Infinite Jungle", desc: "Reach wave 30 in Endless", icon: "🌴", check: (s) => s.mode === "endless" && s.wave >= 30 },
    { id: "no_leak_10", name: "Sealed Ledger", desc: "First 10 waves perfect", icon: "📕", check: (s) => s.perfectStreak >= 10 },
    { id: "speed_demon", name: "×3 Enjoyer", desc: "Clear a wave while on ×3 speed", icon: "⚡", check: (s) => s.clearedOn3x >= 1 },
    { id: "all_types", name: "Full Arsenal", desc: "Build every unlocked tower type in one run", icon: "🧰", check: (s) => s.requiredTowerTypes > 0 && s.typesBuilt >= s.requiredTowerTypes },
    { id: "win_campaign", name: "Potassium Protector", desc: "Win the 50-wave campaign", icon: "🍌", check: (s) => s.wonCampaign },
    { id: "second_win", name: "Double Dip", desc: "Win campaign twice (lifetime)", icon: "✌️", check: (_, m) => m.campaignWins >= 2 },
    { id: "tick_hunter", name: "Fee Slayer", desc: "Peel 15 Gas Fee Ticks in one run", icon: "⛽", check: (s) => s.tickKills >= 15 },
    { id: "hodler_break", name: "HODL Broken", desc: "Peel a Diamond HODLer after it regenerates", icon: "💎", check: (s) => s.hodlerBroken >= 1 },
    { id: "fog_walker", name: "Fog Walker", desc: "Perfect-clear a Regulatory Fog wave", icon: "🌫️", check: (s) => s.fogPerfectClears >= 1 },
    { id: "brain_freeze", name: "Brain Freeze", desc: "Ripe Chill Ban to Lv3 (Brain Freeze perk)", icon: "🧊", check: (s) => s.brainFreezeTowers >= 1 },
    { id: "rug_phase3", name: "Rug Survivor", desc: "Defeat a Rugpull during Rug Moment (phase 3)", icon: "🚨", check: (s) => s.bossPhase3Kills >= 1 },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const rand = (a, b) => a + Math.random() * (b - a);
  const tileCenter = (tx, ty) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
  const hexToRgb = (hex) => {
    const h = hex.replace("#", "");
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  };
  const rgba = (hex, a) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };

  function loadMeta() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return { ...defaultMeta(), ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return defaultMeta();
  }

  function defaultMeta() {
    return {
      achievements: {},
      lifetimeKills: 0,
      lifetimeBosses: 0,
      campaignWins: 0,
      bestScore: 0,
      bestEndlessWave: 0,
      bestCombo: 0,
      unlockedTowers: { cannon: true, sniper: true, splash: true, frost: true, tesla: true },
      settings: { ...DEFAULT_SETTINGS },
    };
  }

  function ensureSettings() {
    if (!meta.settings || typeof meta.settings !== "object") {
      meta.settings = { ...DEFAULT_SETTINGS };
    }
    meta.settings.showAllRanges = !!meta.settings.showAllRanges;
    meta.settings.reduceParticles = !!meta.settings.reduceParticles;
    meta.settings.showDebug = !!meta.settings.showDebug;
    meta.settings.volume = clamp(Number(meta.settings.volume ?? DEFAULT_SETTINGS.volume), 0.05, 0.55);
    meta.settings.muted = !!meta.settings.muted;
  }

  function fxCount(n) {
    const scale = meta.settings?.reduceParticles ? 0.45 : 1;
    return Math.max(1, Math.round(n * scale));
  }

  function cheapestUnlockedCost() {
    let min = Infinity;
    for (const key of Object.keys(TOWER_DEFS)) {
      if (!isTowerUnlocked(key)) continue;
      min = Math.min(min, TOWER_DEFS[key].cost);
    }
    return min === Infinity ? 0 : min;
  }

  function getTowerUnlockHint(type) {
    if (type === "monkey") return "Reach wave 15";
    if (type === "hammer") return "Defeat 3 Rugpulls";
    return "Earn achievement";
  }

  function saveMeta() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
    } catch { /* ignore */ }
  }

  const pathPixels = PATH_TILES.map((p) => tileCenter(p.x, p.y));
  const pathSet = (() => {
    const set = new Set();
    for (let i = 0; i < PATH_TILES.length - 1; i++) {
      const a = PATH_TILES[i], b = PATH_TILES[i + 1];
      if (a.x === b.x) {
        const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
        for (let y = y0; y <= y1; y++) set.add(`${a.x},${y}`);
      } else {
        const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
        for (let x = x0; x <= x1; x++) set.add(`${x},${a.y}`);
      }
    }
    return set;
  })();

  const pathSegLens = [];
  let totalPathLen = 0;
  for (let i = 0; i < pathPixels.length - 1; i++) {
    const len = dist(pathPixels[i].x, pathPixels[i].y, pathPixels[i + 1].x, pathPixels[i + 1].y);
    pathSegLens.push(len);
    totalPathLen += len;
  }

  const stars = Array.from({ length: 50 }, () => ({
    x: Math.random() * W, y: Math.random() * H, z: rand(0.3, 1.2), tw: Math.random() * 6,
  }));

  // Floating bg bananas
  const bgBan = document.getElementById("bg-bananas");
  if (bgBan) {
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      s.textContent = Math.random() > 0.3 ? "🍌" : "🐵";
      s.style.left = `${Math.random() * 100}%`;
      s.style.animationDuration = `${12 + Math.random() * 20}s`;
      s.style.animationDelay = `${-Math.random() * 20}s`;
      s.style.fontSize = `${1 + Math.random()}rem`;
      bgBan.appendChild(s);
    }
  }

  function waveComposition(wave) {
    const enemies = [];
    const base = 8 + Math.floor(wave * 1.6);
    const w = wave;

    if (w % 10 === 0) {
      enemies.push({ type: "boss", count: Math.min(2, 1 + Math.floor((w - 1) / 20)) });
      enemies.push({ type: "whale", count: 1 + Math.floor(w / 20) });
      enemies.push({ type: "bear", count: 2 + Math.floor(w / 10) });
      enemies.push({ type: "shill", count: 1 + Math.floor(w / 15) });
      enemies.push({ type: "paper", count: base });
      enemies.push({ type: "spam", count: 6 + Math.floor(w * 0.85) });
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
      enemies.push({ type: "spam", count: 10 + Math.floor(w * 1.5) });
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
    if (w >= 20) enemies.push({ type: "hodler", count: Math.max(1, Math.floor(w / 22)) });
    return enemies;
  }

  function getWaveEvent(wave) {
    if (WAVE_EVENTS[wave]) return { ...WAVE_EVENTS[wave] };
    if (state.mode === "endless" && wave > 50) {
      const cycle = [7, 12, 18, 22, 28, 35, 42, 48];
      const key = cycle[(wave - 51) % cycle.length];
      return WAVE_EVENTS[key] ? { ...WAVE_EVENTS[key] } : null;
    }
    return null;
  }

  function effectiveRangeFromBase(range) {
    let r = range;
    if (state.waveEvent?.id === "fog" && state.waveEventTimer > 0) {
      r *= state.waveEvent.rangeMod || 0.82;
    }
    return r;
  }

  function towerEffectiveRange(tower) {
    return effectiveRangeFromBase(tower.range);
  }

  const hpScale = (wave) => 1 + (wave - 1) * 0.15 + Math.floor((wave - 1) / 10) * 0.1;

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO
  // ═══════════════════════════════════════════════════════════════════════════

  const AudioFX = (() => {
    let ctx = null, master = null, muted = false, ambient = null;

    function persistMute() {
      if (typeof meta !== "undefined" && meta.settings) {
        meta.settings.muted = muted;
        saveMeta();
      }
    }

    function ensure() {
      if (ctx) return true;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.connect(ctx.destination);
        applyMasterVolume();
        return true;
      } catch { return false; }
    }
    function applyMasterVolume() {
      if (!master) return;
      const vol = typeof meta !== "undefined" && meta.settings ? meta.settings.volume : 0.32;
      master.gain.value = muted ? 0 : vol;
    }
    function resume() {
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume();
    }
    function beep(freq, dur, type = "square", vol = 0.12, slide = 0) {
      if (muted || !ensure()) return;
      resume();
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(dur, vol = 0.06, ff = 1200) {
      if (muted || !ensure()) return;
      resume();
      const t = ctx.currentTime;
      const n = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = ff;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t);
    }

    return {
      resume,
      isMuted: () => muted,
      syncMutedFromSettings() {
        muted = !!(typeof meta !== "undefined" && meta.settings && meta.settings.muted);
        applyMasterVolume();
      },
      toggleMute() {
        muted = !muted;
        applyMasterVolume();
        persistMute();
        if (muted) this.stopAmbient();
        else if (typeof state !== "undefined" && state.phase === "playing") this.startAmbient();
        return muted;
      },
      setVolume(v) {
        if (typeof meta !== "undefined" && meta.settings) meta.settings.volume = clamp(v, 0.05, 0.55);
        applyMasterVolume();
      },
      ui() { beep(540, 0.05, "triangle", 0.07); },
      place() { beep(200, 0.07, "square", 0.08); beep(380, 0.1, "triangle", 0.07, 180); },
      upgrade() { beep(440, 0.06, "sine", 0.09); beep(660, 0.1, "sine", 0.07); beep(880, 0.14, "triangle", 0.06); },
      sell() { beep(280, 0.08, "sawtooth", 0.05, -120); },
      shoot(type) {
        if (type === "sniper") { beep(880, 0.04, "sawtooth", 0.06, -350); noise(0.04, 0.05, 2800); }
        else if (type === "splash" || type === "hammer") { beep(90, 0.08, "triangle", 0.09); noise(0.07, 0.05, 500); }
        else if (type === "frost") { beep(720, 0.06, "sine", 0.05, 180); }
        else if (type === "tesla") { noise(0.06, 0.06, 3800); beep(220, 0.04, "square", 0.04); }
        else if (type === "monkey") { beep(320 + Math.random() * 80, 0.03, "square", 0.05); }
        else { beep(240, 0.04, "square", 0.06, -60); }
      },
      hit(crit) { crit ? (beep(140, 0.06, "sawtooth", 0.07), noise(0.06, 0.05, 900)) : noise(0.025, 0.025, 2000); },
      death() { noise(0.09, 0.06, 1400); beep(180, 0.08, "triangle", 0.04, -80); },
      leak() { beep(110, 0.2, "sawtooth", 0.09, -50); },
      wave() { beep(330, 0.08, "triangle", 0.09); beep(440, 0.12, "triangle", 0.07); beep(550, 0.16, "sine", 0.06); },
      waveClear() { [400, 500, 600, 800].forEach((f, i) => setTimeout(() => beep(f, 0.12, "triangle", 0.07), i * 80)); },
      combo(n) { beep(380 + n * 35, 0.07, "square", 0.05 + Math.min(0.05, n * 0.004)); },
      ability() { noise(0.35, 0.1, 700); beep(70, 0.35, "sawtooth", 0.1, 50); },
      rage() { beep(100, 0.15, "sawtooth", 0.1); beep(150, 0.2, "square", 0.08); noise(0.2, 0.08, 1000); },
      ach() { beep(523, 0.1, "sine", 0.1); beep(659, 0.12, "sine", 0.09); beep(784, 0.18, "triangle", 0.08); },
      win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.22, "triangle", 0.09), i * 110)); },
      lose() { beep(180, 0.3, "sawtooth", 0.09, -80); beep(100, 0.45, "triangle", 0.08); },
      bossShift() { beep(160, 0.12, "sawtooth", 0.09); beep(95, 0.18, "square", 0.08, -50); noise(0.1, 0.06, 800); },
      bossTelegraph() { beep(520, 0.07, "triangle", 0.06); beep(390, 0.09, "triangle", 0.05); },
      rugPulse() { noise(0.14, 0.08, 500); beep(80, 0.22, "sawtooth", 0.09, 40); },
      startAmbient() {
        if (muted || !ensure() || ambient) return;
        resume();
        const o = ctx.createOscillator();
        const l = ctx.createOscillator();
        const lg = ctx.createGain();
        const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = 49;
        l.frequency.value = 0.07; lg.gain.value = 6; g.gain.value = 0.025;
        l.connect(lg); lg.connect(o.frequency); o.connect(g); g.connect(master);
        o.start(); l.start();
        ambient = { o, l };
      },
      stopAmbient() {
        if (!ambient) return;
        try { ambient.o.stop(); ambient.l.stop(); } catch { /* */ }
        ambient = null;
      },
    };
  })();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  let meta = loadMeta();
  ensureSettings();

  const state = {
    phase: "menu",
    mode: "campaign",
    lives: 25,
    gold: 250,
    score: 0,
    wave: 0,
    speed: 1,
    selectedShop: null,
    selectedTower: null,
    towers: [],
    enemies: [],
    projectiles: [],
    beams: [],
    chains: [],
    particles: [],
    rings: [],
    floatTexts: [],
    shocks: [],
    peels: [],
    waveActive: false,
    spawnQueue: [],
    spawnTimer: 0,
    hoverTile: null,
    mouse: { x: 0, y: 0 },
    animTime: 0,
    shake: 0, shakeX: 0, shakeY: 0,
    flash: 0, flashColor: "#fbdd11",
    hitstop: 0,
    combo: 0, comboTimer: 0, bestCombo: 0,
    kills: 0, bossKills: 0,
    airdropCd: 3, rageCd: 8,
    abilityAiming: false,
    rageTimer: 0,
    waveLeaked: false,
    bannerTimer: 0,
    perfectWaves: 0, perfectStreak: 0,
    maxedTowers: 0, towersBuilt: 0,
    airdrops: 0, rages: 0,
    spent: 0, crits: 0,
    typesBuiltSet: new Set(),
    typesBuilt: 0,
    clearedOn3x: 0,
    wonCampaign: false,
    lifetimeBosses: 0,
    memeTimer: 0,
    waveEvent: null,
    waveEventTimer: 0,
    tickKills: 0,
    hodlerBroken: 0,
    fogPerfectClears: 0,
    brainFreezeTowers: 0,
    bossPhase3Kills: 0,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DOM
  // ═══════════════════════════════════════════════════════════════════════════

  const el = {
    lives: document.getElementById("lives"),
    gold: document.getElementById("gold"),
    waveLabel: document.getElementById("wave-label"),
    score: document.getElementById("score"),
    combo: document.getElementById("combo"),
    statCombo: document.getElementById("stat-combo"),
    statLives: document.getElementById("stat-lives"),
    statGold: document.getElementById("stat-gold"),
    shop: document.getElementById("tower-shop"),
    selectedInfo: document.getElementById("selected-info"),
    towerPanel: document.getElementById("tower-panel"),
    nextWave: document.getElementById("next-wave"),
    btnStartWave: document.getElementById("btn-start-wave"),
    btnSpeed: document.getElementById("btn-speed"),
    btnPause: document.getElementById("btn-pause"),
    btnAbility: document.getElementById("btn-ability"),
    btnAbility2: document.getElementById("btn-ability2"),
    abilityCd: document.getElementById("ability-cd"),
    ability2Cd: document.getElementById("ability2-cd"),
    overlayStart: document.getElementById("overlay-start"),
    overlayPause: document.getElementById("overlay-pause"),
    overlayEnd: document.getElementById("overlay-end"),
    overlayAchs: document.getElementById("overlay-achs"),
    btnPlay: document.getElementById("btn-play"),
    btnResume: document.getElementById("btn-resume"),
    btnRestart: document.getElementById("btn-restart"),
    btnEndMenu: document.getElementById("btn-end-menu"),
    btnMute: document.getElementById("btn-mute"),
    btnAchs: document.getElementById("btn-achievements"),
    btnOpenAchs: document.getElementById("btn-open-achs"),
    btnCloseAchs: document.getElementById("btn-close-achs"),
    achList: document.getElementById("ach-list"),
    achProgress: document.getElementById("ach-progress-text"),
    endTitle: document.getElementById("end-title"),
    endMessage: document.getElementById("end-message"),
    endScore: document.getElementById("end-score"),
    endCombo: document.getElementById("end-combo"),
    endKills: document.getElementById("end-kills"),
    endWave: document.getElementById("end-wave"),
    endAchNote: document.getElementById("end-ach-note"),
    waveBanner: document.getElementById("wave-banner"),
    waveBannerTitle: document.getElementById("wave-banner-title"),
    waveBannerKicker: document.getElementById("wave-banner-kicker"),
    comboToast: document.getElementById("combo-toast"),
    achToast: document.getElementById("ach-toast"),
    achToastTitle: document.getElementById("ach-toast-title"),
    achToastDesc: document.getElementById("ach-toast-desc"),
    memeTicker: document.getElementById("meme-ticker"),
    gameToast: document.getElementById("game-toast"),
    metaKills: document.getElementById("meta-kills"),
    metaAchs: document.getElementById("meta-achs"),
    metaCombo: document.getElementById("meta-combo"),
    metaWins: document.getElementById("meta-wins"),
    modeCampaign: document.getElementById("mode-campaign"),
    modeEndless: document.getElementById("mode-endless"),
    optShowRanges: document.getElementById("opt-show-ranges"),
    optReduceParticles: document.getElementById("opt-reduce-particles"),
    optVolume: document.getElementById("opt-volume"),
    optShowDebug: document.getElementById("opt-show-debug"),
    overlayHotkeys: document.getElementById("overlay-hotkeys"),
    btnHotkeys: document.getElementById("btn-hotkeys"),
    btnCloseHotkeys: document.getElementById("btn-close-hotkeys"),
    endBests: document.getElementById("end-bests"),
  };

  function popStat(node) {
    if (!node) return;
    node.classList.remove("pop");
    void node.offsetWidth;
    node.classList.add("pop");
  }

  function showGameToast(text, tone = "warn") {
    if (!el.gameToast) return;
    el.gameToast.textContent = text;
    el.gameToast.classList.remove("hidden", "toast-ok", "toast-warn", "toast-info");
    el.gameToast.classList.add(tone === "ok" ? "toast-ok" : tone === "info" ? "toast-info" : "toast-warn");
    clearTimeout(showGameToast._t);
    showGameToast._t = setTimeout(() => el.gameToast.classList.add("hidden"), 2200);
  }

  function formatRangeHtml(rangeOrTower) {
    const base = Math.round(typeof rangeOrTower === "number" ? rangeOrTower : rangeOrTower.range);
    const eff = Math.round(
      typeof rangeOrTower === "number" ? effectiveRangeFromBase(rangeOrTower) : towerEffectiveRange(rangeOrTower)
    );
    if (eff < base) return `${eff} <span class="range-fog">🌫 base ${base}</span>`;
    return String(base);
  }

  function towerSpecialStats(def, level, tower) {
    const rows = [];
    if (def.beam) rows.push({ label: "Pierce", value: `${(def.pierce || 0) + level - 1} targets` });
    if (def.chain) rows.push({ label: "Chain", value: `${def.chain + level - 1} jumps` });
    if (def.splashRadius) rows.push({ label: "Splash", value: `${Math.round(def.splashRadius * (1 + (level - 1) * 0.15))}px` });
    if (def.slowFactor) rows.push({ label: "Slow", value: `${Math.round((1 - def.slowFactor) * 100)}% for ${def.slowDuration}s` });
    if (def.multishot) rows.push({ label: "Shots", value: `${def.multishot + level - 1}/volley` });
    if (tower?.brainFreeze) rows.push({ label: "Lv3 perk", value: "Brain Freeze (22%)" });
    return rows;
  }

  function getPlaceBlockReason(tx, ty, type) {
    if (!type || !isTowerUnlocked(type)) return null;
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return "Off the map — build on jungle grass!";
    if (pathSet.has(`${tx},${ty}`)) return "Can't build on the yellow BAN path!";
    if (state.towers.some((t) => t.tx === tx && t.ty === ty)) return "That tile already has a tower!";
    const def = TOWER_DEFS[type];
    if (state.gold < def.cost) return `Need 🍌${def.cost} BAN (you have ${state.gold})`;
    return null;
  }

  function isTowerUnlocked(type) {
    const def = TOWER_DEFS[type];
    if (!def.unlock) return true;
    if (meta.unlockedTowers[type]) return true;
    // also unlock if achievement done
    if (meta.achievements[def.unlock]) return true;
    return false;
  }

  function buildShop() {
    el.shop.innerHTML = "";
    Object.keys(TOWER_DEFS).forEach((key, idx) => {
      const def = TOWER_DEFS[key];
      const unlocked = isTowerUnlocked(key);
      const btn = document.createElement("button");
      btn.className = "tower-card" + (unlocked ? "" : " locked");
      btn.dataset.type = key;
      btn.innerHTML = `
        <div class="tower-icon ${key}">${unlocked ? def.icon : "🔒"}</div>
        <div class="tower-meta">
          <strong>${unlocked ? def.name : "Locked"}</strong>
          <span>${unlocked ? def.description : getTowerUnlockHint(key)}</span>
        </div>
        <div class="tower-cost">${unlocked ? "🍌 " + def.cost : "🔒 " + getTowerUnlockHint(key)}</div>
      `;
      btn.addEventListener("click", () => {
        if (!unlocked) {
          showMeme("Unlock this with achievements! 🔒");
          AudioFX.ui();
          return;
        }
        AudioFX.ui();
        selectShopTower(key);
      });
      btn.title = unlocked ? `${def.name} · 🍌${def.cost} · key ${idx + 1}` : `${getTowerUnlockHint(key)}`;
      el.shop.appendChild(btn);
    });
  }

  function selectShopTower(type, opts = {}) {
    if (state.phase !== "playing" && state.phase !== "paused") return;
    if (!isTowerUnlocked(type)) {
      const def = TOWER_DEFS[type];
      if (opts.fromKey) {
        showGameToast(`${def?.name || "Tower"} locked — ${getTowerUnlockHint(type)}`, "info");
        AudioFX.ui();
      }
      return;
    }
    state.selectedShop = state.selectedShop === type ? null : type;
    state.selectedTower = null;
    state.abilityAiming = false;
    updateShopUI();
    updateSelectedUI();
    updateAbilityUI();
  }

  function updateShopUI() {
    el.shop.querySelectorAll(".tower-card").forEach((card) => {
      const type = card.dataset.type;
      const def = TOWER_DEFS[type];
      const unlocked = isTowerUnlocked(type);
      card.classList.toggle("selected", state.selectedShop === type);
      card.classList.toggle("locked", !unlocked);
      const playable = state.phase === "playing" || state.phase === "paused";
      card.disabled = !unlocked || state.phase === "menu";
      card.classList.toggle("cant-afford", unlocked && playable && state.gold < def.cost);
      card.classList.toggle("affordable", unlocked && playable && state.gold >= def.cost);
    });
  }

  function setTowerPanelEmpty(empty) {
    if (el.towerPanel) el.towerPanel.classList.toggle("is-empty", empty);
  }

  function updateSelectedUI() {
    const t = state.selectedTower;
    if (!t) {
      if (state.selectedShop) {
        setTowerPanelEmpty(false);
        const def = TOWER_DEFS[state.selectedShop];
        const afford = state.gold >= def.cost;
        const rageNote = state.rageTimer > 0 ? '<p class="placement-hint rage-hint">🙉 Jungle Rage active — +35% peel power</p>' : "";
        const fogNote = state.waveEvent?.id === "fog" && state.waveEventTimer > 0
          ? '<p class="placement-hint fog-hint">🌫 Regulatory fog — shorter placement range</p>'
          : "";
        el.selectedInfo.innerHTML = `
          <div class="name" style="color:${def.color}">${def.icon} Placing <strong>${def.name}</strong></div>
          <p class="muted">Click valid jungle tile · Esc / R-click cancel</p>
          <div class="detail-row"><span>Cost</span><b class="${afford ? "afford-ok" : "afford-no"}">🍌${def.cost}</b></div>
          <div class="detail-row"><span>Range</span><b>${formatRangeHtml(def.range)}</b></div>
          <div class="detail-row"><span>Damage</span><b>${Math.round(def.damage)}</b></div>
          <div class="detail-row"><span>Fire rate</span><b>${def.fireRate.toFixed(2)}/s</b></div>
          ${fogNote}${rageNote}
        `;
        return;
      }
      setTowerPanelEmpty(true);
      el.selectedInfo.innerHTML = '<p class="muted empty-hint">Tap a tower on the map to upgrade or sell.</p>';
      return;
    }
    setTowerPanelEmpty(false);
    const def = TOWER_DEFS[t.type];
    const upgradeCost = Math.floor(def.upgradeCost * Math.pow(1.38, t.level - 1));
    const sellValue = Math.floor(t.invested * SELL_REFUND);
    const atMax = t.level >= 3;
    const canUpgrade = !atMax && state.gold >= upgradeCost;
    const chips = TARGET_MODES.map((m) => {
      const meta = TARGET_MODE_LABELS[m];
      return `<button class="chip ${t.targetMode === m ? "active" : ""}" data-mode="${m}" title="${meta.tip}">${meta.label}</button>`;
    }).join("");
    const specialRows = towerSpecialStats(def, t.level, t)
      .map((r) => `<div class="detail-row"><span>${r.label}</span><b>${r.value}</b></div>`)
      .join("");
    const activeTarget = TARGET_MODE_LABELS[t.targetMode] || TARGET_MODE_LABELS.first;
    const upgradeLabel = atMax ? "MAX ⭐" : state.gold < upgradeCost ? `Need 🍌${upgradeCost}` : `🍌${upgradeCost}`;
    el.selectedInfo.innerHTML = `
      <div class="name" style="color:${def.color}">${def.icon} ${def.name} · LV ${t.level}${atMax ? " ⭐" : ""}</div>
      <div class="detail-row"><span>Damage</span><b>${Math.round(t.damage)}${state.rageTimer > 0 ? ' <span class="rage-boost">+35%</span>' : ""}</b></div>
      <div class="detail-row"><span>Range</span><b>${formatRangeHtml(t)}</b></div>
      <div class="detail-row"><span>Fire rate</span><b>${t.fireRate.toFixed(2)}/s</b></div>
      <div class="detail-row"><span>Crit</span><b>${Math.round(t.critChance * 100)}%</b></div>
      ${specialRows}
      <div class="detail-row"><span>Peels</span><b>${t.kills}</b></div>
      <p class="targeting-hint">Target: <b>${activeTarget.label}</b> — ${activeTarget.tip}</p>
      <div class="targeting-row">${chips}</div>
      <div class="selected-actions">
        <button class="btn primary" id="btn-upgrade" ${!canUpgrade ? "disabled" : ""} title="${atMax ? "Fully ripe" : state.gold < upgradeCost ? `Need ${upgradeCost - state.gold} more BAN` : "Upgrade tower"}">
          Upgrade ${upgradeLabel}
        </button>
        <button class="btn danger" id="btn-sell" title="Refund 60% of invested BAN">Sell 🍌${sellValue}</button>
      </div>
    `;
    el.selectedInfo.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        t.targetMode = chip.dataset.mode;
        AudioFX.ui();
        updateSelectedUI();
      });
    });
    const up = document.getElementById("btn-upgrade");
    const sell = document.getElementById("btn-sell");
    if (up) up.addEventListener("click", () => upgradeTower(t));
    if (sell) sell.addEventListener("click", () => sellTower(t));
  }

  const WAVE_THREAT_ORDER = ["boss", "whale", "hodler", "tick", "bear", "shill", "bot", "fud", "spam", "paper"];

  function updateNextWaveUI() {
    const next = state.wave + 1;
    if (state.mode === "campaign" && next > CAMPAIGN_WAVES) {
      el.nextWave.innerHTML = '<p class="muted">Campaign complete — victory is ripe!</p>';
      return;
    }
    const comp = [...waveComposition(next)].sort(
      (a, b) => WAVE_THREAT_ORDER.indexOf(a.type) - WAVE_THREAT_ORDER.indexOf(b.type)
    );
    const named = WAVE_NAMES[next];
    const boss = next % 5 === 0;
    const ev = getWaveEvent(next);
    const tags = [];
    if (boss) tags.push('<span class="wave-tag boss">Rugpull</span>');
    if (ev) tags.push(`<span class="wave-tag event">${ev.name}</span>`);
    const shown = comp.slice(0, 4);
    const total = comp.reduce((sum, g) => sum + g.count, 0);
    const shownTotal = shown.reduce((sum, g) => sum + g.count, 0);
    const threatRows = shown.map((g) => {
      const d = ENEMY_DEFS[g.type];
      return `<li><span class="threat-name"><span class="dot ${g.type}"></span>${d.name}</span><b>×${g.count}</b></li>`;
    }).join("");
    const more = total > shownTotal ? `<p class="wave-more">+${total - shownTotal} more FUD</p>` : "";
    el.nextWave.innerHTML = `
      <div class="wave-preview-head">Next <b>Wave ${next}</b>${tags.join("")}</div>
      ${named ? `<p class="wave-preview-sub">${named}</p>` : ""}
      <ul class="wave-threats">${threatRows}</ul>
      ${more}
    `;
  }

  function updateAbilityUI() {
    const play = state.phase === "playing";
    const aReady = state.airdropCd <= 0 && play;
    const rReady = state.rageCd <= 0 && play && state.rageTimer <= 0;
    el.btnAbility.disabled = !aReady && !state.abilityAiming;
    el.btnAbility.classList.toggle("ready", aReady && !state.abilityAiming);
    el.btnAbility.classList.toggle("on-cd", state.airdropCd > 0 && !state.abilityAiming);
    el.btnAbility2.disabled = !rReady;
    el.btnAbility2.classList.toggle("ready", rReady);
    el.btnAbility2.classList.toggle("on-cd", state.rageCd > 0 && state.rageTimer <= 0);
    el.btnAbility2.classList.toggle("active-rage", state.rageTimer > 0);

    if (state.abilityAiming) el.abilityCd.textContent = "Click map!";
    else if (state.airdropCd > 0) el.abilityCd.textContent = `${state.airdropCd.toFixed(1)}s`;
    else el.abilityCd.textContent = "Ready · Q";

    if (state.rageTimer > 0) el.ability2Cd.textContent = `ACTIVE ${state.rageTimer.toFixed(1)}s`;
    else if (state.rageCd > 0) el.ability2Cd.textContent = `${state.rageCd.toFixed(1)}s`;
    else el.ability2Cd.textContent = "Ready · E";
  }

  function updateMetaUI() {
    el.metaKills.textContent = String(meta.lifetimeKills);
    const unlocked = Object.keys(meta.achievements).filter((k) => meta.achievements[k]).length;
    el.metaAchs.textContent = `${unlocked}/${ACHIEVEMENTS.length}`;
    el.metaCombo.textContent = String(meta.bestCombo);
    el.metaWins.textContent = String(meta.campaignWins);
  }

  function updateHUD() {
    el.lives.textContent = String(state.lives);
    el.gold.textContent = String(state.gold);
    el.score.textContent = String(state.score);
    if (state.waveActive) {
      el.waveLabel.textContent = state.mode === "endless"
        ? `Wave ${state.wave} · live ∞`
        : `Wave ${state.wave} · live`;
    } else if (state.mode === "endless") {
      el.waveLabel.textContent = state.wave === 0 ? "Endless · ready" : `Cleared ${state.wave} · next ${state.wave + 1}`;
    } else {
      el.waveLabel.textContent = state.wave === 0
        ? `Ready · ${CAMPAIGN_WAVES} waves`
        : `Cleared ${state.wave} · next ${Math.min(state.wave + 1, CAMPAIGN_WAVES)}`;
    }

    el.statLives.classList.toggle("low-lives", state.lives > 0 && state.lives <= 5);
    const minCost = cheapestUnlockedCost();
    const broke = state.phase === "playing" && minCost > 0 && state.gold < minCost;
    el.statGold.classList.toggle("broke-gold", broke);

    if (state.combo >= 3) {
      el.statCombo.classList.remove("hidden");
      el.combo.textContent = String(state.combo);
    } else el.statCombo.classList.add("hidden");

    const maxW = state.mode === "campaign" ? CAMPAIGN_WAVES : Infinity;
    el.btnStartWave.disabled =
      state.waveActive || state.phase !== "playing" || (state.mode === "campaign" && state.wave >= CAMPAIGN_WAVES);
    el.btnStartWave.textContent = state.waveActive
      ? "Wave peeling…"
      : state.mode === "campaign" && state.wave >= CAMPAIGN_WAVES
        ? "Campaign complete!"
        : state.wave === 0
          ? "Start Wave 1 · Space"
          : `Start Wave ${state.wave + 1} · Space`;
    const canStartWave =
      state.phase === "playing" &&
      !state.waveActive &&
      !(state.mode === "campaign" && state.wave >= CAMPAIGN_WAVES);
    el.btnStartWave.classList.toggle("pulse", canStartWave);
    el.btnSpeed.textContent = `×${state.speed}`;
    el.btnSpeed.classList.toggle(
      "speed-active",
      state.speed > 1 && (state.phase === "playing" || state.phase === "paused")
    );
    el.btnPause.textContent = state.phase === "paused" ? "Resume · Space" : "Pause · Esc";
    updateShopUI();
    updateNextWaveUI();
    updateAbilityUI();
    updateMetaUI();
  }

  function showBanner(kicker, title, duration = 1.6) {
    el.waveBannerKicker.textContent = kicker;
    el.waveBannerTitle.textContent = title;
    el.waveBanner.classList.remove("hidden", "out");
    state.bannerTimer = duration;
  }

  function showComboToast(text) {
    el.comboToast.textContent = text;
    el.comboToast.classList.remove("hidden");
    clearTimeout(showComboToast._t);
    showComboToast._t = setTimeout(() => el.comboToast.classList.add("hidden"), 750);
  }

  function showMeme(text) {
    el.memeTicker.textContent = text;
    el.memeTicker.classList.add("show");
    clearTimeout(showMeme._t);
    showMeme._t = setTimeout(() => el.memeTicker.classList.remove("show"), 2200);
  }

  function showAchToast(ach) {
    el.achToastTitle.textContent = ach.name;
    el.achToastDesc.textContent = ach.desc;
    el.achToast.classList.remove("hidden");
    AudioFX.ach();
    clearTimeout(showAchToast._t);
    showAchToast._t = setTimeout(() => el.achToast.classList.add("hidden"), 3200);
  }

  // ── Achievements ───────────────────────────────────────────────────────────

  function refreshTypesBuilt() {
    state.typesBuiltSet = new Set(state.towers.map((t) => t.type));
    state.typesBuilt = state.typesBuiltSet.size;
  }

  function countUnlockedTowerTypes() {
    return Object.keys(TOWER_DEFS).filter((id) => isTowerUnlocked(id)).length;
  }

  function buildAchievementSnapshot() {
    return {
      ...state,
      typesBuilt: state.typesBuiltSet.size,
      requiredTowerTypes: countUnlockedTowerTypes(),
      lifetimeBosses: meta.lifetimeBosses,
    };
  }

  /** Wave/progress unlocks without requiring achievement toast. */
  function syncTowerUnlocks() {
    let changed = false;
    if (!meta.unlockedTowers.monkey && (meta.achievements.unlock_monkey || state.wave >= 15)) {
      meta.unlockedTowers.monkey = true;
      changed = true;
    }
    if (!meta.unlockedTowers.hammer && (meta.achievements.unlock_hammer || meta.lifetimeBosses >= 3)) {
      meta.unlockedTowers.hammer = true;
      changed = true;
    }
    return changed;
  }

  function checkAchievements() {
    const snapshot = buildAchievementSnapshot();
    let newCount = 0;
    let shopDirty = false;
    for (const ach of ACHIEVEMENTS) {
      if (meta.achievements[ach.id]) continue;
      try {
        if (ach.check(snapshot, meta)) {
          meta.achievements[ach.id] = true;
          newCount++;
          showAchToast(ach);
          if (ach.unlocks) {
            meta.unlockedTowers[ach.unlocks] = true;
            shopDirty = true;
            showMeme(`Unlocked: ${TOWER_DEFS[ach.unlocks].name}! 🎉`);
          }
        }
      } catch { /* */ }
    }
    if (syncTowerUnlocks()) shopDirty = true;
    if (newCount || shopDirty) {
      saveMeta();
      updateMetaUI();
      if (shopDirty) {
        buildShop();
        updateShopUI();
      }
    }
  }

  function renderAchList() {
    const unlocked = Object.keys(meta.achievements).filter((k) => meta.achievements[k]).length;
    el.achProgress.textContent = `${unlocked} / ${ACHIEVEMENTS.length}`;
    el.achList.innerHTML = ACHIEVEMENTS.map((a) => {
      const done = !!meta.achievements[a.id];
      const reward = a.unlocks ? `Unlocks ${TOWER_DEFS[a.unlocks]?.name || a.unlocks}` : "🍌 bragging rights";
      return `
        <div class="ach-item ${done ? "unlocked" : ""}">
          <div class="ach-icon">${a.icon}</div>
          <div>
            <div class="ach-name">${done ? a.name : "???"}</div>
            <div class="ach-desc">${a.desc}</div>
          </div>
          <div class="ach-reward">${done ? "✓ " + reward : reward}</div>
        </div>
      `;
    }).join("");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FX
  // ═══════════════════════════════════════════════════════════════════════════

  function shake(n) { state.shake = Math.max(state.shake, n); }
  function flash(n, c = "#fbdd11") { state.flash = Math.max(state.flash, n); state.flashColor = c; }
  function hitstop(t = 0.04) { state.hitstop = Math.max(state.hitstop, t); }

  function spawnParticles(x, y, color, n, speed = 140) {
    for (let i = 0; i < fxCount(n); i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(speed * 0.3, speed);
      state.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.25, 0.7), maxLife: 0.7, color, size: rand(1.5, 4.5), drag: 0.94, type: "spark",
      });
    }
  }

  function spawnPeel(x, y) {
    state.peels.push({
      x, y,
      vx: rand(-80, 80),
      vy: rand(-120, -40),
      rot: rand(0, Math.PI * 2),
      vr: rand(-8, 8),
      life: 0.8,
      size: rand(10, 16),
    });
  }

  function spawnSmoke(x, y, n = 5) {
    for (let i = 0; i < fxCount(n); i++) {
      state.particles.push({
        x: x + rand(-8, 8), y: y + rand(-8, 8),
        vx: rand(-20, 20), vy: rand(-40, -10),
        life: rand(0.4, 0.9), maxLife: 0.9,
        color: `rgba(180,200,120,${rand(0.15, 0.35)})`,
        size: rand(6, 14), drag: 0.97, type: "smoke",
      });
    }
  }

  function spawnRing(x, y, color, maxR, life = 0.4) {
    state.rings.push({ x, y, color, r: 4, maxR, life, maxLife: life, width: 3 });
  }

  function addFloatText(x, y, text, color, big = false) {
    state.floatTexts.push({ x: x + rand(-6, 6), y, text, color, life: big ? 1.1 : 0.85, vy: big ? -42 : -30, big });
  }

  function addShock(x, y, r, color) {
    state.shocks.push({ x, y, r, color, life: 0.35, maxLife: 0.35 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function resetGame() {
    AudioFX.resume();
    const startGold = 250 + (meta.campaignWins > 0 ? 50 : 0) + (meta.achievements.rich ? 25 : 0);
    Object.assign(state, {
      phase: "playing",
      lives: 25,
      gold: startGold,
      score: 0,
      wave: 0,
      speed: 1,
      selectedShop: null,
      selectedTower: null,
      towers: [],
      enemies: [],
      projectiles: [],
      beams: [],
      chains: [],
      particles: [],
      rings: [],
      floatTexts: [],
      shocks: [],
      peels: [],
      waveActive: false,
      spawnQueue: [],
      spawnTimer: 0,
      shake: 0, flash: 0, hitstop: 0,
      combo: 0, comboTimer: 0, bestCombo: 0,
      kills: 0, bossKills: 0,
      airdropCd: 3, rageCd: 8,
      abilityAiming: false,
      rageTimer: 0,
      waveLeaked: false,
      bannerTimer: 0,
      perfectWaves: 0, perfectStreak: 0,
      maxedTowers: 0, towersBuilt: 0,
      airdrops: 0, rages: 0,
      spent: 0, crits: 0,
      typesBuiltSet: new Set(),
      typesBuilt: 0,
      clearedOn3x: 0,
      wonCampaign: false,
      memeTimer: 4,
      waveEvent: null,
      waveEventTimer: 0,
      tickKills: 0,
      hodlerBroken: 0,
      fogPerfectClears: 0,
      brainFreezeTowers: 0,
      bossPhase3Kills: 0,
    });
    el.overlayStart.classList.add("hidden");
    el.overlayPause.classList.add("hidden");
    el.overlayEnd.classList.add("hidden");
    el.overlayAchs.classList.add("hidden");
    if (el.overlayHotkeys) el.overlayHotkeys.classList.add("hidden");
    el.waveBanner.classList.add("hidden");
    AudioFX.startAmbient();
    showBanner("JUNGLE PROTOCOL", "PROTECT THE BAN 🍌", 1.5);
    showMeme(MEMES[(Math.random() * MEMES.length) | 0]);
    buildShop();
    updateHUD();
    updateSelectedUI();
  }

  function startWave() {
    if (state.waveActive || state.phase !== "playing") return;
    if (state.mode === "campaign" && state.wave >= CAMPAIGN_WAVES) return;
    state.wave += 1;
    state.waveActive = true;
    state.waveLeaked = false;
    state.spawnQueue = [];
    const comp = waveComposition(state.wave);
    for (const g of comp) {
      for (let i = 0; i < g.count; i++) state.spawnQueue.push(g.type);
    }
    const ev = getWaveEvent(state.wave);
    state.waveEvent = ev;
    state.waveEventTimer = ev?.id === "fog" ? (ev.fogDuration || 14) : 0;
    if (ev?.extraBoss) {
      for (let i = 0; i < ev.extraBoss; i++) state.spawnQueue.push("boss");
    }
    for (let i = state.spawnQueue.length - 1; i > 0; i--) {
      if (Math.random() < 0.4) {
        const j = (Math.random() * (i + 1)) | 0;
        [state.spawnQueue[i], state.spawnQueue[j]] = [state.spawnQueue[j], state.spawnQueue[i]];
      }
    }
    state.spawnTimer = ev?.spawnScale ? 0.45 * ev.spawnScale : 0.45;
    AudioFX.wave();
    const isBoss = state.wave % 5 === 0 || ev?.extraBoss;
    const named = WAVE_NAMES[state.wave];
    if (ev) {
      showBanner(`⚡ ${ev.name.toUpperCase()}`, `WAVE ${state.wave}`, 1.9);
      showMeme(ev.meme);
    } else {
      showBanner(
        isBoss ? "⚠ RUGPULL DETECTED" : named || "FUD INCOMING",
        `WAVE ${state.wave}`,
        isBoss ? 2.1 : 1.5
      );
    }
    if (isBoss && !ev) { shake(12); flash(0.45, "#ff4d94"); showMeme("3-phase Rugpull — lock liquidity before Rug Moment! 🔨"); }
    else if (isBoss && ev?.extraBoss) { shake(10); flash(0.35, "#ff4d94"); }
    checkAchievements();
    updateHUD();
    if (state.selectedShop || state.selectedTower) updateSelectedUI();
  }

  function enemySpeedBase(def) {
    return def.speed * (1 + state.wave * 0.0045);
  }

  function buildEnemy(type, progress = 0, opts = {}) {
    const def = ENEMY_DEFS[type];
    const scale = hpScale(state.wave);
    const endlessBoost = state.mode === "endless" && state.wave > 50
      ? 1 + (state.wave - 50) * 0.035
      : 1;
    const hpMult = opts.hpMult ?? 1;
    const pos = posAlongPath(progress);
    const speedBase = enemySpeedBase(def);
    const enemy = {
      type,
      x: pos.x, y: pos.y,
      hp: def.hp * scale * endlessBoost * hpMult,
      maxHp: def.hp * scale * endlessBoost * hpMult,
      speed: speedBase,
      baseSpeed: speedBase,
      reward: Math.floor(def.reward * (1 + state.wave * 0.04)),
      radius: def.radius,
      color: def.color,
      lives: def.lives,
      progress,
      slowTimer: 0,
      slowFactor: 1,
      alive: true,
      healRate: def.healRate || 0,
      healRange: def.healRange || 0,
      healPulse: 0,
      hitFlash: 0,
      wobble: Math.random() * 6,
      goldSteal: def.goldSteal || 0,
      regenUsed: false,
    };
    if (type === "boss") {
      enemy.speedBase = speedBase;
      enemy.bossPhase = 1;
      enemy.rugCd = 3.5;
      enemy.rugTelegraph = 0;
      enemy.color = BOSS_PHASE_CFG[1].color;
    }
    return enemy;
  }

  function spawnEnemy(type) {
    state.enemies.push(buildEnemy(type, 0));
  }

  function spawnMinionAt(type, progress, hpMult = 0.82) {
    state.enemies.push(buildEnemy(type, Math.max(0, progress), { hpMult }));
  }

  function bossPhaseFromRatio(ratio) {
    if (ratio <= BOSS_PHASE_CFG[3].threshold) return 3;
    if (ratio <= BOSS_PHASE_CFG[2].threshold) return 2;
    return 1;
  }

  function applyBossPhaseShift(e, phase) {
    if (e.bossPhase >= phase) return;
    const cfg = BOSS_PHASE_CFG[phase];
    e.bossPhase = phase;
    e.baseSpeed = e.speedBase * cfg.speedMult;
    e.color = cfg.color;
    shake(phase === 3 ? 10 : 7);
    flash(0.28, cfg.color);
    addFloatText(e.x, e.y - e.radius - 28, cfg.name.toUpperCase(), cfg.color, true);
    showGameToast(`Rugpull → ${cfg.name}!`, phase === 3 ? "warn" : "info");
    if (phase === 2) showMeme("Liquidity locked — Shills can't pump the Rug! 🔒");
    else if (phase === 3) showMeme("RUG MOMENT — peel the adds or pay the fee! 🚨");
    AudioFX.bossShift();
  }

  function executeRugPulse(e) {
    const cfg = BOSS_PHASE_CFG[3];
    for (let i = 0; i < cfg.spawns.length; i++) {
      spawnMinionAt(cfg.spawns[i], e.progress - 18 - i * 10);
    }
    spawnRing(e.x, e.y, cfg.color, e.radius * 3.2, 0.45);
    addShock(e.x, e.y, 70, cfg.color);
    shake(5);
    AudioFX.rugPulse();
    addFloatText(e.x, e.y - e.radius - 14, "RUG PULL!", "#ff5c6a", true);
  }

  function updateBossBehavior(e, dt) {
    if (e.type !== "boss" || !e.alive) return;
    const ratio = e.hp / e.maxHp;
    const targetPhase = bossPhaseFromRatio(ratio);
    if (targetPhase > e.bossPhase) applyBossPhaseShift(e, targetPhase);

    if (e.bossPhase < 3) return;
    const cfg = BOSS_PHASE_CFG[3];
    if (e.rugTelegraph > 0) {
      e.rugTelegraph -= dt;
      if (e.rugTelegraph <= 0) executeRugPulse(e);
      return;
    }
    e.rugCd -= dt;
    if (e.rugCd <= 0) {
      e.rugTelegraph = cfg.telegraph;
      e.rugCd = cfg.pulseInterval;
      AudioFX.bossTelegraph();
    }
  }

  function canPlace(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
    if (pathSet.has(`${tx},${ty}`)) return false;
    return !state.towers.some((t) => t.tx === tx && t.ty === ty);
  }

  function placeTower(tx, ty) {
    const type = state.selectedShop;
    const block = getPlaceBlockReason(tx, ty, type);
    if (block) {
      showGameToast(block, block.includes("Need") ? "info" : "warn");
      AudioFX.ui();
      return false;
    }
    const def = TOWER_DEFS[type];
    const c = tileCenter(tx, ty);
    state.gold -= def.cost;
    state.spent += def.cost;
    popStat(el.statGold);
    state.towers.push({
      type, tx, ty, x: c.x, y: c.y,
      level: 1,
      range: def.range,
      damage: def.damage,
      fireRate: def.fireRate,
      critChance: def.critChance,
      cooldown: 0,
      invested: def.cost,
      kills: 0,
      angle: 0,
      recoil: 0,
      targetMode: "first",
      muzzle: 0,
    });
    state.towersBuilt = state.towers.length;
    refreshTypesBuilt();
    spawnParticles(c.x, c.y, def.color, 16, 160);
    spawnRing(c.x, c.y, def.color, 40, 0.35);
    spawnPeel(c.x, c.y);
    AudioFX.place();
    state.selectedShop = null;
    checkAchievements();
    updateHUD();
    updateSelectedUI();
    return true;
  }

  function upgradeTower(t) {
    if (t.level >= 3) return;
    const def = TOWER_DEFS[t.type];
    const cost = Math.floor(def.upgradeCost * Math.pow(1.38, t.level - 1));
    if (state.gold < cost) return;
    state.gold -= cost;
    state.spent += cost;
    popStat(el.statGold);
    t.level += 1;
    t.damage *= def.dmgScale;
    t.range *= def.rangeScale;
    t.fireRate *= def.rateScale;
    t.critChance = Math.min(0.5, t.critChance + 0.05);
    t.invested += cost;
    if (t.level >= 3) {
      state.maxedTowers += 1;
      if (t.type === "frost" && !t.brainFreeze) {
        t.brainFreeze = true;
        state.brainFreezeTowers += 1;
        addFloatText(t.x, t.y - 30, "BRAIN FREEZE! 🧊", "#7ec8e3", true);
      }
    }
    spawnParticles(t.x, t.y, def.color, 22, 180);
    spawnRing(t.x, t.y, "#fbdd11", 50, 0.4);
    addFloatText(t.x, t.y - 24, `RIPE LV${t.level}!`, "#fbdd11", true);
    flash(0.15, def.color);
    AudioFX.upgrade();
    checkAchievements();
    updateHUD();
    updateSelectedUI();
  }

  function sellTower(t) {
    const refund = Math.floor(t.invested * SELL_REFUND);
    state.gold += refund;
    popStat(el.statGold);
    state.towers = state.towers.filter((x) => x !== t);
    state.towersBuilt = state.towers.length;
    refreshTypesBuilt();
    if (state.selectedTower === t) state.selectedTower = null;
    spawnParticles(t.x, t.y, "#fbdd11", 14);
    addFloatText(t.x, t.y - 10, `+${refund}🍌`, "#fbdd11");
    AudioFX.sell();
    updateHUD();
    updateSelectedUI();
  }

  function registerKill(enemy, sourceTower) {
    state.kills += 1;
    meta.lifetimeKills += 1;
    state.combo += 1;
    state.comboTimer = COMBO_WINDOW;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;
    if (state.bestCombo > meta.bestCombo) meta.bestCombo = state.bestCombo;

    if (enemy.type === "boss") {
      state.bossKills += 1;
      meta.lifetimeBosses += 1;
      if (enemy.bossPhase >= 3) state.bossPhase3Kills += 1;
    }
    if (enemy.type === "tick") state.tickKills += 1;
    if (enemy.type === "hodler" && enemy.regenUsed) state.hodlerBroken += 1;

    const mult = 1 + Math.min(COMBO_GOLD_CAP, Math.floor(state.combo / 5) * 0.2);
    const rageMult = state.rageTimer > 0 ? 1.35 : 1;
    const eventBan = state.waveEvent?.id === "double_ban" ? 2 : 1;
    const goldGain = Math.floor(enemy.reward * mult * rageMult * eventBan);
    const scoreGain = Math.floor((enemy.reward * 12 + state.wave * 3) * mult * rageMult);
    state.gold += goldGain;
    state.score += scoreGain;
    if (sourceTower) sourceTower.kills += 1;

    spawnParticles(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 45 : 16, 200);
    spawnPeel(enemy.x, enemy.y);
    if (!meta.settings?.reduceParticles && Math.random() > 0.5) spawnPeel(enemy.x, enemy.y);
    spawnSmoke(enemy.x, enemy.y, enemy.type === "boss" ? 12 : 4);
    spawnRing(enemy.x, enemy.y, enemy.color, enemy.radius * 3, 0.35);
    addFloatText(enemy.x, enemy.y - 10, `+${goldGain}🍌`, "#fbdd11", state.combo >= 5);

    if (enemy.type === "boss") {
      shake(16);
      flash(0.55, "#ff4d94");
      hitstop(0.12);
      addShock(enemy.x, enemy.y, 90, "#ff4d94");
      showMeme("Rugpull rejected! Banhammer justice 🔨");
    } else if (state.combo > 0 && state.combo % 5 === 0) {
      shake(4);
      const labels = { 5: "NICE PEEL!", 10: "BAN GO BRRR!", 15: "POTASSIUM RUSH!", 20: "MONKEY MODE!", 25: "MEME OVERLORD!", 50: "LEGENDARY HODLER!" };
      showComboToast(labels[state.combo] || `${state.combo}× COMBO`);
      AudioFX.combo(state.combo);
    }

    AudioFX.death();
    popStat(el.statGold);
    if (state.kills % 25 === 0) saveMeta();
    checkAchievements();
    updateHUD();
  }

  function damageEnemy(enemy, amount, sourceTower, opts = {}) {
    if (!enemy.alive) return false;
    let dmg = amount * (state.rageTimer > 0 ? 1.35 : 1);
    if (enemy.type === "boss" && enemy.bossPhase > 1) {
      dmg *= 1 - (BOSS_PHASE_CFG[enemy.bossPhase].dr || 0);
    }
    let crit = opts.crit;
    if (crit == null && sourceTower) crit = Math.random() < sourceTower.critChance;
    if (crit) {
      dmg *= 2;
      state.crits += 1;
      addFloatText(enemy.x, enemy.y - enemy.radius - 6, `CRIT ${Math.round(dmg)}`, "#ff6b6b", true);
      hitstop(0.025);
      shake(2);
      AudioFX.hit(true);
    } else {
      if (Math.random() < 0.35) addFloatText(enemy.x, enemy.y - enemy.radius - 4, `${Math.round(dmg)}`, "#fff8dc");
      AudioFX.hit(false);
    }
    enemy.hp -= dmg;
    enemy.hitFlash = 0.1;
    spawnParticles(enemy.x, enemy.y, enemy.color, crit ? 7 : 2, 90);
    if (enemy.type === "hodler" && !enemy.regenUsed && enemy.hp > 0 && enemy.hp / enemy.maxHp < 0.4) {
      const def = ENEMY_DEFS.hodler;
      enemy.regenUsed = true;
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * (def.regen || 0.28));
      addFloatText(enemy.x, enemy.y - enemy.radius - 10, "HODL!", "#88d4ff", true);
      spawnRing(enemy.x, enemy.y, "#88d4ff", enemy.radius * 2.2, 0.4);
    }
    if (enemy.hp <= 0) {
      enemy.alive = false;
      registerKill(enemy, sourceTower);
      return true;
    }
    return false;
  }

  function enemyReachedEnd(enemy) {
    enemy.alive = false;
    state.lives = Math.max(0, state.lives - enemy.lives);
    state.waveLeaked = true;
    state.combo = 0;
    state.perfectStreak = 0;
    if (enemy.goldSteal > 0) {
      const stolen = Math.min(state.gold, enemy.goldSteal);
      if (stolen > 0) {
        state.gold -= stolen;
        addFloatText(enemy.x, enemy.y - 18, `-${stolen}🍌 FEE`, "#ff5c6a", true);
        showGameToast(`Gas Fee Tick stole ${stolen} BAN from your wallet!`, "warn");
        popStat(el.statGold);
      }
    }
    spawnParticles(enemy.x, enemy.y, "#ff5c6a", 20, 180);
    spawnRing(enemy.x, enemy.y, "#ff5c6a", 50, 0.4);
    shake(8);
    flash(0.3, "#ff5c6a");
    AudioFX.leak();
    popStat(el.statLives);
    showMeme(enemy.type === "tick" ? "Network fee got your BAN! ⛽" : "Leak! Paperhands reached the wallet 😱");
    updateHUD();
    if (state.lives <= 0) endGame(false);
  }

  function endGame(won) {
    state.phase = won ? "won" : "lost";
    state.waveActive = false;
    state.abilityAiming = false;
    AudioFX.stopAmbient();

    const newScoreRecord = state.score > meta.bestScore;
    const newEndlessRecord = state.mode === "endless" && state.wave > meta.bestEndlessWave;
    if (won && state.mode === "campaign") {
      state.wonCampaign = true;
      meta.campaignWins += 1;
    }
    if (newEndlessRecord) meta.bestEndlessWave = state.wave;
    if (newScoreRecord) meta.bestScore = state.score;
    checkAchievements();
    saveMeta();

    const newAchs = ACHIEVEMENTS.filter((a) => meta.achievements[a.id]).length;

    if (won) {
      AudioFX.win();
      flash(0.7, "#fbdd11");
      shake(8);
      el.endTitle.textContent = state.mode === "endless" ? "JUNGLE LEGEND!" : "POTASSIUM SECURED!";
      el.endTitle.className = "win";
      el.endMessage.textContent = state.mode === "endless"
        ? `You held the canopy for ${state.wave} waves. Absolute monKey.`
        : WIN_MESSAGES[(Math.random() * WIN_MESSAGES.length) | 0];
    } else {
      AudioFX.lose();
      flash(0.55, "#ff5c6a");
      el.endTitle.textContent = "WALLET DRAINED";
      el.endTitle.className = "lose";
      el.endMessage.textContent = LOSE_MESSAGES[(Math.random() * LOSE_MESSAGES.length) | 0];
    }
    el.endScore.textContent = String(state.score);
    el.endCombo.textContent = String(state.bestCombo);
    el.endKills.textContent = String(state.kills);
    el.endWave.textContent = String(state.wave);
    if (el.endBests) {
      const scoreLine = newScoreRecord
        ? `<span class="record-new">⭐ New best score!</span>`
        : `Best score: <b>${meta.bestScore}</b>`;
      const endlessLine = state.mode === "endless"
        ? (newEndlessRecord
          ? `<span class="record-new">⭐ New endless record!</span>`
          : `Best endless wave: <b>${meta.bestEndlessWave}</b>`)
        : `Campaign wins: <b>${meta.campaignWins}</b>`;
      el.endBests.innerHTML = `${scoreLine} · ${endlessLine}`;
    }
    el.endAchNote.textContent = `Achievements: ${newAchs}/${ACHIEVEMENTS.length} · Lifetime peels: ${meta.lifetimeKills}`;
    el.overlayEnd.classList.remove("hidden");
    updateHUD();
  }

  function fireAirdrop(x, y) {
    if (state.airdropCd > 0 || state.phase !== "playing") return;
    state.airdropCd = AIRDROP_CD;
    state.abilityAiming = false;
    state.airdrops += 1;
    AudioFX.ability();
    shake(16);
    flash(0.55, "#fbdd11");
    hitstop(0.08);

    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      state.beams.push({
        x1: x + Math.cos(ang) * 30, y1: -50,
        x2: x + Math.cos(ang) * 15, y2: y + Math.sin(ang) * 15,
        color: "#fbdd11", life: 0.4, width: 5, delay: i * 0.025,
      });
    }
    spawnRing(x, y, "#fbdd11", 150, 0.55);
    spawnRing(x, y, "#ff9f1c", 100, 0.4);
    addShock(x, y, 110, "#fbdd11");
    spawnParticles(x, y, "#fbdd11", 55, 300);
    for (let i = 0; i < 10; i++) spawnPeel(x + rand(-40, 40), y + rand(-40, 40));

    const radius = 120;
    const dmg = 180 + state.wave * 28;
    for (const e of state.enemies) {
      if (!e.alive) continue;
      const d = dist(x, y, e.x, e.y);
      if (d <= radius) {
        damageEnemy(e, dmg * (1 - (d / radius) * 0.5), null, { crit: d < 35 });
      }
    }
    addFloatText(x, y - 30, "🍌 AIRDROP!", "#fbdd11", true);
    showMeme("Free BAN raining from the sky!");
    checkAchievements();
    updateAbilityUI();
  }

  function activateRage() {
    if (state.rageCd > 0 || state.phase !== "playing" || state.rageTimer > 0) return;
    state.rageCd = RAGE_CD;
    state.rageTimer = 7;
    state.rages += 1;
    AudioFX.rage();
    flash(0.4, "#ff6b35");
    shake(10);
    showBanner("🙉 JUNGLE RAGE", "1.35× DMG · 1.35× BAN", 1.4);
    showMeme("monKeys are UNHINGED! 🙉🔥");
    // buff fire rate temporarily via rageTimer checks
    for (const t of state.towers) t.cooldown = 0;
    checkAchievements();
    updateAbilityUI();
    updateSelectedUI();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBAT
  // ═══════════════════════════════════════════════════════════════════════════

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

  function findTarget(tower) {
    const mode = tower.targetMode || "first";
    let best = null;
    let bestScore = mode === "last" || mode === "close" ? Infinity : -Infinity;
    for (const e of state.enemies) {
      if (!e.alive) continue;
      const d = dist(tower.x, tower.y, e.x, e.y);
      const effRange = towerEffectiveRange(tower);
      if (d > effRange) continue;
      let score = mode === "first" ? e.progress : mode === "last" ? e.progress : mode === "strong" ? e.hp : d;
      const better = mode === "last" || mode === "close" ? score < bestScore : score > bestScore;
      if (better || best == null) { bestScore = score; best = e; }
    }
    return best;
  }

  function fireFromTower(tower, target) {
    const def = TOWER_DEFS[tower.type];
    tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    tower.recoil = 1;
    tower.muzzle = 0.12;
    AudioFX.shoot(tower.type);
    const rateBoost = state.rageTimer > 0 ? 1.3 : 1;

    if (def.instant && def.chain) {
      const hit = [target];
      let current = target;
      const maxChain = def.chain + tower.level - 1;
      for (let i = 0; i < maxChain - 1; i++) {
        let next = null, bestD = 105;
        for (const e of state.enemies) {
          if (!e.alive || hit.includes(e)) continue;
          const d = dist(current.x, current.y, e.x, e.y);
          if (d < bestD) { bestD = d; next = e; }
        }
        if (!next) break;
        hit.push(next);
        current = next;
      }
      let dmg = tower.damage;
      let prev = { x: tower.x, y: tower.y };
      for (const e of hit) {
        state.chains.push({
          x1: prev.x, y1: prev.y, x2: e.x, y2: e.y, life: 0.18, color: def.color,
          jitter: Array.from({ length: 4 }, () => ({ jx: rand(-8, 8), jy: rand(-8, 8) })),
        });
        damageEnemy(e, dmg, tower);
        dmg *= def.chainFalloff;
        prev = e;
      }
      return;
    }

    if (def.beam) {
      const ang = tower.angle;
      const reach = towerEffectiveRange(tower) + 12;
      const x2 = tower.x + Math.cos(ang) * reach;
      const y2 = tower.y + Math.sin(ang) * reach;
      state.beams.push({ x1: tower.x, y1: tower.y, x2, y2, color: def.color, life: 0.12, width: 3 + tower.level });
      const sorted = state.enemies
        .filter((e) => e.alive && dist(tower.x, tower.y, e.x, e.y) <= towerEffectiveRange(tower))
        .map((e) => {
          const dx = x2 - tower.x, dy = y2 - tower.y;
          const len = Math.hypot(dx, dy) || 1;
          const t = ((e.x - tower.x) * dx + (e.y - tower.y) * dy) / (len * len);
          const px = tower.x + dx * t, py = tower.y + dy * t;
          return { e, t, off: dist(e.x, e.y, px, py) };
        })
        .filter((o) => o.t > 0 && o.t < 1 && o.off < 18)
        .sort((a, b) => a.t - b.t);
      let pierced = 0;
      const maxPierce = (def.pierce || 0) + tower.level - 1;
      for (const o of sorted) {
        if (pierced >= maxPierce) break;
        damageEnemy(o.e, tower.damage * (pierced === 0 ? 1 : 0.6), tower);
        pierced++;
      }
      return;
    }

    const shots = def.multishot ? def.multishot + tower.level - 1 : 1;
    for (let s = 0; s < shots; s++) {
      const spread = shots > 1 ? (s - (shots - 1) / 2) * 0.15 : 0;
      const aimX = target.x + Math.cos(tower.angle + Math.PI / 2) * spread * 40;
      const aimY = target.y + Math.sin(tower.angle + Math.PI / 2) * spread * 40;
      // pick target for multishot: primary or nearby
      let tgt = target;
      if (s > 0) {
        const others = state.enemies.filter((e) => e.alive && e !== target && dist(tower.x, tower.y, e.x, e.y) <= towerEffectiveRange(tower));
        if (others.length) tgt = others[(Math.random() * others.length) | 0];
      }
      const isArc = !!def.arc;
      state.projectiles.push({
        x: tower.x, y: tower.y,
        target: tgt,
        speed: def.projectileSpeed,
        damage: tower.damage,
        color: def.color,
        type: tower.type,
        tower,
        splashRadius: def.splashRadius ? def.splashRadius * (1 + (tower.level - 1) * 0.15) : 0,
        slowFactor: def.slowFactor || 0,
        slowDuration: def.slowDuration || 0,
        radius: isArc ? 7 : 4,
        arc: isArc,
        age: 0,
        flightTime: isArc ? dist(tower.x, tower.y, tgt.x, tgt.y) / def.projectileSpeed : 0,
        startX: tower.x, startY: tower.y,
        endX: aimX, endY: aimY,
        trail: [],
      });
    }
  }

  function updateTowers(dt) {
    const rateBoost = state.rageTimer > 0 ? 1.3 : 1;
    for (const t of state.towers) {
      t.cooldown -= dt * rateBoost;
      t.recoil = Math.max(0, t.recoil - dt * 4);
      t.muzzle = Math.max(0, t.muzzle - dt);
      if (t.cooldown > 0) continue;
      const target = findTarget(t);
      if (!target) continue;
      fireFromTower(t, target);
      t.cooldown = 1 / t.fireRate;
    }
  }

  function impactProjectile(p) {
    if (p.splashRadius > 0) {
      const cx = p.arc ? p.endX : (p.target ? p.target.x : p.x);
      const cy = p.arc ? p.endY : (p.target ? p.target.y : p.y);
      for (const e of state.enemies) {
        if (!e.alive) continue;
        const d = dist(cx, cy, e.x, e.y);
        if (d <= p.splashRadius) {
          damageEnemy(e, p.damage * (1 - (d / p.splashRadius) * 0.45), p.tower);
        }
      }
      spawnParticles(cx, cy, p.color, 22, 200);
      spawnRing(cx, cy, p.color, p.splashRadius, 0.35);
      spawnSmoke(cx, cy, 6);
      spawnPeel(cx, cy);
      shake(2.5);
    } else if (p.target && p.target.alive) {
      damageEnemy(p.target, p.damage, p.tower);
      if (p.tower?.brainFreeze && Math.random() < 0.22) {
        p.target.slowFactor = Math.min(p.target.slowFactor, 0.12);
        p.target.slowTimer = Math.max(p.target.slowTimer, 1.1);
        addFloatText(p.target.x, p.target.y - p.target.radius - 8, "BRAIN FREEZE!", "#7ec8e3", true);
        spawnParticles(p.target.x, p.target.y, "#7ec8e3", 8, 60);
      } else if (p.slowFactor > 0) {
        p.target.slowFactor = Math.min(p.target.slowFactor, p.slowFactor);
        p.target.slowTimer = Math.max(p.target.slowTimer, p.slowDuration);
        spawnParticles(p.target.x, p.target.y, "#7ec8e3", 5, 50);
      }
    }
  }

  function updateProjectiles(dt) {
    for (const p of state.projectiles) {
      p.age += dt;
      p.trail.push({ x: p.x, y: p.y, life: 0.2 });
      if (p.trail.length > 10) p.trail.shift();
      for (const tr of p.trail) tr.life -= dt;

      if (p.arc) {
        if (p.target && p.target.alive) { p.endX = p.target.x; p.endY = p.target.y; }
        const t = p.flightTime > 0 ? clamp(p.age / p.flightTime, 0, 1) : 1;
        p.x = lerp(p.startX, p.endX, t);
        p.y = lerp(p.startY, p.endY, t) - Math.sin(t * Math.PI) * 80;
        if (t >= 1) { impactProjectile(p); p.dead = true; }
      } else {
        if (!p.target || !p.target.alive) {
          if (p.tower) {
            const next = findTarget(p.tower);
            if (next) p.target = next;
            else { p.dead = true; continue; }
          } else { p.dead = true; continue; }
        }
        const dx = p.target.x - p.x, dy = p.target.y - p.y;
        const d = Math.hypot(dx, dy);
        const step = p.speed * dt;
        if (d <= step + p.target.radius * 0.5) { impactProjectile(p); p.dead = true; }
        else { p.x += (dx / d) * step; p.y += (dy / d) * step; }
      }
    }
    state.projectiles = state.projectiles.filter((p) => !p.dead);
  }

  function updateEnemies(dt) {
    for (const e of state.enemies) {
      if (!e.alive) continue;
      e.wobble += dt * 6;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        if (e.slowTimer <= 0) e.slowFactor = 1;
      }
      e.progress += e.baseSpeed * e.slowFactor * dt;
      if (e.progress >= totalPathLen) { enemyReachedEnd(e); continue; }
      e.progress = clamp(e.progress, 0, totalPathLen);
      const p = posAlongPath(e.progress);
      e.x = p.x; e.y = p.y;

      updateBossBehavior(e, dt);

      if (e.healRate > 0) {
        e.healPulse += dt;
        if (e.healPulse >= 0.5) {
          e.healPulse = 0;
          for (const o of state.enemies) {
            if (!o.alive || o === e) continue;
            if (o.type === "boss" && o.bossPhase >= 2) continue;
            if (dist(e.x, e.y, o.x, o.y) <= e.healRange) {
              o.hp = Math.min(o.maxHp, o.hp + e.healRate * Math.min(hpScale(state.wave), 4) * 0.35);
            }
          }
        }
      }
    }
    state.enemies = state.enemies.filter((e) => e.alive);
  }

  function updateFX(dt) {
    for (const p of state.particles) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= p.drag; p.vy *= p.drag;
      if (p.type === "smoke") p.size += dt * 10;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    for (const peel of state.peels) {
      peel.life -= dt;
      peel.x += peel.vx * dt;
      peel.y += peel.vy * dt;
      peel.vy += 280 * dt;
      peel.rot += peel.vr * dt;
    }
    state.peels = state.peels.filter((p) => p.life > 0);

    for (const r of state.rings) {
      r.life -= dt;
      r.r = lerp(4, r.maxR, 1 - r.life / r.maxLife);
    }
    state.rings = state.rings.filter((r) => r.life > 0);

    for (const f of state.floatTexts) { f.life -= dt; f.y += f.vy * dt; }
    state.floatTexts = state.floatTexts.filter((f) => f.life > 0);

    for (const b of state.beams) {
      if (b.delay > 0) { b.delay -= dt; continue; }
      b.life -= dt;
    }
    state.beams = state.beams.filter((b) => b.life > 0);
    for (const c of state.chains) c.life -= dt;
    state.chains = state.chains.filter((c) => c.life > 0);
    for (const s of state.shocks) s.life -= dt;
    state.shocks = state.shocks.filter((s) => s.life > 0);

    if (state.shake > 0) {
      state.shake = Math.max(0, state.shake - dt * 28);
      state.shakeX = (Math.random() - 0.5) * state.shake * 2;
      state.shakeY = (Math.random() - 0.5) * state.shake * 2;
    } else state.shakeX = state.shakeY = 0;

    state.flash = Math.max(0, state.flash - dt * 2.2);

    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        const ended = state.combo;
        state.combo = 0;
        if (ended >= 5) showGameToast(`Combo dropped at ${ended}×`, "info");
        updateHUD();
      }
    }

    if (state.airdropCd > 0) state.airdropCd = Math.max(0, state.airdropCd - dt);
    if (state.rageCd > 0 && state.rageTimer <= 0) state.rageCd = Math.max(0, state.rageCd - dt);
    if (state.rageTimer > 0) {
      state.rageTimer = Math.max(0, state.rageTimer - dt);
      if (state.rageTimer <= 0) {
        showMeme("Rage faded. Still rich in potassium.");
        if (state.selectedTower || state.selectedShop) updateSelectedUI();
      }
    }
    if (state.waveEventTimer > 0) {
      state.waveEventTimer = Math.max(0, state.waveEventTimer - dt);
      if (state.waveEventTimer <= 0 && state.waveEvent?.id === "fog") {
        showGameToast("Regulatory fog lifted — full range restored!", "ok");
        if (state.selectedTower || state.selectedShop) updateSelectedUI();
      }
    }
    updateAbilityUI();

    if (state.bannerTimer > 0) {
      state.bannerTimer -= dt;
      if (state.bannerTimer <= 0.35) el.waveBanner.classList.add("out");
      if (state.bannerTimer <= 0) {
        el.waveBanner.classList.add("hidden");
        el.waveBanner.classList.remove("out");
      }
    }

    if (state.phase === "playing") {
      state.memeTimer -= dt;
      if (state.memeTimer <= 0) {
        state.memeTimer = 12 + Math.random() * 10;
        if (Math.random() < 0.4) showMeme(MEMES[(Math.random() * MEMES.length) | 0]);
      }
    }
  }

  function updateSpawning(dt) {
    if (!state.waveActive) return;
    if (state.spawnQueue.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        const type = state.spawnQueue.shift();
        spawnEnemy(type);
        if (type === "spam") {
          for (let i = 0; i < 2; i++) {
            const idx = state.spawnQueue.indexOf("spam");
            if (idx >= 0) { state.spawnQueue.splice(idx, 1); spawnEnemy("spam"); }
          }
          state.spawnTimer = 0.22;
        } else {
          let interval = type === "boss" ? 1.5 : type === "whale" || type === "bear" ? 0.75 : 0.4 + Math.random() * 0.2;
          if (state.waveEvent?.spawnScale) interval *= state.waveEvent.spawnScale;
          state.spawnTimer = interval;
        }
      }
    } else if (state.enemies.length === 0) {
      state.waveActive = false;
      const doubleBan = state.waveEvent?.id === "double_ban";
      if (state.waveEvent?.id === "fog" && !state.waveLeaked) state.fogPerfectClears += 1;
      state.waveEvent = null;
      state.waveEventTimer = 0;
      let bonus = WAVE_BONUS_BASE + state.wave * WAVE_BONUS_PER;
      if (!state.waveLeaked) {
        bonus = Math.floor(bonus * PERFECT_WAVE_MULT);
        state.perfectWaves += 1;
        state.perfectStreak += 1;
        addFloatText(W / 2, 80, "PERFECT WAVE! ✨", "#5dde7a", true);
        state.score += 120 * state.wave;
        flash(0.22, "#5dde7a");
      } else {
        state.perfectStreak = 0;
      }
      if (state.speed === 3) state.clearedOn3x += 1;
      let interest = Math.min(WAVE_INTEREST_CAP, Math.floor(state.gold * WAVE_INTEREST_RATE));
      if (doubleBan) {
        bonus = Math.floor(bonus * 2);
        interest = Math.floor(interest * 2);
      }
      state.gold += bonus + interest;
      state.score += state.wave * 70;
      const payoutLabel = doubleBan ? `DOUBLE BAN +${bonus + interest}🍌` : `WAVE CLEAR +${bonus + interest}🍌`;
      addFloatText(W / 2, 50, payoutLabel, "#fbdd11", true);
      AudioFX.waveClear();
      showMeme(MEMES[(Math.random() * MEMES.length) | 0]);
      popStat(el.statGold);
      checkAchievements();
      updateHUD();
      if (state.mode === "campaign" && state.wave >= CAMPAIGN_WAVES) {
        endGame(true);
      }
    }
  }

  function update(dt) {
    if (state.phase !== "playing") {
      state.animTime += dt;
      updateFX(dt * 0.4);
      return;
    }
    if (state.hitstop > 0) {
      state.hitstop -= dt;
      updateFX(dt);
      return;
    }
    const scaled = dt * state.speed;
    state.animTime += scaled;
    updateSpawning(scaled);
    updateEnemies(scaled);
    updateTowers(scaled);
    updateProjectiles(scaled);
    updateFX(scaled);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0c1a0a");
    g.addColorStop(0.5, "#142410");
    g.addColorStop(1, "#0a1608");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      ctx.globalAlpha = (0.3 + Math.sin(state.animTime * 2 + s.tw) * 0.25) * s.z;
      ctx.fillStyle = "#d4e8a0";
      ctx.fillRect(s.x, s.y, s.z * 1.5, s.z * 1.5);
    }
    ctx.globalAlpha = 1;

    // warm yellow haze
    const ng = ctx.createRadialGradient(W * 0.7, H * 0.2, 10, W * 0.7, H * 0.2, 250);
    ng.addColorStop(0, "rgba(251,221,17,0.06)");
    ng.addColorStop(1, "transparent");
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTiles() {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        if (pathSet.has(`${tx},${ty}`)) continue;
        const parity = (tx + ty) & 1;
        ctx.fillStyle = parity ? "#1a3014" : "#162a12";
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        if ((tx * 13 + ty * 7) % 6 === 0) {
          ctx.fillStyle = "rgba(80, 160, 50, 0.2)";
          ctx.beginPath();
          ctx.ellipse(tx * TILE + 20, ty * TILE + 22, 6, 3, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        // tiny bananas on some tiles
        if ((tx * 19 + ty * 11) % 23 === 0) {
          ctx.globalAlpha = 0.15;
          ctx.font = "12px serif";
          ctx.fillText("🍌", tx * TILE + 12, ty * TILE + 24);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function drawPath() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // banana-yellow path glow
    ctx.strokeStyle = "rgba(251, 221, 17, 0.25)";
    ctx.lineWidth = TILE * 1.05;
    ctx.shadowColor = "rgba(251, 221, 17, 0.4)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(pathPixels[0].x, pathPixels[0].y);
    for (let i = 1; i < pathPixels.length; i++) ctx.lineTo(pathPixels[i].x, pathPixels[i].y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#c4a010";
    ctx.lineWidth = TILE * 0.82;
    ctx.stroke();

    ctx.strokeStyle = "#e8c820";
    ctx.lineWidth = TILE * 0.62;
    ctx.stroke();

    // peel texture dashes
    ctx.setLineDash([12, 14]);
    ctx.lineDashOffset = -state.animTime * 35;
    ctx.strokeStyle = "rgba(80, 60, 0, 0.25)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    // path corner markers (readability)
    for (let i = 1; i < pathPixels.length - 1; i++) {
      const p = pathPixels[i];
      ctx.fillStyle = "rgba(60, 45, 0, 0.35)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(251, 221, 17, 0.55)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const start = pathPixels[0];
    const end = pathPixels[pathPixels.length - 1];
    const pulse = 1 + Math.sin(state.animTime * 4) * 0.1;

    // spawn
    ctx.font = `${28 * pulse}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🍌", start.x, start.y);

    // wallet core
    const cp = 1 + Math.sin(state.animTime * 3) * 0.1;
    ctx.save();
    ctx.shadowColor = "#fbdd11";
    ctx.shadowBlur = 20;
    ctx.font = `${32 * cp}px serif`;
    ctx.fillText("🐵", end.x, end.y);
    ctx.shadowBlur = 0;
    ctx.font = "bold 9px Fredoka, sans-serif";
    ctx.fillStyle = "#fbdd11";
    ctx.fillText("WALLET", end.x, end.y + 22);
    ctx.restore();
  }

  function drawTowerShape(x, y, type, level, angle, recoil, muzzle) {
    const def = TOWER_DEFS[type];
    const r = 13 + (level - 1) * 2.5;
    const rec = recoil * 4;

    ctx.fillStyle = "rgba(20, 35, 12, 0.9)";
    ctx.beginPath();
    ctx.arc(x, y, r + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(def.color, 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();

    if (level > 1) {
      ctx.strokeStyle = rgba("#fbdd11", 0.6);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r + 9, -Math.PI / 2, -Math.PI / 2 + (level / 3) * Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = rgba(def.color, 0.2);
    ctx.beginPath();
    ctx.arc(x, y, r + 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // emoji core
    ctx.font = `${r + 4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.icon, x, y + 1);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-rec, 0);
    ctx.fillStyle = def.color;
    if (type !== "tesla" && type !== "monkey") {
      ctx.fillRect(r * 0.3, -3, r * 0.7 + 6, 6);
    }
    if (muzzle > 0) {
      ctx.globalAlpha = muzzle * 8;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(r + 8, 0, 5 + muzzle * 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (level > 1) {
      for (let i = 0; i < level; i++) {
        ctx.fillStyle = "#fbdd11";
        ctx.beginPath();
        ctx.arc(x - 7 + i * 7, y + r + 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawTowers() {
    for (const t of state.towers) {
      if (meta.settings?.showAllRanges && state.selectedTower !== t) {
        ctx.strokeStyle = rgba(TOWER_DEFS[t.type].color, 0.1);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, towerEffectiveRange(t), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (state.selectedTower === t) {
        ctx.strokeStyle = rgba(TOWER_DEFS[t.type].color, 0.3);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -state.animTime * 20;
        ctx.beginPath();
        ctx.arc(t.x, t.y, towerEffectiveRange(t), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // rage aura
      if (state.rageTimer > 0) {
        ctx.strokeStyle = rgba("#ff6b35", 0.3 + Math.sin(state.animTime * 8) * 0.15);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawTowerShape(t.x, t.y, t.type, t.level, t.angle, t.recoil, t.muzzle);
    }
  }

  function drawEnemies() {
    for (const e of state.enemies) {
      if (e.type === "boss") {
        const phaseCfg = BOSS_PHASE_CFG[e.bossPhase || 1];
        const pulse = 1 + Math.sin(state.animTime * 5) * 0.12;
        const phaseColor = phaseCfg.color;
        if (e.rugTelegraph > 0) {
          const t = 1 - e.rugTelegraph / BOSS_PHASE_CFG[3].telegraph;
          const teleR = e.radius + 12 + t * 42;
          ctx.strokeStyle = rgba("#ff5c6a", 0.25 + t * 0.45);
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(e.x, e.y, teleR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.strokeStyle = rgba(phaseColor, 0.35 + Math.sin(state.animTime * 5) * 0.2);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 16 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = "bold 9px Fredoka, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = phaseColor;
        ctx.shadowColor = phaseColor;
        ctx.shadowBlur = 8;
        ctx.fillText("RUGPULL", e.x, e.y - e.radius - 26);
        ctx.font = "bold 8px Orbitron, sans-serif";
        ctx.fillStyle = e.rugTelegraph > 0 ? "#ff5c6a" : phaseColor;
        ctx.fillText(`${phaseCfg.label} · ${phaseCfg.name.toUpperCase()}`, e.x, e.y - e.radius - 16);
        ctx.shadowBlur = 0;
      }
      ctx.save();
      if (e.healRate > 0) {
        ctx.strokeStyle = rgba("#ffb347", 0.25);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.healRange * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (e.slowTimer > 0) {
        ctx.fillStyle = "rgba(126, 200, 227, 0.2)";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.translate(e.x, e.y);
      const flashW = e.hitFlash > 0;
      ctx.fillStyle = flashW ? "#ffffff" : e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = e.type === "boss" ? 18 : 8;

      if (e.type === "bear" || e.type === "whale" || e.type === "boss") {
        const s = e.radius;
        ctx.rotate(state.animTime * (e.type === "boss" ? 0.5 : 0.25));
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const px = Math.cos(a) * s, py = Math.sin(a) * s;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else if (e.type === "fud" || e.type === "bot") {
        ctx.rotate(Math.sin(e.wobble) * 0.2);
        ctx.beginPath();
        ctx.moveTo(0, -e.radius);
        ctx.lineTo(e.radius, e.radius * 0.7);
        ctx.lineTo(-e.radius, e.radius * 0.7);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // face / label
      if (e.type === "boss") {
        ctx.font = "16px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💀", 0, 1);
      } else if (e.type === "whale") {
        ctx.font = "14px serif";
        ctx.textAlign = "center";
        ctx.fillText("🐋", 0, 1);
      } else if (e.type === "paper") {
        ctx.font = "11px serif";
        ctx.textAlign = "center";
        ctx.fillText("📄", 0, 1);
      } else if (e.type === "tick") {
        ctx.font = "12px serif";
        ctx.textAlign = "center";
        ctx.fillText("⛽", 0, 1);
      } else if (e.type === "hodler") {
        ctx.font = "12px serif";
        ctx.textAlign = "center";
        ctx.fillText("💎", 0, 1);
        if (e.regenUsed) {
          ctx.strokeStyle = rgba("#88d4ff", 0.5);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();

      // hp
      const barW = Math.max(22, e.radius * 2.4);
      const pct = clamp(e.hp / e.maxHp, 0, 1);
      const bx = e.x - barW / 2, by = e.y - e.radius - 12;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(bx - 1, by - 1, barW + 2, 6);
      ctx.fillStyle = pct > 0.5 ? "#5dde7a" : pct > 0.25 ? "#fbdd11" : "#ff5c6a";
      ctx.fillRect(bx, by, barW * pct, 4);
      if (e.type === "boss" || e.type === "whale" || e.type === "hodler") {
        ctx.font = "bold 8px Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "rgba(255, 248, 220, 0.92)";
        ctx.fillText(`${Math.ceil(e.hp)}`, e.x, by - 2);
      }
    }
  }

  function drawProjectiles() {
    for (const p of state.projectiles) {
      for (const tr of p.trail) {
        if (tr.life <= 0) continue;
        ctx.globalAlpha = (tr.life / 0.2) * 0.45;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, p.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.font = `${p.radius * 3}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (p.type === "cannon" || p.type === "monkey") {
        ctx.fillText("🍌", p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  function drawBeamsAndChains() {
    for (const b of state.beams) {
      if (b.delay > 0) continue;
      const a = clamp(b.life / 0.15, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = (b.width || 3) * a;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = (b.width || 3) * 0.3 * a;
      ctx.shadowBlur = 0;
      ctx.stroke();
      ctx.restore();
    }
    for (const c of state.chains) {
      const a = clamp(c.life / 0.18, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(c.x1, c.y1);
      for (let i = 1; i < 5; i++) {
        const t = i / 5;
        const j = c.jitter ? c.jitter[i - 1] : { jx: 0, jy: 0 };
        ctx.lineTo(lerp(c.x1, c.x2, t) + j.jx, lerp(c.y1, c.y2, t) + j.jy);
      }
      ctx.lineTo(c.x2, c.y2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      ctx.globalAlpha = clamp(p.life / (p.maxLife * 0.5), 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const peel of state.peels) {
      ctx.save();
      ctx.globalAlpha = clamp(peel.life / 0.4, 0, 1);
      ctx.translate(peel.x, peel.y);
      ctx.rotate(peel.rot);
      ctx.font = `${peel.size}px serif`;
      ctx.textAlign = "center";
      ctx.fillText("🍌", 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    for (const r of state.rings) {
      ctx.globalAlpha = clamp(r.life / r.maxLife, 0, 1) * 0.85;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width * (r.life / r.maxLife);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const s of state.shocks) {
      ctx.globalAlpha = (s.life / s.maxLife) * 0.35;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (1.3 - s.life / s.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    for (const f of state.floatTexts) {
      ctx.globalAlpha = clamp(f.life / 0.4, 0, 1);
      ctx.fillStyle = f.color;
      ctx.font = f.big ? "bold 15px Fredoka, sans-serif" : "bold 13px Nunito, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(f.text, f.x, f.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  function drawPlacementPreview() {
    if (state.abilityAiming && state.phase === "playing") {
      const { x, y } = state.mouse;
      ctx.strokeStyle = "rgba(251, 221, 17, 0.7)";
      ctx.fillStyle = "rgba(251, 221, 17, 0.12)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(x, y, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "28px serif";
      ctx.textAlign = "center";
      ctx.fillText("🍌", x, y);
      return;
    }
    if (!state.selectedShop || !state.hoverTile || state.phase !== "playing") return;
    const { tx, ty } = state.hoverTile;
    const def = TOWER_DEFS[state.selectedShop];
    const c = tileCenter(tx, ty);
    const placeOk = canPlace(tx, ty);
    const afford = state.gold >= def.cost;
    const ok = placeOk && afford;
    const tileFill = !placeOk
      ? "rgba(255, 92, 106, 0.28)"
      : !afford
        ? "rgba(251, 221, 17, 0.22)"
        : "rgba(93, 222, 122, 0.22)";
    const tileStroke = !placeOk
      ? "rgba(255, 92, 106, 0.6)"
      : !afford
        ? "rgba(251, 221, 17, 0.55)"
        : "rgba(93, 222, 122, 0.55)";
    ctx.fillStyle = tileFill;
    ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    ctx.strokeStyle = tileStroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(tx * TILE + 1, ty * TILE + 1, TILE - 2, TILE - 2);
    ctx.strokeStyle = ok ? "rgba(93, 222, 122, 0.45)" : "rgba(255, 255, 255, 0.2)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(c.x, c.y, effectiveRangeFromBase(def.range), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.75;
    drawTowerShape(c.x, c.y, state.selectedShop, 1, 0, 0, 0);
    ctx.globalAlpha = 1;
    ctx.font = "bold 11px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = afford ? "#5dde7a" : "#ff5c6a";
    ctx.fillText(`🍌${def.cost}`, c.x, c.y + 14);
    if (!ok) {
      const hint = !placeOk
        ? (pathSet.has(`${tx},${ty}`) ? "BAN path" : tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS ? "Off map" : "Occupied")
        : "Need BAN";
      ctx.font = "bold 9px Nunito, sans-serif";
      ctx.fillStyle = !placeOk ? "#ff9aaa" : "#fbdd11";
      ctx.fillText(hint, c.x, c.y - 16);
    } else if (state.waveEvent?.id === "fog" && state.waveEventTimer > 0) {
      ctx.font = "bold 8px Nunito, sans-serif";
      ctx.fillStyle = "#7ec8e3";
      ctx.fillText("🌫 fog range", c.x, c.y - 16);
    }
  }

  function drawVignetteAndFlash() {
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    if (state.flash > 0) {
      ctx.globalAlpha = state.flash * 0.4;
      ctx.fillStyle = state.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    if (state.rageTimer > 0) {
      ctx.globalAlpha = 0.08 + Math.sin(state.animTime * 10) * 0.04;
      ctx.fillStyle = "#ff6b35";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    if (state.waveEvent?.id === "fog" && state.waveEventTimer > 0) {
      ctx.globalAlpha = 0.1 + (state.waveEventTimer / (state.waveEvent.fogDuration || 14)) * 0.08;
      const fg = ctx.createLinearGradient(0, 0, 0, H);
      fg.addColorStop(0, "rgba(126, 200, 227, 0.15)");
      fg.addColorStop(0.5, "rgba(80, 120, 140, 0.2)");
      fg.addColorStop(1, "rgba(126, 200, 227, 0.12)");
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  function render() {
    ctx.save();
    ctx.translate(state.shakeX, state.shakeY);
    drawBackground();
    drawTiles();
    drawPath();
    drawTowers();
    drawEnemies();
    drawProjectiles();
    drawBeamsAndChains();
    drawParticles();
    drawPlacementPreview();
    drawVignetteAndFlash();
    drawDebugOverlay();
    ctx.restore();
  }

  // ── Debug overlay (settings.showDebug) ─────────────────────────────────────

  const debug = { fps: 0, acc: 0, frames: 0 };

  function countEntities() {
    return state.towers.length + state.enemies.length + state.projectiles.length
      + state.particles.length + state.peels.length + state.floatTexts.length
      + state.beams.length + state.chains.length;
  }

  function tickDebug(dt) {
    if (!meta.settings?.showDebug) return;
    debug.acc += dt;
    debug.frames += 1;
    if (debug.acc >= 0.5) {
      debug.fps = Math.round(debug.frames / debug.acc);
      debug.acc = 0;
      debug.frames = 0;
    }
  }

  function drawDebugOverlay() {
    if (!meta.settings?.showDebug || state.phase === "menu") return;
    const lines = [
      `FPS ${debug.fps}`,
      `${state.phase} · ×${state.speed} · wave ${state.wave}`,
      `towers ${state.towers.length} · enemies ${state.enemies.length}`,
      `proj ${state.projectiles.length} · particles ${state.particles.length}`,
      `entities ~${countEntities()}`,
    ];
    ctx.save();
    ctx.fillStyle = "rgba(8, 14, 6, 0.78)";
    ctx.fillRect(6, 6, 175, 10 + lines.length * 14);
    ctx.font = "10px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "#9effc4";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    lines.forEach((line, i) => ctx.fillText(line, 10, 10 + i * 14));
    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT
  // ═══════════════════════════════════════════════════════════════════════════

  function canvasPos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (canvas.width / rect.width),
      y: (evt.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener("mousemove", (evt) => {
    const p = canvasPos(evt);
    state.mouse = p;
    state.hoverTile = { tx: Math.floor(p.x / TILE), ty: Math.floor(p.y / TILE) };
  });
  canvas.addEventListener("mouseleave", () => { state.hoverTile = null; });

  canvas.addEventListener("click", (evt) => {
    if (state.phase !== "playing") return;
    const p = canvasPos(evt);
    if (state.abilityAiming) { fireAirdrop(p.x, p.y); return; }
    for (const t of state.towers) {
      if (dist(p.x, p.y, t.x, t.y) <= TOWER_SELECT_RADIUS + (t.level - 1) * 2) {
        state.selectedTower = t;
        state.selectedShop = null;
        const tdef = TOWER_DEFS[t.type];
        spawnRing(t.x, t.y, tdef.color, 34, 0.28);
        AudioFX.ui();
        updateShopUI();
        updateSelectedUI();
        return;
      }
    }
    if (state.selectedShop) {
      placeTower(Math.floor(p.x / TILE), Math.floor(p.y / TILE));
      return;
    }
    state.selectedTower = null;
    updateSelectedUI();
  });

  canvas.addEventListener("contextmenu", (evt) => {
    evt.preventDefault();
    state.selectedShop = null;
    state.selectedTower = null;
    state.abilityAiming = false;
    updateShopUI();
    updateSelectedUI();
    updateAbilityUI();
  });

  function cycleSpeed() {
    if (state.phase !== "playing" && state.phase !== "paused") return;
    state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 3 : 1;
    AudioFX.ui();
    showGameToast(`Speed ×${state.speed}`, "info");
    updateHUD();
  }

  function togglePause() {
    if (state.phase === "playing") {
      state.phase = "paused";
      el.overlayPause.classList.remove("hidden");
      AudioFX.ui();
    } else if (state.phase === "paused") {
      state.phase = "playing";
      el.overlayPause.classList.add("hidden");
      AudioFX.ui();
    }
    updateHUD();
  }

  function beginAirdropAim() {
    if (state.phase !== "playing" || state.airdropCd > 0) return;
    state.abilityAiming = !state.abilityAiming;
    state.selectedShop = null;
    state.selectedTower = null;
    updateShopUI();
    updateSelectedUI();
    updateAbilityUI();
    AudioFX.ui();
    if (state.abilityAiming) showGameToast("Click the jungle to drop · Esc to cancel", "info");
  }

  function openAchs() {
    renderAchList();
    el.overlayAchs.classList.remove("hidden");
    AudioFX.ui();
  }

  function closeAchs() {
    el.overlayAchs.classList.add("hidden");
    AudioFX.ui();
  }

  function syncSettingsUI() {
    ensureSettings();
    if (el.optShowRanges) el.optShowRanges.checked = meta.settings.showAllRanges;
    if (el.optReduceParticles) el.optReduceParticles.checked = meta.settings.reduceParticles;
    if (el.optShowDebug) el.optShowDebug.checked = meta.settings.showDebug;
    if (el.optVolume) el.optVolume.value = String(Math.round(meta.settings.volume * 100));
  }

  function onSettingChange() {
    ensureSettings();
    if (el.optShowRanges) meta.settings.showAllRanges = el.optShowRanges.checked;
    if (el.optReduceParticles) meta.settings.reduceParticles = el.optReduceParticles.checked;
    if (el.optShowDebug) meta.settings.showDebug = el.optShowDebug.checked;
    if (el.optVolume) {
      meta.settings.volume = clamp(Number(el.optVolume.value) / 100, 0.05, 0.55);
      AudioFX.setVolume(meta.settings.volume);
    }
    saveMeta();
    AudioFX.ui();
  }

  function openHotkeys() {
    if (el.overlayHotkeys) el.overlayHotkeys.classList.remove("hidden");
    AudioFX.ui();
  }

  function closeHotkeys() {
    if (el.overlayHotkeys) el.overlayHotkeys.classList.add("hidden");
    AudioFX.ui();
  }

  function goMenu() {
    state.phase = "menu";
    AudioFX.stopAmbient();
    el.overlayEnd.classList.add("hidden");
    el.overlayPause.classList.add("hidden");
    if (el.overlayHotkeys) el.overlayHotkeys.classList.add("hidden");
    el.overlayStart.classList.remove("hidden");
    updateMetaUI();
  }

  window.addEventListener("keydown", (evt) => {
    const k = evt.key.toLowerCase();
    if (k === "escape") {
      if (el.overlayHotkeys && !el.overlayHotkeys.classList.contains("hidden")) { closeHotkeys(); return; }
      if (!el.overlayAchs.classList.contains("hidden")) { closeAchs(); return; }
      if (state.abilityAiming) { state.abilityAiming = false; updateAbilityUI(); return; }
      const hadSelection = !!(state.selectedShop || state.selectedTower);
      state.selectedShop = null;
      state.selectedTower = null;
      updateShopUI();
      updateSelectedUI();
      if (!hadSelection && (state.phase === "playing" || state.phase === "paused")) togglePause();
    }
    if (k === " ") {
      evt.preventDefault();
      if (state.phase === "paused") togglePause();
      else if (state.phase === "playing") startWave();
    }
    if (k === "q") beginAirdropAim();
    if (k === "e") activateRage();
    if (k === "m") {
      AudioFX.toggleMute();
      syncMuteUI();
    }
    if ((k === "+" || k === "=" || k === "]") && (state.phase === "playing" || state.phase === "paused")) {
      cycleSpeed();
    }
    if ((k === "?" || k === "h") && (state.phase === "playing" || state.phase === "paused")) {
      openHotkeys();
    }
    const num = parseInt(evt.key, 10);
    if (num >= 1 && num <= TOWER_SHOP_KEYS.length && (state.phase === "playing" || state.phase === "paused")) {
      selectShopTower(TOWER_SHOP_KEYS[num - 1], { fromKey: true });
    }
  });

  // Mode select
  el.modeCampaign.addEventListener("click", () => {
    state.mode = "campaign";
    el.modeCampaign.classList.add("selected");
    el.modeEndless.classList.remove("selected");
    AudioFX.ui();
  });
  el.modeEndless.addEventListener("click", () => {
    state.mode = "endless";
    el.modeEndless.classList.add("selected");
    el.modeCampaign.classList.remove("selected");
    AudioFX.ui();
  });

  el.btnPlay.addEventListener("click", () => { AudioFX.ui(); resetGame(); });
  el.btnRestart.addEventListener("click", () => { AudioFX.ui(); resetGame(); });
  el.btnEndMenu.addEventListener("click", () => { AudioFX.ui(); goMenu(); });
  el.btnResume.addEventListener("click", () => togglePause());
  el.btnPause.addEventListener("click", () => {
    if (state.phase === "playing" || state.phase === "paused") togglePause();
  });
  el.btnStartWave.addEventListener("click", () => { AudioFX.ui(); startWave(); });
  el.btnSpeed.addEventListener("click", () => cycleSpeed());
  el.btnAbility.addEventListener("click", () => beginAirdropAim());
  el.btnAbility2.addEventListener("click", () => activateRage());
  el.btnMute.addEventListener("click", () => {
    AudioFX.toggleMute();
    syncMuteUI();
  });
  el.btnAchs.addEventListener("click", openAchs);
  el.btnOpenAchs.addEventListener("click", openAchs);
  el.btnCloseAchs.addEventListener("click", closeAchs);
  if (el.optShowRanges) el.optShowRanges.addEventListener("change", onSettingChange);
  if (el.optReduceParticles) el.optReduceParticles.addEventListener("change", onSettingChange);
  if (el.optShowDebug) el.optShowDebug.addEventListener("change", onSettingChange);
  if (el.optVolume) el.optVolume.addEventListener("input", onSettingChange);
  if (el.btnHotkeys) el.btnHotkeys.addEventListener("click", openHotkeys);
  if (el.btnCloseHotkeys) el.btnCloseHotkeys.addEventListener("click", closeHotkeys);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOOP
  // ═══════════════════════════════════════════════════════════════════════════

  let last = performance.now();
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    tickDebug(dt);
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function syncMuteUI() {
    if (el.btnMute) el.btnMute.textContent = AudioFX.isMuted() ? "🔇" : "🔊";
  }

  buildShop();
  syncSettingsUI();
  AudioFX.syncMutedFromSettings();
  AudioFX.setVolume(meta.settings.volume);
  syncMuteUI();
  updateHUD();
  updateSelectedUI();
  updateMetaUI();
  requestAnimationFrame(frame);
})();
