import { getSprite, towerSpriteKey } from "../art/sprites";
import type { PathRuntime } from "../path/maps";
import type { SimWorld } from "../sim/types";
import { TOWER_BY_ID } from "../content/towers";

const PATH = "#e8d4a8";
const GRASS = "#2f6b45";

function drawChromaSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number
) {
  // Simple draw; full chroma key would use offscreen — green BG OK at small size with circle mask
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  ctx.restore();
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: SimWorld,
  path: PathRuntime,
  hover: { c: number; r: number } | null,
  placeId: string | null
) {
  const { tw, th, cols, rows } = path;
  const W = cols * tw;
  const H = rows * th;

  ctx.save();
  if (world.shake > 0) {
    const m = world.shake * 10;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  ctx.fillStyle = GRASS;
  ctx.fillRect(0, 0, W, H);

  for (const [c, r] of path.cells) {
    ctx.fillStyle = PATH;
    ctx.fillRect(c * tw, r * th, tw + 0.5, th + 0.5);
  }

  ctx.strokeStyle = "rgba(251,221,17,0.28)";
  ctx.lineWidth = 2;
  for (let i = 4; i < path.waypoints.length; i += 5) {
    const a = path.waypoints[i - 1];
    const b = path.waypoints[i];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.beginPath();
    ctx.moveTo(b.x - Math.cos(ang) * 8 - Math.sin(ang) * 5, b.y - Math.sin(ang) * 8 + Math.cos(ang) * 5);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x - Math.cos(ang) * 8 + Math.sin(ang) * 5, b.y - Math.sin(ang) * 8 - Math.cos(ang) * 5);
    ctx.stroke();
  }

  const end = path.waypoints[path.waypoints.length - 1];
  const coreImg = getSprite("board/core_idol.jpg");
  if (coreImg && coreImg.complete && coreImg.naturalWidth) {
    drawChromaSprite(ctx, coreImg, end.x, end.y, 40);
  } else {
    ctx.fillStyle = "#ffe566";
    ctx.beginPath();
    ctx.arc(end.x, end.y, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  const sp = path.waypoints[0];
  ctx.fillStyle = "rgba(61,224,255,0.45)";
  ctx.fillRect(sp.x - 10, sp.y - 10, 20, 20);

  if (hover && placeId) {
    const def = TOWER_BY_ID[placeId];
    const ok =
      hover.c >= 0 &&
      hover.r >= 0 &&
      hover.c < cols &&
      hover.r < rows &&
      !path.pathSet.has(`${hover.c},${hover.r}`) &&
      !world.towers.some((t) => t.c === hover.c && t.r === hover.r);
    const gx = hover.c * tw + tw / 2;
    const gy = hover.r * th + th / 2;
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = ok ? "#3d8b5a" : "#e83e8c";
    ctx.beginPath();
    ctx.arc(gx, gy, tw * 0.4, 0, Math.PI * 2);
    ctx.fill();
    if (def && ok) {
      ctx.strokeStyle = "#f5d041";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(gx, gy, def.range, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  for (const t of world.towers) {
    const selected = t.uid === world.selectedUid;
    if (selected || world.showRanges) {
      ctx.strokeStyle = selected ? "rgba(245,208,65,0.45)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
      ctx.stroke();
    }
    const key = towerSpriteKey(t.defId, t.pathA, t.pathB);
    const img = getSprite(key);
    if (img && img.complete && img.naturalWidth) {
      drawChromaSprite(ctx, img, t.x, t.y, t.farm ? 36 : 32);
    } else {
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.farm ? 14 : 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = selected ? "#fff" : "#0a0c0f";
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.farm ? 16 : 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#0a0c0f";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`${t.pathA}-${t.pathB}`, t.x, t.y + 22);
    if (selected) {
      ctx.fillStyle = "#fff6d1";
      ctx.font = "9px system-ui";
      ctx.fillText(t.targetMode, t.x, t.y - 20);
    }
  }

  // denser mid: skip some detail when many threats
  const lod = world.threats.length > 120;
  for (const th of world.threats) {
    if (th.kind === "boss") {
      const boss = getSprite("enemies/bosses/ban_barge.jpg");
      if (boss && boss.complete && boss.naturalWidth) {
        drawChromaSprite(ctx, boss, th.x, th.y, th.r * 2.2);
      } else {
        ctx.fillStyle = th.color;
        ctx.beginPath();
        ctx.arc(th.x, th.y, th.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = th.color;
      ctx.beginPath();
      ctx.arc(th.x, th.y, th.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!lod) {
      ctx.strokeStyle = "#0a0c0f";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (th.camo) {
      ctx.strokeStyle = "#a78bfa";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(th.x, th.y, th.r + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (th.lead) {
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(th.x, th.y, Math.max(2, th.r - 2), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (world.showImmunities && !lod) {
      ctx.fillStyle = "#fff";
      ctx.font = "9px system-ui";
      ctx.textAlign = "center";
      const tags = [th.camo ? "C" : "", th.lead ? "L" : "", th.fortified ? "F" : ""].filter(Boolean).join("");
      if (tags) ctx.fillText(tags, th.x, th.y + th.r + 10);
    }
    if (th.kind !== "layer" && th.maxHp > 1) {
      const w = th.r * 2;
      ctx.fillStyle = "#000";
      ctx.fillRect(th.x - w / 2, th.y - th.r - 8, w, 4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(th.x - w / 2, th.y - th.r - 8, w * (th.hp / th.maxHp), 4);
    }
  }

  for (const p of world.projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, lod ? 3 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const f of world.floats) {
    ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.fillStyle = f.color;
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  if (world.feverT > 0) {
    const pulse = 0.35 + 0.3 * Math.sin(performance.now() / 100);
    ctx.strokeStyle = `rgba(244,114,182,${pulse})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.fillStyle = `rgba(244,114,182,${0.04 + 0.03 * Math.sin(performance.now() / 80)})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (world.rageT > 0) {
    ctx.strokeStyle = `rgba(255,59,74,${0.25 + 0.15 * Math.sin(performance.now() / 90)})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, W - 20, H - 20);
  }

  // 4xx upgrade ceremony ring
  if (world.ceremonyT > 0) {
    const t = 1 - world.ceremonyT / 1.2;
    const r = 20 + t * 80;
    ctx.strokeStyle = `rgba(251,221,17,${1 - t})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(world.ceremonyX, world.ceremonyY, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,246,209,${1 - t})`;
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(world.ceremonyLabel, world.ceremonyX, world.ceremonyY - r - 8);
  }

  // Boss entrance banner
  if (world.bossBannerT > 0 && world.bossBanner) {
    const a = Math.min(1, world.bossBannerT / 0.4, (2.2 - world.bossBannerT) / 0.4);
    ctx.fillStyle = `rgba(0,0,0,${0.55 * a})`;
    ctx.fillRect(0, H * 0.38, W, 48);
    ctx.fillStyle = `rgba(251,221,17,${a})`;
    ctx.font = "bold 22px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(world.bossBanner, W / 2, H * 0.38 + 32);
  }

  if (world.hitFlash > 0) {
    ctx.fillStyle = `rgba(255,230,100,${world.hitFlash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (world.lives <= 60) {
    ctx.fillStyle = `rgba(232,62,140,${0.08 + (60 - world.lives) * 0.002})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}
