/** Cosmetic stubs — never grant combat power. */

export type CosmeticSlot = "towerSkin" | "projectile" | "mapSkin" | "banner" | "title";

export interface CosmeticDef {
  id: string;
  name: string;
  slot: CosmeticSlot;
  unlock: string;
  equippedDefault?: boolean;
}

export const COSMETICS: CosmeticDef[] = [
  { id: "skin_dart_default", name: "Dart Classic", slot: "towerSkin", unlock: "start", equippedDefault: true },
  { id: "skin_dart_gold", name: "Dart Midas", slot: "towerSkin", unlock: "badge:first_win" },
  { id: "proj_default", name: "Standard Peel", slot: "projectile", unlock: "start", equippedDefault: true },
  { id: "proj_spark", name: "Potassium Spark", slot: "projectile", unlock: "badge:wave_50" },
  { id: "map_default", name: "Jungle Day", slot: "mapSkin", unlock: "start", equippedDefault: true },
  { id: "map_night", name: "Vine Night", slot: "mapSkin", unlock: "badge:atlas_short" },
  { id: "banner_core", name: "Core Banner", slot: "banner", unlock: "badge:first_win" },
  { id: "title_recruit", name: "Peel Recruit", slot: "title", unlock: "start", equippedDefault: true },
  { id: "title_general", name: "General", slot: "title", unlock: "badge:hard_win" },
  { id: "title_ace", name: "Starship Ace", slot: "title", unlock: "badge:starship_win" },
];

export interface CosmeticState {
  unlocked: string[];
  equipped: Partial<Record<CosmeticSlot, string>>;
}

export function defaultCosmetics(): CosmeticState {
  const unlocked = COSMETICS.filter((c) => c.unlock === "start").map((c) => c.id);
  const equipped: CosmeticState["equipped"] = {};
  for (const c of COSMETICS) {
    if (c.equippedDefault) equipped[c.slot] = c.id;
  }
  return { unlocked, equipped };
}

/** Unlock cosmetics from badge ids — visual only. */
export function unlockFromBadges(state: CosmeticState, badges: Record<string, number>): CosmeticState {
  const unlocked = new Set(state.unlocked);
  for (const c of COSMETICS) {
    if (c.unlock.startsWith("badge:")) {
      const bid = c.unlock.slice(6);
      if (badges[bid]) unlocked.add(c.id);
    }
  }
  return { ...state, unlocked: [...unlocked] };
}
