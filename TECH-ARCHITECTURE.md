# Banano TD — Tech Architecture (Prompt 3)

**Status:** IMPLEMENTATION-READY  
**Depends on:** `DESIGN-LOCK.md`, `SYSTEMS-BIBLE.md`  
**Supersedes for tech detail:** `ARCHITECTURE.md` (keep as summary; this doc wins on conflict)  
**Product name:** Banano TD  
**Replace target:** `playTD.html` + `playTD.js` → Vite bundle on bananox.com  

---

## 1. Stack choice

### Options evaluated

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A. Evolve `playTD.js` Canvas2D** | Zero migration; already live DNA | 4k IIFE; hard tests; weak dense VFX; no modules; TS retrofit painful | **No** as end state |
| **B. Phaser 3 + TS** | Scenes, input, arcade helpers | Heavier bundle; opinionated scene graph; TD needs custom sim anyway | **Backup** only |
| **C. PixiJS v8 + TS + Vite** | Thin WebGL; full control of sim; great for pooling/atlases; small | More DIY for UI/scenes | **Recommended** |

### Recommendation

**PixiJS v8 + TypeScript (strict) + Vite** for the battlefield; **HTML/CSS** for hub/HUD/overlays (Banano X shell). Pure **sim in TS with zero Pixi imports**. Vitest for headless combat/economy.

**Not Unity WebGL** (size, load, Banano X static hosting).

### Migration path

```
Phase M0  Keep playTD.js as production (playTD.legacy.js rename optional)
Phase M1  Scaffold src-td/ Vite app; mount empty Pixi in playTD.html host div
Phase M2  Port content JSON + path + sim tick headless tests green
Phase M3  Combat sandbox (no full hub)
Phase M4  Vertical slice → ?td=new or path playTD.html?engine=pixi
Phase M5  Feature parity Phase 3 → default engine = new; ?legacy=1 one release
Phase M6  Delete legacy JS after 1–2 weeks stable
```

**Deploy artifact**

```
bananox/
  playTD.html           # shell: nav, HUD mounts, #td-canvas-host
  playTD.legacy.js      # frozen old IIFE (temporary)
  td/                   # vite build outDir
    assets/
    index-*.js
  src-td/               # source (built in CI or pre-push; not required on Pages raw)
  package.json          # name: banano-td, scripts: dev, build, test
```

**Bundle budget:** initial JS gzip **&lt; 350KB** core; atlases lazy per run start.

---

## 2. Folder structure + module APIs

```
src-td/
  main.ts
  app/
    GameApp.ts
    RunSession.ts
    loop/
      MainLoop.ts
      Clock.ts
  core/
    types.ts
    math.ts
    rng.ts              # mulberry32 / sfc32 streams
    EventBus.ts
    pool.ts
    spatialHash.ts
  content/              # data only — loaders + typed defs
    schema/
    towers/
    enemies/
    waves/
    maps/
    modes.ts
    abilities.ts
    events.ts
    cosmetics.ts
    badges.ts
    balance.jsonc       # SYSTEMS-BIBLE §14
  path/                 # pathing (name per prompt)
  combat/
  economy/
  sim/
  render/
  input/
  ui/
  save/
  audio/
  net/
  assets/               # static imports / URL refs
```

### Hard dependency rule

```
content → (nothing runtime)
core → (nothing game)
path → core, content
combat → core, content, path
economy → core, content
sim → core, content, path, combat, economy   [NO render/ui/input/pixi]
input → core
render → core, content   [reads sim snapshots only]
ui → core, content, save
save → core, content
audio → core
net → core
app → everything (wiring only)
```

---

### 2.1 `sim` — orchestration

```ts
interface SimWorld { /* SYSTEMS-BIBLE §1 */ }
interface SimCommand =
  | { type: "place"; towerId: string; c: number; r: number }
  | { type: "sell"; towerUid: number }
  | { type: "upgrade"; towerUid: number; path: 0 | 1 }
  | { type: "retarget"; towerUid: number; mode: TargetMode }
  | { type: "ability"; id: AbilityId }
  | { type: "sendWave" }
  | { type: "setAutoWave"; on: boolean }
  | { type: "setSpeed"; mult: number }
  | { type: "pause"; on: boolean };

interface SimApi {
  create(config: RunConfig, seed: string | null): SimWorld;
  enqueue(cmd: SimCommand): void;
  step(world: SimWorld, dt: number): SimEvents[];  // dt fixed 1/60
  snapshot(world: SimWorld): SimSnapshot;          // render-facing immutable-ish
  canAutoSend(world: SimWorld): boolean;
}
```

`SimEvents`: `pop`, `leak`, `waveClear`, `bossKill`, `fever`, `ability`, `place`, … for audio/juice.

---

### 2.2 `path`

```ts
interface PathApi {
  buildFromMap(def: MapDef, reverse: boolean): PathRuntime;
  // PathRuntime: waypoints, segLens, pathLen, pathSet, placeableMask, lanes[]
  posAlong(path: PathRuntime, dist: number, lane?: number): { x: number; y: number; ang: number };
  isPlaceable(path: PathRuntime, c: number, r: number): boolean;
  validateMap(def: MapDef): ValidationResult;
}
```

---

### 2.3 `combat`

```ts
interface CombatApi {
  tryFire(world: SimWorld, tower: TowerEntity, dt: number): void;
  tickProjectiles(world: SimWorld, dt: number): void;
  tickThreats(world: SimWorld, dt: number): void;
  applyHit(world: SimWorld, proj: Projectile, threat: Threat): void;
  popLayers(world: SimWorld, threat: Threat, pop: number, source: HitSource): void;
  acquireTarget(tower: TowerEntity, threats: Threat[], path: PathRuntime): Threat | null;
  canTarget(tower: TowerFlags, t: Threat): boolean;
  canDamage(tower: TowerFlags, t: Threat): boolean;
}
```

Uses `spatialHash` for projectile ↔ threat queries when count high.

---

### 2.4 `economy`

```ts
interface EconomyApi {
  startBan(config: RunConfig): number;
  onKill(world: SimWorld, baseValue: number, pos: Vec2): number;
  onRoundClear(world: SimWorld, perfect: boolean): RoundPayout;
  interestPreview(ban: number, diff: DiffId): number;
  applyInterest(world: SimWorld): number;
  farmPayout(world: SimWorld): number;
  dropAbility(world: SimWorld): number;
  sellRefund(invested: number): number;
}
```

All softcaps live here (SYSTEMS-BIBLE §8).

---

### 2.5 `content`

```ts
interface ContentApi {
  towers: Record<TowerId, TowerDef>;
  layers: Record<LayerId, LayerDef>;
  specials: Record<SpecialId, SpecialDef>;
  maps: Record<MapId, MapDef>;
  modes: Record<ModeId, ModeDef>;
  lengths: Record<LengthId, LengthDef>;
  difficulties: Record<DiffId, DiffDef>;
  abilities: Record<AbilityId, AbilityDef>;
  events: EventTable;
  badges: BadgeDef[];
  cosmetics: CosmeticDef[];
  balance: BalanceConfig;          // from JSONC
  waveTable: WaveDef[];           // contentLevel 1..150
  getTower(id: TowerId): TowerDef;
  waveContentLevel(displayWave: number, length: LengthId, mode: ModeId): number;
}
```

---

### 2.6 `render`

```ts
interface RenderApi {
  mount(host: HTMLElement): void;
  resize(w: number, h: number, dpr: number): void;
  setQuality(q: "high" | "med" | "low"): void;
  sync(snapshot: SimSnapshot, alpha: number): void;  // alpha = render interpolation
  setDebug(flags: RenderDebugFlags): void;
  destroy(): void;
}
```

Pixi stage layers per SYSTEMS-BIBLE / prior arch. **No writes to SimWorld.**

---

### 2.7 `input`

```ts
interface InputApi {
  attach(el: HTMLElement): void;
  setMode(mode: "hub" | "place" | "select" | "radial" | "disabled"): void;
  poll(): InputFrame;  // edges: pointer, keys
  // Maps to SimCommands in app layer — input does not call sim directly required,
  // but may emit Intent events
}
```

Desktop-class mobile: drag-place, 44px hits, radial upgrade; no gesture-only crits (Design Lock).

---

### 2.8 `ui`

```ts
interface UiApi {
  bindHud(els: HudElements): void;
  renderHub(progress: ProgressState): void;
  renderShop(world: SimSnapshot, selected: string): void;
  renderTowerPanel(tower: TowerEntity | null): void;
  showOverlay(kind: OverlayKind, data: unknown): void;
  showToast(msg: string): void;
  shareCard(result: RunResult): SharePayload;
}
```

DOM-first for text; theme via Banano X `data-theme`.

---

### 2.9 `save`

```ts
interface SaveApi {
  load(): ProgressState;
  save(state: ProgressState): void;       // debounced + dual-slot
  exportJson(): string;
  importJson(raw: string): ProgressState;
  migrate(raw: unknown): ProgressState; // v1..vNext
  reset(): void;                        // confirm in UI
}
```

Keys: `bananox_td_v1`, `bananox_td_v1.bak` (KEEP names).

---

### 2.10 `audio`

```ts
interface AudioApi {
  unlock(): void;           // user gesture
  setMuted(m: boolean): void;
  onSimEvents(events: SimEvents[]): void;
}
```

Procedural Web Audio first; optional buffers later.

---

### 2.11 `net`

```ts
interface LeaderboardClient {
  submitLocal(entry: LbEntry): void;
  listLocal(limit: number): LbEntry[];
  submitGlobal?(dto: GlobalRunSubmit): Promise<void>;  // Phase 4
  fetchGlobal?(query: GlobalQuery): Promise<LbEntry[]>;
}
```

Schema at launch; live backend Phase 4 (Design Lock).

---

## 3. Main loop

### 3.1 Clock

```
display frame (rAF)
  now = performance.now()
  if document.hidden: pause sim accumulation (or cap); don't soft-lock UI
  frameDt = min(now - last, 100ms)           // clamp spiral
  if paused or phase prep without combat: simAcc = 0; render only HUD
  else:
    simAcc += frameDt * speedMult
    steps = 0
    while simAcc >= SIM_DT and steps < maxStepsForSpeed:
      events += sim.step(world, SIM_DT)
      simAcc -= SIM_DT
      steps++
    alpha = simAcc / SIM_DT                  // interpolation residual
  render.sync(snapshot, alpha)
  audio/ui handle events
```

| Constant | Value |
|----------|-------|
| `SIM_DT` | `1000/60` ms |
| `speedMult` | 1, 2, 3 ranked; up to **10** sandbox/debug only |
| `maxSteps` ranked | `ceil(3 * (fps/60))` capped **6** at 1–3× |
| `maxSteps` sandbox 10× | **12** hard cap; if exceeded, **drop speed** to highest safe (never desync economy by skipping steps silently—prefer temporary speed clamp + toast “Speed limited for stability”) |

### 3.2 Pause

- `paused=true`: no sim steps; render idle anim optional; CD frozen  
- Overlays (upgrade modal) may auto-pause on mobile settings  

### 3.3 Background tab

- `document.visibilityState === "hidden"`: freeze simAcc; do not catch-up more than **0.5s** on return (prevents wave teleport)  
- Auto-wave does not fire while hidden  

### 3.4 Speed safety ×1–10

| Speed | Allowed |
|-------|---------|
| 1–3 | Ranked + sandbox |
| 4–10 | Sandbox / debug only (`ranked=false`) |
| Any | If `steps` hit cap 3 frames in a row → force speed down one tier |

---

## 4. Content schema

TypeScript interfaces (serialized JSON on disk where noted).

### 4.1 Tower

```ts
interface TowerDef {
  id: TowerId;
  name: string;
  role: "Primary" | "Mid" | "Military" | "Magic" | "Economy" | "Support" | "Hero" | "Ultimate";
  verb: string;
  cost: number;
  base: CombatStats;
  pathNames: [string, string];
  paths: [UpgradeTier[], UpgradeTier[]];  // length 4 each
  art: { base: string; pathTiers?: string[] };
  defaults?: { targetMode?: TargetMode };
}

interface CombatStats {
  range: number; rof: number; pierce: number; pop: number;
  splash: number; slow?: number;
  camo: boolean; lead: boolean;
  multishot?: number; boomerang?: boolean; rail?: boolean;
  farm?: boolean; support?: boolean; freezePulse?: boolean;
  preferStrong?: boolean; income?: number;
  auraRof?: number; auraCamo?: boolean;
}

interface UpgradeTier {
  name: string; desc: string; cost: number;
  // sparse deltas merged into stats
  [stat: string]: number | boolean | string | undefined;
}
```

### 4.2 Enemy / layers / specials

```ts
interface LayerDef {
  id: LayerId; name: string; next: LayerId | null;
  speed: number; value: number; r: number; lives: number;
  color?: string; // UI fallback only
}

interface SpecialDef {
  id: SpecialId; hp: number; speed: number; value: number; lives: number;
  children: LayerId | SpecialId; childCount: number;
  lead?: boolean; camo?: boolean; fortified?: boolean;
}
```

### 4.3 Waves

```ts
interface WaveDef {
  contentLevel: number;           // 1..150
  groups: {
    unit: LayerId | SpecialId;
    count: number;
    spacing: number;
    delay: number;
    props?: { camo?: boolean; lead?: boolean; regrow?: boolean; fortified?: boolean; speedMul?: number };
    lane?: 0 | 1 | "split";
  }[];
  bossInsert?: SpecialId;
}
```

### 4.4 Maps — see §5

### 4.5 Modes / lengths / difficulties

As SYSTEMS-BIBLE balance JSON; typed in `content/modes.ts` etc.

### 4.6 Abilities

```ts
interface AbilityDef {
  id: AbilityId; name: string; maxCd: number;
  // effect params from balance.jsonc
}
```

### 4.7 Events

```ts
interface RandomEventDef {
  id: "double" | "slowmo" | "rain" | "frenzy";
  weight: number; duration: number; banCap?: number;
}
```

### 4.8 Cosmetics / badges

```ts
interface CosmeticDef {
  id: string; slot: "towerSkin" | "projectile" | "mapSkin" | "banner" | "title";
  unlock: { type: "badge" | "mastery" | "daily" | "accountXp"; ref: string };
  // power: never
}

interface BadgeDef {
  id: string; name: string; desc: string; tier: "easy" | "medium" | "hard" | "legend";
  // predicate evaluated in save/meta on run end
}
```

---

## 5. Map pipeline

### 5.1 Authoring format (JSON)

```jsonc
{
  "id": "canyon",
  "name": "Potassium Canyon",
  "short": "Canyon",
  "version": 1,
  "grid": { "cols": 40, "rows": 25 },
  "lanes": [
    {
      "id": 0,
      "waypoints": [ [0, 12], [9, 12], [9, 3], [18, 3], /* ... cell coords */ ]
    }
  ],
  // optional explicit mask; default = all cells not on any lane polyline
  "blocked": [ [5, 5], [5, 6] ],
  "forcePlaceable": [],
  "decor": [ { "type": "palm", "c": 10, "r": 8 } ],
  "meta": {
    "lesson": "line-farm",
    "chokepoints": 3,
    "gimmick": null
  }
}
```

**Waypoints:** ordered grid cells; runtime expands to centers + segment lengths.  
**Placeable mask:** `placeable[c,r] = inBounds && !pathSet && !blocked`.  
**Reverse:** `waypoints = waypoints.slice().reverse()` per lane before bake; validate still contiguous.

### 5.2 Validation (`path.validateMap`)

| Check | Fail if |
|-------|---------|
| ≥2 waypoints per lane | empty / single |
| Orthogonal or diagonal steps | jump &gt; √2 cells (prefer 4-connected; allow 8 if authored) |
| No duplicate consecutive | warn strip |
| Start on edge / end on edge | warn (not hard fail) |
| pathLen &gt; 0 | fail |
| Placeable cells ≥ 30 | fail (unplayable) |
| Tower cell not path | enforced at place |
| Reverse produces valid | run validate twice |

**CI:** load all `content/maps/*.json`, validate, snapshot pathLen.

### 5.3 Runtime bake

```
MapDef → PathRuntime { lanes: PathLane[], pathSet, placeableMask[][], pathLenMax }
```

---

## 6. Performance budget

### 6.1 Caps (sim)

| Entity | Soft cap | Hard behavior |
|--------|----------|---------------|
| Bananas / threats | **280** | Delay spawns (SYSTEMS-BIBLE) |
| Projectiles | **400** | Oldest non-rail despawn |
| Towers | **80** | Place reject + toast |
| Particles (render) | **200** | Pool recycle; skip spawn |
| Float texts | **48** | Throttle |

### 6.2 Pooling

- `Pool<Threat>`, `Pool<Projectile>`, `Pool<ParticleView>`  
- Reset fields on release; never retain stale uid  

### 6.3 Spatial hash

- Cell size ≈ **64 world units** (tune to average banana radius × 4)  
- Insert threats each step (or dirty move)  
- Projectiles query neighbor cells only  
- Below 80 threats: linear scan OK (branch in combat)  

### 6.4 Culling (render)

- Skip sprites outside camera padded AABB  
- Static map layer: single baked texture/container  
- Offscreen towers: still sim; hide sprite  

### 6.5 Late-game LOD

| Pressure | LOD action |
|----------|------------|
| threats &gt; 150 | Merge pop floats; 50% particle rate |
| threats &gt; 220 | Simplify banana sprites (no wobble); disable shadow |
| projectiles &gt; 250 | Hide trail meshes |
| FPS p95 &lt; 40 for 2s | Auto quality → med → low |
| quality low | No screen shake; max particles 80; skip non-boss juice |

**Sim never drops** bananas for FPS (fairness).

---

## 7. Save system

### 7.1 Keys (unchanged)

| Key | Role |
|-----|------|
| `bananox_td_v1` | Primary |
| `bananox_td_v1.bak` | Previous good write |

### 7.2 Schema vNext (v5)

```ts
interface ProgressState {
  schemaVersion: 5;
  updatedAt: number;
  lastPlayedAt: number;
  lastMapId: MapId;
  lastMode: ModeId;
  lastDifficulty: DiffId;
  lastLength: LengthId;
  reversePath: boolean;
  blitzOn: boolean;
  records: { bestWave; bestStreak; bestPops; games; goldens; missions; bestScore };
  maps: Record<MapId, MapRecord>;
  modes: Record<ModeId, ModeRecord>;
  badges: Record<string, number>;          // id → ts
  leaderboard: LbEntry[];                  // max 20
  stats: { abilityUses; perfectWaves; totalWins; totalPops };
  mapLengthClears: Record<string, number>; // "canyon_short" → ts
  unlockedMaps: MapId[];
  settings: {
    muted: boolean;
    autoWave: boolean;
    reversePath: boolean;
    blitzOn: boolean;
    quality?: "high" | "med" | "low";
    nickname?: string;
  };
  // v5 additions
  accountXp: number;
  mastery: Record<TowerId, number>;
  cosmetics: { unlocked: string[]; equipped: Record<string, string> };
  titles: string[];
  cosmeticCurrency: number;                // daily only; never power
  clientVersion: string;
}
```

### 7.3 Migration path

```
raw missing version → v1 flat records → v2 → v3 badges/LB → v4 length/mutators → v5 meta cosmetics
```

Port existing `migrateProgress` logic; **never drop badges / mapLengthClears**.

### 7.4 Export / import policy

| Action | Policy |
|--------|--------|
| Export | Full JSON download; player-owned |
| Import | Validate + migrate; **merge strategy:** max() numerics, union badges, merge LB top 20 by score |
| Reset | Confirm string; wipe both keys |
| Corruption | Load bak; if both fail, defaultProgress + toast |
| Sandbox | Does not write ranked badges; may write settings |

### 7.5 Write strategy

- Debounce 500ms on mid-run  
- On visibility hidden / run end: flush immediate  
- Write primary then bak rotation (current DNA: bak = previous primary)  

---

## 8. Deterministic daily challenge design

### 8.1 Seed

```
dailySeed = hash(`banano-td|${YYYY-MM-DD}|${clientMajorVersion}`)
// or server-provided later; local compute fine Phase 1–3
RunConfig fixed: mode, length, map, diff, mutators from daily table
```

### 8.2 Seeded RNG points (must use streams)

| Stream | Seed derivation | Consumed by |
|--------|-----------------|-------------|
| `rngWave` | `seed \|\| "wave"` | Wave group property rolls, jackpot insert, boss variance |
| `rngSpawn` | `seed \|\| "spawn"` | Spawn spacing jitter, child lateral offset |
| `rngEvent` | `seed \|\| "event"` | Random event kind + CD noise |
| `rngMission` | `seed \|\| "mission"` | Daily mission variant |
| `rngCosmetic` | unseeded optional | Visual-only confetti |

**Not seeded:** pointer timing (player), particle angles (render).

### 8.3 Daily rewards (Design Lock)

- Cosmetic / title / cosmeticCurrency only  
- `ranked` daily board separate flag  
- Same seed + perfect command replay → same outcome (golden test)  

### 8.4 Command log (optional Phase 4)

```ts
{ tStep: number, cmd: SimCommand }[]
```

Enough for dispute / ghost; not required day one.

---

## 9. Testing

### 9.1 Unit (Vitest) — required

| Test | Assert |
|------|--------|
| Pop chain | JACKPOT peels full chain order |
| Multi-pop | pop=3 from zebra walks 3 steps |
| Pierce | pierce=2 hits two bananas then dies |
| Lead fail | !canLead sparks; pierce consumed per bible |
| Fortified pop1 | blocked; pop2 peels |
| Path reverse | first/last waypoints swapped; pathLen equal |
| Sell refund | floor(invested * 0.7) |
| Wave remap | Short w=30 → contentLevel near 90 span math |
| Dual path | 2-2 OK; 3-2 OK; 3-3 reject |
| Interest softcap | 10k bank &lt; linear 12% |
| Fever | bounty ×2; interest unchanged |
| Auto-wave guard | broke+cd+leak → false |

### 9.2 Balance snapshot tests

- Serialize `content/balance.jsonc` + tower costs hash  
- Wave 1–20 spawn counts for Normal Classic Medium frozen fixtures  
- Fail CI if unintentional drift (explicit `-u` to update)  

### 9.3 Integration

- Headless: create sim, place dart, force wave 1, step until clear, lives unchanged  
- Save: load v4 fixture → v5 fields present; badges preserved  

### 9.4 Manual / Playwright smoke

- Boot playTD.html, open hub, start Short Canyon, place tower  

---

## 10. Phased plan

| Phase | Name | Deliverables | Exit gate |
|-------|------|--------------|-----------|
| **0** | Design | DESIGN-LOCK, SYSTEMS-BIBLE, TECH-ARCHITECTURE | Docs reviewed |
| **1** | Combat sandbox | Vite+Pixi+sim; sandbox map; fire/pop/pierce/camo/lead; debug HUD; unit tests green | Golden tests 10, 16, 17 pass |
| **2** | Vertical slice | **1 map** (Canyon), **5 towers** (Dart, Bomb, Sniper, Chill, Farm), Classic **Short + Medium**, dual-path UI, Storm+Cryo, save migrate, abilities CD, interest tiers, hub minimal | Stranger clears Short Normal; migrate real v4 save |
| **3** | Full content | 6 maps, 9–10 towers, all modes/lengths/mutators, fever/events/streak, badges atlas, local LB, Hard default, readability+juice, radial mobile | Parity vs legacy DNA; golden playtests 1–20 |
| **4** | Social / live / trailer | Global LB backend, daily cosmetic challenge, share card polish, trailer capture quality, cut legacy | Schema live; trailer shipped; `?legacy` removed |

**Post-4 content drop:** +2 maps, +2 towers (bible), dual-lane map.

**Note vs earlier arch:** Phase 2 here is **5 towers / Classic Short+Med** (this prompt)—tighter than full DNA; Phase 3 carries remaining towers/modes.

---

## 11. Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Port stall (4k lines) | Schedule | H | Slice Phase 2; legacy flag |
| Sim/render desync | Bugs | M | Snapshot API; sim authority; no render writes |
| Perf on mid-mobile late | Pillar fail | H | Caps, LOD, spatial hash, quality auto |
| Eco inflation regress | Buildcraft dead | M | Softcaps + snapshot tests |
| Save wipe on migrate | Trust | L | bak + fixtures + merge import |
| Pixi bundle bloat | Load time | M | code-split; compress atlases |
| Determinism broken by juice RNG | Daily unfair | M | Stream isolation tests |
| Scope (art for 10 towers) | Delay | H | Ship 9; Alchemist follows |
| Touch mis-tap | Mobile churn | M | 44px; drag place; radial+panel |
| Background tab catch-up | Unfair teleport | M | max 0.5s catch-up |
| Dual maintenance legacy+new | Burnout | M | Hard cutover date after Phase 3 |

---

## Appendix — RunConfig

```ts
interface RunConfig {
  mode: ModeId;
  length: LengthId;
  map: MapId;
  difficulty: DiffId;
  reverse: boolean;
  blitz: boolean;
  seed: string | null;
  ranked: boolean;          // false for sandbox
  endless?: boolean;
  clientVersion: string;
}
```

---

## Doc map

| Doc | Owns |
|-----|------|
| DESIGN-LOCK.md | Product |
| SYSTEMS-BIBLE.md | Formulas / feel |
| **TECH-ARCHITECTURE.md** | Stack / modules / loop / save / phases |
| ARCHITECTURE.md | Short summary (optional) |

---

**NEXT: paste PROMPT 4**
