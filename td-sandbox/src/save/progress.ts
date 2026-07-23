import { evaluateBadges, type RunBadgeContext } from "../content/badges";
import { defaultCosmetics, unlockFromBadges, type CosmeticState } from "../content/cosmetics";
import type { DiffId, LengthId, MapId, ModeId } from "../content/runConfig";

export const LIVE_KEY = "bananox_td_v1";
export const SLICE_KEY = "bananox_td_slice_v2";

export interface SliceProgress {
  schemaVersion: number;
  games: number;
  wins: number;
  bestWave: number;
  bestScore: number;
  shortWins: number;
  hardWins: number;
  mapPlays: Record<string, number>;
  mapLengthClears: Record<string, number>;
  badges: Record<string, number>;
  cosmetics: CosmeticState;
  settings: { muted: boolean; coach: boolean };
  migratedFromLive: boolean;
  updatedAt: number;
}

function defaultProgress(): SliceProgress {
  return {
    schemaVersion: 2,
    games: 0,
    wins: 0,
    bestWave: 0,
    bestScore: 0,
    shortWins: 0,
    hardWins: 0,
    mapPlays: {},
    mapLengthClears: {},
    badges: {},
    cosmetics: defaultCosmetics(),
    settings: { muted: false, coach: true },
    migratedFromLive: false,
    updatedAt: 0,
  };
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function migrateFromLive(into: SliceProgress): SliceProgress {
  const live = safeParse(
    typeof localStorage !== "undefined" ? localStorage.getItem(LIVE_KEY) : null
  ) as Record<string, unknown> | null;
  if (!live || typeof live !== "object") return into;

  into.migratedFromLive = true;
  const records = (live.records || live) as Record<string, number>;
  if (records.bestWave) into.bestWave = Math.max(into.bestWave, Number(records.bestWave) || 0);
  if (records.games) into.games = Math.max(into.games, Number(records.games) || 0);
  if (records.bestScore) into.bestScore = Math.max(into.bestScore, Number(records.bestScore) || 0);

  if (live.badges && typeof live.badges === "object") {
    for (const [k, v] of Object.entries(live.badges as Record<string, number>)) {
      const ts = Number(v) || 0;
      if (ts > 0) into.badges[k] = into.badges[k] || ts;
    }
  }
  if (live.mapLengthClears && typeof live.mapLengthClears === "object") {
    for (const [k, v] of Object.entries(live.mapLengthClears as Record<string, number>)) {
      const ts = Number(v) || 0;
      if (ts > 0) into.mapLengthClears[k] = into.mapLengthClears[k] || ts;
    }
  }
  if (live.maps && typeof live.maps === "object") {
    for (const [mapId, m] of Object.entries(live.maps as Record<string, { clears?: number }>)) {
      into.mapPlays[mapId] = Math.max(into.mapPlays[mapId] || 0, Number(m?.clears) || 0);
    }
  }
  into.cosmetics = unlockFromBadges(into.cosmetics, into.badges);
  return into;
}

export function loadProgress(): SliceProgress {
  let p = defaultProgress();
  const raw = safeParse(
    typeof localStorage !== "undefined" ? localStorage.getItem(SLICE_KEY) : null
  ) as Partial<SliceProgress> | null;
  // also try v1 key
  const rawV1 = safeParse(
    typeof localStorage !== "undefined" ? localStorage.getItem("bananox_td_slice_v1") : null
  ) as Partial<SliceProgress> | null;
  const src = raw || rawV1;
  if (src && typeof src === "object") {
    p = {
      ...defaultProgress(),
      ...src,
      settings: { ...defaultProgress().settings, ...src.settings },
      badges: src.badges || {},
      mapPlays: src.mapPlays || {},
      mapLengthClears: src.mapLengthClears || {},
      cosmetics: src.cosmetics || defaultCosmetics(),
    };
  }
  if (!p.migratedFromLive) {
    p = migrateFromLive(p);
    saveProgress(p);
  }
  p.cosmetics = unlockFromBadges(p.cosmetics, p.badges);
  return p;
}

export function saveProgress(p: SliceProgress): void {
  if (typeof localStorage === "undefined") return;
  p.updatedAt = Date.now();
  try {
    localStorage.setItem(SLICE_KEY, JSON.stringify(p));
  } catch {
    /* quota */
  }
}

export function recordRun(
  p: SliceProgress,
  opts: {
    won: boolean;
    wave: number;
    score: number;
    map: MapId;
    length: LengthId;
    difficulty: DiffId;
    mode: ModeId;
    reverse: boolean;
    blitz: boolean;
    usedFarm: boolean;
    onlyDart: boolean;
  }
): { progress: SliceProgress; newBadges: string[] } {
  p.games++;
  if (opts.won) p.wins++;
  p.bestWave = Math.max(p.bestWave, opts.wave);
  p.bestScore = Math.max(p.bestScore, opts.score);
  p.mapPlays[opts.map] = (p.mapPlays[opts.map] || 0) + 1;
  if (opts.won && opts.length === "short") p.shortWins++;
  if (opts.won && (opts.difficulty === "hard" || opts.difficulty === "starship")) p.hardWins++;

  const ctx: RunBadgeContext = {
    won: opts.won,
    wave: opts.wave,
    mode: opts.mode,
    map: opts.map,
    length: opts.length,
    difficulty: opts.difficulty,
    reverse: opts.reverse,
    blitz: opts.blitz,
    usedFarm: opts.usedFarm,
    onlyDart: opts.onlyDart,
    mapLengthClears: p.mapLengthClears,
  };
  // Short: any difficulty. Medium/Long: Hard+ only (atlas / map badges).
  if (opts.won) {
    if (opts.length === "short" || opts.difficulty === "hard" || opts.difficulty === "starship") {
      p.mapLengthClears[`${opts.map}_${opts.length}`] = Date.now();
    }
  }
  const newly = evaluateBadges(ctx, p.badges);
  const now = Date.now();
  for (const id of newly) p.badges[id] = now;
  p.cosmetics = unlockFromBadges(p.cosmetics, p.badges);
  saveProgress(p);
  return { progress: p, newBadges: newly };
}

export function computeScore(opts: {
  wave: number;
  pops: number;
  banEarned: number;
  won: boolean;
  difficulty: string;
  length: string;
  mode: string;
  reverse: boolean;
  blitz: boolean;
}): number {
  const diffMul = opts.difficulty === "starship" ? 1.85 : opts.difficulty === "hard" ? 1.4 : 1;
  const lenMul = opts.length === "long" ? 1.35 : opts.length === "short" ? 0.85 : 1;
  const modeMul =
    opts.mode === "rush" ? 1.15 : opts.mode === "party" ? 1.1 : opts.mode === "tour" ? 1.12 : 1;
  let mut = 1;
  if (opts.reverse) mut *= 1.08;
  if (opts.blitz) mut *= 1.12;
  const base =
    opts.wave * 100 + opts.pops * 2 + Math.floor(opts.banEarned * 0.1) + (opts.won ? 5000 : 0);
  return Math.floor(base * diffMul * lenMul * modeMul * mut);
}
