import { playPopThrottled, playSfx, setMuted } from "./audio/sfx";
import { preloadSliceArt } from "./art/sprites";
import { BADGE_DEFS } from "./content/badges";
import { CODEX } from "./content/codex";
import { COSMETICS } from "./content/cosmetics";
import {
  claimDailyWin,
  getDailyChallenge,
  loadDailyProgress,
  type DailyChallenge,
} from "./content/daily";
import {
  defaultRunConfig,
  DIFFS,
  labRunConfig,
  LENGTHS,
  MAPS,
  MODES,
  type DiffId,
  type LengthId,
  type MapId,
  type ModeId,
  type RunConfig,
} from "./content/runConfig";
import { TOWER_BY_ID, TOWERS } from "./content/towers";
import { isTowerUnlocked, listUnlockedTowers, unlockHint } from "./content/unlocks";
import { hashUserId, lbClient, makeRunId } from "./net/leaderboard";
import { CLIENT_VERSION } from "./net/types";
import type { PathRuntime } from "./path/maps";
import { drawWorld } from "./render/draw";
import {
  computeScore,
  loadProgress,
  recordRun,
  saveProgress,
  type SliceProgress,
} from "./save/progress";
import { canUpgrade } from "./sim/stats";
import type { AbilityId, SimEvent, SimWorld } from "./sim/types";
import {
  castAbility,
  createWorld,
  cycleTarget,
  godCash,
  H,
  placeTower,
  sellTower,
  startWave,
  stepSim,
  upgradeTower,
  W,
} from "./sim/world";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $("game") as unknown as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const toastEl = $("toast");
const coachEl = $("coach");

let progress: SliceProgress = loadProgress();
let config: RunConfig = defaultRunConfig();
let world: SimWorld;
let path: PathRuntime;
let shopId: string | null = "dart";
let hover: { c: number; r: number } | null = null;
let lastTs = 0;
let acc = 0;
const SIM_DT = 1 / 60;
const MAX_STEPS = 6;
let lastShare = "";
let runActive = false;
let codexTab = "bananas";
/** Drag-from-shop (mobile + desktop). */
let dragPlaceId: string | null = null;
let pointerDownShop = false;

const COACH = [
  "Place a Dart MonKey on the grass (not the path). Drag from the shop works too.",
  "Press Send Wave (or Enter) when ready.",
  "BAN from pops buys more MonKeys. Interest pays at wave clear.",
  "Two paths — only one goes deep (tiers 3–4). Confirm when asked.",
  "Dashed purple = camo. Snipers and Village radar detect them (max 4 aura).",
  "Bosses: set Target Strong. Storm chips MOAB shells.",
  "Farms: max 3. Sell returns 70%. Lab never ranks.",
];

function toast(msg: string) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  window.setTimeout(() => toastEl.classList.remove("show"), 1600);
}

type Screen = "hub" | "config" | "settings" | "game" | "codex" | "badges" | "cosmetics" | "lb";

let daily: DailyChallenge = getDailyChallenge();
let isDailyRun = false;

function showScreen(which: Screen) {
  for (const id of [
    "screen-hub",
    "screen-config",
    "screen-settings",
    "screen-game",
    "screen-codex",
    "screen-badges",
    "screen-cosmetics",
    "screen-lb",
  ]) {
    $(id).classList.toggle("hidden", id !== `screen-${which}`);
  }
}

function refreshHub() {
  daily = getDailyChallenge();
  const dp = loadDailyProgress();
  const clearedToday = dp.lastDate === daily.date && dp.cleared;
  $("hubStats").innerHTML = `
    Games <b>${progress.games}</b> · Wins <b>${progress.wins}</b><br/>
    Best wave <b>${progress.bestWave}</b> · Score <b>${progress.bestScore}</b><br/>
    Badges <b>${Object.keys(progress.badges).length}</b>/${BADGE_DEFS.length}
    · Cosmetics <b>${progress.cosmetics.unlocked.length}</b>
    · Cosmetic ₡ <b>${dp.cosmeticCurrency}</b>
  `;
  $("dailyCard").innerHTML = `
    <strong>${daily.title}</strong> ${clearedToday ? "· cleared ✓" : "· open"}<br/>
    ${MODES[daily.mode].name} · ${MAPS[daily.map].short} · ${LENGTHS[daily.length].name} · ${DIFFS[daily.difficulty].name}
    ${daily.reverse ? " · Reverse" : ""}${daily.blitz ? " · Blitz" : ""}<br/>
    <span class="muted">Reward: +${daily.cosmeticReward} cosmetic ₡ + title (no combat power)</span>
  `;
  $("migrateNote").textContent = progress.migratedFromLive
    ? "Imported live Banano TD progress (best-effort)."
    : "No live save — fresh slice progress.";
}

function lbPartitionFromUi(): { mode?: string; length?: string; difficulty?: string } {
  const mode = ($("lbMode") as HTMLSelectElement | null)?.value;
  const length = ($("lbLength") as HTMLSelectElement | null)?.value;
  const difficulty = ($("lbDiff") as HTMLSelectElement | null)?.value;
  return {
    mode: mode && mode !== "all" ? mode : undefined,
    length: length && length !== "all" ? length : undefined,
    difficulty: difficulty && difficulty !== "all" ? difficulty : undefined,
  };
}

async function refreshLb() {
  const part = lbPartitionFromUi();
  const local = lbClient.listLocal(10, part);
  $("lbLocal").innerHTML = local.length
    ? local
        .map(
          (e, i) =>
            `<div class="item">#${i + 1} <strong>${e.score}</strong> · ${e.nickname} · ${e.mode}/${e.length}/${e.difficulty} · ${e.map} w${e.wave}</div>`
        )
        .join("")
    : `<div class="item muted">No local scores in this partition yet.</div>`;
  $("lbGlobal").innerHTML = `<div class="item muted">Loading mock global…</div>`;
  try {
    const g = await lbClient.fetchGlobal({ ...part, limit: 10 });
    $("lbGlobal").innerHTML = g.length
      ? g
          .map(
            (e) =>
              `<div class="item">#${e.rank} <strong>${e.score}</strong> · ${e.nickname} · ${e.mode}/${e.length}/${e.difficulty}${e.dailySeed ? " · daily" : ""}</div>`
          )
          .join("")
      : `<div class="item muted">Empty mock global for this partition — win a run to submit.</div>`;
  } catch {
    $("lbGlobal").innerHTML = `<div class="item muted">Mock global unavailable.</div>`;
  }
}

function refreshCodex() {
  const list = $("codexList");
  list.innerHTML = CODEX.filter((e) => e.tab === codexTab)
    .map(
      (e) =>
        `<div class="item"><strong>${e.name}</strong>${e.first ? ` · ${e.first}` : ""}<br/>${e.blurb}${
          e.counters ? `<br/><span class="muted">Counters: ${e.counters}</span>` : ""
        }</div>`
    )
    .join("");
}

function refreshBadges() {
  $("badgeList").innerHTML = BADGE_DEFS.map((b) => {
    const owned = !!progress.badges[b.id];
    return `<div class="item ${owned ? "owned" : "locked"}">${owned ? "★" : "☆"} <strong>${b.name}</strong> · ${b.tier}<br/><span class="muted">${b.desc}</span></div>`;
  }).join("");
}

function refreshCosmetics() {
  $("cosmoList").innerHTML = COSMETICS.map((c) => {
    const owned = progress.cosmetics.unlocked.includes(c.id);
    const eq = progress.cosmetics.equipped[c.slot] === c.id;
    return `<div class="item ${owned ? "owned" : "locked"}">${eq ? "●" : "○"} ${c.name} <span class="muted">(${c.slot})</span><br/><span class="muted">${c.unlock}</span></div>`;
  }).join("");
}

function syncMapVisibility() {
  const mode = ($("cfgMode") as HTMLSelectElement).value as ModeId;
  const pick = MODES[mode].pickMap;
  $("mapLabel").style.display = pick ? "block" : "none";
}

function startRun(cfg: RunConfig, opts?: { daily?: boolean }) {
  config = { ...cfg };
  isDailyRun = !!opts?.daily;
  // FTUE: first games force coach on Short Normal
  if (
    progress.games < 2 &&
    config.length === "short" &&
    config.difficulty === "normal" &&
    !config.sandbox &&
    !isDailyRun
  ) {
    config.coach = true;
  } else if (!(config.length === "short" && config.difficulty === "normal" && progress.settings.coach)) {
    if (!($("cfgCoach") as HTMLInputElement).checked) config.coach = false;
  }
  if (isDailyRun) config.coach = false;

  const unlocked = listUnlockedTowers(progress, config.sandbox);
  const created = createWorld(config, unlocked);
  world = created.world;
  path = created.path;
  world.dailySeed = isDailyRun ? daily.seed : null;
  shopId = "dart";
  dragPlaceId = null;
  runActive = true;
  lastTs = 0;
  acc = 0;
  setMuted(progress.settings.muted);
  showScreen("game");
  $("ov-pause").classList.add("hidden");
  $("ov-results").classList.add("hidden");
  preloadSliceArt(TOWERS.map((t) => t.id));
  $("hudMap").textContent =
    MAPS[config.map].short +
    (isDailyRun ? " · Daily" : "") +
    (config.sandbox ? " · LAB" : "");
  const debugBar = $("debugBar");
  if (debugBar) debugBar.classList.toggle("hidden", !config.sandbox);
  refreshGameUi();
  playSfx("ui");
  toast(
    `${config.sandbox ? "LAB · " : ""}${isDailyRun ? "Daily · " : ""}${MODES[config.mode].name} · ${MAPS[config.map].short} · ${LENGTHS[config.length].name} · ${DIFFS[config.difficulty].name}`
  );
}

function endRun(won: boolean) {
  runActive = false;
  world.paused = true;
  playSfx(won ? "win" : "lose");
  const score = computeScore({
    wave: world.wave,
    pops: world.pops,
    banEarned: world.banEarned,
    won,
    difficulty: config.difficulty,
    length: config.length,
    mode: config.mode,
    reverse: config.reverse,
    blitz: config.blitz,
  });
  let newBadges: string[] = [];
  let dailyLine = "";
  const canRank = config.ranked && !config.sandbox && !world.usedGodTools && !isDailyRun;
  if (canRank) {
    const res = recordRun(progress, {
      won,
      wave: world.wave,
      score,
      map: config.map,
      length: config.length,
      difficulty: config.difficulty,
      mode: config.mode,
      reverse: config.reverse,
      blitz: config.blitz,
      usedFarm: world.usedFarm,
      onlyDart: world.onlyDart,
    });
    progress = res.progress;
    newBadges = res.newBadges;
  }
  if (isDailyRun && won) {
    const claim = claimDailyWin(daily, score);
    if (claim.currency > 0) {
      dailyLine = `Daily reward: +${claim.currency} cosmetic ₡ · ${claim.title}`;
      progress.cosmetics.unlocked.push(daily.cosmeticId);
      saveProgress(progress);
    } else dailyLine = "Daily already claimed today (best score updated).";
  }

  const nick =
    (($("lbNick") as HTMLInputElement)?.value || "").trim() ||
    progress.cosmetics.equipped.title ||
    "Jungle General";

  const entry = {
    score,
    wave: world.wave,
    pops: world.pops,
    mode: config.mode,
    map: config.map,
    difficulty: config.difficulty,
    length: config.length,
    reverse: config.reverse,
    blitz: config.blitz,
    won,
    nickname: String(nick).slice(0, 24),
    at: Date.now(),
    dailySeed: world.dailySeed || undefined,
  };
  if (!config.sandbox && !world.usedGodTools) {
    lbClient.submitLocal(entry);
    void lbClient.submitGlobal({
      runId: makeRunId(),
      userIdHash: hashUserId(entry.nickname),
      nickname: entry.nickname,
      score,
      wave: world.wave,
      pops: world.pops,
      mode: config.mode,
      map: config.map,
      difficulty: config.difficulty,
      length: config.length,
      reverse: config.reverse,
      blitz: config.blitz,
      won,
      freeplay: false,
      dailySeed: world.dailySeed || undefined,
      clientVersion: CLIENT_VERSION,
      createdAt: Date.now(),
    });
  }

  lastShare = [
    "Banano TD",
    `${won ? "Victory" : "Defeat"} · Score ${score}`,
    `${MODES[config.mode].name} · ${LENGTHS[config.length].name} · ${MAPS[config.map].name}`,
    `${DIFFS[config.difficulty].name}${config.reverse ? " · Reverse" : ""}${config.blitz ? " · Blitz" : ""}`,
    isDailyRun ? `Daily seed ${daily.date}` : "",
    `Wave ${world.wave}/${world.maxWave} · Pops ${world.pops}`,
    `In-game BAN earned ${Math.floor(world.banEarned)} (not on-chain) · Perfect ${world.perfectWaves}`,
    newBadges.length ? `Badges: ${newBadges.join(", ")}` : "",
    dailyLine,
    "bananox.com/playTD.html",
  ]
    .filter(Boolean)
    .join("\n");
  $("resTitle").textContent = won ? "Core Secure" : "Core Cracked";
  $("resBadges").textContent = [newBadges.length ? `New badges: ${newBadges.join(", ")}` : "", dailyLine]
    .filter(Boolean)
    .join(" · ");
  $("resBody").textContent = lastShare;
  $("ov-results").classList.remove("hidden");
}

function handleEvents(events: SimEvent[]) {
  for (const e of events) {
    if (e.type === "toast") toast(e.msg);
    if (e.type === "leak") {
      toast(`Leak −${e.lives}`);
      playSfx("leak");
    }
    if (e.type === "lost") endRun(false);
    if (e.type === "won") endRun(true);
    if (e.type === "fever") {
      $("hudFever").classList.add("on");
      playSfx("fever");
    }
    if (e.type === "event") $("hudEvent").textContent = e.name;
    if (e.type === "tour") $("hudMap").textContent = MAPS[e.map as MapId]?.short || e.map;
    if (e.type === "bossSpawn") toast(`${e.kind.toUpperCase()} inbound`);
    if (e.type === "tier4") {
      toast(`✦ ${e.name}`);
      playSfx("upgrade");
    }
    if (e.type === "pop") playPopThrottled();
    if (e.type === "place") playSfx("place");
    if (e.type === "ability") playSfx("ability");
    if (e.type === "waveStart") playSfx("wave");
  }
  if (world && world.feverT <= 0) $("hudFever").classList.remove("on");
  if (world && !world.eventId) $("hudEvent").textContent = "";
}

function selectedTower() {
  return world?.towers.find((t) => t.uid === world.selectedUid) || null;
}

function refreshShop() {
  const shop = $("shop");
  shop.innerHTML = "";
  for (const def of TOWERS) {
    const unlocked = isTowerUnlocked(def.id, progress, config.sandbox);
    const b = document.createElement("button");
    b.type = "button";
    const short = def.name.split(" ")[0];
    b.textContent = unlocked ? `${short} ${def.cost}` : `[L] ${short}`;
    b.title = unlocked ? `${def.name} · ${def.role}` : unlockHint(def.id);
    b.className = [
      shopId === def.id ? "selected" : "",
      unlocked ? "" : "locked",
      def.id === "farm" ? "farm-btn" : "",
    ]
      .filter(Boolean)
      .join(" ");
    b.style.borderColor = unlocked ? def.color : "#555";
    b.disabled = !unlocked;
    b.dataset.towerId = def.id;

    // Click select
    b.onclick = () => {
      if (!unlocked) {
        toast(unlockHint(def.id));
        return;
      }
      shopId = def.id;
      world.selectedUid = null;
      playSfx("ui");
      refreshShop();
      refreshSel();
    };

    // Drag-from-shop for mobile place
    b.addEventListener("pointerdown", (ev) => {
      if (!unlocked || !runActive) return;
      pointerDownShop = true;
      dragPlaceId = def.id;
      shopId = def.id;
      world.selectedUid = null;
      b.setPointerCapture?.(ev.pointerId);
      refreshShop();
      refreshSel();
    });
    b.addEventListener("pointerup", (ev) => {
      if (!pointerDownShop || !dragPlaceId) return;
      pointerDownShop = false;
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX;
      const y = ev.clientY;
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const { c, r } = canvasToCell(x, y);
        handleEvents(placeTower(world, path, dragPlaceId, c, r));
        if (world.coachStep === 0 && world.towers.length) world.coachStep = 1;
        refreshGameUi();
      }
      dragPlaceId = null;
    });
    b.addEventListener("pointercancel", () => {
      pointerDownShop = false;
      dragPlaceId = null;
    });

    shop.appendChild(b);
  }
  // Farm count hint
  if (world) {
    const farms = world.towers.filter((t) => t.farm).length;
    if (farms >= 3) {
      const hint = document.createElement("span");
      hint.className = "muted farm-cap";
      hint.textContent = "Farms 3/3";
      shop.appendChild(hint);
    }
  }
}

function refreshSel() {
  const panel = $("sel-panel");
  const t = selectedTower();
  if (!t) {
    const def = shopId ? TOWER_BY_ID[shopId] : null;
    if (def && !isTowerUnlocked(def.id, progress, config.sandbox)) {
      panel.textContent = unlockHint(def.id);
      return;
    }
    panel.textContent = def
      ? `Place: ${def.name} (${def.cost}) — tap tile or drag from shop`
      : "Select shop tower";
    return;
  }
  const def = TOWER_BY_ID[t.defId]!;
  const a = canUpgrade(t, 0);
  const b = canUpgrade(t, 1);
  panel.innerHTML = `<strong>${def.name}</strong> ${t.pathA}-${t.pathB} · ${t.targetMode}
    ${t.effCamo ? " · camo" : ""}<br/>
    A:${a.ok ? a.cost : "—"} B:${b.ok ? b.cost : "—"}
    <br/><button type="button" id="upA">Up A</button>
    <button type="button" id="upB">Up B</button>
    <button type="button" id="tgt">Target</button>
    <button type="button" id="sell">Sell</button>`;
  $("upA").onclick = () => tryUpgrade(0);
  $("upB").onclick = () => tryUpgrade(1);
  $("tgt").onclick = () => {
    handleEvents(cycleTarget(world, t.uid));
    refreshSel();
  };
  $("sell").onclick = () => {
    handleEvents(sellTower(world, t.uid));
    refreshGameUi();
  };
}

function tryUpgrade(pathI: 0 | 1) {
  const t = selectedTower();
  if (!t) return;
  const def = TOWER_BY_ID[t.defId]!;
  const level = pathI === 0 ? t.pathA : t.pathB;
  if (level === 2 && t.deepPath === null) {
    if (!confirm(`Go deep on ${def.pathNames[pathI]}? Other path stops at 2.`)) return;
  }
  handleEvents(upgradeTower(world, t.uid, pathI));
  playSfx("upgrade");
  refreshGameUi();
}

function refreshAbilities() {
  if (!world) return;
  for (const [el, id] of [
    ["abStorm", "storm"],
    ["abCryo", "cryo"],
    ["abDrop", "drop"],
    ["abRage", "rage"],
  ] as const) {
    const btn = $(el) as HTMLButtonElement;
    const ab = world.abilities[id];
    const ready = ab.cd <= 0;
    btn.disabled = !ready || world.phase === "lost" || world.phase === "won";
    btn.textContent = ready ? id[0]!.toUpperCase() + id.slice(1) : `${Math.ceil(ab.cd)}s`;
  }
}

function refreshCoach() {
  if (!config.coach || !world || world.coachStep >= COACH.length) {
    coachEl.classList.add("hidden");
    return;
  }
  coachEl.classList.remove("hidden");
  coachEl.textContent = COACH[world.coachStep] || "";
}

function refreshGameUi() {
  $("hudBan").textContent = String(Math.floor(world.ban));
  $("hudLives").textContent = String(world.lives);
  $("hudWave").textContent = String(world.wave);
  $("hudMax").textContent = String(world.maxWave);
  $("hudStreak").textContent = world.killStreak >= 5 ? `Streak x${world.killStreak}` : "Streak —";
  $("hudFever").classList.toggle("on", world.feverT > 0);
  ($("btnSpeed") as HTMLButtonElement).textContent = `${world.speed}×`;
  ($("btnWave") as HTMLButtonElement).disabled = world.waveActive || world.phase !== "prep";
  refreshShop();
  refreshSel();
  refreshAbilities();
  refreshCoach();
}

// Hub
$("btnPlay").onclick = () => {
  ($("cfgCoach") as HTMLInputElement).checked = progress.settings.coach;
  // FTUE defaults
  if (progress.games === 0) {
    ($("cfgLength") as HTMLSelectElement).value = "short";
    ($("cfgDiff") as HTMLSelectElement).value = "normal";
    ($("cfgMode") as HTMLSelectElement).value = "classic";
    ($("cfgCoach") as HTMLInputElement).checked = true;
  }
  syncMapVisibility();
  showScreen("config");
};
$("btnSettings").onclick = () => {
  ($("setMute") as HTMLInputElement).checked = progress.settings.muted;
  ($("setCoach") as HTMLInputElement).checked = progress.settings.coach;
  showScreen("settings");
};
$("btnCodex").onclick = () => {
  refreshCodex();
  showScreen("codex");
};
$("btnBadges").onclick = () => {
  refreshBadges();
  showScreen("badges");
};
$("btnCosmetics").onclick = () => {
  refreshCosmetics();
  showScreen("cosmetics");
};
$("btnLb").onclick = () => {
  showScreen("lb");
  void refreshLb();
};
$("btnLbBack").onclick = () => showScreen("hub");
$("btnLbRefresh").onclick = () => void refreshLb();
for (const id of ["lbMode", "lbLength", "lbDiff"] as const) {
  const el = $(id) as HTMLSelectElement | null;
  if (el) el.onchange = () => void refreshLb();
}
$("btnLab").onclick = () => {
  startRun(
    labRunConfig({
      map: "canyon",
      length: "medium",
      difficulty: "normal",
      mode: "classic",
    })
  );
};
$("btnDaily").onclick = () => {
  daily = getDailyChallenge();
  startRun(
    {
      mode: daily.mode,
      map: daily.map,
      length: daily.length,
      difficulty: daily.difficulty,
      reverse: daily.reverse,
      blitz: daily.blitz,
      ranked: true,
      coach: false,
      sandbox: false,
    },
    { daily: true }
  );
};
$("btnConfigBack").onclick = () => showScreen("hub");
$("btnCodexBack").onclick = () => showScreen("hub");
$("btnBadgesBack").onclick = () => showScreen("hub");
$("btnCosmoBack").onclick = () => showScreen("hub");
$("btnSettingsBack").onclick = () => {
  progress.settings.muted = ($("setMute") as HTMLInputElement).checked;
  progress.settings.coach = ($("setCoach") as HTMLInputElement).checked;
  setMuted(progress.settings.muted);
  saveProgress(progress);
  refreshHub();
  showScreen("hub");
};
$("cfgMode").onchange = syncMapVisibility;

$("codexTabs").onclick = (e) => {
  const t = (e.target as HTMLElement).closest("button[data-tab]") as HTMLButtonElement | null;
  if (!t) return;
  codexTab = t.dataset.tab || "bananas";
  for (const b of $("codexTabs").querySelectorAll("button")) b.classList.toggle("on", b === t);
  refreshCodex();
};

$("btnDeploy").onclick = () => {
  const mode = ($("cfgMode") as HTMLSelectElement).value as ModeId;
  const cfg: RunConfig = {
    mode,
    map: mode === "tour" ? "canyon" : (($("cfgMap") as HTMLSelectElement).value as MapId),
    length: ($("cfgLength") as HTMLSelectElement).value as LengthId,
    difficulty: ($("cfgDiff") as HTMLSelectElement).value as DiffId,
    reverse: ($("cfgReverse") as HTMLInputElement).checked,
    blitz: ($("cfgBlitz") as HTMLInputElement).checked,
    ranked: true,
    coach: ($("cfgCoach") as HTMLInputElement).checked,
    sandbox: false,
  };
  startRun(cfg);
};

$("btnWave").onclick = () => {
  handleEvents(startWave(world));
  if (world.coachStep === 1) world.coachStep = 2;
  refreshGameUi();
};
$("btnSpeed").onclick = () => {
  world.speed = world.speed >= 3 ? 1 : ((world.speed + 1) as 1 | 2 | 3);
  refreshGameUi();
};
$("btnMenu").onclick = () => {
  world.paused = true;
  $("ov-pause").classList.remove("hidden");
};
$("btnResume").onclick = () => {
  world.paused = false;
  $("ov-pause").classList.add("hidden");
};
$("btnSurrender").onclick = () => {
  $("ov-pause").classList.add("hidden");
  world.phase = "lost";
  endRun(false);
};
$("btnToHub").onclick = () => {
  $("ov-pause").classList.add("hidden");
  runActive = false;
  showScreen("hub");
  refreshHub();
};
$("btnRetry").onclick = () => {
  $("ov-results").classList.add("hidden");
  startRun(config);
};
$("btnResHub").onclick = () => {
  $("ov-results").classList.add("hidden");
  runActive = false;
  showScreen("hub");
  refreshHub();
};
$("btnCopyShare").onclick = async () => {
  try {
    await navigator.clipboard.writeText(lastShare);
    toast("Share card copied");
  } catch {
    toast("Copy failed");
  }
};

for (const [el, id] of [
  ["abStorm", "storm"],
  ["abCryo", "cryo"],
  ["abDrop", "drop"],
  ["abRage", "rage"],
] as const) {
  $(el).onclick = () => {
    handleEvents(castAbility(world, path, id as AbilityId));
    refreshGameUi();
  };
}

$("dbgCash").onclick = () => {
  if (!config.sandbox) {
    toast("God cash is Lab-only");
    return;
  }
  godCash(world, 5000);
  toast("+5000 LAB (unranked)");
  refreshGameUi();
};
$("dbgRanges").onclick = () => {
  world.showRanges = !world.showRanges;
};
$("dbgImm").onclick = () => {
  world.showImmunities = !world.showImmunities;
};

function canvasToCell(clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const sx = (clientX - rect.left) * (W / rect.width);
  const sy = (clientY - rect.top) * (H / rect.height);
  return { c: Math.floor(sx / path.tw), r: Math.floor(sy / path.th) };
}

canvas.addEventListener("pointerdown", (e) => {
  if (!runActive) return;
  const { c, r } = canvasToCell(e.clientX, e.clientY);
  hover = { c, r };
  const hit = world.towers.find((t) => t.c === c && t.r === r);
  if (hit) {
    world.selectedUid = hit.uid;
    shopId = null;
    playSfx("ui");
    refreshGameUi();
    return;
  }
  if (shopId && isTowerUnlocked(shopId, progress, config.sandbox)) {
    handleEvents(placeTower(world, path, shopId, c, r));
    if (world.coachStep === 0 && world.towers.length) world.coachStep = 1;
    refreshGameUi();
  }
});
canvas.addEventListener("pointermove", (e) => {
  if (!runActive) return;
  hover = canvasToCell(e.clientX, e.clientY);
});

// Tab blur: freeze sim so players do not leak off-tab
document.addEventListener("visibilitychange", () => {
  if (document.hidden && runActive && world && world.phase !== "lost" && world.phase !== "won") {
    world.paused = true;
    $("ov-pause").classList.remove("hidden");
  }
});

window.addEventListener("keydown", (e) => {
  if (!runActive || !world) return;
  if (e.key === "Enter") {
    handleEvents(startWave(world));
    if (world.coachStep === 1) world.coachStep = 2;
    refreshGameUi();
  }
  if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    world.paused = !world.paused;
    $("ov-pause").classList.toggle("hidden", !world.paused);
  }
  if (e.key === "f" || e.key === "F") {
    world.speed = world.speed >= 3 ? 1 : ((world.speed + 1) as 1 | 2 | 3);
    refreshGameUi();
  }
  if (e.key === "1") {
    handleEvents(castAbility(world, path, "storm"));
    refreshGameUi();
  }
  if (e.key === "2") {
    handleEvents(castAbility(world, path, "cryo"));
    refreshGameUi();
  }
  if (e.key === "3") {
    handleEvents(castAbility(world, path, "drop"));
    refreshGameUi();
  }
  if (e.key === "4") {
    handleEvents(castAbility(world, path, "rage"));
    refreshGameUi();
  }
  if (e.key === "Escape") {
    world.paused = true;
    $("ov-pause").classList.remove("hidden");
  }
  const t = selectedTower();
  if (!t) return;
  if (e.key === "t" || e.key === "T") {
    handleEvents(cycleTarget(world, t.uid));
    refreshSel();
  }
  if (e.key === "x" || e.key === "X") {
    handleEvents(sellTower(world, t.uid));
    refreshGameUi();
  }
});

// Coach auto-advance on early progress milestones
function maybeAdvanceCoach() {
  if (!world || !config.coach) return;
  if (world.coachStep === 2 && world.pops >= 5) world.coachStep = 3;
  if (world.coachStep === 3 && world.towers.some((t) => t.pathA + t.pathB >= 1)) world.coachStep = 4;
  if (world.coachStep === 4 && world.wave >= 8) world.coachStep = 5;
  if (world.coachStep === 5 && world.wave >= 15) world.coachStep = 6;
  if (world.coachStep === 6 && world.wave >= 25) world.coachStep = 99;
}

function frame(ts: number) {
  requestAnimationFrame(frame);
  if (!runActive || !world || !path) return;
  if (!lastTs) lastTs = ts;
  const frameDt = Math.min(0.1, (ts - lastTs) / 1000);
  lastTs = ts;

  if (!world.paused && world.phase !== "lost" && world.phase !== "won") {
    acc += frameDt * world.speed;
    let steps = 0;
    while (acc >= SIM_DT && steps < MAX_STEPS) {
      const { events, path: p2 } = stepSim(world, path, SIM_DT);
      path = p2;
      handleEvents(events);
      acc -= SIM_DT;
      steps++;
    }
    if (steps === MAX_STEPS) acc = 0;
    maybeAdvanceCoach();
  }

  drawWorld(ctx, world, path, hover, shopId);
  if ((ts | 0) % 5 === 0) {
    $("hudBan").textContent = String(Math.floor(world.ban));
    $("hudLives").textContent = String(world.lives);
    $("hudWave").textContent = String(world.wave);
    $("hudStreak").textContent = world.killStreak >= 5 ? `Streak x${world.killStreak}` : "Streak —";
    $("hudFever").classList.toggle("on", world.feverT > 0);
    refreshAbilities();
    refreshCoach();
  }
}

setMuted(progress.settings.muted);
preloadSliceArt(TOWERS.map((t) => t.id));
refreshHub();
showScreen("hub");
if (progress.games === 0) {
  ($("cfgLength") as HTMLSelectElement).value = "short";
  ($("cfgDiff") as HTMLSelectElement).value = "normal";
}
requestAnimationFrame(frame);
(window as unknown as { __td: unknown }).__td = () => ({ world, path, progress, config });
