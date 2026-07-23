import { waveContentLevel, type LengthId, type ModeId } from "./runConfig";

export type LayerId = "green" | "ripe" | "gold" | "purple" | "star" | "zebra" | "golden";
export type SpecialId = "ceramic" | "boss" | "freighter" | "titan";

export interface GroupDef {
  unit: LayerId | SpecialId;
  count: number;
  spacing: number;
  delay: number;
  camo?: boolean;
  lead?: boolean;
  fortified?: boolean;
}

export interface WaveDef {
  groups: GroupDef[];
}

function d(n: number, dens: number) {
  return Math.max(1, Math.ceil(n * dens));
}

/** Full grammar by contentLevel 1–150 (Systems/Content Bible). */
export function buildWaveFromContent(contentLevel: number, densMul: number, jackpotMul = 1): WaveDef {
  const L = Math.max(1, Math.min(150, contentLevel));

  // Boss inserts by content level
  if (L === 30 || L === 40 || L === 60) {
    return {
      groups: [
        { unit: "zebra", count: d(5, densMul), spacing: 0.28, delay: 0 },
        { unit: "boss", count: 1, spacing: 1, delay: 2 },
      ],
    };
  }
  if (L === 50 || L === 70 || L === 90) {
    return {
      groups: [
        { unit: "ceramic", count: d(2, densMul), spacing: 0.7, delay: 0 },
        { unit: "freighter", count: 1, spacing: 1, delay: 2.5 },
      ],
    };
  }
  if (L === 100 || L === 120 || L === 150) {
    return {
      groups: [
        { unit: "zebra", count: d(8, densMul), spacing: 0.24, delay: 0, lead: true },
        { unit: "titan", count: 1, spacing: 1, delay: 3 },
      ],
    };
  }

  if (L <= 5) return { groups: [{ unit: "green", count: d(8 + L, densMul), spacing: 0.42, delay: 0 }] };
  if (L <= 12) return { groups: [{ unit: "ripe", count: d(10 + Math.floor(L / 2), densMul), spacing: 0.38, delay: 0 }] };
  if (L <= 20) {
    return {
      groups: [
        { unit: "ripe", count: d(8, densMul), spacing: 0.35, delay: 0 },
        { unit: "gold", count: d(6, densMul), spacing: 0.38, delay: 1.2 },
      ],
    };
  }
  if (L <= 28) {
    return {
      groups: [
        { unit: "gold", count: d(10, densMul), spacing: 0.32, delay: 0 },
        { unit: "purple", count: d(5, densMul), spacing: 0.34, delay: 1.5 },
      ],
    };
  }
  if (L <= 35) {
    return {
      groups: [
        { unit: "purple", count: d(8, densMul), spacing: 0.3, delay: 0, camo: true },
        { unit: "gold", count: d(10, densMul), spacing: 0.32, delay: 1.2 },
      ],
    };
  }
  if (L <= 48) {
    return {
      groups: [
        { unit: "gold", count: d(12, densMul), spacing: 0.28, delay: 0, lead: L >= 40 },
        { unit: "purple", count: d(6, densMul), spacing: 0.3, delay: 1.4, camo: L >= 42 },
      ],
    };
  }
  if (L <= 55) {
    return {
      groups: [
        { unit: "purple", count: d(10, densMul), spacing: 0.26, delay: 0 },
        { unit: "star", count: d(4, densMul), spacing: 0.34, delay: 1.8 },
        { unit: "ceramic", count: d(1 + (L > 50 ? 1 : 0), densMul), spacing: 0.75, delay: 2.8 },
      ],
    };
  }
  if (L <= 85) {
    return {
      groups: [
        { unit: "star", count: d(8, densMul), spacing: 0.25, delay: 0 },
        { unit: "zebra", count: d(5, densMul), spacing: 0.3, delay: 1.4 },
        { unit: "ceramic", count: d(2, densMul), spacing: 0.7, delay: 2.4, fortified: L > 70 },
      ],
    };
  }
  // late endurance
  const groups: GroupDef[] = [
    { unit: "zebra", count: d(10, densMul), spacing: 0.22, delay: 0, camo: L % 2 === 0 },
    { unit: "star", count: d(6, densMul), spacing: 0.26, delay: 1, lead: true },
    { unit: "ceramic", count: d(3, densMul), spacing: 0.55, delay: 1.8, fortified: true },
  ];
  if (jackpotMul >= 1 && (L % 15 < 2 || jackpotMul > 1.2)) {
    groups.push({ unit: "golden", count: Math.min(2, Math.ceil(jackpotMul)), spacing: 1, delay: 2.5 });
  }
  return { groups };
}

export function buildWave(
  displayWave: number,
  mode: ModeId,
  length: LengthId,
  densMul: number,
  jackpotMul = 1
): WaveDef {
  const cl = waveContentLevel(displayWave, mode, length);
  return buildWaveFromContent(cl, densMul, jackpotMul);
}
