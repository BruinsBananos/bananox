# Banano TD — Architecture Lock (Prompt 2)

**Status:** Summary lock — **canonical tech detail is `TECH-ARCHITECTURE.md` (Prompt 3)**  
**Depends on:** `DESIGN-LOCK.md` (Prompt 1 + open-question locks)  
**Product name in code/UI strings:** `Banano TD`  
**Live replace target:** `playTD.html` + `playTD.js` on bananox.com  

On conflict, **TECH-ARCHITECTURE.md wins**.

---

## 0) Goal

Replace the ~4k-line Canvas2D IIFE with a **modular PixiJS + TypeScript + Vite** game that preserves DNA and save keys, hits mid-mobile 60fps intent, and ships desktop-class touch without pay power or Unity dumps.

---

## 1) Stack (confirmed)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | **TypeScript** (strict) | Content safety, refactorability |
| Bundler | **Vite** | Fast dev, static GH Pages output |
| Render | **PixiJS v8** (WebGL) | Dense sprites/particles; better than raw Canvas for AAA feel |
| UI chrome | **HTML/CSS** (existing Banano X shell) | Hub, HUD, overlays, a11y, theme |
| Audio | Web Audio (procedural first) + optional assets later | Offline, tiny |
| Save | `localStorage` dual-slot | Migrate `bananox_td_v1` |
| Net | Interface only until Phase 4 | Global LB schema ready, no live dep at launch |
| Tests | Vitest (pure sim/economy) | Headless balance & pathing |

**Rejected for launch:** Phaser (heavier habits), Unity WebGL (size), React-in-gameloop (jank risk).  
**Challenge rule:** only if Pixi blocks a pillar with evidence.

### Deploy shape (bananox site)

```
bananox/
  playTD.html          ← thin shell (nav + HUD mounts + canvas host)
  td/                  ← Vite build output (hashed assets)
    index.js
    index.css
    assets/...
  src-td/              ← source (or packages/banano-td) — NOT required on Pages if built in CI
```

**Transition:** keep legacy `playTD.js` as `playTD.legacy.js` until cutover green; `playTD.html` points at new bundle. Feature flag query `?legacy=1` optional for one release.

---

## 2) Module map

```
┌─────────────────────────────────────────────────────────────┐
│  shell (HTML)  ·  ui/  ·  audio/  ·  save/  ·  net/         │
├─────────────────────────────────────────────────────────────┤
│  app/  (GameApp: mode select → run lifecycle → results)      │
├─────────────────────────────────────────────────────────────┤
│  render/ (Pixi world, VFX, readability overlays)            │
├─────────────────────────────────────────────────────────────┤
│  sim/  (deterministic-ish combat tick — NO Pixi imports)    │
│    pathing · combat · economy · abilities · waves · events  │
├─────────────────────────────────────────────────────────────┤
│  content/  (towers, layers, maps, modes, badges — data)     │
└─────────────────────────────────────────────────────────────┘
```

### Module responsibilities

| Module | Owns | Must not own |
|--------|------|--------------|
| **core/** | Types, RNG, math, event bus, fixed timestep helper | Game rules content |
| **content/** | Tower defs, path upgrades, layers, maps (waypoints), modes, lengths, diffs, badges, copy | Runtime mutation of balance mid-combat without API |
| **pathing/** | Grid, waypoints, dist-along, reverse, placeable mask | Drawing |
| **combat/** | Threats, projectiles, targeting, pop chain, properties | BAN interest formula |
| **economy/** | BAN, interest softcaps, farms, Drop, round summary, bounties | Sprite positions |
| **abilities/** | Storm/Cryo/Drop/Rage CD + effects as sim commands | Button DOM |
| **waves/** | Spawn queues, chapter tags, length contentSpan remap, blitz dens | |
| **events/** | Fever, random events, streak | |
| **sim/** | Orchestrates tick order; pure state in/out | Pixi, DOM, localStorage |
| **render/** | Pixi stage, towers/threats/projectiles, rings, floats, juice | Authoritative HP/BAN |
| **ui/** | Shop, select panel, radial upgrade, HUD bind, hub, overlays | Sim math |
| **audio/** | SFX bus keyed by sim events | |
| **save/** | Load/migrate/validate/export/import; schema versioning | |
| **net/** | `LeaderboardClient` interface + noop/local impl; submit DTO | |
| **app/** | Wire modules; input map (pointer/keyboard); run phases | |

**Hard rule:** `sim/**` never imports `pixi.js` or `document`. Enables Vitest + future headless balancers.

---

## 3) Source tree

```
src-td/
  main.ts                 # bootstrap Pixi + shell hooks
  app/
    GameApp.ts
    RunConfig.ts          # mode, length, map, diff, mutators
    input/
      PointerController.ts
      KeyboardMap.ts
      RadialUpgrade.ts
  core/
    types.ts
    math.ts
    rng.ts
    EventBus.ts
    time.ts
  content/
    towers/*.ts
    layers.ts
    maps/*.ts
    modes.ts
    lengths.ts
    difficulties.ts
    badges.ts
    copy.ts
  pathing/
    Grid.ts
    PathGraph.ts
    placement.ts
  combat/
    Threat.ts
    Projectile.ts
    targeting.ts
    pop.ts
    properties.ts
  economy/
    Wallet.ts
    interest.ts
    farms.ts
    bounties.ts
  abilities/
    AbilitySystem.ts
  waves/
    WaveDirector.ts
    spawnTables.ts
  events/
    FeverSystem.ts
    RandomEvents.ts
    Streak.ts
  sim/
    SimWorld.ts
    tick.ts
    commands.ts           # place, upgrade, sell, retarget, ability, sendWave
  render/
    WorldRenderer.ts
    layers/               # bg, path, towers, threats, fx, overlays
    readability/          # camo/lead/armor icons, leak arrows
    juice.ts
  ui/
    hud.ts
    shop.ts
    towerPanel.ts
    hub.ts
    overlays.ts
    shareCard.ts
  audio/
    Sfx.ts
  save/
    schema.ts
    migrate.ts
    ProgressStore.ts
  net/
    types.ts
    LocalLeaderboard.ts
    RemoteLeaderboard.ts  # Phase 4 stub
  assets/
    towers/               # Imagine exports (engine-ready)
    maps/
    ui/
```

---

## 4) Sim architecture

### Tick model

- **Fixed sim step:** `1/60 s` logical; render interpolates if needed.
- **Speed:** multiply sim steps per frame (1×/2×/3×), cap spiral on low FPS (drop render FX first, never skip economy desync silently—prefer slow-mo over corrupt state).
- **Command buffer:** all player actions → `SimCommand[]` applied at start of step (or immediate if between waves). Enables replay seeds later.

### SimWorld state (authoritative)

```ts
interface SimWorld {
  config: RunConfig;
  ban: number;
  lives: number;
  wave: number;
  phase: "prep" | "combat" | "summary" | "won" | "lost";
  towers: TowerEntity[];
  threats: ThreatEntity[];
  projectiles: ProjectileEntity[];
  abilities: Record<AbilityId, { cd: number; maxCd: number }>;
  feverT: number;
  rageT: number;
  event: { kind: EventKind | null; t: number };
  streak: number;
  flags: { reverse: boolean; blitz: boolean; autoWave: boolean; endless: boolean };
  meta: RunMeta; // pops, perfectWaves, abilityUses, goldens, ...
}
```

### Combat property pipeline

```
target filter (camo, range, alive)
  → canDamage? (lead, immunities)
  → apply pop / splash / slow
  → child spawn (layer tree)
  → bounty (economy) + streak + juice events
```

### Economy soft softcaps (design lock §3)

| System | Cap style |
|--------|-----------|
| Interest | Diminishing tiers by bank bracket |
| Farm total income | Softcap on sum of farm income per round after N farms / income threshold |
| Drop ability | Wave-scaled with diminishing returns if used on CD chain |
| Fever | Pop value + ROF; **does not** multiply interest |
| Party events | Max BAN per event hard ceiling |

Implemented only in `economy/*` + content tables—not scattered in towers.

### Auto-wave ethics (sim-enforced)

```
canAutoSend =
  phase === prep
  && !(ban < cheapestTowerCost && allAbilitiesOnCd && lastWaveLeaked)
  && !bossIntroLock
```

---

## 5) Render architecture

| Layer (z) | Content |
|-----------|---------|
| 0 | Map tiles / decor (static bake + parallax light) |
| 1 | Path + chevrons (leak direction) |
| 2 | Placement ghost + invalid flash |
| 3 | Towers + auras |
| 4 | Threats (property badges as small containers) |
| 5 | Projectiles |
| 6 | VFX / particles (pooled) |
| 7 | Range rings / select |
| 8 | Damage floats (throttled) |

**Readability overlays** are first-class containers, not afterthought strokes.

**Performance budget (mid mobile, wave 40 dens, Party off)**

| Budget | Target |
|--------|--------|
| Threats | 250 active soft softcap; merge/cull FX beyond |
| Particles | ≤200 live; pool recycle |
| Draw calls | Atlas towers + banana sheets |
| FPS | p50 ≥55, p90 ≥40 |
| Quality tiers | High / Med / Low (auto on FPS trip) |

**Art pipeline hook:** Imagine base per tower family → `image_edit` path tiers; chroma key `#00FF00` / `#FF00FF`; no baked text.

---

## 6) UI / input (desktop-class mobile)

### Pointer model (single code path)

```
pointerdown → hit test (tower | shop | empty placeable | UI)
  drag threshold → placement drag OR tower drag-cancel
pointerup → place / select / open radial
```

| Action | Desktop | Mobile |
|--------|---------|--------|
| Place | Click tile / drag from shop | Drag from shop to tile (large ghost) |
| Select | Click tower | Tap tower (min 44×44 CSS px hit) |
| Upgrade | Panel buttons **and** radial | Radial primary; panel still available |
| Target mode | Panel cycle + key | Panel chips (large) |
| Abilities | Buttons + keys 1–4 | Buttons only (no swipe-cast) |
| Send wave | Button + Space | Button (no exclusive swipe) |
| Pause / speed | Buttons + keys | Buttons |

**Rule:** every critical action has a **visible control**. Gestures only accelerate.

### Shell integration

- Banano X nav + theme (`data-theme`) unchanged.
- Game fills `.td-app` canvas host; HUD can stay DOM for crisp text.
- Name string constant: `PRODUCT_NAME = "Banano TD"`.

---

## 7) Content data shape

```ts
// content/towers/dart.ts
export const dartTower: TowerDef = {
  id: "dart",
  name: "Dart MonKey",
  role: "Primary",
  verb: "stitch",
  cost: 175,
  base: { range, rof, pierce, pop, camo, lead, ... },
  pathNames: ["Sharp Path", "Frenzy Path"],
  paths: [ [/* 4 tiers */], [/* 4 tiers */] ],
  // anti-samey documented in DESIGN-LOCK
};
```

Maps: pure waypoint builders + metadata (chokepoints, lesson tags)—render theme separate.

Waves: tables keyed by `contentLevel 1..150`; `waveContentLevel(displayWave)` KEEP algorithm.

---

## 8) Save / progress

### Keys (KEEP)

- Primary: `bananox_td_v1`
- Backup: `bananox_td_v1.bak`

### Schema

- Continue migrations v1→…→v4 (current) → **v5** for overhaul fields:
  - `cosmetics: { unlocked: string[], equipped: ... }`
  - `mastery: Record<towerId, xp>`
  - `accountXp: number`
  - `titles: string[]`
  - `cosmeticCurrency?: number` (daily only, non-power)
  - `settings.quality`, radial prefs
  - preserve: records, maps, modes, badges, leaderboard, mapLengthClears, unlockedMaps, mutator prefs

### Rules

- Validate + migrate on load; never throw away badges.
- Export/import JSON KEEP.
- Sandbox/Lab flags do not write ranked badges.

---

## 9) Leaderboard

### Local (day one)

Existing shape + `product: "banano-td"`, `clientVersion`, optional `seed`.

### Global schema (ship types at launch; backend Phase 4)

```ts
interface GlobalRunSubmit {
  runId: string;           // uuid
  userIdHash: string;      // privacy-preserving
  nickname: string;        // local choice
  score: number;
  wave: number;
  pops: number;
  mode: ModeId;
  map: MapId;
  difficulty: DiffId;
  length: LengthId;
  reverse: boolean;
  blitz: boolean;
  won: boolean;
  freeplay: boolean;
  clientVersion: string;
  seed?: string;
  createdAt: number;
  sig?: string;            // Phase 4
}
```

`net/RemoteLeaderboard.ts`: methods `submit`, `fetchTop` → throw `NotImplemented` or no-op until Phase 4.

---

## 10) Phased delivery

| Phase | Name | Exit criteria |
|-------|------|----------------|
| **0** | Scaffold | Vite+Pixi+TS; blank map; place 1 tower; tick sim headless test green |
| **1** | Vertical slice | Canyon + Dart/Bomb/Farm + layers through ceramic tease + Storm/Cryo + save migrate smoke + Short Normal clearable |
| **2** | Full DNA port | 6 maps, 9–10 towers, all modes/lengths/mutators/abilities/fever/events/interest softcaps, badges, local LB, Hard default in hub |
| **3** | Premium pass | Readability polish, juice, art swap, radial UI, quality tiers, onboarding beats, share card |
| **4** | Live services | Global LB backend, daily challenge cosmetic pipeline (optional) |
| **5** | Post-launch | +2 maps, +2 towers (bible-ready), dual-lane Split Market |

**Cutover:** Phase 2+ feature-complete vs legacy → replace default `playTD.html` entry; one release with `?legacy=1`.

---

## 11) Vertical slice (Phase 1) definition

**In**
- Map: Potassium Canyon only  
- Towers: Dart, Bomb, Banana Farm (3)  
- Layers: Unripe→Ripe→Golden→Meme + camo/lead flags  
- Dual path to tier 2 only (prove 2/2 rule UI); stub path 3 lock  
- Abilities: Storm + Cryo  
- Economy: start BAN, pop bounty, end-round, interest tier-0  
- Diff: Normal  
- Length: Short  
- Save: load/migrate existing v4 blob without wipe  
- UI: DOM shop + canvas battlefield + drag place  
- Name: **Banano TD** in HUD  

**Out:** Tour, Battery, fever max, Party, global LB, full art  

**Playtest gate:** stranger clears Short Canyon Normal; explains dual-path lock; no soft-lock.

---

## 12) Legacy → module mapping

| `playTD.js` region | Destination |
|--------------------|-------------|
| `MAPS`, path builders | `content/maps`, `pathing/` |
| `TOWER_DEFS` | `content/towers/*` |
| `LAYERS` | `content/layers.ts` |
| `MODES` / `LENGTHS` / `DIFFS` | `content/*` |
| spawn / wave | `waves/` |
| pop / projectiles / targeting | `combat/` |
| ban / interest / farm income | `economy/` |
| abilities object | `abilities/` |
| fever / events / streak | `events/` |
| ProgressSave block | `save/` |
| badges / score | `content/badges`, `save`, `ui` |
| canvas draw loop | `render/` |
| DOM HUD / shop / overlays | `ui/` + HTML |
| audio beeps | `audio/` |
| game loop / input | `app/` |

**Port order:** content data → pathing → sim tick → one tower combat → economy → UI bind → rest towers/maps → modes → juice.

---

## 13) Testing strategy

| Layer | Tool | Examples |
|-------|------|----------|
| Unit | Vitest | pop chain, interest softcap, contentSpan remap, path reverse, path lock 2/2→3 |
| Sim | Vitest | wave clear, leak lives, ability CD, auto-wave guard |
| Visual | manual / Playwright smoke | boot, place, win Short |
| Perf | chrome mobile metrics | particle cap, FPS HUD dev flag |

---

## 14) Banano X integration

- Stay static-hostable on GitHub Pages under bananox.com.  
- Shared: `styles.css` theme, fonts, nav, favicon, arcade deep link.  
- Arcade card title: **Banano TD**.  
- No wallet SDK in game loop.  
- Optional future: site account hash for Phase 4 LB only.

---

## 15) Risk register

| Risk | Mitigation |
|------|------------|
| Port stall (4k lines) | Vertical slice first; feature flag legacy |
| Sim/render desync | Command buffer; sim authoritative |
| Mobile mis-taps | 44px hits; drag place; radial; no gesture-only |
| Eco inflation | Softcaps centralized in economy module |
| Save wipe | migrate + bak + export; slice test on real v4 blobs |
| Pixi bundle size | code-split hub vs run; compress atlases |
| Scope creep (10 towers art) | Launch 9 if Alchemist slips; bible keeps 10 |

---

## 16) Definition of done (architecture)

- [x] Stack locked (Pixi + TS + Vite)  
- [x] Module boundaries + no-Pixi-in-sim rule  
- [x] Tree, tick model, save v5, net schema stub  
- [x] Phases 0–5 + vertical slice gate  
- [x] Touch/UI rules mapped to input system  
- [x] Legacy mapping + risks  
- [x] Aligns DESIGN-LOCK power/economy/diff/LB/name locks  

---

## 17) Immediate next implementation tasks (Prompt 3+)

1. Scaffold `src-td` Vite app; Pixi canvas in `playTD.html` host.  
2. Port `layers` + `canyon` path + `SimWorld` empty tick.  
3. Place Dart; pop Unripe; BAN float.  
4. Save migrate smoke.  
5. Expand toward Phase 1 slice checklist.

---

*End Architecture Lock — Prompt 2.*
