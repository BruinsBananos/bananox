import { TOWER_BY_ID, type UpgradeTier } from "../content/towers";
import type { TowerEntity } from "./types";

const VILLAGE_CAMO_CAP = 4;

function applyTier(st: TowerEntity, u: UpgradeTier) {
  if (u.pierce) st.pierce += u.pierce;
  if (u.pop) st.pop += u.pop;
  if (u.range) st.range += u.range;
  if (u.rof) st.rof = Math.max(0.05, st.rof + u.rof);
  if (u.splash) st.splash += u.splash;
  if (u.slow) st.slow = Math.min(0.85, st.slow + u.slow);
  if (u.multishot) st.multishot += u.multishot;
  if (u.camo) st.camo = true;
  if (u.lead) st.lead = true;
  if (u.preferStrong) st.preferStrong = true;
  if (u.income) st.income += u.income;
  if (u.auraRof) st.auraRof += u.auraRof;
  if (u.auraCamo) st.auraCamo = true;
  if (u.coatBrittle) st.coatBrittle += u.coatBrittle;
  if (u.coatMidas) st.coatMidas += u.coatMidas;
}

export function recomputeStats(t: TowerEntity): void {
  const d = TOWER_BY_ID[t.defId];
  if (!d) return;
  t.range = d.range;
  t.rof = d.rof;
  t.pierce = d.pierce;
  t.pop = d.pop;
  t.splash = d.splash;
  t.slow = d.slow;
  t.camo = d.camo;
  t.lead = d.lead;
  t.multishot = d.multishot;
  t.preferStrong = !!d.preferStrong;
  t.farm = !!d.farm;
  t.freezePulse = !!d.freezePulse;
  t.support = !!d.support;
  t.coat = !!d.coat;
  t.coatBrittle = 0;
  t.coatMidas = 0;
  t.income = 0;
  t.auraRof = 0;
  t.auraCamo = false;
  t.color = d.color;
  for (let i = 0; i < t.pathA; i++) applyTier(t, d.paths[0][i]);
  for (let i = 0; i < t.pathB; i++) applyTier(t, d.paths[1][i]);
}

export function canUpgrade(t: TowerEntity, path: 0 | 1): { ok: boolean; reason?: string; cost?: number } {
  const d = TOWER_BY_ID[t.defId];
  if (!d) return { ok: false, reason: "Unknown tower" };
  const level = path === 0 ? t.pathA : t.pathB;
  if (level >= 4) return { ok: false, reason: "Max tier" };
  if (level >= 2) {
    const other = path === 0 ? t.pathB : t.pathA;
    if (t.deepPath !== null && t.deepPath !== path) {
      return { ok: false, reason: "Other path is deep" };
    }
    if (t.deepPath === null && other >= 3) {
      return { ok: false, reason: "Other path is deep" };
    }
  }
  const tier = d.paths[path][level];
  return { ok: true, cost: tier.cost };
}

export function applyUpgrade(t: TowerEntity, path: 0 | 1): void {
  if (path === 0) t.pathA++;
  else t.pathB++;
  if ((path === 0 ? t.pathA : t.pathB) >= 3) t.deepPath = path;
  recomputeStats(t);
}

/**
 * Village auras: ROF diminishing; camo detect to at most VILLAGE_CAMO_CAP
 * nearest combat towers total (not per village).
 */
export function applyAuras(towers: TowerEntity[]): void {
  for (const t of towers) {
    t.effCamo = t.camo;
    t.effRofMul = 1;
  }
  const villages = towers.filter((t) => t.support || t.auraRof > 0 || t.auraCamo);
  for (const v of villages) {
    let stack = 0;
    for (const t of towers) {
      if (t.uid === v.uid || t.farm) continue;
      const dist = Math.hypot(t.x - v.x, t.y - v.y);
      if (dist > v.range) continue;
      if (v.auraRof > 0) {
        const mul = v.auraRof * Math.pow(0.6, stack);
        t.effRofMul *= 1 + mul;
        stack++;
      }
    }
  }
  // Camo aura: collect candidates sorted by distance to nearest radar village
  const radarVillages = villages.filter((v) => v.auraCamo);
  if (!radarVillages.length) return;
  const candidates: { t: TowerEntity; dist: number }[] = [];
  for (const t of towers) {
    if (t.farm || t.support) continue;
    if (t.camo) {
      t.effCamo = true;
      continue;
    }
    let best = Infinity;
    for (const v of radarVillages) {
      const d = Math.hypot(t.x - v.x, t.y - v.y);
      if (d <= v.range && d < best) best = d;
    }
    if (best < Infinity) candidates.push({ t, dist: best });
  }
  candidates.sort((a, b) => a.dist - b.dist);
  for (let i = 0; i < Math.min(VILLAGE_CAMO_CAP, candidates.length); i++) {
    candidates[i]!.t.effCamo = true;
  }
}
