/** Party / mid-run event catalog (Systems + Content Bible). */

export type EventId =
  | "double"
  | "slowmo"
  | "rain"
  | "frenzy"
  | "camo_clear"
  | "lead_soft"
  | "jackpot_spawn"
  | "freeze_party"
  | "range_up"
  | "ability_haste"
  | "particle_fiesta"
  | "swarm";

export interface EventDef {
  id: EventId;
  name: string;
  duration: number;
  weight: number;
  /** Max BAN from rain etc. */
  banCap?: number;
}

export const EVENT_CATALOG: EventDef[] = [
  { id: "double", name: "Double Peel", duration: 8, weight: 10 },
  { id: "slowmo", name: "Jungle Time", duration: 6, weight: 8 },
  { id: "rain", name: "BAN Rain", duration: 0, weight: 10, banCap: 120 },
  { id: "frenzy", name: "Frenzy Air", duration: 7, weight: 8 },
  { id: "camo_clear", name: "Radar Bloom", duration: 5, weight: 6 },
  { id: "lead_soft", name: "Thermite Mist", duration: 5, weight: 6 },
  { id: "jackpot_spawn", name: "Golden Gust", duration: 0, weight: 4 },
  { id: "freeze_party", name: "Snow Cone", duration: 4, weight: 5 },
  { id: "range_up", name: "Long Arms", duration: 8, weight: 5 },
  { id: "ability_haste", name: "Quick Cast", duration: 12, weight: 4 },
  { id: "particle_fiesta", name: "Confetti", duration: 6, weight: 7 },
  { id: "swarm", name: "Peel Panic", duration: 0, weight: 5 },
];

export function pickEvent(rng: () => number, exclude?: EventId): EventDef {
  const pool = EVENT_CATALOG.filter((e) => e.id !== exclude);
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return pool[pool.length - 1]!;
}

export function eventCdBase(eventScale: number, blitz: boolean, short: boolean): number {
  const scale = eventScale * (blitz ? 0.75 : 1) * (short ? 0.85 : 1);
  return (6 + Math.random() * 8) * scale;
}
