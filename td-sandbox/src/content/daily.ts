/**
 * Daily seeded challenge — cosmetic rewards only (Design Lock).
 * Never grants tower DPS, lives, or eco power.
 */

import type { DiffId, LengthId, MapId, ModeId } from "./runConfig";
import { MAP_ORDER } from "./runConfig";

export interface DailyChallenge {
  seed: string;
  date: string;
  mode: ModeId;
  map: MapId;
  length: LengthId;
  difficulty: DiffId;
  reverse: boolean;
  blitz: boolean;
  title: string;
  /** Cosmetic currency on clear (not power) */
  cosmeticReward: number;
  cosmeticId: string;
}

/** Simple string hash → [0,1) mulberry-like */
export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todayUTC(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function getDailyChallenge(date = todayUTC(), clientMajor = "0.4"): DailyChallenge {
  const seed = `banano-td|${date}|${clientMajor}`;
  const rng = mulberry32((hashSeed(seed) * 0xffffffff) >>> 0);
  const modes: ModeId[] = ["classic", "rush", "party"];
  const lengths: LengthId[] = ["short", "medium"];
  const diffs: DiffId[] = ["normal", "hard"];
  const map = MAP_ORDER[Math.floor(rng() * MAP_ORDER.length)]!;
  const mode = modes[Math.floor(rng() * modes.length)]!;
  const length = lengths[Math.floor(rng() * lengths.length)]!;
  const difficulty = diffs[Math.floor(rng() * diffs.length)]!;
  const reverse = rng() > 0.7;
  const blitz = rng() > 0.75;

  return {
    seed,
    date,
    mode,
    map,
    length,
    difficulty,
    reverse,
    blitz,
    title: `Daily · ${date}`,
    cosmeticReward: 25 + Math.floor(rng() * 26),
    cosmeticId: `daily_${date.replace(/-/g, "")}`,
  };
}

export interface DailyProgress {
  lastDate: string;
  cleared: boolean;
  bestScore: number;
  cosmeticCurrency: number;
  titles: string[];
}

const DAILY_KEY = "bananox_td_daily_v1";

export function loadDailyProgress(): DailyProgress {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) return { ...{ lastDate: "", cleared: false, bestScore: 0, cosmeticCurrency: 0, titles: [] }, ...JSON.parse(raw) };
  } catch {
    /* */
  }
  return { lastDate: "", cleared: false, bestScore: 0, cosmeticCurrency: 0, titles: [] };
}

export function saveDailyProgress(p: DailyProgress) {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(p));
  } catch {
    /* */
  }
}

/** On win of today's seed — cosmetic only. */
export function claimDailyWin(daily: DailyChallenge, score: number): { currency: number; title: string } {
  const p = loadDailyProgress();
  if (p.lastDate !== daily.date) {
    p.lastDate = daily.date;
    p.cleared = false;
    p.bestScore = 0;
  }
  p.bestScore = Math.max(p.bestScore, score);
  let currency = 0;
  let title = "";
  if (!p.cleared) {
    p.cleared = true;
    p.cosmeticCurrency += daily.cosmeticReward;
    currency = daily.cosmeticReward;
    title = `Daily Clear ${daily.date}`;
    if (!p.titles.includes(title)) p.titles.push(title);
  }
  saveDailyProgress(p);
  return { currency, title };
}
