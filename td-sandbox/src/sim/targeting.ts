import type { PathRuntime } from "../path/canyon";
import type { ThreatEntity, TowerEntity } from "./types";

function distSq(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function canTarget(tower: TowerEntity, th: ThreatEntity): boolean {
  if (!th.alive) return false;
  if (th.camo && !tower.camo) return false;
  return true;
}

/** Lead blocks damage, not targeting (Systems Bible). */
export function canDamage(tower: { lead: boolean }, th: ThreatEntity): boolean {
  if (th.lead && !tower.lead) return false;
  if (th.kind === "boss" && th.lead && !tower.lead) return false;
  return true;
}

function threatScore(th: ThreatEntity): number {
  const layerRank: Record<string, number> = {
    green: 1,
    ripe: 2,
    gold: 3,
    purple: 4,
    star: 5,
    zebra: 6,
    golden: 7,
  };
  let s = (th.layer ? layerRank[th.layer] || 1 : 0) * 10;
  if (th.kind === "ceramic") s += th.hp * 0.5 + 20;
  if (th.kind === "boss") s += th.hp * 0.02 + 80;
  if (th.fortified) s += 25;
  if (th.lead) s += 5;
  if (th.camo) s += 3;
  return s;
}

export function acquireTargets(
  tower: TowerEntity,
  threats: ThreatEntity[],
  _path: PathRuntime,
  count: number
): ThreatEntity[] {
  const rangeSq = tower.range * tower.range;
  const visible = threats.filter(
    (th) => th.alive && canTarget(tower, th) && distSq(tower.x, tower.y, th.x, th.y) <= rangeSq
  );
  if (!visible.length) return [];

  const mode = tower.preferStrong && tower.targetMode === "first" ? "strong" : tower.targetMode;

  visible.sort((a, b) => {
    switch (mode) {
      case "last":
        return a.dist - b.dist;
      case "strong":
        return threatScore(b) - threatScore(a) || b.dist - a.dist;
      case "close":
        return distSq(tower.x, tower.y, a.x, a.y) - distSq(tower.x, tower.y, b.x, b.y);
      case "first":
      default:
        return b.dist - a.dist;
    }
  });

  const out: ThreatEntity[] = [];
  for (let i = 0; i < count; i++) {
    out.push(visible[i % visible.length]);
  }
  return out;
}
