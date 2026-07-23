/**
 * Global leaderboard contract — schema ships now; live backend Phase 4+.
 * Real BAN (chain) is NEVER a field here and never buys power.
 */

export type ModeId = "classic" | "tour" | "rush" | "party";
export type MapId = string;
export type DiffId = "normal" | "hard" | "starship";
export type LengthId = "short" | "medium" | "long";

/** Payload submitted after a ranked run (local or remote). */
export interface GlobalRunSubmit {
  runId: string;
  userIdHash: string;
  nickname: string;
  score: number;
  wave: number;
  pops: number;
  mode: ModeId;
  map: MapId;
  difficulty: DiffId;
  length: LengthId;
  reverse: boolean;
  blitz: boolean;
  won: boolean;
  freeplay: boolean;
  dailySeed?: string;
  clientVersion: string;
  seed?: string;
  createdAt: number;
  /** Phase 4+ server signature */
  sig?: string;
}

export interface LbEntry {
  rank?: number;
  score: number;
  wave: number;
  pops: number;
  mode: string;
  map: string;
  difficulty: string;
  length: string;
  reverse?: boolean;
  blitz?: boolean;
  won: boolean;
  nickname: string;
  at: number;
  dailySeed?: string;
}

export interface LeaderboardClient {
  submitLocal(entry: LbEntry): void;
  listLocal(limit?: number, partition?: {
    mode?: string;
    length?: string;
    difficulty?: string;
    dailySeed?: string;
  }): LbEntry[];
  /** Remote — mock until backend live */
  submitGlobal(dto: GlobalRunSubmit): Promise<{ ok: boolean; reason?: string }>;
  fetchGlobal(query: {
    mode?: string;
    length?: string;
    difficulty?: string;
    dailySeed?: string;
    limit?: number;
  }): Promise<LbEntry[]>;
}

export const CLIENT_VERSION = "0.5.0-aaa";
