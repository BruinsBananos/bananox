(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════
  // MEGA POTASSIUM TOWER — Banano Icy Tower
  // Slippery peels · combos · coins · FUD hazards
  // ═══════════════════════════════════════════════════════════

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d", { alpha: false });
  var W = 420, H = 720;
  canvas.width = W;
  canvas.height = H;

  var hud = document.getElementById("hud");
  var hudH = document.getElementById("hudH");
  var hudScore = document.getElementById("hudScore");
  var hudCoins = document.getElementById("hudCoins");
  var comboEl = document.getElementById("comboEl");
  var menuOv = document.getElementById("menuOv");
  var howOv = document.getElementById("howOv");
  var scoresOv = document.getElementById("scoresOv");
  var pauseOv = document.getElementById("pauseOv");
  var overOv = document.getElementById("overOv");
  var scoresBox = document.getElementById("scoresBox");

  var STORAGE_KEY = "bx-potassium-tower-v1";

  // Physics
  var GRAVITY = 2100;
  var JUMP_V = -720;
  var JUMP_HOLD_BONUS = -380; // applied while holding early jump
  var MOVE_ACCEL = 3400;
  var AIR_ACCEL = 2800;
  var MAX_RUN = 340;
  var ICE_FRICTION = 0.965;   // closer to 1 = slipperier
  var AIR_DRAG = 0.995;
  var WALL_SLIDE = 140;
  var WALL_JUMP_X = 380;
  var WALL_JUMP_Y = -680;
  var COYOTE = 0.11;
  var JUMP_BUF = 0.13;
  var MAX_FALL = 1100;
  var PW = 36, PH = 42;
  var PLAT_H = 16;

  // State
  var state = "menu"; // menu | play | pause | over
  var player = { x: 0, y: 0, vx: 0, vy: 0, facing: 1, squish: 1, stretch: 1 };
  var plats = [];
  var coins = [];
  var powers = [];
  var hazards = [];
  var particles = [];
  var floats = [];
  var snow = [];
  var camY = 0;
  var camShake = 0;
  var maxHeight = 0;
  var score = 0;
  var coinsGot = 0;
  var combo = 0;
  var bestCombo = 0;
  var comboTimer = 0;
  var comboFlash = 0;
  var lastTs = 0;
  var animT = 0;
  var grounded = false;
  var groundPlat = null;
  var coyoteT = 0;
  var jumpBuf = 0;
  var jumpHeld = false;
  var jumpHoldT = 0;
  var onWall = 0; // -1 left +1 right
  var wallCoyote = 0;
  var nextPlatY = 0;
  var startY = 0;
  var shieldT = 0;
  var superJumpT = 0;
  var floatT = 0;
  var magnetT = 0;
  var speedT = 0;
  var invulnT = 0;
  var flash = 0;
  var runFrame = 0;
  var dead = false;

  // Input
  var keyL = false, keyR = false, keyJ = false, jumpPressed = false;

  // Audio
  var actx = null;
  function ensureAudio() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (actx && actx.state === "suspended") actx.resume();
  }
  function beep(f, d, type, v, slide) {
    if (!actx) return;
    var t0 = actx.currentTime;
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + d);
    g.gain.setValueAtTime(v || 0.05, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g); g.connect(actx.destination);
    o.start(t0); o.stop(t0 + d + 0.02);
  }
  function sfxJump(c) {
    beep(360 + c * 20, 0.06, "square", 0.05, 220);
    if (c >= 3) beep(600 + c * 30, 0.08, "triangle", 0.035);
  }
  function sfxLand(c) {
    beep(180 + Math.min(c, 10) * 15, 0.04, "triangle", 0.04);
  }
  function sfxCoin() { beep(980, 0.04, "square", 0.03); beep(1320, 0.06, "square", 0.022); }
  function sfxPower() { beep(440, 0.05, "sine", 0.05); beep(700, 0.1, "triangle", 0.04); }
  function sfxCombo(n) { beep(500 + n * 40, 0.07, "square", 0.04); beep(800 + n * 50, 0.1, "sine", 0.03); }
  function sfxDie() { beep(200, 0.25, "sawtooth", 0.06, 50); }
  function sfxWall() { beep(280, 0.05, "triangle", 0.035, 400); }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function irand(a, b) { return (a + Math.random() * (b - a + 1)) | 0; }

  // ── High scores ──
  function loadScores() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { bestScore: 0, bestHeight: 0, bestCombo: 0, runs: [] };
      return JSON.parse(raw);
    } catch (e) {
      return { bestScore: 0, bestHeight: 0, bestCombo: 0, runs: [] };
    }
  }
  function saveRun(s, h, c) {
    var data = loadScores();
    data.bestScore = Math.max(data.bestScore || 0, s);
    data.bestHeight = Math.max(data.bestHeight || 0, h);
    data.bestCombo = Math.max(data.bestCombo || 0, c);
    data.runs = data.runs || [];
    data.runs.unshift({ s: s, h: h, c: c, t: Date.now() });
    data.runs = data.runs.slice(0, 8);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    return data;
  }
  function renderScores() {
    var d = loadScores();
    if (!d.bestScore && !d.runs.length) {
      scoresBox.innerHTML = "No climbs yet — go be legendary.";
      return;
    }
    var html = "<div><strong>Best score:</strong> " + d.bestScore + "</div>";
    html += "<div><strong>Best height:</strong> " + d.bestHeight + "m</div>";
    html += "<div><strong>Best combo:</strong> x" + d.bestCombo + "</div>";
    if (d.runs && d.runs.length) {
      html += "<br><strong>Recent runs</strong><br>";
      for (var i = 0; i < Math.min(5, d.runs.length); i++) {
        var r = d.runs[i];
        html += (i + 1) + ". " + r.s + " pts · " + r.h + "m · x" + r.c + "<br>";
      }
    }
    scoresBox.innerHTML = html;
  }

  // ── Particles ──
  function burst(x, y, color, n, kind) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 160;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.25 + Math.random() * 0.4, age: 0,
        color: color, size: 2 + Math.random() * 3,
        kind: kind || "spark"
      });
    }
  }
  function floatTxt(x, y, text, color, size) {
    floats.push({ x: x, y: y, text: text, color: color || "#f5d041", size: size || 14, life: 0.8, age: 0 });
  }

  function initSnow() {
    snow = [];
    for (var i = 0; i < 40; i++) {
      snow.push({
        x: Math.random() * W,
        y: Math.random() * H,
        s: 1 + Math.random() * 2,
        sp: 20 + Math.random() * 40,
        ph: Math.random() * Math.PI * 2
      });
    }
  }

  // ── Platforms ──
  function platTypeForHeight(h) {
    var r = Math.random();
    if (h < 40) return r < 0.15 ? "peel" : "ice";
    if (h < 120) {
      if (r < 0.12) return "crumble";
      if (r < 0.22) return "peel";
      if (r < 0.3) return "block";
      if (r < 0.36) return "spring";
      return "ice";
    }
    if (h < 250) {
      if (r < 0.18) return "crumble";
      if (r < 0.32) return "move";
      if (r < 0.42) return "peel";
      if (r < 0.5) return "spring";
      if (r < 0.58) return "block";
      return "ice";
    }
    if (r < 0.22) return "crumble";
    if (r < 0.4) return "move";
    if (r < 0.52) return "peel";
    if (r < 0.62) return "spring";
    if (r < 0.72) return "block";
    return "ice";
  }

  function makePlat(y, forcedX, forcedW, type) {
    var hMeters = Math.max(0, (startY - y) / 40);
    var gapScale = 1 + Math.min(1.4, hMeters / 280);
    var wMin = Math.max(48, 92 - hMeters * 0.12);
    var wMax = Math.max(wMin + 10, 140 - hMeters * 0.15);
    var w = forcedW || rand(wMin, wMax);
    var margin = 12;
    var x = forcedX != null ? forcedX : rand(margin, W - w - margin);
    type = type || platTypeForHeight(hMeters);
    var p = {
      x: x, y: y, w: w, h: PLAT_H,
      type: type,
      vx: type === "move" ? (Math.random() < 0.5 ? -1 : 1) * rand(40, 90) * gapScale : 0,
      x0: x, range: type === "move" ? rand(30, 70) : 0,
      crumble: type === "crumble" ? 0 : -1, // -1 = solid, 0+ = timer
      broken: false,
      spike: hMeters > 80 && Math.random() < 0.08 + Math.min(0.12, hMeters / 800),
      phase: Math.random() * Math.PI * 2
    };
    return p;
  }

  function spawnRow(y) {
    var hMeters = Math.max(0, (startY - y) / 40);
    var p = makePlat(y);
    plats.push(p);

    // occasional second small platform
    if (hMeters > 30 && Math.random() < 0.18) {
      var w2 = rand(50, 80);
      var x2 = clamp(p.x + rand(-120, 120), 10, W - w2 - 10);
      plats.push(makePlat(y - rand(8, 20), x2, w2, Math.random() < 0.3 ? "peel" : "ice"));
    }

    // coins
    if (Math.random() < 0.55) {
      var cn = 1 + (Math.random() < 0.3 ? 1 : 0) + (Math.random() < 0.1 ? 1 : 0);
      for (var i = 0; i < cn; i++) {
        coins.push({
          x: p.x + p.w * (0.25 + 0.5 * Math.random()),
          y: p.y - 22 - i * 16,
          r: 9, got: false, phase: Math.random() * Math.PI * 2
        });
      }
    }

    // power-up
    if (hMeters > 15 && Math.random() < 0.1 + Math.min(0.08, hMeters / 600)) {
      var kinds = ["jump", "shield", "float", "magnet", "speed"];
      powers.push({
        x: p.x + p.w / 2,
        y: p.y - 28,
        kind: kinds[irand(0, kinds.length - 1)],
        r: 12, got: false, phase: Math.random() * Math.PI * 2
      });
    }
  }

  function seedWorld() {
    plats = []; coins = []; powers = []; hazards = [];
    particles = []; floats = [];
    // floor
    plats.push({ x: 20, y: H - 50, w: W - 40, h: 22, type: "block", vx: 0, x0: 20, range: 0, crumble: -1, broken: false, spike: false, phase: 0 });
    player.x = W / 2 - PW / 2;
    player.y = H - 50 - PH;
    player.vx = 0; player.vy = 0;
    startY = player.y;
    camY = 0;
    nextPlatY = H - 50 - 70;
    for (var i = 0; i < 14; i++) {
      spawnRow(nextPlatY);
      var hMeters = Math.max(0, (startY - nextPlatY) / 40);
      var gap = 58 + Math.min(55, hMeters * 0.18) + rand(-6, 10);
      nextPlatY -= gap;
    }
  }

  function ensurePlats() {
    var top = camY - 40;
    while (nextPlatY > top - H) {
      spawnRow(nextPlatY);
      var hMeters = Math.max(0, (startY - nextPlatY) / 40);
      var gap = 58 + Math.min(58, hMeters * 0.2) + rand(-8, 12);
      nextPlatY -= gap;
    }
    // cull
    var bottom = camY + H + 120;
    plats = plats.filter(function (p) { return p.y < bottom; });
    coins = coins.filter(function (c) { return !c.got && c.y < bottom; });
    powers = powers.filter(function (p) { return !p.got && p.y < bottom; });
    hazards = hazards.filter(function (h) { return h.y < bottom + 40; });
  }

  function spawnSnowball() {
    var hMeters = maxHeight;
    if (hMeters < 60) return;
    if (Math.random() > 0.012 + Math.min(0.025, hMeters / 4000)) return;
    hazards.push({
      kind: "snow",
      x: rand(20, W - 20),
      y: camY - 30,
      vy: rand(120, 220) + hMeters * 0.3,
      r: 11 + Math.random() * 5,
      rot: 0
    });
  }

  // ── Game flow ──
  function showOnly(el) {
    [menuOv, howOv, scoresOv, pauseOv, overOv].forEach(function (o) {
      if (o) o.classList.toggle("hidden", o !== el);
    });
  }

  function startGame() {
    ensureAudio();
    state = "play";
    dead = false;
    maxHeight = 0; score = 0; coinsGot = 0;
    combo = 0; bestCombo = 0; comboTimer = 0; comboFlash = 0;
    shieldT = 0; superJumpT = 0; floatT = 0; magnetT = 0; speedT = 0; invulnT = 0;
    grounded = false; groundPlat = null; coyoteT = 0; jumpBuf = 0;
    onWall = 0; wallCoyote = 0; camShake = 0; flash = 0;
    seedWorld();
    initSnow();
    showOnly(null);
    menuOv.classList.add("hidden");
    howOv.classList.add("hidden");
    scoresOv.classList.add("hidden");
    pauseOv.classList.add("hidden");
    overOv.classList.add("hidden");
    hud.hidden = false;
    comboEl.classList.remove("show");
    updateHud();
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
    dead = false;
    hud.hidden = true;
    showOnly(menuOv);
    comboEl.classList.remove("show");
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
    "", "NICE PEEL!", "POTASSIUM!", "SLICK MOVES!", "CHAIN RAIN!",
    "MEGA K⁺!", "BLOCKCHAIN!", "UNSTOPPABLE!", "STARSHIP CLIMB!", "LEGENDARY!"
  ];

  function endGame() {
    if (dead) return;
    dead = true;
    state = "over";
    sfxDie();
    burst(player.x + PW / 2, player.y + PH / 2, "#f87171", 24, "spark");
    burst(player.x + PW / 2, player.y + PH / 2, "#f5d041", 12, "peel");
    var h = Math.floor(maxHeight);
    var data = saveRun(score, h, bestCombo);
    document.getElementById("endH").textContent = String(h);
    document.getElementById("endScore").textContent = String(score);
    document.getElementById("endCoins").textContent = String(coinsGot);
    document.getElementById("endCombo").textContent = String(bestCombo);
    document.getElementById("overPun").textContent = PUNS[irand(0, PUNS.length - 1)];
    var title = "YEETED OFF THE TOWER 💀";
    if (h >= data.bestHeight && h > 0) title = "NEW HEIGHT RECORD! 👑";
    else if (score >= data.bestScore && score > 0) title = "NEW HIGH SCORE! 🍌";
    document.getElementById("overTitle").textContent = title;
    overOv.classList.remove("hidden");
    hud.hidden = true;
  }

  function updateHud() {
    hudH.textContent = String(Math.floor(maxHeight));
    hudScore.textContent = String(score);
    hudCoins.textContent = String(coinsGot);
  }

  function showCombo() {
    if (combo < 2) {
      comboEl.classList.remove("show");
      return;
    }
    var pun = COMBO_PUNS[Math.min(COMBO_PUNS.length - 1, combo)] || "POTASSIUM!";
    comboEl.innerHTML = "COMBO x" + combo + "<br><span style='font-size:0.75rem;color:#7dd3fc'>" + pun + "</span>";
    comboEl.classList.add("show");
    comboFlash = 0.9;
  }

  // ── Collision ──
  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function tryLand(p, prevY) {
    // Land on top of platform when falling
    if (player.vy < 0) return false;
    if (p.broken) return false;
    var feet = player.y + PH;
    var prevFeet = prevY + PH;
    if (prevFeet > p.y + 4) return false;
    if (feet < p.y - 2 || feet > p.y + p.h + 8) return false;
    if (player.x + PW < p.x + 4 || player.x > p.x + p.w - 4) return false;
    // spike damage
    if (p.spike && invulnT <= 0 && shieldT <= 0) {
      // bounce up but hurt combo
      player.y = p.y - PH;
      player.vy = JUMP_V * 0.55;
      combo = 0; comboTimer = 0; showCombo();
      invulnT = 0.8;
      flash = 0.3;
      burst(player.x + PW / 2, player.y + PH, "#f87171", 10);
      beep(120, 0.1, "sawtooth", 0.04);
      return true;
    }
    if (p.spike && shieldT > 0) {
      // shield eats spike
      p.spike = false;
      burst(p.x + p.w / 2, p.y, "#67e8f9", 12);
    }

    player.y = p.y - PH;
    player.vy = 0;
    grounded = true;
    groundPlat = p;
    coyoteT = COYOTE;
    sfxLand(combo);

    if (p.type === "spring") {
      player.vy = JUMP_V * 1.45;
      grounded = false;
      groundPlat = null;
      burst(player.x + PW / 2, p.y, "#f5d041", 14, "peel");
      floatTxt(player.x + PW / 2, p.y - 10, "BOING!", "#f5d041", 16);
      sfxJump(combo + 2);
      addCombo(true);
      return true;
    }

    if (p.type === "crumble" && p.crumble < 0) p.crumble = 0;

    addCombo(false);
    player.squish = 0.7;
    player.stretch = 1.25;
    burst(player.x + PW / 2, p.y, "#7dd3fc", 6);
    return true;
  }

  function addCombo(spring) {
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    comboTimer = 2.2;
    var bonus = 10 + combo * 8 + (spring ? 20 : 0);
    score += bonus;
    if (combo >= 2) {
      showCombo();
      if (combo % 5 === 0) {
        sfxCombo(combo);
        confetti(player.x + PW / 2, player.y);
        floatTxt(player.x + PW / 2, player.y - 20, COMBO_PUNS[Math.min(9, combo)] || "K⁺!", "#f472b6", 15);
      }
    }
  }

  function confetti(x, y) {
    var cols = ["#f5d041", "#7dd3fc", "#f472b6", "#86efac", "#fb923c"];
    for (var i = 0; i < 22; i++) burst(x, y, cols[i % cols.length], 1);
  }

  // ── Update ──
  function update(dt) {
    animT += dt;
    if (state !== "play") {
      // still animate snow on menus
      updateSnow(dt);
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

    // timers
    if (shieldT > 0) shieldT -= dt;
    if (superJumpT > 0) superJumpT -= dt;
    if (floatT > 0) floatT -= dt;
    if (magnetT > 0) magnetT -= dt;
    if (speedT > 0) speedT -= dt;
    if (invulnT > 0) invulnT -= dt;

    var prevY = player.y;
    var accel = grounded ? MOVE_ACCEL : AIR_ACCEL;
    if (speedT > 0) accel *= 1.35;

    var maxV = MAX_RUN * (speedT > 0 ? 1.3 : 1);
    if (keyL) { player.vx -= accel * dt; player.facing = -1; }
    if (keyR) { player.vx += accel * dt; player.facing = 1; }
    player.vx = clamp(player.vx, -maxV, maxV);

    if (grounded) {
      if (!keyL && !keyR) player.vx *= Math.pow(ICE_FRICTION, dt * 60);
      // peel = even slipperier
      if (groundPlat && groundPlat.type === "peel") {
        player.vx *= Math.pow(0.99, dt * 60);
      }
      if (groundPlat && groundPlat.type === "block" && !keyL && !keyR) {
        player.vx *= Math.pow(0.88, dt * 60); // grippier
      }
    } else {
      player.vx *= Math.pow(AIR_DRAG, dt * 60);
    }

    // Jump buffer / coyote
    if (jumpPressed) { jumpBuf = JUMP_BUF; jumpPressed = false; }
    if (jumpBuf > 0) jumpBuf -= dt;
    if (coyoteT > 0) coyoteT -= dt;
    if (wallCoyote > 0) wallCoyote -= dt;

    var canJump = grounded || coyoteT > 0;
    if (jumpBuf > 0 && canJump) {
      var jv = JUMP_V * (superJumpT > 0 ? 1.28 : 1);
      player.vy = jv;
      grounded = false;
      groundPlat = null;
      coyoteT = 0;
      jumpBuf = 0;
      jumpHoldT = 0.16;
      player.squish = 1.2;
      player.stretch = 0.75;
      sfxJump(combo);
      burst(player.x + PW / 2, player.y + PH, "#f5d041", 8, "peel");
    } else if (jumpBuf > 0 && (onWall || wallCoyote > 0)) {
      // wall jump
      var dir = onWall || wallCoyoteSide;
      player.vx = -dir * WALL_JUMP_X;
      player.vy = WALL_JUMP_Y * (superJumpT > 0 ? 1.15 : 1);
      player.facing = -dir;
      onWall = 0; wallCoyote = 0; jumpBuf = 0;
      grounded = false; groundPlat = null;
      jumpHoldT = 0.1;
      sfxWall();
      burst(player.x + PW / 2, player.y + PH / 2, "#7dd3fc", 10);
      if (combo >= 1) addCombo(false);
    }

    // variable jump height
    if (jumpHoldT > 0 && jumpHeld && player.vy < 0) {
      player.vy += JUMP_HOLD_BONUS * dt;
      jumpHoldT -= dt;
    } else {
      jumpHoldT = 0;
    }

    // gravity
    var g = GRAVITY;
    if (floatT > 0 && player.vy > 0) g *= 0.35;
    if (onWall && player.vy > 0) {
      player.vy = Math.min(player.vy + g * dt * 0.4, WALL_SLIDE);
    } else {
      player.vy += g * dt;
    }
    player.vy = Math.min(player.vy, MAX_FALL * (floatT > 0 ? 0.45 : 1));

    // integrate
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // walls of tower
    onWall = 0;
    if (player.x < 8) {
      player.x = 8;
      if (player.vx < 0) player.vx = 0;
      if (!grounded && player.vy > 50) { onWall = -1; wallCoyote = 0.12; wallCoyoteSide = -1; }
    }
    if (player.x + PW > W - 8) {
      player.x = W - 8 - PW;
      if (player.vx > 0) player.vx = 0;
      if (!grounded && player.vy > 50) { onWall = 1; wallCoyote = 0.12; wallCoyoteSide = 1; }
    }

    // platform collision
    grounded = false;
    groundPlat = null;
    for (var i = 0; i < plats.length; i++) {
      var p = plats[i];
      if (p.broken) continue;
      // move platforms
      if (p.type === "move") {
        p.x += p.vx * dt;
        if (p.x < p.x0 - p.range || p.x > p.x0 + p.range) p.vx *= -1;
      }
      // crumble
      if (p.crumble >= 0) {
        p.crumble += dt;
        if (p.crumble > 0.55) {
          p.broken = true;
          burst(p.x + p.w / 2, p.y, "#fbbf24", 14, "peel");
          continue;
        }
      }
      if (tryLand(p, prevY)) {
        // carry move platform velocity
        if (p.type === "move") player.x += p.vx * dt;
      }
    }
    if (grounded) coyoteT = COYOTE;

    // coins
    for (var c = 0; c < coins.length; c++) {
      var coin = coins[c];
      if (coin.got) continue;
      if (magnetT > 0) {
        var dx = (player.x + PW / 2) - coin.x;
        var dy = (player.y + PH / 2) - coin.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < 120) {
          coin.x += (dx / d) * 280 * dt;
          coin.y += (dy / d) * 280 * dt;
        }
      }
      if (rectsOverlap(player.x, player.y, PW, PH, coin.x - coin.r, coin.y - coin.r, coin.r * 2, coin.r * 2)) {
        coin.got = true;
        coinsGot++;
        score += 25 * Math.max(1, Math.floor(combo / 2) + 1);
        sfxCoin();
        burst(coin.x, coin.y, "#f5d041", 8, "peel");
        floatTxt(coin.x, coin.y, "+BAN", "#f5d041", 12);
      }
    }

    // powers
    for (var u = 0; u < powers.length; u++) {
      var pw = powers[u];
      if (pw.got) continue;
      if (rectsOverlap(player.x, player.y, PW, PH, pw.x - pw.r, pw.y - pw.r, pw.r * 2, pw.r * 2)) {
        pw.got = true;
        sfxPower();
        applyPower(pw.kind);
        burst(pw.x, pw.y, "#c084fc", 14);
      }
    }

    // hazards
    spawnSnowball();
    for (var h = hazards.length - 1; h >= 0; h--) {
      var hz = hazards[h];
      hz.y += hz.vy * dt;
      hz.rot += dt * 4;
      if (hz.y > camY + H + 40) { hazards.splice(h, 1); continue; }
      if (invulnT > 0) continue;
      if (rectsOverlap(player.x + 4, player.y + 4, PW - 8, PH - 8, hz.x - hz.r, hz.y - hz.r, hz.r * 2, hz.r * 2)) {
        if (shieldT > 0) {
          shieldT = 0;
          invulnT = 0.6;
          hazards.splice(h, 1);
          burst(hz.x, hz.y, "#67e8f9", 16);
          floatTxt(hz.x, hz.y, "SHIELD!", "#67e8f9", 13);
          continue;
        }
        // knock down
        player.vy = Math.min(player.vy, 200);
        player.vx += (player.x + PW / 2 < hz.x ? -1 : 1) * 200;
        combo = 0; comboTimer = 0; showCombo();
        invulnT = 1;
        flash = 0.35;
        camShake = 0.35;
        hazards.splice(h, 1);
        burst(hz.x, hz.y, "#e0f2fe", 12);
        beep(100, 0.12, "sawtooth", 0.045);
      }
    }

    // height / score
    var height = Math.max(0, (startY - player.y) / 40);
    if (height > maxHeight) {
      var dh = height - maxHeight;
      maxHeight = height;
      score += Math.floor(dh * 10);
    }

    // camera — follow when climbing above mid
    var targetCam = player.y - H * 0.45;
    if (targetCam < camY) camY = targetCam;
    // gentle catch-up only upward
    // death
    if (player.y > camY + H + 20) endGame();

    // squash recover
    player.squish += (1 - player.squish) * Math.min(1, dt * 12);
    player.stretch += (1 - player.stretch) * Math.min(1, dt * 12);
    if (!grounded) runFrame += dt * 10;
    else runFrame += Math.abs(player.vx) * dt * 0.08;

    ensurePlats();
    updateSnow(dt);
    updateFX(dt);
    updateHud();
  }

  var wallCoyoteSide = 0;

  function applyPower(kind) {
    if (kind === "jump") {
      superJumpT = 8;
      floatTxt(player.x + PW / 2, player.y, "SUPER JUMP!", "#f5d041", 14);
    } else if (kind === "shield") {
      shieldT = 10;
      floatTxt(player.x + PW / 2, player.y, "PEEL SHIELD!", "#67e8f9", 14);
    } else if (kind === "float") {
      floatT = 7;
      floatTxt(player.x + PW / 2, player.y, "AIRDROP FLOAT!", "#c084fc", 14);
    } else if (kind === "magnet") {
      magnetT = 9;
      floatTxt(player.x + PW / 2, player.y, "BAN MAGNET!", "#fb923c", 14);
    } else if (kind === "speed") {
      speedT = 7;
      floatTxt(player.x + PW / 2, player.y, "SPEED RUSH!", "#86efac", 14);
    }
  }

  function updateSnow(dt) {
    for (var i = 0; i < snow.length; i++) {
      var s = snow[i];
      s.y += s.sp * dt;
      s.x += Math.sin(animT * 2 + s.ph) * 12 * dt;
      if (s.y > H) { s.y = -5; s.x = Math.random() * W; }
    }
  }

  function updateFX(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
      if (p.age >= p.life) particles.splice(i, 1);
    }
    for (var f = floats.length - 1; f >= 0; f--) {
      floats[f].age += dt; floats[f].y -= 40 * dt;
      if (floats[f].age >= floats[f].life) floats.splice(f, 1);
    }
  }

  // ── Draw ──
  function worldToScreen(y) { return y - camY; }

  function drawBackground() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0c1a2e");
    g.addColorStop(0.45, "#0a2035");
    g.addColorStop(1, "#071018");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // parallax stars / potassium orbs
    ctx.fillStyle = "rgba(245,208,65,0.35)";
    for (var i = 0; i < 18; i++) {
      var sx = (i * 97 + animT * 5) % W;
      var sy = (i * 53 - camY * 0.05) % H;
      if (sy < 0) sy += H;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2 + (i % 3) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // jungle side silhouettes
    ctx.fillStyle = "rgba(15, 40, 28, 0.55)";
    ctx.fillRect(0, 0, 10, H);
    ctx.fillRect(W - 10, 0, 10, H);
    // icy edge glow
    var edge = ctx.createLinearGradient(0, 0, 18, 0);
    edge.addColorStop(0, "rgba(125,211,252,0.25)");
    edge.addColorStop(1, "rgba(125,211,252,0)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, 18, H);
    var edge2 = ctx.createLinearGradient(W, 0, W - 18, 0);
    edge2.addColorStop(0, "rgba(125,211,252,0.25)");
    edge2.addColorStop(1, "rgba(125,211,252,0)");
    ctx.fillStyle = edge2;
    ctx.fillRect(W - 18, 0, 18, H);

    // snow
    ctx.fillStyle = "rgba(224,242,254,0.55)";
    for (var s = 0; s < snow.length; s++) {
      ctx.beginPath();
      ctx.arc(snow[s].x, snow[s].y, snow[s].s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlat(p) {
    var sy = worldToScreen(p.y);
    if (sy < -40 || sy > H + 40 || p.broken) return;

    var shake = p.crumble >= 0 ? Math.sin(animT * 40) * p.crumble * 3 : 0;
    var x = p.x + shake;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(x + 2, sy + 4, p.w, p.h);

    if (p.type === "ice" || p.type === "move") {
      var ig = ctx.createLinearGradient(x, sy, x, sy + p.h);
      ig.addColorStop(0, "#e0f2fe");
      ig.addColorStop(0.5, "#7dd3fc");
      ig.addColorStop(1, "#38bdf8");
      ctx.fillStyle = ig;
      roundRect(x, sy, p.w, p.h, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // shine
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(x + 6, sy + 3, p.w * 0.35, 3);
    } else if (p.type === "peel") {
      var pg = ctx.createLinearGradient(x, sy, x, sy + p.h);
      pg.addColorStop(0, "#fde047");
      pg.addColorStop(1, "#eab308");
      ctx.fillStyle = pg;
      roundRect(x, sy, p.w, p.h, 8);
      ctx.fill();
      ctx.strokeStyle = "#a16207";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(161,98,7,0.4)";
      ctx.beginPath();
      ctx.moveTo(x + 8, sy + 4);
      ctx.quadraticCurveTo(x + p.w / 2, sy + p.h + 2, x + p.w - 8, sy + 4);
      ctx.stroke();
    } else if (p.type === "block") {
      ctx.fillStyle = "#1e3a5f";
      roundRect(x, sy, p.w, p.h, 4);
      ctx.fill();
      ctx.strokeStyle = "#f5d041";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(245,208,65,0.25)";
      for (var bx = x + 8; bx < x + p.w - 6; bx += 14) {
        ctx.fillRect(bx, sy + 4, 8, 8);
      }
    } else if (p.type === "crumble") {
      var alpha = p.crumble >= 0 ? 1 - p.crumble * 0.8 : 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#fdba74";
      roundRect(x, sy, p.w, p.h, 5);
      ctx.fill();
      ctx.strokeStyle = "#c2410c";
      ctx.stroke();
      ctx.globalAlpha = 1;
      // cracks
      if (p.crumble >= 0) {
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.moveTo(x + p.w * 0.3, sy);
        ctx.lineTo(x + p.w * 0.4, sy + p.h);
        ctx.moveTo(x + p.w * 0.6, sy);
        ctx.lineTo(x + p.w * 0.55, sy + p.h);
        ctx.stroke();
      }
    } else if (p.type === "spring") {
      ctx.fillStyle = "#86efac";
      roundRect(x, sy, p.w, p.h, 6);
      ctx.fill();
      ctx.strokeStyle = "#f5d041";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#f5d041";
      ctx.font = "12px serif";
      ctx.textAlign = "center";
      ctx.fillText("🍌", x + p.w / 2, sy + 12);
    }

    if (p.spike) {
      ctx.fillStyle = "#f87171";
      for (var s = 0; s < p.w - 10; s += 12) {
        ctx.beginPath();
        ctx.moveTo(x + 6 + s, sy);
        ctx.lineTo(x + 12 + s, sy - 10);
        ctx.lineTo(x + 18 + s, sy);
        ctx.fill();
      }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCoin(c) {
    if (c.got) return;
    var sy = worldToScreen(c.y);
    if (sy < -20 || sy > H + 20) return;
    var bob = Math.sin(animT * 5 + c.phase) * 3;
    ctx.save();
    ctx.translate(c.x, sy + bob);
    ctx.rotate(animT * 2 + c.phase);
    var g = ctx.createRadialGradient(-2, -2, 1, 0, 0, c.r);
    g.addColorStop(0, "#fef08a");
    g.addColorStop(0.6, "#f5d041");
    g.addColorStop(1, "#c9a227");
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#1a1400";
    ctx.font = "bold 9px Fredoka,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("B", 0, 1);
    ctx.restore();
  }

  function drawPower(p) {
    if (p.got) return;
    var sy = worldToScreen(p.y);
    if (sy < -20 || sy > H + 20) return;
    var bob = Math.sin(animT * 4 + p.phase) * 4;
    var icons = { jump: "⬆", shield: "🛡", float: "🪂", magnet: "🧲", speed: "⚡" };
    var cols = { jump: "#f5d041", shield: "#67e8f9", float: "#c084fc", magnet: "#fb923c", speed: "#86efac" };
    ctx.beginPath();
    ctx.arc(p.x, sy + bob, p.r + 2 + Math.sin(animT * 6) * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = cols[p.kind] || "#fff";
    ctx.globalAlpha = 0.25;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(p.x, sy + bob, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10,20,35,0.85)";
    ctx.fill();
    ctx.strokeStyle = cols[p.kind] || "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "12px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icons[p.kind] || "?", p.x, sy + bob + 1);
  }

  function drawHazard(h) {
    var sy = worldToScreen(h.y);
    if (sy < -30 || sy > H + 30) return;
    ctx.save();
    ctx.translate(h.x, sy);
    ctx.rotate(h.rot);
    ctx.beginPath();
    ctx.arc(0, 0, h.r, 0, Math.PI * 2);
    var g = ctx.createRadialGradient(-2, -2, 1, 0, 0, h.r);
    g.addColorStop(0, "#f8fafc");
    g.addColorStop(1, "#94a3b8");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#f87171";
    ctx.font = "10px Fredoka,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FUD", 0, 1);
    ctx.restore();
  }

  function drawMonkey() {
    var sx = player.x;
    var sy = worldToScreen(player.y);
    if (invulnT > 0 && Math.floor(animT * 20) % 2 === 0) return;

    var sh = camShake > 0 ? (Math.random() - 0.5) * camShake * 8 : 0;
    ctx.save();
    ctx.translate(sx + PW / 2 + sh, sy + PH / 2);
    ctx.scale(player.facing * player.stretch, player.squish);

    // shadow
    ctx.beginPath();
    ctx.ellipse(0, PH / 2 - 4, 14, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();

    // body
    ctx.beginPath();
    ctx.ellipse(0, 4, 13, 15, 0, 0, Math.PI * 2);
    var body = ctx.createRadialGradient(-3, 0, 2, 0, 4, 16);
    body.addColorStop(0, "#e2c08a");
    body.addColorStop(1, "#b8894e");
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = "#5c3d1e";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // head
    ctx.beginPath();
    ctx.arc(0, -12, 14, 0, Math.PI * 2);
    ctx.fillStyle = "#c4a574";
    ctx.fill();
    ctx.stroke();

    // ears
    ctx.beginPath();
    ctx.arc(-13, -16, 6, 0, Math.PI * 2);
    ctx.arc(13, -16, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#c4a574";
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-13, -16, 3, 0, Math.PI * 2);
    ctx.arc(13, -16, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#e8c9a0";
    ctx.fill();

    // face patch
    ctx.beginPath();
    ctx.ellipse(0, -10, 9, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#f0d9b5";
    ctx.fill();

    // eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-4.5, -12, 3.5, 0, Math.PI * 2);
    ctx.arc(4.5, -12, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    var eyeX = grounded ? Math.sin(runFrame) * 0.5 : player.vx * 0.01;
    ctx.beginPath();
    ctx.arc(-4.2 + eyeX, -12, 1.7, 0, Math.PI * 2);
    ctx.arc(4.8 + eyeX, -12, 1.7, 0, Math.PI * 2);
    ctx.fill();

    // smile / effort
    ctx.strokeStyle = "#5c3d1e";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (player.vy < -100) {
      ctx.arc(0, -6, 4, 0.2, Math.PI - 0.2); // grin
    } else if (!grounded && player.vy > 200) {
      ctx.moveTo(-3, -5); ctx.lineTo(3, -5); // oh no
    } else {
      ctx.arc(0, -7, 3.5, 0.15, Math.PI - 0.15);
    }
    ctx.stroke();

    // scarf (Banano flair)
    ctx.fillStyle = "#f5d041";
    ctx.fillRect(-8, -1, 16, 4);
    ctx.fillRect(6, -1, 4, 10);

    // limbs simple
    ctx.strokeStyle = "#5c3d1e";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    var leg = grounded ? Math.sin(runFrame * 2) * 6 : 8;
    ctx.beginPath();
    ctx.moveTo(-5, 14); ctx.lineTo(-5 - leg * 0.3, 22);
    ctx.moveTo(5, 14); ctx.lineTo(5 + leg * 0.3, 22);
    ctx.stroke();

    // banana trail when fast
    if (Math.abs(player.vx) > 200 || player.vy < -200) {
      ctx.globalAlpha = 0.5;
      ctx.font = "12px serif";
      ctx.fillText("🍌", -player.facing * 16, 0);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // shield aura
    if (shieldT > 0) {
      ctx.beginPath();
      ctx.arc(sx + PW / 2, sy + PH / 2, 28, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(103,232,249," + (0.4 + Math.sin(animT * 8) * 0.2) + ")";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // float aura
    if (floatT > 0) {
      ctx.beginPath();
      ctx.arc(sx + PW / 2, sy + PH / 2, 32, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(192,132,252,0.35)";
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawFX() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var a = 1 - p.age / p.life;
      var sy = worldToScreen(p.y);
      ctx.globalAlpha = a;
      if (p.kind === "peel") {
        ctx.font = 10 * a + 6 + "px serif";
        ctx.fillText("🍌", p.x, sy);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, sy, p.size * a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (var f = 0; f < floats.length; f++) {
      var fl = floats[f];
      var fy = worldToScreen(fl.y);
      // floats store world y that decreases - actually we store screen-ish y and decrement
      // We stored world-ish coords from player - use as world
      ctx.globalAlpha = 1 - fl.age / fl.life;
      ctx.font = "700 " + fl.size + "px Fredoka,sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 3;
      ctx.strokeText(fl.text, fl.x, fy);
      ctx.fillStyle = fl.color;
      ctx.fillText(fl.text, fl.x, fy);
    }
    ctx.globalAlpha = 1;
  }

  // Fix floats: store screen-relative by converting on create
  // Actually floatTxt uses world y from player.y - worldToScreen works if we pass world y.
  // floatTxt decrements y each frame - treating as world y rising = good.

  function draw() {
    var shx = camShake > 0 ? (Math.random() - 0.5) * camShake * 10 : 0;
    var shy = camShake > 0 ? (Math.random() - 0.5) * camShake * 10 : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);

    drawBackground();

    // height markers
    ctx.fillStyle = "rgba(125,211,252,0.15)";
    ctx.font = "10px Fredoka,sans-serif";
    ctx.textAlign = "left";
    for (var m = 50; m < maxHeight + 100; m += 50) {
      var my = worldToScreen(startY - m * 40);
      if (my > 0 && my < H) {
        ctx.fillText(m + "m", 14, my);
        ctx.fillRect(12, my + 2, W - 24, 1);
      }
    }

    for (var i = 0; i < plats.length; i++) drawPlat(plats[i]);
    for (var c = 0; c < coins.length; c++) drawCoin(coins[c]);
    for (var u = 0; u < powers.length; u++) drawPower(powers[u]);
    for (var h = 0; h < hazards.length; h++) drawHazard(hazards[h]);
    if (state === "play" || state === "pause" || state === "over") drawMonkey();
    drawFX();

    // flash
    if (flash > 0) {
      ctx.fillStyle = "rgba(248,113,113," + (flash * 0.35) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    // power-up indicators
    if (state === "play") {
      var ix = 12, iy = H - 28;
      ctx.font = "11px Fredoka,sans-serif";
      ctx.textAlign = "left";
      if (superJumpT > 0) { ctx.fillStyle = "#f5d041"; ctx.fillText("⬆ " + superJumpT.toFixed(0) + "s", ix, iy); ix += 50; }
      if (shieldT > 0) { ctx.fillStyle = "#67e8f9"; ctx.fillText("🛡 " + shieldT.toFixed(0) + "s", ix, iy); ix += 50; }
      if (floatT > 0) { ctx.fillStyle = "#c084fc"; ctx.fillText("🪂 " + floatT.toFixed(0) + "s", ix, iy); ix += 54; }
      if (magnetT > 0) { ctx.fillStyle = "#fb923c"; ctx.fillText("🧲 " + magnetT.toFixed(0) + "s", ix, iy); ix += 50; }
      if (speedT > 0) { ctx.fillStyle = "#86efac"; ctx.fillText("⚡ " + speedT.toFixed(0) + "s", ix, iy); }
    }

    // vignette
    var vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // menu idle preview — simple decorative climb silhouette
    if (state === "menu") {
      // already has overlay; canvas still draws bg via loop
    }
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

  // ── Input ──
  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") { keyL = true; e.preventDefault(); }
    if (k === "ArrowRight" || k === "d" || k === "D") { keyR = true; e.preventDefault(); }
    if (k === " " || k === "ArrowUp" || k === "w" || k === "W") {
      if (!keyJ) jumpPressed = true;
      keyJ = true; jumpHeld = true;
      e.preventDefault();
      if (state === "menu") startGame();
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
    if (k === " " || k === "ArrowUp" || k === "w" || k === "W") {
      keyJ = false; jumpHeld = false;
    }
  });

  // Touch
  function bindTouch(el, on, off) {
    if (!el) return;
    el.addEventListener("touchstart", function (e) { e.preventDefault(); on(); }, { passive: false });
    el.addEventListener("touchend", function (e) { e.preventDefault(); off(); }, { passive: false });
    el.addEventListener("touchcancel", function (e) { e.preventDefault(); off(); }, { passive: false });
    el.addEventListener("mousedown", function (e) { e.preventDefault(); on(); });
    el.addEventListener("mouseup", function (e) { e.preventDefault(); off(); });
    el.addEventListener("mouseleave", function () { off(); });
  }
  bindTouch(document.getElementById("touchL"), function () { keyL = true; }, function () { keyL = false; });
  bindTouch(document.getElementById("touchR"), function () { keyR = true; }, function () { keyR = false; });
  bindTouch(document.getElementById("touchJ"), function () {
    if (!keyJ) jumpPressed = true;
    keyJ = true; jumpHeld = true;
    if (state === "menu") startGame();
  }, function () { keyJ = false; jumpHeld = false; });

  // Buttons
  document.getElementById("btnPlay").addEventListener("click", function () { ensureAudio(); startGame(); });
  document.getElementById("btnHow").addEventListener("click", function () {
    menuOv.classList.add("hidden");
    howOv.classList.remove("hidden");
  });
  document.getElementById("btnHowBack").addEventListener("click", function () {
    howOv.classList.add("hidden");
    menuOv.classList.remove("hidden");
  });
  document.getElementById("btnScores").addEventListener("click", function () {
    renderScores();
    menuOv.classList.add("hidden");
    scoresOv.classList.remove("hidden");
  });
  document.getElementById("btnScoresBack").addEventListener("click", function () {
    scoresOv.classList.add("hidden");
    menuOv.classList.remove("hidden");
  });
  document.getElementById("btnResume").addEventListener("click", resumeGame);
  document.getElementById("btnPauseMenu").addEventListener("click", goMenu);
  document.getElementById("btnRetry").addEventListener("click", function () { ensureAudio(); startGame(); });
  document.getElementById("btnOverMenu").addEventListener("click", goMenu);

  // Idle menu backdrop
  initSnow();
  seedWorld();
  // park monkey for menu visual
  player.x = W / 2 - PW / 2;
  player.y = H - 50 - PH;
  camY = 0;
  requestAnimationFrame(loop);
})();
