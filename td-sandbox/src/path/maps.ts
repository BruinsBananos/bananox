import { bakePath, type PathRuntime } from "./canyon";
import type { MapId } from "../content/runConfig";

function dedupe(cells: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  let last = "";
  for (const [c, r] of cells) {
    const k = `${c},${r}`;
    if (k !== last) {
      out.push([c, r]);
      last = k;
    }
  }
  return out;
}

function lineH(r: number, c0: number, c1: number, p: [number, number][]) {
  const step = c0 <= c1 ? 1 : -1;
  for (let c = c0; c !== c1 + step; c += step) p.push([c, r]);
}
function lineV(c: number, r0: number, r1: number, p: [number, number][]) {
  const step = r0 <= r1 ? 1 : -1;
  for (let r = r0; r !== r1 + step; r += step) p.push([c, r]);
}

export function buildMapCells(map: MapId): [number, number][] {
  const p: [number, number][] = [];
  switch (map) {
    case "helix":
      lineH(2, 0, 12, p);
      lineV(12, 2, 11, p);
      lineH(11, 12, 5, p);
      lineV(5, 11, 18, p);
      lineH(18, 5, 22, p);
      lineV(22, 18, 4, p);
      lineH(4, 22, 33, p);
      lineV(33, 4, 21, p);
      lineH(21, 33, 39, p);
      break;
    case "spiral":
      lineH(12, 0, 20, p);
      lineV(20, 12, 4, p);
      lineH(4, 20, 8, p);
      lineV(8, 4, 18, p);
      lineH(18, 8, 28, p);
      lineV(28, 18, 6, p);
      lineH(6, 28, 34, p);
      lineV(34, 6, 20, p);
      lineH(20, 34, 39, p);
      break;
    case "fork":
      lineH(6, 0, 10, p);
      lineV(10, 6, 16, p);
      lineH(16, 10, 18, p);
      lineV(18, 16, 4, p);
      lineH(4, 18, 26, p);
      lineV(26, 4, 19, p);
      lineH(19, 26, 32, p);
      lineV(32, 19, 10, p);
      lineH(10, 32, 39, p);
      break;
    case "runway":
      lineV(3, 0, 21, p);
      lineH(21, 3, 14, p);
      lineV(14, 21, 2, p);
      lineH(2, 14, 26, p);
      lineV(26, 2, 21, p);
      lineH(21, 26, 36, p);
      lineV(36, 21, 8, p);
      lineH(8, 36, 39, p);
      break;
    case "gauntlet":
      lineH(2, 0, 6, p);
      lineV(6, 2, 22, p);
      lineH(22, 6, 12, p);
      lineV(12, 22, 2, p);
      lineH(2, 12, 18, p);
      lineV(18, 2, 22, p);
      lineH(22, 18, 24, p);
      lineV(24, 22, 2, p);
      lineH(2, 24, 30, p);
      lineV(30, 2, 22, p);
      lineH(22, 30, 36, p);
      lineV(36, 22, 12, p);
      lineH(12, 36, 39, p);
      break;
    case "canyon":
    default:
      lineH(12, 0, 9, p);
      lineV(9, 12, 3, p);
      lineH(3, 9, 18, p);
      lineV(18, 3, 20, p);
      lineH(20, 18, 28, p);
      lineV(28, 20, 6, p);
      lineH(6, 28, 35, p);
      lineV(35, 6, 18, p);
      lineH(18, 35, 39, p);
      break;
  }
  return dedupe(p);
}

export function bakeMap(
  map: MapId,
  cols: number,
  rows: number,
  width: number,
  height: number,
  reverse = false
): PathRuntime {
  let cells = buildMapCells(map);
  if (reverse && cells.length > 1) cells = cells.slice().reverse();
  return bakePath(cells, cols, rows, width, height);
}

export function validateMap(map: MapId): { ok: boolean; pathLen: number; placeable: number } {
  const cells = buildMapCells(map);
  const path = bakePath(cells, 40, 25, 960, 600);
  let placeable = 0;
  for (let c = 0; c < 40; c++) {
    for (let r = 0; r < 25; r++) {
      if (!path.pathSet.has(`${c},${r}`)) placeable++;
    }
  }
  return { ok: cells.length >= 2 && placeable >= 30 && path.pathLen > 0, pathLen: path.pathLen, placeable };
}

export { isPlaceable, posAlong, type PathRuntime } from "./canyon";
