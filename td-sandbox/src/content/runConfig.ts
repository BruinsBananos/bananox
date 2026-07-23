export type MapId = "canyon" | "helix" | "spiral" | "fork" | "runway" | "gauntlet";
export type LengthId = "short" | "medium" | "long";
export type DiffId = "normal" | "hard" | "starship";
export type ModeId = "classic" | "tour" | "rush" | "party";

export interface RunConfig {
  map: MapId;
  length: LengthId;
  difficulty: DiffId;
  mode: ModeId;
  reverse: boolean;
  blitz: boolean;
  /** Ranked writes badges/LB. Forced false when sandbox. */
  ranked: boolean;
  coach: boolean;
  /** Lab/Sandbox: god tools allowed; never writes ranked badges/LB. */
  sandbox: boolean;
}

export const MAP_ORDER: MapId[] = ["canyon", "helix", "spiral", "fork", "runway", "gauntlet"];

export const MAPS: Record<MapId, { name: string; short: string; lesson: string }> = {
  canyon: { name: "Potassium Canyon", short: "Canyon", lesson: "Classic line-farm" },
  helix: { name: "Double Helix", short: "Helix", lesson: "S-turns · crossfire" },
  spiral: { name: "Peel Spiral", short: "Spiral", lesson: "Long dwell · eco" },
  fork: { name: "Twin Fork Trail", short: "Fork", lesson: "Detour · targeting" },
  runway: { name: "Starship Runway", short: "Runway", lesson: "Straights · rails" },
  gauntlet: { name: "Gauntlet Gorge", short: "Gauntlet", lesson: "Dense pressure" },
};

export const MODES: Record<
  ModeId,
  {
    name: string;
    tagline: string;
    dens: number;
    ban: number;
    startBan: number;
    pickMap: boolean;
    tour: boolean;
    tourEvery: number;
    eventScale: number;
    jackpot: number;
    feverStart: number;
  }
> = {
  classic: {
    name: "Classic",
    tagline: "One map. Pure tower defense.",
    dens: 1,
    ban: 1,
    startBan: 0,
    pickMap: true,
    tour: false,
    tourEvery: 0,
    eventScale: 1,
    jackpot: 1,
    feverStart: 0,
  },
  tour: {
    name: "World Tour",
    tagline: "Maps rotate — upgrades stay.",
    dens: 1.08,
    ban: 1.18,
    startBan: 150,
    pickMap: false,
    tour: true,
    tourEvery: 20,
    eventScale: 0.9,
    jackpot: 1.15,
    feverStart: 0,
  },
  rush: {
    name: "Fever Rush",
    tagline: "Dense waves, free ROF Fever start — earn the rest.",
    dens: 1.32,
    ban: 1.12,
    startBan: 280,
    pickMap: true,
    tour: false,
    tourEvery: 0,
    eventScale: 0.7,
    jackpot: 1.35,
    feverStart: 12,
  },
  party: {
    name: "Party",
    tagline: "Events on loop — soft BAN caps keep it fair.",
    dens: 1.18,
    ban: 1.12,
    startBan: 180,
    pickMap: true,
    tour: false,
    tourEvery: 0,
    eventScale: 0.5,
    jackpot: 1.35,
    feverStart: 0,
  },
};

export const LENGTHS: Record<
  LengthId,
  {
    name: string;
    waves: Record<ModeId, number>;
    contentSpan: number;
    dens: number;
    ban: number;
    scoreMul: number;
    tagline: string;
  }
> = {
  short: {
    name: "Short",
    waves: { classic: 30, tour: 40, rush: 25, party: 30 },
    contentSpan: 90,
    dens: 1.05,
    ban: 1.08,
    scoreMul: 0.85,
    tagline: "Quick badge run",
  },
  medium: {
    name: "Medium",
    waves: { classic: 75, tour: 80, rush: 50, party: 60 },
    contentSpan: 120,
    dens: 1,
    ban: 1,
    scoreMul: 1,
    tagline: "Balanced campaign",
  },
  long: {
    name: "Long",
    waves: { classic: 150, tour: 120, rush: 80, party: 100 },
    contentSpan: 150,
    dens: 1,
    ban: 1,
    scoreMul: 1.35,
    tagline: "Full endurance",
  },
};

export const DIFFS: Record<
  DiffId,
  {
    name: string;
    startBan: number;
    lives: number;
    scale: number;
    dens: number;
    reward: number;
    interestCap: number;
  }
> = {
  normal: { name: "Normal", startBan: 900, lives: 300, scale: 1, dens: 1, reward: 1, interestCap: 300 },
  hard: { name: "Hard", startBan: 750, lives: 200, scale: 1.35, dens: 1.15, reward: 1.3, interestCap: 380 },
  starship: { name: "Starship", startBan: 650, lives: 140, scale: 1.75, dens: 1.3, reward: 1.6, interestCap: 500 },
};

export function defaultRunConfig(): RunConfig {
  return {
    map: "canyon",
    length: "short",
    difficulty: "normal",
    mode: "classic",
    reverse: false,
    blitz: false,
    ranked: true,
    coach: true,
    sandbox: false,
  };
}

/** Lab config: assists OK, ranked off. */
export function labRunConfig(partial?: Partial<RunConfig>): RunConfig {
  return {
    ...defaultRunConfig(),
    ...partial,
    sandbox: true,
    ranked: false,
    coach: false,
  };
}

export function getModeWaveCap(mode: ModeId, length: LengthId): number {
  return LENGTHS[length].waves[mode];
}

export function getTourEvery(mode: ModeId, length: LengthId): number {
  const m = MODES[mode];
  if (!m.tour) return 0;
  const base = m.tourEvery || 20;
  if (length === "short") return Math.max(8, Math.round(base * 0.5));
  if (length === "medium") return Math.max(12, Math.round(base * 0.75));
  return base;
}

export function waveContentLevel(displayWave: number, mode: ModeId, length: LengthId): number {
  const cap = Math.max(1, getModeWaveCap(mode, length));
  const span = LENGTHS[length].contentSpan;
  return Math.max(1, Math.min(150, Math.round(displayWave * (span / cap))));
}

export function runDensMul(cfg: RunConfig): number {
  let m = MODES[cfg.mode].dens * LENGTHS[cfg.length].dens * DIFFS[cfg.difficulty].dens;
  if (cfg.blitz) m *= 1.38;
  return m;
}

export function runBanMul(cfg: RunConfig): number {
  let m = MODES[cfg.mode].ban * LENGTHS[cfg.length].ban;
  // Blitz: dens+speed only — no ban mul (Red Team patch)
  if (cfg.reverse) m *= 1.05;
  return m;
}

/** Pop/clear bounty band by content level */
export function popBandMul(contentLevel: number): number {
  if (contentLevel <= 30) return 1;
  if (contentLevel <= 60) return 0.85;
  if (contentLevel <= 90) return 0.7;
  return 0.55;
}
