import type { DiffId, LengthId, MapId, ModeId } from "./runConfig";
import { MAP_ORDER } from "./runConfig";

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  tier: "easy" | "medium" | "hard" | "legend";
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: "first_peel", name: "First Peel", desc: "Finish any run", tier: "easy" },
  { id: "first_win", name: "Core Secure", desc: "Win any mode", tier: "medium" },
  { id: "length_short_win", name: "Speed Date", desc: "Win any Short run", tier: "easy" },
  { id: "length_medium_win", name: "Solid Clear", desc: "Win any Medium run", tier: "easy" },
  { id: "length_long_win", name: "Marathoner", desc: "Win any Long run", tier: "medium" },
  { id: "classic_clear", name: "Classic Champ", desc: "Win Classic", tier: "hard" },
  { id: "tour_clear", name: "World Tourist", desc: "Win World Tour", tier: "hard" },
  { id: "rush_clear", name: "Fever Finisher", desc: "Win Fever Rush", tier: "hard" },
  { id: "party_clear", name: "Party Animal", desc: "Win Party", tier: "hard" },
  { id: "hard_win", name: "Hardened", desc: "Win on Hard+", tier: "medium" },
  { id: "starship_win", name: "Starship Ace", desc: "Win on Starship", tier: "legend" },
  { id: "reverse_win", name: "Wrong Way", desc: "Win with Reverse", tier: "medium" },
  { id: "blitz_win", name: "Blitzkrieg", desc: "Win with Blitz", tier: "medium" },
  { id: "chaos_win", name: "Chaos Agent", desc: "Win Reverse+Blitz", tier: "hard" },
  { id: "wave_50", name: "Half Century", desc: "Reach wave 50", tier: "medium" },
  { id: "wave_100", name: "Century", desc: "Reach wave 100", tier: "hard" },
  { id: "atlas_short", name: "Short Atlas", desc: "Clear Short on every map", tier: "hard" },
  { id: "atlas_medium", name: "Medium Atlas", desc: "Clear Medium Hard+ on every map", tier: "hard" },
  { id: "atlas_long", name: "Long Atlas", desc: "Clear Long Hard+ on every map", tier: "legend" },
  { id: "full_atlas", name: "Full Atlas", desc: "All maps x S/M/L (M/L on Hard+)", tier: "legend" },
  { id: "no_farm_med", name: "Field Rations", desc: "Win Medium with 0 farms", tier: "hard" },
  { id: "primary_only", name: "Primary School", desc: "Win Short using only Dart", tier: "medium" },
];

// map × length badges
for (const mid of MAP_ORDER) {
  for (const L of ["short", "medium", "long"] as LengthId[]) {
    BADGE_DEFS.push({
      id: `ml_${mid}_${L}`,
      name: `${mid} ${L[0]!.toUpperCase()}`,
      desc: `Clear ${L} on ${mid}`,
      tier: L === "short" ? "easy" : L === "medium" ? "medium" : "hard",
    });
  }
}

export interface RunBadgeContext {
  won: boolean;
  wave: number;
  mode: ModeId;
  map: MapId;
  length: LengthId;
  difficulty: DiffId;
  reverse: boolean;
  blitz: boolean;
  usedFarm: boolean;
  onlyDart: boolean;
  mapLengthClears: Record<string, number>;
}

export function evaluateBadges(ctx: RunBadgeContext, owned: Record<string, number>): string[] {
  const newly: string[] = [];
  const unlock = (id: string) => {
    if (!owned[id]) newly.push(id);
  };

  unlock("first_peel");
  if (ctx.won) {
    unlock("first_win");
    if (ctx.length === "short") unlock("length_short_win");
    if (ctx.length === "medium") unlock("length_medium_win");
    if (ctx.length === "long") unlock("length_long_win");
    if (ctx.mode === "classic") unlock("classic_clear");
    if (ctx.mode === "tour") unlock("tour_clear");
    if (ctx.mode === "rush") unlock("rush_clear");
    if (ctx.mode === "party") unlock("party_clear");
    if (ctx.difficulty === "hard" || ctx.difficulty === "starship") unlock("hard_win");
    if (ctx.difficulty === "starship") unlock("starship_win");
    if (ctx.reverse) unlock("reverse_win");
    if (ctx.blitz) unlock("blitz_win");
    if (ctx.reverse && ctx.blitz) unlock("chaos_win");
    if (ctx.length === "medium" && !ctx.usedFarm) unlock("no_farm_med");
    if (ctx.length === "short" && ctx.onlyDart) unlock("primary_only");
    // Medium/Long map badges require Hard+ (Hard proud). Short any difficulty.
    if (ctx.length === "short" || ctx.difficulty === "hard" || ctx.difficulty === "starship") {
      unlock(`ml_${ctx.map}_${ctx.length}`);
    }
  }
  if (ctx.wave >= 50) unlock("wave_50");
  if (ctx.wave >= 100) unlock("wave_100");

  // atlas: short any; medium/long only count Hard+ clears stored in mapLengthClears
  const clears = { ...ctx.mapLengthClears };
  if (ctx.won) {
    if (ctx.length === "short" || ctx.difficulty === "hard" || ctx.difficulty === "starship") {
      clears[`${ctx.map}_${ctx.length}`] = Date.now();
    }
  }
  const allShort = MAP_ORDER.every((m) => clears[`${m}_short`]);
  const allMed = MAP_ORDER.every((m) => clears[`${m}_medium`]);
  const allLong = MAP_ORDER.every((m) => clears[`${m}_long`]);
  if (allShort) unlock("atlas_short");
  if (allMed) unlock("atlas_medium");
  if (allLong) unlock("atlas_long");
  if (allShort && allMed && allLong) unlock("full_atlas");

  return newly;
}
