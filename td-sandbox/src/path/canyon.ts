/** Potassium Canyon — cell waypoints (col, row) on 40×25 grid. */
export function buildCanyonCells(): [number, number][] {
  const p: [number, number][] = [];
  const lineH = (r: number, c0: number, c1: number) => {
    const step = c0 <= c1 ? 1 : -1;
    for (let c = c0; c !== c1 + step; c += step) p.push([c, r]);
  };
  const lineV = (c: number, r0: number, r1: number) => {
    const step = r0 <= r1 ? 1 : -1;
    for (let r = r0; r !== r1 + step; r += step) p.push([c, r]);
  };
  lineH(12, 0, 9);
  lineV(9, 12, 3);
  lineH(3, 9, 18);
  lineV(18, 3, 20);
  lineH(20, 18, 28);
  lineV(28, 20, 6);
  lineH(6, 28, 35);
  lineV(35, 6, 18);
  lineH(18, 35, 39);

  const out: [number, number][] = [];
  let last = "";
  for (const [c, r] of p) {
    const k = `${c},${r}`;
    if (k !== last) {
      out.push([c, r]);
      last = k;
    }
  }
  return out;
}

export interface PathRuntime {
  cells: [number, number][];
  waypoints: { x: number; y: number }[];
  segLens: number[];
  pathLen: number;
  pathSet: Set<string>;
  cols: number;
  rows: number;
  tw: number;
  th: number;
}

export function bakePath(
  cells: [number, number][],
  cols: number,
  rows: number,
  width: number,
  height: number
): PathRuntime {
  const tw = width / cols;
  const th = height / rows;
  const pathSet = new Set<string>();
  const waypoints = cells.map(([c, r]) => {
    pathSet.add(`${c},${r}`);
    return { x: c * tw + tw / 2, y: r * th + th / 2 };
  });
  const segLens = [0];
  let pathLen = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i].x - waypoints[i - 1].x;
    const dy = waypoints[i].y - waypoints[i - 1].y;
    pathLen += Math.hypot(dx, dy);
    segLens.push(pathLen);
  }
  return { cells, waypoints, segLens, pathLen, pathSet, cols, rows, tw, th };
}

export function posAlong(path: PathRuntime, dist: number): { x: number; y: number; ang: number } {
  dist = Math.max(0, Math.min(path.pathLen, dist));
  for (let i = 1; i < path.segLens.length; i++) {
    if (dist <= path.segLens[i]) {
      const segStart = path.segLens[i - 1];
      const seg = path.segLens[i] - segStart;
      const t = seg > 0 ? (dist - segStart) / seg : 0;
      const a = path.waypoints[i - 1];
      const b = path.waypoints[i];
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        ang: Math.atan2(b.y - a.y, b.x - a.x),
      };
    }
  }
  const last = path.waypoints[path.waypoints.length - 1];
  return { x: last.x, y: last.y, ang: 0 };
}

export function isPlaceable(path: PathRuntime, c: number, r: number): boolean {
  if (c < 0 || r < 0 || c >= path.cols || r >= path.rows) return false;
  return !path.pathSet.has(`${c},${r}`);
}
