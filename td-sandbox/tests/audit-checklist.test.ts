/**
 * Extensive pass/fail audit — maps design locks + systems to code evidence.
 */
import { describe, expect, it } from "vitest";
import { existsSync } from "fs";
import { join } from "path";
import {
  defaultRunConfig,
  labRunConfig,
  MAP_ORDER,
  MODES,
  DIFFS,
  LENGTHS,
  runBanMul,
  runDensMul,
  waveContentLevel,
  popBandMul,
} from "../src/content/runConfig";
import { TOWERS } from "../src/content/towers";
import { buildWaveFromContent, buildWave } from "../src/content/waves";
import { EVENT_CATALOG } from "../src/content/events";
import { BADGE_DEFS, evaluateBadges } from "../src/content/badges";
import { getDailyChallenge } from "../src/content/daily";
import { CODEX } from "../src/content/codex";
import { COSMETICS } from "../src/content/cosmetics";
import { isTowerUnlocked, listUnlockedTowers } from "../src/content/unlocks";
import { validateMap } from "../src/path/maps";
import { applyAuras, canUpgrade } from "../src/sim/stats";
import { canDamage, canTarget } from "../src/sim/targeting";
import {
  createWorld,
  placeTower,
  sellTower,
  godCash,
  castAbility,
  startWave,
  stepSim,
  upgradeTower,
} from "../src/sim/world";
import { computeScore, type SliceProgress } from "../src/save/progress";
import { MockRemoteLeaderboard, partitionKey } from "../src/net/leaderboard";
import type { TowerEntity, ThreatEntity } from "../src/sim/types";

const root = join(__dirname, "../..");

function towerStub(p: Partial<TowerEntity> = {}): TowerEntity {
  return {
    uid: 1,
    defId: "dart",
    c: 0,
    r: 0,
    x: 0,
    y: 0,
    pathA: 0,
    pathB: 0,
    deepPath: null,
    invested: 175,
    targetMode: "first",
    cooldown: 0,
    range: 170,
    rof: 0.46,
    pierce: 1,
    pop: 1,
    splash: 0,
    slow: 0,
    camo: false,
    lead: false,
    multishot: 0,
    preferStrong: false,
    farm: false,
    freezePulse: false,
    support: false,
    coat: false,
    coatBrittle: 0,
    coatMidas: 0,
    income: 0,
    auraRof: 0,
    auraCamo: false,
    color: "#fff",
    effCamo: false,
    effRofMul: 1,
    ...p,
  };
}

function threatStub(p: Partial<ThreatEntity> = {}): ThreatEntity {
  return {
    uid: 2,
    kind: "layer",
    layer: "ripe",
    dist: 50,
    x: 0,
    y: 0,
    r: 12,
    speed: 60,
    baseSpeed: 60,
    camo: false,
    lead: false,
    fortified: false,
    alive: true,
    hp: 1,
    maxHp: 1,
    value: 3,
    lives: 1,
    slowMul: 1,
    freezeT: 0,
    coatBrittle: 0,
    coatMidas: 0,
    coatT: 0,
    color: "#ff0",
    ...p,
  };
}

describe("AUDIT docs present", () => {
  for (const d of [
    "DESIGN-LOCK.md",
    "SYSTEMS-BIBLE.md",
    "CONTENT-BIBLE.md",
    "TECH-ARCHITECTURE.md",
    "UI-UX-SPEC.md",
    "AUDIO-BIBLE.md",
    "ART-BIBLE.md",
  ]) {
    it(`doc ${d}`, () => {
      expect(existsSync(join(root, d))).toBe(true);
    });
  }
  it("prototype status", () => {
    expect(existsSync(join(__dirname, "../PROTOTYPE-STATUS.md"))).toBe(true);
  });
  it("legacy playTD still on site", () => {
    expect(existsSync(join(root, "playTD.js"))).toBe(true);
  });
});

describe("AUDIT maps", () => {
  for (const m of MAP_ORDER) {
    it(`${m} valid path + placeable`, () => {
      const v = validateMap(m);
      expect(v.ok).toBe(true);
      expect(v.placeable).toBeGreaterThanOrEqual(30);
      expect(v.pathLen).toBeGreaterThan(0);
    });
  }
});

describe("AUDIT roster", () => {
  it("10 towers", () => expect(TOWERS.length).toBe(10));
  it("each has 2 paths × 4 tiers", () => {
    for (const t of TOWERS) {
      expect(t.paths[0].length).toBe(4);
      expect(t.paths[1].length).toBe(4);
    }
  });
  it("alchemist coat identity", () => {
    const a = TOWERS.find((t) => t.id === "alchemist")!;
    expect(a.coat).toBe(true);
    expect(a.pop).toBe(0);
    expect(a.paths.flat().some((u) => (u.income || 0) > 0)).toBe(false);
  });
});

describe("AUDIT combat rules", () => {
  it("camo blocks targeting", () => {
    expect(canTarget(towerStub({ camo: false }), threatStub({ camo: true }))).toBe(false);
    expect(canTarget(towerStub({ camo: true }), threatStub({ camo: true }))).toBe(true);
  });
  it("lead blocks damage", () => {
    expect(canDamage({ lead: false }, threatStub({ lead: true }))).toBe(false);
    expect(canDamage({ lead: true }, threatStub({ lead: true }))).toBe(true);
  });
  it("dual path 2-2 free, 3-3 blocked", () => {
    const t = towerStub({ pathA: 2, pathB: 2 });
    expect(canUpgrade(t, 0).ok).toBe(true);
    t.pathA = 3;
    t.deepPath = 0;
    expect(canUpgrade(t, 1).ok).toBe(false);
  });
  it("sell 70%", () => {
    const { world, path } = createWorld(defaultRunConfig());
    world.ban = 2000;
    placeTower(world, path, "dart", 5, 5);
    world.towers[0]!.invested = 1000;
    const before = world.ban;
    sellTower(world, world.towers[0]!.uid);
    expect(world.ban - before).toBe(700);
  });
});

describe("AUDIT economy / modes", () => {
  it("rush dens high, ban soft (red team rebalance)", () => {
    expect(MODES.rush.dens).toBeGreaterThan(1.2);
    expect(MODES.rush.ban).toBeLessThanOrEqual(1.2);
    expect(MODES.rush.feverStart).toBeGreaterThan(0);
  });
  it("blitz does NOT multiply ban", () => {
    const cfg = { ...defaultRunConfig(), blitz: true };
    expect(runBanMul(cfg)).toBe(runBanMul(defaultRunConfig()));
    expect(runDensMul(cfg)).toBeGreaterThan(runDensMul(defaultRunConfig()));
  });
  it("short remaps content", () => {
    expect(waveContentLevel(30, "classic", "short")).toBeGreaterThanOrEqual(80);
  });
  it("party ban softer than old inflate", () => {
    expect(MODES.party.ban).toBeLessThanOrEqual(1.2);
    expect(MODES.party.eventScale).toBeLessThan(0.7);
  });
});

describe("AUDIT wave grammar", () => {
  it("boss freighter titan schedule", () => {
    expect(buildWaveFromContent(30, 1).groups.some((g) => g.unit === "boss")).toBe(true);
    expect(buildWaveFromContent(50, 1).groups.some((g) => g.unit === "freighter")).toBe(true);
    expect(buildWaveFromContent(100, 1).groups.some((g) => g.unit === "titan")).toBe(true);
  });
  it("all modes produce waves", () => {
    for (const mode of ["classic", "tour", "rush", "party"] as const) {
      const w = buildWave(15, mode, "medium", 1);
      expect(w.groups.length).toBeGreaterThan(0);
    }
  });
});

describe("AUDIT lab integrity", () => {
  it("god cash blocked ranked", () => {
    const { world } = createWorld(defaultRunConfig());
    const b = world.ban;
    godCash(world, 5000);
    expect(world.ban).toBe(b);
    expect(world.usedGodTools).toBe(false);
  });
  it("god cash lab only", () => {
    const { world } = createWorld(labRunConfig());
    godCash(world, 5000);
    expect(world.usedGodTools).toBe(true);
    expect(world.config.ranked).toBe(false);
  });
});

describe("AUDIT abilities", () => {
  it("four abilities cast", () => {
    const { world, path } = createWorld(defaultRunConfig());
    world.ban = 99999;
    placeTower(world, path, "dart", 8, 11);
    startWave(world);
    for (const id of ["storm", "cryo", "drop", "rage"] as const) {
      world.abilities[id].cd = 0;
      expect(castAbility(world, path, id).some((e) => e.type === "ability")).toBe(true);
    }
  });
});

describe("AUDIT meta", () => {
  it("daily stable seed", () => {
    const a = getDailyChallenge("2026-07-22");
    const b = getDailyChallenge("2026-07-22");
    expect(a.seed).toBe(b.seed);
    expect(a.cosmeticReward).toBeGreaterThan(0);
  });
  it("badges evaluate win", () => {
    const n = evaluateBadges(
      {
        won: true,
        wave: 30,
        mode: "classic",
        map: "canyon",
        length: "short",
        difficulty: "normal",
        reverse: false,
        blitz: false,
        usedFarm: true,
        onlyDart: false,
        mapLengthClears: {},
      },
      {}
    );
    expect(n).toContain("first_win");
  });
  it("codex and cosmetics non-empty", () => {
    expect(CODEX.length).toBeGreaterThan(10);
    expect(COSMETICS.length).toBeGreaterThan(5);
  });
  it("mock LB submit + partition key", async () => {
    const lb = new MockRemoteLeaderboard();
    const r = await lb.submitGlobal({
      runId: "audit1",
      userIdHash: "h",
      nickname: "Audit",
      score: 500,
      wave: 5,
      pops: 10,
      mode: "classic",
      map: "canyon",
      difficulty: "hard",
      length: "short",
      reverse: false,
      blitz: false,
      won: true,
      freeplay: false,
      clientVersion: "0.5.0-aaa",
      createdAt: Date.now(),
    });
    expect(r.ok).toBe(true);
    expect(partitionKey({ mode: "classic", length: "short", difficulty: "hard" })).toBe(
      "classic|short|hard"
    );
  });
  it("unlock ladder start set", () => {
    const fresh = {
      badges: {},
      bestWave: 0,
    } as SliceProgress;
    expect(isTowerUnlocked("dart", fresh, false)).toBe(true);
    expect(isTowerUnlocked("battery", fresh, false)).toBe(false);
    expect(isTowerUnlocked("battery", fresh, true)).toBe(true);
    expect(listUnlockedTowers(fresh, false).length).toBe(5);
  });
  it("pop band softcap declines", () => {
    expect(popBandMul(20)).toBe(1);
    expect(popBandMul(50)).toBeLessThan(1);
    expect(popBandMul(100)).toBeLessThan(popBandMul(50));
  });
  it("village camo aura caps at 4", () => {
    const towers: TowerEntity[] = [];
    const village = towerStub({
      uid: 99,
      defId: "village",
      support: true,
      auraCamo: true,
      range: 500,
      x: 0,
      y: 0,
      farm: false,
    });
    towers.push(village);
    for (let i = 0; i < 8; i++) {
      towers.push(
        towerStub({
          uid: i + 1,
          x: i * 10,
          y: 0,
          camo: false,
          farm: false,
          support: false,
        })
      );
    }
    applyAuras(towers);
    const camoCount = towers.filter((t) => t.uid !== 99 && t.effCamo).length;
    expect(camoCount).toBe(4);
  });
  it("score scales with starship", () => {
    const base = {
      wave: 30,
      pops: 100,
      banEarned: 1000,
      won: true,
      length: "medium",
      mode: "classic",
      reverse: false,
      blitz: false,
    };
    expect(
      computeScore({ ...base, difficulty: "starship" })
    ).toBeGreaterThan(computeScore({ ...base, difficulty: "normal" }));
  });
});

describe("AUDIT AAA locks enforced", () => {
  it("unlock ladder blocks battery on fresh progress", () => {
    const unlocked = ["dart", "bomb", "ice", "sniper", "farm"];
    const { world, path } = createWorld(defaultRunConfig(), unlocked);
    world.ban = 999999;
    placeTower(world, path, "battery", 4, 4);
    expect(world.towers.some((t) => t.defId === "battery")).toBe(false);
    placeTower(world, path, "dart", 5, 5);
    expect(world.towers.some((t) => t.defId === "dart")).toBe(true);
  });
  it("max 3 farms", () => {
    const { world, path } = createWorld(defaultRunConfig());
    world.ban = 999999;
    let n = 0;
    for (let c = 0; c < 12; c++) {
      for (let r = 0; r < 12; r++) {
        const before = world.towers.length;
        placeTower(world, path, "farm", c, r);
        if (world.towers.length > before) n++;
      }
    }
    expect(n).toBe(3);
  });
  it("rush dens pressure without ban inflate", () => {
    expect(MODES.rush.dens).toBeGreaterThan(1.25);
    expect(MODES.rush.ban).toBeLessThan(1.25);
  });
  it("atlas medium requires hard clears in badge logic", () => {
    const n = evaluateBadges(
      {
        won: true,
        wave: 75,
        mode: "classic",
        map: "canyon",
        length: "medium",
        difficulty: "normal",
        reverse: false,
        blitz: false,
        usedFarm: true,
        onlyDart: false,
        mapLengthClears: {},
      },
      {}
    );
    expect(n).not.toContain("ml_canyon_medium");
    const hard = evaluateBadges(
      {
        won: true,
        wave: 75,
        mode: "classic",
        map: "canyon",
        length: "medium",
        difficulty: "hard",
        reverse: false,
        blitz: false,
        usedFarm: true,
        onlyDart: false,
        mapLengthClears: {},
      },
      {}
    );
    expect(hard).toContain("ml_canyon_medium");
  });
});

describe("AUDIT sim smoke", () => {
  it("places and runs wave without throw", () => {
    const created = createWorld(defaultRunConfig());
    const world = created.world;
    let path = created.path;
    world.ban = 99999;
    placeTower(world, path, "dart", 8, 11);
    placeTower(world, path, "bomb", 9, 11);
    startWave(world);
    for (let i = 0; i < 300; i++) {
      const out = stepSim(world, path, 1 / 60);
      path = out.path;
    }
    expect(["prep", "combat", "won", "lost"]).toContain(world.phase);
  });
});
