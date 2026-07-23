/**
 * Launch unlock ladder (Red Team Patch 1). Sandbox unlocks all.
 */
import type { SliceProgress } from "../save/progress";
import { TOWERS } from "./towers";

export const START_TOWERS = ["dart", "bomb", "ice", "sniper", "farm"] as const;

export function isTowerUnlocked(defId: string, progress: SliceProgress, sandbox: boolean): boolean {
  if (sandbox) return true;
  if ((START_TOWERS as readonly string[]).includes(defId)) return true;

  const badges = progress.badges || {};
  const bestWave = progress.bestWave || 0;
  const mediumWin = !!(badges.length_medium_win || badges.classic_clear);
  const hardMed = !!(badges.hard_win || badges.starship_win);
  const atlasCount = Object.keys(badges).filter((k) => k.startsWith("ml_")).length;
  const firstCamo = !!(badges.first_win || bestWave >= 20);

  switch (defId) {
    case "boomer":
      return bestWave >= 15 || !!(badges.length_short_win || badges.first_win);
    case "village":
      return firstCamo || bestWave >= 20;
    case "super":
      return mediumWin || bestWave >= 40;
    case "battery":
      return hardMed || bestWave >= 50;
    case "alchemist":
      return atlasCount >= 3 || bestWave >= 30;
    default:
      return true;
  }
}

export function unlockHint(defId: string): string {
  switch (defId) {
    case "boomer":
      return "Unlock: clear Short or reach wave 15";
    case "village":
      return "Unlock: wave 20 or first win";
    case "super":
      return "Unlock: clear Medium or wave 40";
    case "battery":
      return "Unlock: Hard win or wave 50";
    case "alchemist":
      return "Unlock: 3 map badges or wave 30";
    default:
      return "Locked";
  }
}

/** Ordered list of tower ids available for this progress / sandbox flag. */
export function listUnlockedTowers(progress: SliceProgress, sandbox: boolean): string[] {
  return TOWERS.map((t) => t.id).filter((id) => isTowerUnlocked(id, progress, sandbox));
}
