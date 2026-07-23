/** Load Imagine pipeline art when present under /art (public). Fallback: null. */

const cache = new Map<string, HTMLImageElement | null>();

export function towerSpriteKey(defId: string, pathA: number, pathB: number): string {
  // prefer deep path tier art
  if (pathA >= 4) return `towers/${defId}/pathA_t4.jpg`;
  if (pathB >= 4) return `towers/${defId}/pathB_t4.jpg`;
  if (pathA >= 3) return `towers/${defId}/pathA_t3.jpg`;
  if (pathB >= 3) return `towers/${defId}/pathB_t3.jpg`;
  return `towers/${defId}/base.jpg`;
}

export function getSprite(path: string): HTMLImageElement | null {
  if (cache.has(path)) return cache.get(path)!;
  const img = new Image();
  img.src = `/art/${path}`;
  cache.set(path, img);
  img.onerror = () => cache.set(path, null);
  return img;
}

export function preloadSliceArt(ids: string[]) {
  for (const id of ids) {
    getSprite(`towers/${id}/base.jpg`);
    for (const p of ["pathA_t3", "pathA_t4", "pathB_t3", "pathB_t4"]) {
      getSprite(`towers/${id}/${p}.jpg`);
    }
  }
  getSprite("enemies/layers/ripe.jpg");
  getSprite("enemies/bosses/ban_barge.jpg");
  getSprite("board/core_idol.jpg");
}
