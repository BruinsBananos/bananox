import tunables from "../content/tunables.json";
import { eventCdBase, pickEvent, type EventId } from "../content/events";
import {
  DIFFS,
  getModeWaveCap,
  getTourEvery,
  MAP_ORDER,
  MODES,
  popBandMul,
  runBanMul,
  runDensMul,
  waveContentLevel,
  type RunConfig,
} from "../content/runConfig";
import { TOWER_BY_ID, TOWERS, type TargetMode } from "../content/towers";
import { buildWave } from "../content/waves";
import { bakeMap, isPlaceable, posAlong, type PathRuntime } from "../path/maps";
import { applyAuras, applyUpgrade, canUpgrade, recomputeStats } from "./stats";
import { acquireTargets, canDamage, canTarget } from "./targeting";
import type {
  AbilityId,
  ProjectileEntity,
  SimEvent,
  SimWorld,
  ThreatEntity,
  TowerEntity,
} from "./types";

export const W = 960;
export const H = 600;
export const COLS = tunables.cols as number;
export const ROWS = tunables.rows as number;

const MAX_THREATS = 240;
const MAX_PROJECTILES = 300;
const MAX_FLOATS = 40;
const MAX_FARMS = 3;
const PARTY_EVENT_BAN_CAP = 150;

export function createWorld(
  config: RunConfig,
  unlockedTowers?: string[]
): { world: SimWorld; path: PathRuntime } {
  const path = bakeMap(config.map, COLS, ROWS, W, H, config.reverse);
  const diff = DIFFS[config.difficulty];
  const mode = MODES[config.mode];
  const densMul = runDensMul(config);
  const banMul = runBanMul(config);
  const allIds = TOWERS.map((t) => t.id);
  const world: SimWorld = {
    config: { ...config },
    ban: diff.startBan + mode.startBan,
    lives: diff.lives,
    wave: 0,
    maxWave: getModeWaveCap(config.mode, config.length),
    pops: 0,
    banEarned: 0,
    phase: "prep",
    speed: 1,
    paused: false,
    towers: [],
    threats: [],
    projectiles: [],
    floats: [],
    spawnQueue: [],
    spawnTimer: 0,
    nextUid: 1,
    selectedUid: null,
    showRanges: false,
    showImmunities: false,
    waveActive: false,
    killStreak: 0,
    killStreakT: 0,
    feverT: mode.feverStart > 0 ? mode.feverStart : 0,
    rageT: 0,
    abilities: {
      storm: { cd: 0, maxCd: 28 },
      cryo: { cd: 0, maxCd: 20 },
      drop: { cd: 0, maxCd: 28 },
      rage: { cd: 0, maxCd: 32 },
    },
    dropUses: 0,
    perfectWaves: 0,
    leakedThisWave: false,
    coachStep: config.coach ? 0 : 99,
    densMul,
    banMul,
    rewardMul: diff.reward,
    interestCap: diff.interestCap,
    hpScale: diff.scale,
    speedMul: config.blitz ? 1.42 : 1,
    eventId: null,
    eventT: 0,
    eventCd: eventCdBase(mode.eventScale, config.blitz, config.length === "short"),
    eventCamoAll: false,
    eventLeadSoft: false,
    eventRangeMul: 1,
    eventBountyMul: 1,
    eventRofMul: mode.feverStart > 0 ? 1.25 : 1,
    eventAbilityHaste: 1,
    tourStop: 0,
    usedFarm: false,
    onlyDart: true,
    jackpotMul: mode.jackpot,
    shake: 0,
    hitFlash: 0,
    bossBanner: "",
    bossBannerT: 0,
    ceremonyT: 0,
    ceremonyX: 0,
    ceremonyY: 0,
    ceremonyLabel: "",
    dailySeed: null,
    usedGodTools: false,
    unlockedTowers: unlockedTowers?.length ? unlockedTowers : allIds,
    feverRofOnly: mode.feverStart > 0,
    eventBanThisWave: 0,
    swarmNext: false,
  };
  if (config.sandbox) world.config.ranked = false;
  return { world, path };
}

function uid(world: SimWorld) {
  return world.nextUid++;
}

function layerMeta(id: string) {
  return (
    tunables.layers as Record<
      string,
      { name: string; next: string | null; speed: number; value: number; r: number; lives: number; color: string }
    >
  )[id];
}

function addBan(world: SimWorld, n: number, x?: number, y?: number, color = "#ffe566") {
  n = Math.floor(n);
  if (n <= 0) return;
  world.ban += n;
  world.banEarned += n;
  if (x != null && y != null && world.floats.length < MAX_FLOATS) {
    world.floats.push({ x, y, text: `+${n}`, color, life: 0.7, vy: -28 });
  }
}

function makeLayer(
  world: SimWorld,
  layerId: string,
  dist: number,
  flags: { camo?: boolean; lead?: boolean; fortified?: boolean }
): ThreatEntity {
  const L = layerMeta(layerId) || layerMeta("green");
  return {
    uid: uid(world),
    kind: "layer",
    layer: layerId,
    dist,
    x: 0,
    y: 0,
    r: L.r,
    speed: L.speed * world.speedMul,
    baseSpeed: L.speed * world.speedMul,
    camo: !!flags.camo,
    lead: !!flags.lead,
    fortified: !!flags.fortified,
    alive: true,
    hp: 1,
    maxHp: 1,
    value: L.value,
    lives: L.lives,
    slowMul: 1,
    freezeT: 0,
    coatBrittle: 0,
    coatMidas: 0,
    coatT: 0,
    color: L.color,
  };
}

function makeSpecial(
  world: SimWorld,
  kind: "ceramic" | "boss" | "freighter" | "titan",
  dist: number,
  fortified?: boolean
): ThreatEntity {
  const S = (tunables.specials as Record<string, {
    hp: number; speed: number; value: number; lives: number; children: string; childCount: number; r: number; color: string; lead?: boolean;
  }>)[kind];
  const hp = Math.floor(S.hp * world.hpScale);
  return {
    uid: uid(world),
    kind,
    layer: null,
    dist,
    x: 0,
    y: 0,
    r: S.r,
    speed: S.speed * world.speedMul,
    baseSpeed: S.speed * world.speedMul,
    camo: false,
    lead: !!S.lead,
    fortified: !!fortified,
    alive: true,
    hp,
    maxHp: hp,
    value: S.value,
    lives: S.lives,
    slowMul: 1,
    freezeT: 0,
    coatBrittle: 0,
    coatMidas: 0,
    coatT: 0,
    children: S.children,
    childCount: S.childCount,
    color: S.color,
  };
}

const COAT_DURATION = 4;

function applyCoat(th: ThreatEntity, brittle: number, midas: number) {
  if (brittle > 0) th.coatBrittle = Math.max(th.coatBrittle, brittle);
  if (midas > 0) th.coatMidas = Math.max(th.coatMidas, midas);
  th.coatT = COAT_DURATION;
}

function syncThreat(path: PathRuntime, th: ThreatEntity) {
  const p = posAlong(path, th.dist);
  th.x = p.x;
  th.y = p.y;
}

export function placeTower(
  world: SimWorld,
  path: PathRuntime,
  defId: string,
  c: number,
  r: number
): SimEvent[] {
  const def = TOWER_BY_ID[defId];
  if (!def) return [{ type: "toast", msg: "Unknown tower" }];
  if (!world.unlockedTowers.includes(defId) && !world.config.sandbox) {
    return [{ type: "toast", msg: "Tower locked — progress to unlock." }];
  }
  if (world.ban < def.cost) return [{ type: "toast", msg: "Need more BAN." }];
  if (!isPlaceable(path, c, r)) return [{ type: "toast", msg: "That's the trail — build on the grass." }];
  if (world.towers.some((t) => t.c === c && t.r === r)) return [{ type: "toast", msg: "Tile taken." }];
  if (world.towers.length >= 80) return [{ type: "toast", msg: "Tower cap." }];
  if (defId === "farm") {
    const farms = world.towers.filter((t) => t.farm).length;
    if (farms >= MAX_FARMS) return [{ type: "toast", msg: `Max ${MAX_FARMS} Farms per run.` }];
  }

  world.ban -= def.cost;
  if (defId === "farm") world.usedFarm = true;
  if (defId !== "dart") world.onlyDart = false;

  const t: TowerEntity = {
    uid: uid(world),
    defId,
    c,
    r,
    x: c * path.tw + path.tw / 2,
    y: r * path.th + path.th / 2,
    pathA: 0,
    pathB: 0,
    deepPath: null,
    invested: def.cost,
    targetMode: def.defaultTarget,
    cooldown: 0,
    range: def.range,
    rof: def.rof,
    pierce: def.pierce,
    pop: def.pop,
    splash: def.splash,
    slow: def.slow,
    camo: def.camo,
    lead: def.lead,
    multishot: def.multishot,
    preferStrong: !!def.preferStrong,
    farm: !!def.farm,
    freezePulse: !!def.freezePulse,
    support: !!def.support,
    coat: !!def.coat,
    coatBrittle: 0,
    coatMidas: 0,
    income: 0,
    auraRof: 0,
    auraCamo: false,
    color: def.color,
    effCamo: def.camo,
    effRofMul: 1,
  };
  recomputeStats(t);
  world.towers.push(t);
  world.selectedUid = t.uid;
  if (world.coachStep === 0) world.coachStep = 1;
  return [{ type: "place", defId }];
}

export function upgradeTower(world: SimWorld, towerUid: number, pathI: 0 | 1): SimEvent[] {
  const t = world.towers.find((x) => x.uid === towerUid);
  if (!t) return [{ type: "toast", msg: "No tower" }];
  const check = canUpgrade(t, pathI);
  if (!check.ok) return [{ type: "toast", msg: check.reason || "Locked" }];
  const cost = check.cost || 0;
  if (world.ban < cost) return [{ type: "toast", msg: "Need more BAN." }];
  world.ban -= cost;
  t.invested += cost;
  applyUpgrade(t, pathI);
  if (world.coachStep === 3) world.coachStep = 4;
  const tier = pathI === 0 ? t.pathA : t.pathB;
  const events: SimEvent[] = [{ type: "upgrade", path: pathI, tier, deep: tier >= 3 }];
  if (tier === 4) {
    const def = TOWER_BY_ID[t.defId];
    const name = def?.paths[pathI][3]?.name || "Tier 4";
    world.ceremonyT = 1.2;
    world.ceremonyX = t.x;
    world.ceremonyY = t.y;
    world.ceremonyLabel = name;
    world.shake = Math.max(world.shake, 0.35);
    world.hitFlash = Math.max(world.hitFlash, 0.2);
    events.push({ type: "tier4", towerUid: t.uid, name });
    events.push({ type: "toast", msg: `✦ ${name}` });
  }
  return events;
}

export function sellTower(world: SimWorld, towerUid: number): SimEvent[] {
  const i = world.towers.findIndex((x) => x.uid === towerUid);
  if (i < 0) return [];
  const t = world.towers[i];
  const refund = Math.floor(t.invested * tunables.sellRate);
  world.ban += refund;
  world.towers.splice(i, 1);
  if (world.selectedUid === towerUid) world.selectedUid = null;
  return [{ type: "sell" }, { type: "toast", msg: `Sold +${refund} BAN` }];
}

export function cycleTarget(world: SimWorld, towerUid: number): SimEvent[] {
  const t = world.towers.find((x) => x.uid === towerUid);
  if (!t) return [];
  const modes: TargetMode[] = ["first", "last", "strong", "close"];
  t.targetMode = modes[(modes.indexOf(t.targetMode) + 1) % modes.length];
  return [{ type: "toast", msg: `Target: ${t.targetMode}` }];
}

function killBounty(world: SimWorld, base: number, midasBonus = 0, layerId?: string | null): number {
  const streakMul = 1 + Math.min(0.75, world.killStreak * 0.025);
  const waveMul = 1 + world.wave * tunables.waveMulPerWave;
  const cl = waveContentLevel(Math.max(1, world.wave), world.config.mode, world.config.length);
  const band = popBandMul(cl);
  // Cap ONLY fever × event bounty (max 3). Rush start fever is ROF-only.
  const feverMul = world.feverT > 0 && !world.feverRofOnly ? 2 : 1;
  const eventMul = world.eventBountyMul || 1;
  const stack = Math.min(3, feverMul * eventMul);
  let midas = Math.min(0.5, Math.max(0, midasBonus));
  if (layerId === "golden") midas *= 0.5; // jackpot half midas
  const midasMul = 1 + midas;
  const mult = world.rewardMul * world.banMul * streakMul * waveMul * band * stack * midasMul;
  return Math.max(1, Math.floor(base * mult));
}

function triggerFever(world: SimWorld, events: SimEvent[], dur: number, rofOnly = false) {
  world.feverT = Math.max(world.feverT, dur);
  world.feverRofOnly = rofOnly;
  if (!rofOnly) world.eventRofMul = Math.max(world.eventRofMul, 1.25);
  else world.eventRofMul = Math.max(world.eventRofMul, 1.25);
  world.hitFlash = Math.max(world.hitFlash, 0.25);
  world.shake = Math.max(world.shake, 0.2);
  events.push({ type: "fever", duration: dur });
  events.push({ type: "toast", msg: rofOnly ? "FEVER (ROF)" : "FEVER!" });
}

function onKill(world: SimWorld, events: SimEvent[]) {
  world.killStreak++;
  world.killStreakT = 3.2;
  if (
    world.killStreak === 15 ||
    world.killStreak === 30 ||
    world.killStreak === 50 ||
    (world.killStreak > 0 && world.killStreak % 25 === 0)
  ) {
    triggerFever(world, events, 4 + Math.min(6, Math.floor(world.killStreak / 15)), false);
  }
}

function peelLayer(world: SimWorld, th: ThreatEntity, events: SimEvent[]): void {
  if (th.kind !== "layer" || !th.layer) {
    th.alive = false;
    return;
  }
  const L = layerMeta(th.layer);
  const next = L?.next;
  const bounty = killBounty(world, th.value, th.coatMidas, th.layer);
  addBan(world, bounty, th.x, th.y);
  world.pops++;
  onKill(world, events);
  events.push({ type: "pop", x: th.x, y: th.y, value: bounty, layer: th.layer });
  if (!next) {
    th.alive = false;
    return;
  }
  const nL = layerMeta(next);
  th.layer = next;
  th.r = nL.r;
  th.baseSpeed = nL.speed * world.speedMul;
  th.value = nL.value;
  th.lives = nL.lives;
  th.color = nL.color;
  th.hp = 1;
  th.maxHp = 1;
  th.fortified = false;
}

function isShell(th: ThreatEntity) {
  return th.kind === "ceramic" || th.kind === "boss" || th.kind === "freighter" || th.kind === "titan";
}

function applyPop(
  world: SimWorld,
  path: PathRuntime,
  th: ThreatEntity,
  pop: number,
  slow: number,
  events: SimEvent[]
): void {
  if (!th.alive) return;
  if (slow > 0) {
    th.slowMul = Math.max(0.18, Math.min(th.slowMul, 1 - slow));
    const maxF = th.kind === "boss" || th.kind === "freighter" || th.kind === "titan" ? 0.45 : 1.0;
    th.freezeT = Math.max(th.freezeT, Math.min(maxF, slow > 0.4 ? 0.55 : 0.22));
  }
  // Brittle coat: extra pop while coated
  if (pop > 0 && th.coatT > 0 && th.coatBrittle > 0) {
    pop += th.coatBrittle;
  }
  if (pop <= 0) return;

  if (isShell(th)) {
    let dmg = pop;
    if (th.fortified) dmg = Math.max(1, Math.floor(dmg * 0.5));
    th.hp -= dmg;
    if (th.hp <= 0) {
      const bounty = killBounty(world, th.value, th.coatMidas, th.kind);
      addBan(world, bounty, th.x, th.y, "#fb923c");
      world.pops++;
      onKill(world, events);
      events.push({ type: "pop", x: th.x, y: th.y, value: bounty, layer: th.kind });
      th.alive = false;
      const child = th.children || "zebra";
      const n = th.childCount || 2;
      for (let i = 0; i < n && world.threats.length < MAX_THREATS; i++) {
        let ch: ThreatEntity;
        if (child === "ceramic" || child === "boss" || child === "freighter") {
          ch = makeSpecial(world, child as "ceramic" | "boss" | "freighter", Math.max(0, th.dist - 8 * i));
        } else {
          ch = makeLayer(world, child, Math.max(0, th.dist - 6 * i), {});
        }
        syncThreat(path, ch);
        world.threats.push(ch);
      }
    }
    return;
  }

  if (th.fortified && pop < 2 && tunables.fortifiedBlocksPop1) return;
  let remaining = th.fortified ? Math.max(1, Math.floor(pop * 0.5)) : pop;
  while (remaining > 0 && th.alive) {
    peelLayer(world, th, events);
    remaining--;
  }
}

function towerCanTarget(t: TowerEntity, th: ThreatEntity, world: SimWorld): boolean {
  if (world.eventCamoAll) return th.alive;
  return canTarget({ ...t, camo: t.effCamo }, th);
}

function towerCanDamage(t: TowerEntity, th: ThreatEntity, world: SimWorld): boolean {
  if (world.eventLeadSoft && th.lead) return true; // soft allows hit; damage halved in apply
  return canDamage(t, th);
}

function fireTower(world: SimWorld, path: PathRuntime, tower: TowerEntity, events: SimEvent[]) {
  if (tower.farm || tower.support) return;
  let rofMul = tower.effRofMul * world.eventRofMul;
  if (world.feverT > 0 && world.feverRofOnly) rofMul *= 1; // already in eventRofMul
  else if (world.feverT > 0 && !world.feverRofOnly) rofMul *= 1.25;
  if (world.rageT > 0) rofMul *= 1.45;

  // temp camo for targeting
  const camoSave = tower.camo;
  tower.camo = tower.effCamo || world.eventCamoAll;
  const rangeSave = tower.range;
  tower.range *= world.eventRangeMul;

  const n = 1 + tower.multishot;
  const targets = acquireTargets(tower, world.threats, path, n).filter((th) =>
    towerCanTarget(tower, th, world)
  );
  tower.camo = camoSave;
  tower.range = rangeSave;
  if (!targets.length) return;
  tower.cooldown = tower.rof / rofMul;

  // Alchemist: coat pulse only (no raw pop DPS / no farm income)
  if (tower.coat) {
    const brittle = tower.coatBrittle > 0 || tower.coatMidas > 0 ? tower.coatBrittle : 1;
    const midas = tower.coatMidas;
    const r = tower.range * world.eventRangeMul;
    for (const th of world.threats) {
      if (!th.alive || !towerCanTarget(tower, th, world)) continue;
      if (Math.hypot(th.x - tower.x, th.y - tower.y) > r) continue;
      applyCoat(th, brittle, midas);
    }
    return;
  }

  if (tower.freezePulse) {
    for (const th of world.threats) {
      if (!th.alive || !towerCanTarget(tower, th, world)) continue;
      if (Math.hypot(th.x - tower.x, th.y - tower.y) > tower.range * world.eventRangeMul) continue;
      if (!towerCanDamage(tower, th, world)) {
        events.push({ type: "leadFail", x: th.x, y: th.y });
        continue;
      }
      applyPop(world, path, th, tower.pop, tower.slow || 0.4, events);
    }
    return;
  }

  if (world.projectiles.length > MAX_PROJECTILES - n) return;
  for (const th of targets) {
    const ang = Math.atan2(th.y - tower.y, th.x - tower.x);
    const speed = 420;
    world.projectiles.push({
      uid: uid(world),
      x: tower.x,
      y: tower.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      pierce: tower.pierce,
      pop: tower.pop,
      splash: tower.splash,
      slow: tower.slow,
      camo: tower.effCamo || world.eventCamoAll,
      lead: tower.lead || world.eventLeadSoft,
      targetUid: th.uid,
      ttl: 1.8,
      color: tower.color,
    });
  }
}

function interestOf(world: SimWorld): number {
  const raw = Math.floor(world.ban * tunables.interestRate);
  let left = raw;
  let paid = 0;
  for (const b of [
    { n: 150, m: 1 },
    { n: 150, m: 0.6 },
    { n: 200, m: 0.35 },
    { n: 99999, m: 0.15 },
  ]) {
    const take = Math.min(left, b.n);
    paid += Math.floor(take * b.m);
    left -= take;
  }
  return Math.min(world.interestCap, paid);
}

function clearEventMods(world: SimWorld) {
  world.eventId = null;
  world.eventT = 0;
  world.eventCamoAll = false;
  world.eventLeadSoft = false;
  world.eventRangeMul = 1;
  world.eventBountyMul = 1;
  world.eventRofMul = 1;
  world.eventAbilityHaste = 1;
}

function startEvent(world: SimWorld, path: PathRuntime, events: SimEvent[]) {
  const ev = pickEvent(Math.random);
  world.eventId = ev.id;
  world.eventT = ev.duration || 0.1;
  events.push({ type: "event", id: ev.id, name: ev.name });
  events.push({ type: "toast", msg: `Event: ${ev.name}` });

  switch (ev.id) {
    case "double":
      world.eventBountyMul = 2;
      break;
    case "slowmo":
      for (const th of world.threats) th.slowMul = Math.min(th.slowMul, 0.7);
      break;
    case "rain": {
      // Party: hard per-wave event BAN cap. Other modes: softer rain only.
      const want = Math.min(ev.banCap || 120, 40 + world.wave * 2);
      const cap =
        world.config.mode === "party" ? PARTY_EVENT_BAN_CAP : Math.min(200, 80 + world.wave * 3);
      const room = Math.max(0, cap - world.eventBanThisWave);
      const ban = Math.min(want, room);
      if (ban > 0) {
        addBan(world, ban);
        world.eventBanThisWave += ban;
      } else {
        events.push({ type: "toast", msg: "Event BAN cap this wave" });
      }
      break;
    }
    case "frenzy":
      world.eventRofMul = Math.max(world.eventRofMul, 1.2);
      world.eventBountyMul = 1.5;
      break;
    case "camo_clear":
      world.eventCamoAll = true;
      break;
    case "lead_soft":
      world.eventLeadSoft = true;
      break;
    case "jackpot_spawn":
      if (world.threats.length < MAX_THREATS) {
        const j = makeLayer(world, "golden", 0, {});
        syncThreat(path, j);
        world.threats.push(j);
      }
      break;
    case "freeze_party":
      for (const th of world.threats) {
        th.slowMul = Math.min(th.slowMul, 0.55);
        th.freezeT = Math.max(th.freezeT, 0.4);
      }
      break;
    case "range_up":
      world.eventRangeMul = 1.15;
      break;
    case "ability_haste":
      world.eventAbilityHaste = 1.5;
      break;
    case "particle_fiesta":
      world.eventBountyMul = 1.1;
      break;
    case "swarm":
      world.swarmNext = true;
      events.push({ type: "toast", msg: "Peel Panic — next wave denser!" });
      break;
  }
}

function maybeTourRotate(world: SimWorld, path: PathRuntime, events: SimEvent[]): PathRuntime {
  const every = getTourEvery(world.config.mode, world.config.length);
  if (!every || world.wave % every !== 0 || world.wave === 0) return path;
  world.tourStop = (world.tourStop + 1) % MAP_ORDER.length;
  const nextMap = MAP_ORDER[world.tourStop]!;
  world.config.map = nextMap;
  const newPath = bakeMap(nextMap, COLS, ROWS, W, H, world.config.reverse);
  // free re-place: snap towers to nearest placeable
  for (const t of world.towers) {
    if (isPlaceable(newPath, t.c, t.r) && !world.towers.some((o) => o !== t && o.c === t.c && o.r === t.r)) {
      t.x = t.c * newPath.tw + newPath.tw / 2;
      t.y = t.r * newPath.th + newPath.th / 2;
      continue;
    }
    // find free cell
    let found = false;
    for (let r = 0; r < ROWS && !found; r++) {
      for (let c = 0; c < COLS && !found; c++) {
        if (!isPlaceable(newPath, c, r)) continue;
        if (world.towers.some((o) => o !== t && o.c === c && o.r === r)) continue;
        t.c = c;
        t.r = r;
        t.x = c * newPath.tw + newPath.tw / 2;
        t.y = r * newPath.th + newPath.th / 2;
        found = true;
      }
    }
  }
  events.push({ type: "tour", map: nextMap });
  events.push({ type: "toast", msg: `Tour → ${nextMap}` });
  return newPath;
}

// path ref holder for tour — returned via step result
export let lastPath: PathRuntime | null = null;

function endWave(world: SimWorld, path: PathRuntime, events: SimEvent[]): PathRuntime {
  world.waveActive = false;
  world.phase = "prep";
  if (!world.leakedThisWave) world.perfectWaves++;
  const perfectMul = world.leakedThisWave ? 1 : 1.15;
  const cl = waveContentLevel(Math.max(1, world.wave), world.config.mode, world.config.length);
  const band = popBandMul(cl);
  const clear = Math.floor(
    (tunables.clearBonusBase + world.wave * tunables.clearBonusPerWave) *
      world.rewardMul *
      world.banMul *
      perfectMul *
      band
  );
  world.eventBanThisWave = 0;
  const interest = interestOf(world);
  let farm = 0;
  for (const t of world.towers) farm += t.income;
  let farmPaid = 0;
  let left = farm;
  for (const b of [
    { n: 200, m: 1 },
    { n: 200, m: 0.7 },
    { n: 99999, m: 0.4 },
  ]) {
    const take = Math.min(left, b.n);
    farmPaid += Math.floor(take * b.m);
    left -= take;
  }
  addBan(world, clear + interest + farmPaid);
  events.push({ type: "waveClear", ban: clear, interest, farm: farmPaid });
  events.push({
    type: "toast",
    msg: `Clear +${clear} · interest +${interest}` + (farmPaid ? ` · farm +${farmPaid}` : ""),
  });

  let p = path;
  if (world.wave < world.maxWave) {
    p = maybeTourRotate(world, path, events);
  }

  if (world.wave >= world.maxWave) {
    world.phase = "won";
    events.push({ type: "won" });
    events.push({ type: "toast", msg: "CORE SECURE" });
  }
  return p;
}

export function startWave(world: SimWorld): SimEvent[] {
  if (world.phase === "lost" || world.phase === "won") return [];
  if (world.waveActive) return [{ type: "toast", msg: "Wave in progress" }];
  if (world.wave >= world.maxWave) return [{ type: "toast", msg: "Run complete" }];

  world.wave++;
  world.leakedThisWave = false;
  world.eventBanThisWave = 0;
  let dens = world.densMul;
  if (world.swarmNext) {
    dens *= 1.3;
    world.swarmNext = false;
  }
  const def = buildWave(
    world.wave,
    world.config.mode,
    world.config.length,
    dens,
    world.jackpotMul
  );
  world.spawnQueue = [];
  let t = 0;
  for (const g of def.groups) {
    t += g.delay;
    for (let i = 0; i < g.count; i++) {
      world.spawnQueue.push({
        delay: t + i * g.spacing,
        unit: g.unit,
        camo: !!g.camo,
        lead: !!g.lead,
        fortified: !!g.fortified,
      });
    }
  }
  world.spawnQueue.sort((a, b) => a.delay - b.delay);
  world.spawnTimer = 0;
  world.waveActive = true;
  world.phase = "combat";
  if (world.coachStep === 1) world.coachStep = 2;
  return [{ type: "waveStart", wave: world.wave }];
}

export function castAbility(world: SimWorld, path: PathRuntime, id: AbilityId): SimEvent[] {
  const ab = world.abilities[id];
  if (!ab || ab.cd > 0) return [{ type: "toast", msg: "Ability cooling down" }];
  const events: SimEvent[] = [{ type: "ability", id }];

  if (id === "storm") {
    const n = 12 + Math.floor(world.wave / 10);
    const list = [...world.threats].filter((th) => th.alive).sort((a, b) => b.dist - a.dist).slice(0, n);
    for (const th of list) {
      if (isShell(th)) {
        th.hp -= 15;
        if (th.hp <= 0) applyPop(world, path, th, 99, 0, events);
      } else applyPop(world, path, th, 1, 0, events);
    }
    events.push({ type: "toast", msg: "Peel Storm!" });
  } else if (id === "cryo") {
    for (const th of world.threats) {
      if (!th.alive) continue;
      const freeze = isShell(th) && th.kind !== "ceramic" ? 0.3 : 0.75;
      th.freezeT = Math.max(th.freezeT, freeze);
      th.slowMul = Math.max(0.18, th.slowMul * 0.5);
    }
    events.push({ type: "toast", msg: "Cryo Core!" });
  } else if (id === "drop") {
    world.dropUses++;
    const diminish = 1 / (1 + world.dropUses * 0.15);
    let drop = Math.floor((80 + world.wave * 12) * world.rewardMul * diminish);
    // Softcap: half after 8 uses, lower floor so the half is not undone
    if (world.dropUses > 8) {
      drop = Math.max(20, Math.floor(drop * 0.5));
    } else {
      drop = Math.max(40, drop);
    }
    addBan(world, drop);
    events.push({ type: "toast", msg: `Banana Drop +${drop}` });
  } else if (id === "rage") {
    world.rageT = Math.max(world.rageT, 6);
    events.push({ type: "toast", msg: "Jungle Rage!" });
  }

  ab.cd = ab.maxCd;
  return events;
}

export function stepSim(world: SimWorld, path: PathRuntime, dt: number): { events: SimEvent[]; path: PathRuntime } {
  const events: SimEvent[] = [];
  let pathRef = path;
  if (world.paused || world.phase === "lost" || world.phase === "won") return { events, path: pathRef };

  if (world.feverT > 0) {
    world.feverT = Math.max(0, world.feverT - dt);
    if (world.feverT <= 0) {
      world.feverRofOnly = false;
      if (world.eventRofMul <= 1.25 && world.rageT <= 0) world.eventRofMul = 1;
    }
  }
  if (world.rageT > 0) world.rageT = Math.max(0, world.rageT - dt);
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 1.8);
  if (world.hitFlash > 0) world.hitFlash = Math.max(0, world.hitFlash - dt * 2.5);
  if (world.bossBannerT > 0) world.bossBannerT = Math.max(0, world.bossBannerT - dt);
  if (world.ceremonyT > 0) world.ceremonyT = Math.max(0, world.ceremonyT - dt);
  if (world.killStreakT > 0) {
    world.killStreakT -= dt;
    if (world.killStreakT <= 0) world.killStreak = 0;
  }

  // events
  if (world.eventT > 0) {
    world.eventT -= dt;
    if (world.eventT <= 0) clearEventMods(world);
  } else {
    world.eventCd -= dt;
    if (world.eventCd <= 0 && world.waveActive) {
      startEvent(world, pathRef, events);
      world.eventCd = eventCdBase(
        MODES[world.config.mode].eventScale,
        world.config.blitz,
        world.config.length === "short"
      );
    }
  }

  const haste = world.eventAbilityHaste;
  for (const id of Object.keys(world.abilities) as AbilityId[]) {
    if (world.abilities[id].cd > 0) {
      world.abilities[id].cd = Math.max(0, world.abilities[id].cd - dt * haste);
    }
  }

  for (const f of world.floats) {
    f.life -= dt;
    f.y += f.vy * dt;
  }
  world.floats = world.floats.filter((f) => f.life > 0);

  applyAuras(world.towers);

  if (world.waveActive && world.spawnQueue.length) {
    world.spawnTimer += dt;
    while (
      world.spawnQueue.length &&
      world.spawnQueue[0].delay <= world.spawnTimer &&
      world.threats.length < MAX_THREATS
    ) {
      const s = world.spawnQueue.shift()!;
      let th: ThreatEntity;
      if (s.unit === "ceramic" || s.unit === "boss" || s.unit === "freighter" || s.unit === "titan") {
        th = makeSpecial(world, s.unit, 0, s.fortified);
      } else {
        th = makeLayer(world, s.unit, 0, { camo: s.camo, lead: s.lead, fortified: s.fortified });
      }
      syncThreat(pathRef, th);
      world.threats.push(th);
      if (th.kind === "boss" || th.kind === "freighter" || th.kind === "titan") {
        world.bossBanner =
          th.kind === "titan" ? "VAULTBREAKER TITAN" : th.kind === "freighter" ? "POTASSIUM FREIGHTER" : "BAN-BARGE";
        world.bossBannerT = 2.2;
        world.shake = Math.max(world.shake, 0.45);
        world.hitFlash = Math.max(world.hitFlash, 0.15);
        events.push({ type: "bossSpawn", kind: th.kind, x: th.x, y: th.y });
      }
    }
  }

  for (const t of world.towers) {
    if (t.farm || t.support) continue;
    t.cooldown -= dt;
    if (t.cooldown <= 0) fireTower(world, pathRef, t, events);
  }

  for (const p of world.projectiles) {
    p.ttl -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.ttl <= 0 || p.pierce <= 0) {
      p.pierce = 0;
      continue;
    }
    for (const th of world.threats) {
      if (!th.alive || p.pierce <= 0) continue;
      if (th.camo && !p.camo) continue;
      if (Math.hypot(th.x - p.x, th.y - p.y) > th.r + 6) continue;
      const softLead = world.eventLeadSoft && th.lead && !p.lead;
      if (th.lead && !p.lead && !world.eventLeadSoft) {
        events.push({ type: "leadFail", x: th.x, y: th.y });
        p.pierce--;
        continue;
      }
      let hitPop = softLead ? Math.max(1, Math.floor(p.pop * 0.5)) : p.pop;
      applyPop(world, pathRef, th, hitPop, p.slow, events);
      if (p.splash > 0) {
        for (const o of world.threats) {
          if (!o.alive || o.uid === th.uid) continue;
          if (o.camo && !p.camo) continue;
          if (Math.hypot(o.x - th.x, o.y - th.y) <= p.splash) {
            const softO = world.eventLeadSoft && o.lead && !p.lead;
            if (o.lead && !p.lead && !world.eventLeadSoft) continue;
            const sp = softO ? Math.max(1, Math.floor(p.pop * 0.5)) : Math.max(1, p.pop);
            applyPop(world, pathRef, o, sp, p.slow * 0.5, events);
          }
        }
      }
      p.pierce--;
    }
  }
  world.projectiles = world.projectiles.filter((p) => p.pierce > 0 && p.ttl > 0);

  for (const th of world.threats) {
    if (!th.alive) continue;
    if (th.freezeT > 0) th.freezeT -= dt;
    else {
      let spd = th.baseSpeed * th.slowMul;
      if (world.eventId === "slowmo") spd *= 0.7;
      th.dist += spd * dt;
    }
    th.slowMul = Math.min(1, th.slowMul + dt * 0.15);
    if (th.coatT > 0) {
      th.coatT -= dt;
      if (th.coatT <= 0) {
        th.coatBrittle = 0;
        th.coatMidas = 0;
        th.coatT = 0;
      }
    }
    syncThreat(pathRef, th);
    if (th.dist >= pathRef.pathLen) {
      th.alive = false;
      world.lives -= th.lives;
      world.leakedThisWave = true;
      world.killStreak = 0;
      events.push({ type: "leak", lives: th.lives });
      if (world.lives <= 0) {
        world.lives = 0;
        world.phase = "lost";
        events.push({ type: "lost" });
      }
    }
  }
  world.threats = world.threats.filter((t) => t.alive);

  if (
    world.waveActive &&
    world.spawnQueue.length === 0 &&
    world.threats.length === 0 &&
    world.phase === "combat"
  ) {
    pathRef = endWave(world, pathRef, events);
  }

  lastPath = pathRef;
  return { events, path: pathRef };
}

export function godCash(world: SimWorld, n = 5000) {
  if (!world.config.sandbox) return; // P0: never on ranked
  world.ban += n;
  world.usedGodTools = true;
  world.config.ranked = false;
}

export function forceWave(world: SimWorld, n: number) {
  world.wave = Math.max(0, Math.min(world.maxWave, n) - 1);
  world.spawnQueue = [];
  world.threats = [];
  world.projectiles = [];
  world.waveActive = false;
  if (world.phase !== "lost" && world.phase !== "won") world.phase = "prep";
  return startWave(world);
}

export { TOWERS, interestOf as interestPreview };
