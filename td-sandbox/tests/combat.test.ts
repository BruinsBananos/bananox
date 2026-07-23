import { describe, expect, it } from "vitest";
import { evaluateBadges } from "../src/content/badges";
import {
  defaultRunConfig,
  labRunConfig,
  MAP_ORDER,
  runDensMul,
  waveContentLevel,
} from "../src/content/runConfig";
import { buildWave, buildWaveFromContent } from "../src/content/waves";
import { TOWERS } from "../src/content/towers";
import { validateMap } from "../src/path/maps";
import { canUpgrade } from "../src/sim/stats";
import { canDamage, canTarget } from "../src/sim/targeting";
import type { ThreatEntity, TowerEntity } from "../src/sim/types";
import {
  castAbility,
  createWorld,
  godCash,
  placeTower,
  sellTower,
  startWave,
  stepSim,
  upgradeTower,
} from "../src/sim/world";
import { computeScore, migrateFromLive } from "../src/save/progress";
import tunables from "../src/content/tunables.json";

function towerStub(partial: Partial<TowerEntity>): TowerEntity {
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
    ...partial,
  };
}

function threatStub(partial: Partial<ThreatEntity>): ThreatEntity {
  return {
    uid: 2,
    kind: "layer",
    layer: "ripe",
    dist: 100,
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
    color: "#facc15",
    ...partial,
  };
}

describe("maps", () => {
  it("all 6 maps validate", () => {
    for (const m of MAP_ORDER) {
      const v = validateMap(m);
      expect(v.ok, m).toBe(true);
      expect(v.placeable).toBeGreaterThanOrEqual(30);
    }
  });
});

describe("towers roster", () => {
  it("has 10 launch towers", () => {
    expect(TOWERS.length).toBe(10);
  });
  it("blocks second deep path", () => {
    const t = towerStub({ pathA: 3, pathB: 2, deepPath: 0 });
    expect(canUpgrade(t, 1).ok).toBe(false);
  });
});

describe("camo lead", () => {
  it("matrix", () => {
    expect(canTarget(towerStub({ camo: false }), threatStub({ camo: true }))).toBe(false);
    expect(canTarget(towerStub({ camo: true }), threatStub({ camo: true }))).toBe(true);
    expect(canDamage(towerStub({ lead: false }), threatStub({ lead: true }))).toBe(false);
    expect(canDamage(towerStub({ lead: true }), threatStub({ lead: true }))).toBe(true);
  });
});

describe("wave grammar", () => {
  it("short remaps late content", () => {
    const cl = waveContentLevel(30, "classic", "short");
    expect(cl).toBeGreaterThanOrEqual(80);
    const w = buildWaveFromContent(90, 1);
    expect(w.groups.length).toBeGreaterThan(0);
  });
  it("boss waves exist at key levels", () => {
    expect(buildWaveFromContent(30, 1).groups.some((g) => g.unit === "boss")).toBe(true);
    expect(buildWaveFromContent(50, 1).groups.some((g) => g.unit === "freighter")).toBe(true);
    expect(buildWaveFromContent(100, 1).groups.some((g) => g.unit === "titan")).toBe(true);
  });
  it("modes build waves", () => {
    for (const mode of ["classic", "tour", "rush", "party"] as const) {
      expect(buildWave(10, mode, "medium", runDensMul({ ...defaultRunConfig(), mode })).groups.length).toBeGreaterThan(0);
    }
  });
});

describe("abilities", () => {
  it("all four cast", () => {
    const { world, path } = createWorld(defaultRunConfig());
    world.ban = 99999;
    placeTower(world, path, "dart", 8, 11);
    startWave(world);
    stepSim(world, path, 0.5);
    for (const id of ["storm", "cryo", "drop", "rage"] as const) {
      world.abilities[id].cd = 0;
      expect(castAbility(world, path, id).some((e) => e.type === "ability")).toBe(true);
    }
  });
});

describe("sell refund", () => {
  it("70%", () => {
    const { world, path } = createWorld(defaultRunConfig());
    world.ban = 1000;
    placeTower(world, path, "dart", 5, 5);
    world.towers[0]!.invested = 1000;
    const before = world.ban;
    sellTower(world, world.towers[0]!.uid);
    expect(world.ban - before).toBe(Math.floor(1000 * tunables.sellRate));
  });
});

describe("badges", () => {
  it("unlocks first win", () => {
    const newly = evaluateBadges(
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
    expect(newly).toContain("first_win");
    expect(newly).toContain("ml_canyon_short");
  });
});

describe("score", () => {
  it("starship multiplies", () => {
    const n = computeScore({
      wave: 30,
      pops: 100,
      banEarned: 1000,
      won: true,
      difficulty: "normal",
      length: "medium",
      mode: "classic",
      reverse: false,
      blitz: false,
    });
    const s = computeScore({
      wave: 30,
      pops: 100,
      banEarned: 1000,
      won: true,
      difficulty: "starship",
      length: "medium",
      mode: "classic",
      reverse: false,
      blitz: false,
    });
    expect(s).toBeGreaterThan(n);
  });
});

describe("migrate", () => {
  it("tolerates empty", () => {
    const p = migrateFromLive({
      schemaVersion: 2,
      games: 0,
      wins: 0,
      bestWave: 0,
      bestScore: 0,
      shortWins: 0,
      hardWins: 0,
      mapPlays: {},
      mapLengthClears: {},
      badges: {},
      cosmetics: { unlocked: [], equipped: {} },
      settings: { muted: false, coach: true },
      migratedFromLive: false,
      updatedAt: 0,
    });
    expect(p.schemaVersion).toBe(2);
  });
});

describe("upgrade", () => {
  it("path increments", () => {
    const { world, path } = createWorld(defaultRunConfig());
    world.ban = 5000;
    placeTower(world, path, "village", 6, 8);
    upgradeTower(world, world.towers[0]!.uid, 0);
    expect(world.towers[0]!.pathA).toBe(1);
  });
});

describe("P0 integrity", () => {
  it("god cash blocked outside sandbox", () => {
    const { world } = createWorld(defaultRunConfig());
    const before = world.ban;
    godCash(world, 5000);
    expect(world.ban).toBe(before);
    expect(world.usedGodTools).toBe(false);
  });
  it("god cash works in lab and marks unranked", () => {
    const { world } = createWorld(labRunConfig());
    godCash(world, 5000);
    expect(world.ban).toBeGreaterThan(5000);
    expect(world.usedGodTools).toBe(true);
    expect(world.config.ranked).toBe(false);
  });
  it("alchemist has coat not farm income paths", () => {
    const a = TOWERS.find((t) => t.id === "alchemist")!;
    expect(a.coat).toBe(true);
    expect(a.pop).toBe(0);
    const flatIncome = a.paths.flat().some((u) => (u.income || 0) > 0);
    expect(flatIncome).toBe(false);
    const hasBrittle = a.paths[0].some((u) => (u.coatBrittle || 0) > 0);
    const hasMidas = a.paths[1].some((u) => (u.coatMidas || 0) > 0);
    expect(hasBrittle && hasMidas).toBe(true);
  });
});

describe("phase4 social", () => {
  it("daily seed is stable for a date", async () => {
    const { getDailyChallenge } = await import("../src/content/daily");
    const a = getDailyChallenge("2026-07-22");
    const b = getDailyChallenge("2026-07-22");
    expect(a.seed).toBe(b.seed);
    expect(a.map).toBe(b.map);
    expect(a.cosmeticReward).toBeGreaterThan(0);
  });
  it("mock LB submits", async () => {
    const { MockRemoteLeaderboard } = await import("../src/net/leaderboard");
    const lb = new MockRemoteLeaderboard();
    const r = await lb.submitGlobal({
      runId: "t1",
      userIdHash: "abc",
      nickname: "Test",
      score: 1000,
      wave: 10,
      pops: 50,
      mode: "classic",
      map: "canyon",
      difficulty: "normal",
      length: "short",
      reverse: false,
      blitz: false,
      won: true,
      freeplay: false,
      clientVersion: "0.4.0-phase4",
      createdAt: Date.now(),
    });
    expect(r.ok).toBe(true);
  });
});
