import type { GlobalRunSubmit, LbEntry, LeaderboardClient } from "./types";
import { CLIENT_VERSION } from "./types";

const LB_KEY = "bananox_td_lb_local_v1";
const LB_MAX = 40;
const MOCK_GLOBAL_KEY = "bananox_td_lb_mock_global_v1";

export interface LbPartition {
  mode?: string;
  length?: string;
  difficulty?: string;
  dailySeed?: string;
  limit?: number;
}

function readArr(key: string): LbEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

function writeArr(key: string, arr: LbEntry[]) {
  try {
    localStorage.setItem(key, JSON.stringify(arr.slice(0, LB_MAX)));
  } catch {
    /* quota */
  }
}

function sortTrim(arr: LbEntry[]): LbEntry[] {
  return arr
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, LB_MAX)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

/** Partition key: mode|length|difficulty (daily separate by seed). */
export function partitionKey(e: {
  mode: string;
  length: string;
  difficulty: string;
  dailySeed?: string;
}): string {
  if (e.dailySeed) return `daily|${e.dailySeed}`;
  return `${e.mode}|${e.length}|${e.difficulty}`;
}

function matchesPartition(e: LbEntry, q: LbPartition): boolean {
  if (q.dailySeed) return e.dailySeed === q.dailySeed;
  if (q.mode && e.mode !== q.mode) return false;
  if (q.length && e.length !== q.length) return false;
  if (q.difficulty && e.difficulty !== q.difficulty) return false;
  return true;
}

/** Mock remote: stores in localStorage under mock key; simulates latency. */
export class MockRemoteLeaderboard implements LeaderboardClient {
  submitLocal(entry: LbEntry): void {
    const all = readArr(LB_KEY);
    all.push(entry);
    writeArr(LB_KEY, sortTrim(all));
  }

  listLocal(limit = 10, partition?: LbPartition): LbEntry[] {
    let all = sortTrim(readArr(LB_KEY));
    if (partition) all = all.filter((e) => matchesPartition(e, partition));
    return all.slice(0, limit);
  }

  async submitGlobal(dto: GlobalRunSubmit): Promise<{ ok: boolean; reason?: string }> {
    await delay(120 + Math.random() * 180);
    if (!dto.score || dto.score < 0) return { ok: false, reason: "invalid score" };
    if (!dto.nickname?.trim()) return { ok: false, reason: "nickname required" };
    const entry: LbEntry = {
      score: dto.score,
      wave: dto.wave,
      pops: dto.pops,
      mode: dto.mode,
      map: dto.map,
      difficulty: dto.difficulty,
      length: dto.length,
      reverse: dto.reverse,
      blitz: dto.blitz,
      won: dto.won,
      nickname: dto.nickname.slice(0, 24),
      at: dto.createdAt,
      dailySeed: dto.dailySeed,
    };
    const all = readArr(MOCK_GLOBAL_KEY);
    all.push(entry);
    writeArr(MOCK_GLOBAL_KEY, sortTrim(all));
    return { ok: true };
  }

  async fetchGlobal(query: {
    mode?: string;
    length?: string;
    difficulty?: string;
    dailySeed?: string;
    limit?: number;
  }): Promise<LbEntry[]> {
    await delay(80 + Math.random() * 120);
    let all = sortTrim(readArr(MOCK_GLOBAL_KEY));
    all = all.filter((e) =>
      matchesPartition(e, {
        mode: query.mode,
        length: query.length,
        difficulty: query.difficulty,
        dailySeed: query.dailySeed,
      })
    );
    return all.slice(0, query.limit ?? 10);
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function makeRunId(): string {
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function hashUserId(nickname: string): string {
  let h = 2166136261;
  const s = `banano-td|${nickname}|${CLIENT_VERSION}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export const lbClient: LeaderboardClient = new MockRemoteLeaderboard();
