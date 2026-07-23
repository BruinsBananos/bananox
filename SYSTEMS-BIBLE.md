# Banano TD — Systems & Combat Feel Bible (Prompt 2)

**Status:** IMPLEMENTATION-READY  
**Depends on:** `DESIGN-LOCK.md`, `ARCHITECTURE.md`  
**Product name:** Banano TD  
**Scope:** Formulas, matrices, state machines — no full game code  

---

## 1. Simulation model

### 1.1 Tick rate / fixed step

| Parameter | Value | Notes |
|-----------|-------|-------|
| `SIM_HZ` | **60** | Logical steps per second at 1× |
| `DT` | `1/60` seconds | Fixed; never use raw frame delta for combat |
| `MAX_SIM_STEPS_PER_FRAME` | 6 | Prevent spiral of death; if behind, drop render juice first |
| Speed 1× / 2× / 3× | 1 / 2 / 3 sim steps per display frame (when FPS allows) | If FPS < 40, prefer fewer visual particles over skipping sim fairness |
| Render | Variable; interpolate positions optional | Sim is authoritative |

**Order of operations (one sim step)**

```
1. Apply SimCommands (place, sell, upgrade, retarget, ability, sendWave, setSpeed)
2. Tick ability cooldowns / fever / rage / event timers
3. Tick auras (recompute buff snapshot on towers)
4. Towers: acquire targets → fire → spawn projectiles
5. Projectiles: move → hit tests → apply damage/pop
6. Hazards / ability residual effects
7. Bananas (threats): move along path (speed × slowMul); regen; freeze timers
8. Child-spawn queue flush (from pops this step)
9. Leak check (dist >= pathLen)
10. Wave clear check → economy end-round if queue empty
11. Emit juice events (for render/audio; not sim-authoritative)
```

### 1.2 Entity types

| Type | Authority | Lifetime | Notes |
|------|-----------|----------|-------|
| **Tower** | Sim | Until sold | Grid cell (c,r) or free pos if non-grid; stats from def + paths + auras |
| **Projectile** | Sim | Until pierce exhausted / max range / TTL | Carries `pop`, `pierce`, flags, ownerId |
| **Banana** (threat) | Sim | Until popped / leaked | Layer OR special kind (ceramic/MOAB-class) |
| **ChildSpawn** | Sim queue | 0–2 steps delay | Deferred spawn to avoid iterator mutation; inherits `dist`, partial flags |
| **Hazard** | Sim | Duration or permanent (spike later) | Path-tied or radius; e.g. spike piles post-launch |
| **Aura** | Derived | While source tower alive | Village ROF/camo; recomputed each step or on dirty |
| **AbilityEffect** | Sim | Duration | Storm pulses, Cryo field, Rage buff, Drop is instant economy |

**ID:** monotonic `uid` per entity for targeting stability and VFX binding.

### 1.3 Determinism (daily seeds)

**Seed must control**

| Domain | RNG stream name | Uses |
|--------|-----------------|------|
| Wave composition | `rngWave` | Group picks, property rolls, jackpot inserts, boss variance |
| Spawn jitter | `rngSpawn` | Micro spacing noise (±ε), lateral child offset |
| Events | `rngEvent` | Event kind roll, timing within window |
| Jackpot peel side-FX | `rngJuice` | **Optional visual-only** — may be unseeded |

**Must NOT use unseeded Math.random in sim** when `config.seed != null`.

**Do not seed (keep local/feel)**

- Particle spray angles (render-only)
- Screen shake magnitude noise
- Audio pitch variance

**Replay contract (daily):** same `seed + clientVersion + RunConfig + command stream` → same leaks/wins. Cosmetic skins never affect sim.

**State machine — run phase**

```
HUB → CONFIGURE → PREP ⇄ COMBAT → ROUND_SUMMARY → PREP …
                              ↘ WIN → (FREEPLAY optional) → RESULTS
                              ↘ LOSE → RESULTS
SANDBOX: same, badges suppressed
```

---

## 2. Pathing

### 2.1 Representation

| Layer | Form |
|-------|------|
| **Authoring** | Ordered grid cells `PathCell[]` (col, row) from map builder |
| **Runtime** | `waypoints: Vec2[]` (cell centers) + `segLens[]` cumulative + `pathLen` |
| **Progress** | Scalar `dist ∈ [0, pathLen]` along polyline |
| **Placeable** | All in-bounds non-path cells; optional water/blocked mask later |
| **Reverse mutator** | Reverse cell list before waypoint bake |

**Position:** `posAlong(dist)` linear interpolate segment.

**Grid:** 40×25 logical (legacy DNA) or scale-invariant world units with same ratios. Towers occupy 1 cell; no stacking.

### 2.2 Speed model

```
effectiveSpeed = baseSpeed
  × diffSpeedScale          // from difficulty
  × blitzSpeedMul           // 1.42 if blitz
  × propertySpeedMul        // rare flags
  × slowMul                 // from control (≤ 1)
  × (freezeT > 0 ? 0 : 1)   // hard freeze while timer > 0
```

Layer base speeds (world units/sec at Normal, no mutator):

| Layer | id | baseSpeed | baseValue (BAN) |
|-------|-----|-----------|-----------------|
| Unripe | green | 50 | 2 |
| Ripe | ripe | 60 | 3 |
| Golden | gold | 72 | 5 |
| Meme | purple | 88 | 7 |
| Cosmic | star | 105 | 9 |
| Zebra | zebra | 96 | 12 |
| JACKPOT | golden | 70 | 40 |

### 2.3 Slow stacking (diminishing returns)

Slows apply as **multiplicative factors** on a stack list, then compressed:

```
// Each source adds a slow factor s_i ∈ (0,1) meaning "multiply speed by s_i"
// Example: Chill 0.52 means speed *= 0.52 for duration

raw = Π s_i
// Diminishing: convert to "slow amount" then reapply cap
amount = 1 - raw
effectiveAmount = 1 - (1 - amount)^0.85     // soft compress multi-source
slowMul = max(SLOW_FLOOR, 1 - effectiveAmount)
```

| Constant | Value |
|----------|-------|
| `SLOW_FLOOR` | **0.18** | Never slower than 18% speed from slows alone |
| Same-source refresh | Refresh duration; do not stack identical aura twice |
| Unique sources | Tower uid + ability id; max **4** slow sources counted |

### 2.4 Freeze / stun caps

| Rule | Value |
|------|-------|
| Freeze = speed 0 while `freezeT > 0` | Tick down in sim time |
| Max freeze duration per application | **1.25 s** (Normal); ×0.9 Hard; ×0.75 Starship |
| Max freeze duration on MOAB-class | **0.45 s** per application |
| Global freeze uptime softcap | Banana cannot be freeze-locked > **40%** of last 5s window — excess freeze becomes slow at `SLOW_FLOOR` |
| Stun (Bomb path etc.) | Treated as freeze with same caps; tag `stun` for VFX only |
| Boss **slow-resist** flag (late) | `slowMul = max(slowMul, 0.55)` after all calc |

**Design intent:** control shapes tempo; never infinite hold freeplay.

### 2.5 Multi-lane / fork rules

**Launch maps:** single polyline (Fork is *visual* detour, still one chain).

**Post-launch dual-lane (`Split Market`):**

| Rule | Spec |
|------|------|
| Paths | `path[0]`, `path[1]` independent `dist` spaces |
| Spawn | Wave group specifies `lane: 0 \| 1 \| "split"` (split = half/half or alternating) |
| Lives | Shared Core |
| Targeting First/Last | Per-lane progress normalized: `progress = dist/pathLen` comparable across lanes |
| Close | Euclidean to tower |
| Strong | Global among visible |
| Children | Stay on parent lane |
| Reverse | Reverse each lane independently |

---

## 3. Targeting

### 3.1 Priority modes (player-selectable)

| Mode | Sort key (ascending = higher priority first in sort) |
|------|-----------------------------------------------------|
| **First** | Max `dist` (closest to leak) |
| **Last** | Min `dist` (closest to spawn) |
| **Strong** | Max `threatScore` then max `dist` |
| **Close** | Min Euclidean distance to tower |
| **Camo** *(optional advanced)* | Prefer `camo==true`, then First |
| **Boss** *(optional advanced)* | Prefer MOAB-class, then Strong |

**Launch ship:** First / Last / Strong / Close (KEEP).  
**Post-launch optional:** Camo, Boss as extra cycle modes if UI room.

### 3.2 threatScore (Strong)

```
threatScore =
  layerRank * 10           // green=1 … jackpot=7
  + ceramicShellHp * 0.5
  + moabHp * 0.02
  + (fortified ? 25 : 0)
  + (lead ? 5 : 0)
  + (camo ? 3 : 0)
```

### 3.3 Visibility filter (before sort)

Tower can target banana iff **all** true:

1. `alive`
2. In range: `distSq(tower, banana) <= range²` (Sniper/Battery use map-scale range)
3. Camo: `!banana.camo || tower.canCamo`
4. Not blacklisted by ability (none at launch)

**Lead does not block targeting** — it blocks **damage** (projectile fails / spark).

### 3.4 Retarget cadence

| Situation | Cadence |
|-----------|---------|
| Default | Re-evaluate every shot (when `cooldown` ready) |
| Beam / continuous (if any) | Every **0.15 s** |
| Sticky prefer | If `preferStrong` and current target still valid & in range, keep until dead or out of range |
| Target dies / pops | Immediate reacquire same step |
| Multishot | Acquire ordered list; distribute per §3.5 |

### 3.5 Multishot distribution

```
n = 1 + multishot   // multishot stat = extra projectiles
candidates = sorted visible list
for i in 0..n-1:
  target = candidates[i % candidates.length]  // spread across top priorities
  with small angle fan if same target repeated
```

If only 1 candidate: all shots hit same (fan angles ±4°).

### 3.6 Boomerang / return projectile

| Phase | Behavior |
|-------|----------|
| Outbound | Move toward aim point / along arc; pierce counts on hit |
| Apex | At max range OR pierce remaining but path end of arc |
| Return | Move toward owner; **can hit again** if `returnHit=true` (default boomer) |
| Pierce shared | Single pierce pool for whole flight unless path upgrade says dual pool |
| Owner sold | Projectile dies |

### 3.7 Rail (Battery)

- Instant or very fast line projectile; pierce along line segment through first target direction.
- Prefer Strong default.

---

## 4. Damage & pop model

### 4.1 Core terms

| Term | Meaning |
|------|---------|
| **pop** | Layers removed from a standard banana per hit (or HP damage units to shells) |
| **pierce** | Number of bananas a projectile may affect before despawn |
| **splash** | Radius; apply `splashPop` (often = pop or pop-1) to others in radius |
| **shell HP** | Ceramic / MOAB-class use HP instead of single-layer pop |
| **fortified** | Incoming pop or shell damage × `FORTIFIED_MUL` (default **0.5** for pop; shell takes ×1.5 maxHp at spawn) |

### 4.2 Standard layer hit

```
if !canDamage(towerFlags, banana): play fail VFX; consume pierce if policy says so (DEFAULT: consume pierce on lead fail)
else:
  layersToRemove = pop
  if fortified: layersToRemove = max(1, floor(layersToRemove * FORTIFIED_MUL))  // at least chip optional: use 0 min for true resist — LOCK: max(1,...) only if pop≥2 else 0 with fail spark when pop=1
  apply layer chain peel layersToRemove times
  grant bounty per layer peeled
```

**Fortified + pop=1 LOCK:** fortified standard layers **immune to 1-pop** hits (spark); need pop≥2 or splash special.  
**Fortified + shell:** shell HP damage × 0.5.

### 4.3 Layer peel chain

```
JACKPOT → zebra → star → purple → gold → ripe → green → (dead)
```

Multi-pop walks chain N times; each step can spawn children per content rules:

| Parent | Children on full peel of that layer |
|--------|-------------------------------------|
| Standard | 1× next layer (or 0 if green) |
| Ceramic death | `childCount` × layer `children` id (default 2× zebra) |
| MOAB death | `childCount` × next boss tier or ceramics |

**Child spawn:** `dist = parent.dist - childSpacing` (slight behind); inherit camo/lead only if parent had and content says so (default: ceramic children clean; boss children may keep lead).

### 4.4 Shell HP (ceramic / MOAB-class)

| Kind | Base HP (Normal) | Speed | Death children | Lives on leak |
|------|------------------|-------|----------------|---------------|
| ceramic | 14 | 44 | 2× zebra | 5 |
| boss (BAN-Barge) | 260 | 24 | 4× ceramic | 25 |
| freighter (starship mid) | 800 | 16 | 2× boss | 50 |
| titan (superstarship) | 2000 | 12 | 2× freighter | 99 |

Scale: `hp *= DIFF.scale` (Normal 1 / Hard 1.35 / Starship 1.75).

**Damage to shell:**

```
dmg = pop * SHELL_POP_VALUE   // SHELL_POP_VALUE = 1 default; sniper high pop = high dmg
if bomb missile boss-bonus: dmg *= bossBonus
if fortified shell: dmg *= 0.5
hp -= dmg
```

### 4.5 Interaction matrix — tower property × enemy property

Legend: **Y** = full effect · **P** = partial · **N** = no damage / no target · **S** = spark fail (targetable)

| Tower flag → / Enemy → | Normal | Camo | Lead | Fortified layer | Armor/Ceramic | Regen | MOAB-class |
|------------------------|--------|------|------|-----------------|---------------|-------|------------|
| **canCamo=false** | Y | **N target** | Y/S* | Y/P | Y | Y | Y |
| **canCamo=true** | Y | Y | Y/S* | Y/P | Y | Y | Y |
| **canLead=false** | Y | (camo rule) | **S** | Y/P | Y | Y | **S** if boss.lead |
| **canLead=true** | Y | (camo rule) | Y | Y/P | Y | Y | Y |
| **pop=0** (pure slow) | slow only | camo rule | slow if canLead or slowIgnoresLead | slow P | slow | slow | slow capped |
| **splash** | Y | only if targetable center | center must canLead | P | Y | Y | Y if canLead |
| **MOAB bonus** (missile/rail) | normal | — | — | — | P | — | **Y++** |

\*Lead column: without canLead → spark, pierce consumed (LOCK).

### 4.6 “Can this tower see/pop X?” master table (BASE form, no upgrades)

| Tower | See camo | Pop lead | Pop fortified (1-pop) | Shell ceramic | MOAB | Notes |
|-------|----------|----------|----------------------|---------------|------|-------|
| Dart | N | N | N | weak | weak | Backbone stitch |
| Boomer | N | N | N | ok pierce | weak | Sweep |
| Sniper | **Y** | N→Y pathA1 | Y high pop | **strong** | strong pathA | Mark |
| Bomb | N | **Y** | Y splash | **strong** | strong pathB | Crack |
| Chill | N | N | slow only | slow | slow cap | Hold |
| Farm | — | — | — | — | — | No combat |
| Village | aura camo pathA2+ | — | — | — | — | Buff only |
| Super | **Y** | **Y** | Y | good | good | Flood late |
| Battery | **Y** | **Y** | Y | good | **best** | Rail |
| Alchemist | N base | N base | brittle helps | coat | coat | Coat support |

Upgrades flip N→Y per path (see §6).

### 4.7 Regen

```
if regen && fully not dead:
  regrowT += dt
  if regrowT >= REGEN_INTERVAL (3.5s):
    regrow one layer toward parent layer (cap at spawn layer)
    regrowT = 0
```

Freeze pauses regen. Full delete (green gone) stops regen.

---

## 5. Dual-path upgrade rules

### 5.1 Crosspath model (2-path BTD-style — KEEP)

Towers have paths **A** and **B**, each tiers **0–4**.

| Rule | Spec |
|------|------|
| Free crosspath | Both paths may reach **tier 2** freely → max **2-2** |
| Deep path | Only **one** path may purchase tier **3** or **4** |
| Illegal | 3-3, 3-4, 4-3, 4-4, 4-1 if other path already 3+, etc. |
| Legal examples | 0-0, 2-2, 3-2, 4-2, 2-3, 2-4, 4-0, 0-4, 3-0, 1-2 |
| Illegal examples | 3-3, 4-3, 3-4, 4-4 |

**Purchase order:** must buy tier n before n+1 on that path.  
**UI:** grey out illegal tier 3+ on the non-deep path once other path ≥3; if both 2-2, first tier-3 purchase locks that path as deep.

**Notation:** `A-B` e.g. `4-2` = pathA4 pathB2. (No third path at launch.)

### 5.2 Sell refund

```
refund = floor(totalBanInvested * SELL_RATE)
SELL_RATE = 0.70
```

`totalBanInvested` = place cost + all upgrade costs (not interest).  
Sell removes tower same step; auras update dirty.

### 5.3 Path identity tests (tier 3–4)

Each tier **3** and **4** must pass **at least one**:

1. **New verb** — new projectile behavior (multishot, rail, orbit, map pulse)  
2. **New property** — gains camo or lead or aura type  
3. **Role shift** — e.g. cleanup → boss melt  
4. **Illegal:** pure +5% ROF with no pattern change at t3+

**Review checklist per tower:** document in §6.

---

## 6. Tower combat templates

Shared defaults unless noted: `sell=70%`, dual path 2-2/4-2, targeting as listed.

### 6.1 Dart MonKey — verb *Stitch* · Primary

**Base**

```
cost: 175 | range: 170 | rof: 0.46s | pierce: 1 | pop: 1 | splash: 0
camo: N | lead: N | projectile: straight banana dart | default target: First
```

| Path | Fantasy | t3–4 identity |
|------|---------|----------------|
| **A Sharp** | Pierce javelin lines | t3 Spike Storm high pierce; t4 Potassium Javelin preferStrong + long pierce |
| **B Frenzy** | Multi-dart ROF | t3 Triple; t4 Fan Club quad stream |

**Illegal:** splash radius, farm income, native camo before t4 special (none).  
**Anti-synergy:** pure Frenzy falls over on lead dens — need Bomb/Sniper friend.

### 6.2 Boomer K+ — *Sweep* · Mid

```
cost: 320 | range: 150 | rof: 0.85 | pierce: 6 | pop: 1 | boomerang: Y
camo: N | lead: N | default: First
```

| Path | Fantasy | t3–4 |
|------|---------|------|
| A Glaive | Pierce/ricochet | t3 huge multi-hit; t4 MOAB-cleave + lead |
| B Chase | Turbo multi-rang | t3 ROF; t4 perma multi |

**Illegal:** map-wide sniper range, income.  
**Anti-synergy:** short zig-zag maps reduce return value.

### 6.3 Sniper MonKey — *Mark* · Military/Support

```
cost: 380 | range: 420 (map-scale) | rof: 1.0 | pierce: 1 | pop: 2
camo: Y | lead: N | preferStrong: Y | default: Strong
```

| Path | Fantasy | t3–4 |
|------|---------|------|
| A Deadeye | Lead → ceramic → boss rail | t1 lead; t4 Cripple barge |
| B Supply | Shrapnel + income | t4 Supply Drop income + ROF |

**Illegal:** cheap full-screen AOE spam.  
**Anti-synergy:** Supply income weaker than Farm long-term — intentional hybrid.

### 6.4 Bomb MonKey — *Crack* · Military

```
cost: 550 | range: 160 | rof: 1.1 | pierce: 1 | pop: 1 | splash: 78
camo: N | lead: Y | default: First / Strong on missile path
```

| Path | Fantasy | t3–4 |
|------|---------|------|
| A Blast | Big splash / stun-slow | t4 impact stun |
| B Missile | Boss-prefer rockets | t3+ Strong bias; t4 eliminator multishot |

**Illegal:** base camo.  
**Anti-synergy:** wastes on single green lines (overkill).

### 6.5 Chill MonKey — *Hold* · Magic

```
cost: 400 | range: 145 | rof: 1.2 | pierce: 1 | pop: 0 | splash: 100 | slow: 0.52
camo: N | lead: N | freezePulse: Y | default: First
```

| Path | Fantasy | t3–4 |
|------|---------|------|
| A Freeze | Radius control | t4 Absolute Zero near-stop + camo |
| B Impale | Shards gain pop/camo/lead | t3 camo+lead shards; t4 snowstorm |

**Illegal:** out-DPS Super; farm.  
**Control caps:** §2.4 apply always.

### 6.6 Banana Farm — *Mint* · Economy

```
cost: 750 | range: 90 | combat: none | farm: Y
```

| Path | Fantasy | t3–4 |
|------|---------|------|
| A Harvest | Flat end-round income | t4 Republic large flat |
| B Bank | Stored interest-style lump | t4 Wall Street lump |

**Income applied** on round clear only (see §8). Softcap on total farm income.  
**Illegal:** any pop.

### 6.7 Jungle Village — *Buff* · Support

```
cost: 1000 | range: 190 | combat: none | support: Y
```

| Path | Fantasy | t3–4 |
|------|---------|------|
| A Support | ROF aura + camo detect | t2 radar camo; t4 homeland bubble |
| B Trade | Eco + light ROF | t4 trade empire income |

**Aura stack:** multiple villages diminishing (0.6× stacking on ROF portion).  
**Illegal:** personal boss DPS.

### 6.8 Super MonKey — *Flood* · Hero late

```
cost: 2400 | range: 200 | rof: 0.10 | pierce: 1 | pop: 1 | multishot: 1
camo: Y | lead: Y | default: First
```

| Path | Fantasy | t3–4 |
|------|---------|------|
| A Plasma | Splash multi-beam | t3–4 sun-scale beams |
| B Robo | Hyper multi-stream | t3–4 anti-swarm dark |

**Illegal:** early cheap (cost gate).  
**Anti-synergy:** without Mid/Military, ceramics leak under pure stream if underleveled.

### 6.9 Starship Battery — *Rail* · Ultimate

```
cost: 4800 | range: 460 | rof: 1.7 | pierce: 1 | pop: 14 | rail: Y
camo: Y | lead: Y | preferStrong: Y | default: Strong
```

| Path | Fantasy | t3–4 |
|------|---------|------|
| A Rail | Pierce boss beam | t4 Full Stack Raptor |
| B Salvo | Multi-rail cluster splash | t4 Starfall |

**Illegal:** primary green cleanup role (bad ROF efficiency).  
**Anti-synergy:** solo Battery on Gauntlet Short without stitch = leak.

### 6.10 Peel Alchemist — *Coat* · Magic/Mid (optional 10th)

```
cost: 500 | range: 155 | rof: 0.9 | pierce: 1 | pop: 0 | splash: 60
camo: N | lead: N | applies Coat status | default: First
```

| Path | Fantasy | t3–4 |
|------|---------|------|
| A Brittle | +pop taken / shred shell | enemies take +1 pop; shell shred |
| B Midas | Bounty buff / jackpot luck | coated pops +BAN; rare jackpot bias |

**Illegal:** second freeze; pure sniper.  
**Coat duration:** 4s; max 1 coat type per banana (stronger overwrites).

---

## 7. Wave composition grammar

### 7.1 Authoring structure

```
WaveDef {
  contentLevel: 1..150
  groups: GroupDef[]
  bossInsert?: BossKind
  missionHint?: string
}

GroupDef {
  layer | special: id
  count: int
  spacing: seconds between spawns
  delay: seconds after previous group starts
  props?: { camo, lead, regrow, fortified, speedMul }
  lane?: 0 | 1 | "split"   // post-launch
}
```

**Spawn clock:** `spawnTimer` counts down; emit next from queue.

### 7.2 Chapter templates (contentLevel)

| Band | Levels | Grammar |
|------|--------|---------|
| Teach | 1–10 | Single layer groups; low count; no multi-prop |
| Open | 11–20 | Mixed ripe/gold; first camo pack (~15) |
| Spike | 21–40 | Lead dens, regen lesson, ceramic, first barge ~30/40 |
| Craft | 41–70 | Zebra floods, multi-prop, freighter |
| Endurance | 71–150 | Stacked flags, titan cadence, jackpot rare |

**Boss cadence:** BAN-Barge every ~10 from 20+; freighter ~50/70/90; titan 100/120/150 (scaled by length remap).

### 7.3 Short / Medium / Long remap (KEEP)

```
contentLevel = clamp(1, 150, round(displayWave * contentSpan / waveCap))

// LENGTHS
short:  contentSpan 90,  waveCap classic 30
medium: contentSpan 120, waveCap classic 75
long:   contentSpan 150, waveCap classic 150
```

Mode wave caps override per `LENGTHS.waves[mode]`.

**Intent:** Short still spawns late-tier threats via remap — denser, not “only greens.”

### 7.4 Density multipliers

```
count' = ceil(count * densMul)
densMul = mode.dens * length.dens * diff.dens * (blitz ? 1.38 : 1)

// Mode DNA: classic 1 / tour 1.08 / rush 1.42 / party 1.22
// Diff: normal 1 / hard 1.15 / starship 1.3
```

**Sludge guards**

| Guard | Rule |
|-------|------|
| Max concurrent bananas | Soft **280**; if exceeded, delay next spawn 0.05s (not delete) |
| Spacing floor | `max(0.04s, spacing / densMul)` |
| Particle quality | Render tier; sim never drops bananas for FPS |
| Jackpot count | Max 1 per wave Normal; Rush 2 |

---

## 8. Economy formulas

### 8.1 Start BAN

```
startBan = DIFF.startBan + MODE.startBanBonus
// DIFF: normal 900, hard 750, starship 650
// MODE: classic 0, tour 150, rush 300, party 200
```

### 8.2 Live pop bounty

```
killBounty(baseValue) =
  floor(baseValue
    * DIFF.reward          // 1 / 1.3 / 1.6
    * streakMul
    * waveMul
    * runBanMul            // mode.ban * length.ban * blitz 1.12 * reverse 1.05
    * feverMul             // 2 if fever else 1
    * eventMul             // double 2, frenzy 1.5, else 1
  )
  at least 1

streakMul = 1 + min(0.75, killStreak * 0.025)
waveMul   = 1 + displayWave * 0.012
```

Layer `baseValue` from §2.2. Ceramic/boss use `specialBounty` floors (28 / 180 / 400 / 900) then `killBounty`.

### 8.3 Round clear bonus

```
clearBonus = floor( (50 + displayWave * 5) * DIFF.reward * runBanMul * (perfect ? 1.15 : 1) )
```

Paid once when wave ends (queue empty, no threats).

### 8.4 Interest (soft softcap — LOCK diminishing tiers)

```
// Replace flat min(cap, ban*0.12) with tiers:
raw = floor(ban * 0.12)
interest = tierSoftcap(raw)

tierSoftcap(raw):
  // first 150 at 100%, next 150 at 60%, next 200 at 35%, rest at 15%
  take bands...
hardCeiling = DIFF: normal 300, hard 380, starship 500  // still apply AFTER tiers
interest = min(hardCeiling, tiered)
```

**Fever does not multiply interest.**  
Preview = same formula on current ban (HUD).

### 8.5 Farm income (round clear)

```
farmSum = sum over farms of pathIncome(farm)
// softcap:
farmPaid = farmSoftcap(farmSum)
// first 200 full, next 200 @ 70%, rest @ 40%
```

Harvest vs Bank: Bank may convert stored pool — still through softcap on payout.

### 8.6 Ability Drop

```
dropBan = floor( (80 + displayWave * 12) * DIFF.reward * dropDiminish )
dropDiminish = 1 / (1 + timesUsedThisRun * 0.08)   // soft anti-snowball
// min floor 40
```

### 8.7 Fever multiplier

- Pop bounties ×2  
- Tower ROF ×1.25 (attack interval / 1.25)  
- **Not** on interest/farm flat (farm is not ROF)  
Duration from streak triggers: `4 + min(6, floor(streak/15))` seconds; Rush starts with fever stacks per mode.

### 8.8 Streak

- +1 per kill bounty event; reset on leak or 3.2s idle  
- Fever thresholds: 15 / 30 / 50 / every +25  

### 8.9 Worked examples

Assume: Classic, Medium, **Hard**, no blitz/reverse, no fever/event, streak 0, waveMul only.

**Wave 10 — pop one Ripe (base 3)**

```
reward=1.3, streakMul=1, waveMul=1.12, runBanMul=1
bounty = floor(3 * 1.3 * 1.12) = floor(4.368) = 4
```

**Wave 10 — end round clear (imperfect)**

```
clear = floor((50+50)*1.3) = floor(130) = 130
interest on ban=1000 raw=120 → tiered ≤120 → hardcap 380 → 120
```

**Wave 40 — pop Zebra (12), streak 20**

```
streakMul=1+min(0.75,0.5)=1.5
waveMul=1.48
bounty=floor(12*1.3*1.5*1.48)=floor(34.632)=34
```

**Wave 40 — barge kill special floor 180**

```
bounty=floor(180*1.3*1.5*1.48)=floor(519.48)=519
```

**Wave 80 — fever on, pop Cosmic (9), streak 40**

```
streakMul=1+min(0.75,1.0)=1.75
waveMul=1.96
fever=2
bounty=floor(9*1.3*1.75*1.96*2)=floor(80.262)=80
```

**Wave 80 — interest bank 4000**

```
raw=floor(4000*0.12)=480
tiered: 150*1 + 150*0.6 + 180*0.35 = 150+90+63 = 303
hardcap hard 380 → 303
```

**Wave 80 — Drop used 5 times**

```
base=80+80*12=1040; *1.3=1352
diminish=1/(1+0.4)=0.714
drop=floor(1352*0.714)=965
```

---

## 9. Abilities

| ID | Name | Max CD | Effect | Cannot |
|----|------|--------|--------|--------|
| storm | Storm | **22s** | Path-aligned pops: `pop=1` on up to **N** non-MOAB bananas nearest First (N=12 + wave/10); MOAB takes **flat 15 shell dmg** only | Full-map delete; ignore camo (CAN hit camo); not win button late |
| freeze | Cryo | **18s** | Apply freeze/slow in large radius at Core-side path third: freeze packs **1.0s** (capped §2.4); bosses 0.35s | Permanent hold; lead immune to freeze? **No — Cryo hits lead** |
| cash | Drop | **28s** | Instant BAN §8.6 | Stack infinite with zero diminish; better than 3 farms long-term |
| rage | Rage | **32s** | All towers ROF ×1.45 for **6s** | Grant camo/lead; increase pop |

**Charges:** single charge each (no multi-stock at launch).  
**Cost:** 0 BAN.  
**Targeting:** Storm/Cryo automatic global rules; no player ground-target at launch (mobile clarity). Optional ground-target Cryo post-launch.  
**Meta:** `abilityUses++` on cast.

**State:** `cd` ticks in sim time (affected by game speed).

---

## 10. Leak / lives / failure

### 10.1 Life loss

| Enemy | Lives lost |
|-------|------------|
| green | 1 |
| ripe | 1 |
| gold | 2 |
| purple | 3 |
| star | 4 |
| zebra | 5 |
| jackpot | 6 |
| ceramic | 5 |
| boss | 25 |
| freighter | 50 |
| titan | 99 |

Children not spawned on leak (entity removed).

### 10.2 Start lives

```
Normal 300 | Hard 200 | Starship 140
```

### 10.3 Failure

- `lives <= 0` → LOSE immediately (mid-wave OK).  
- No sudden-death alternate unless Sandbox modifier.  
- Win: survive `waveCap` (mode/length); optional freeplay does not auto-lose.

### 10.4 Save scumming stance

| Allow | Disallow |
|-------|----------|
| Restart run anytime | Mid-wave savestate for ranked badges |
| Export/import progress | Editing JSON to unlock badges (honor system; no anti-cheat launch) |
| Sandbox god tools | Ranked badge grants from sandbox |

**Badge integrity:** only runs with `ranked=true` (not sandbox, not god cash) write atlas/mode badges.

---

## 11. Juice triggers

| Trigger | Audio | Visual | UI |
|---------|-------|--------|-----|
| Perfect round (0 leak) | bright arpeggio | gold rim pulse | “Perfect” float + 1.15 clear bonus |
| Leak | low saw | magenta core flash; life float | streak reset toast if ≥10 |
| Boss kill | deep boom | shake 0.25; banana confetti | bounty float force |
| Fever start | rising fanfare | gold full-screen rim; speed lines | FEVER badge HUD |
| Ability use | ability ping | ability-specific (lightning / frost / BAN rain / red aura) | CD flash |
| 4xx upgrade | fanfare tier | tower transform burst; ring expand | path name announce |
| Jackpot pop | jackpot chime | huge coins | announce |
| Streak ×10 | tick-up | small flash | streak HUD |
| Wave start | soft thump | portal pulse | wave label |
| Win | victory | confetti + share card ready | results |
| Place tower | soft thud | dirt + confetti | — |
| Illegal place | muted buzz | red flash tile | — |

**Throttle:** BAN floats max rate; boss/jackpot never throttled.

---

## 12. Debug / sandbox tools

**Gate:** `?sandbox=1` or hub Sandbox/Lab · `ranked=false`.

| Tool | Effect |
|------|--------|
| God cash | `ban += 99999` |
| Force wave N | set wave, rebuild queue |
| Skip to contentLevel | remap |
| Show ranges | all towers range rings |
| Show immunities | icons on all bananas |
| Show path IDs / dist | debug text |
| Speed 5× | sandbox only |
| Seed display | HUD `seed` hex |
| Reroll seed | new daily practice |
| Toggle invuln Core | lives frozen |
| Spawn group | pick layer+props |
| Clear CD | abilities ready |
| Unlock all towers | ignore meta gates |
| FPS / entity counts | overlay |

**Never** available in ranked Hard/Starship badge runs without sandbox flag.

---

## 13. Golden playtests (15+)

Use as automated/manual acceptance. **Normal = teach; Hard = proud; Starship = brag.**

| # | Claim | Pass condition |
|---|-------|----------------|
| 1 | Dart-only can clear **Normal Short Canyon** | Win with only Dart placed (sell others none); abilities OK |
| 2 | No farm required for **Normal Medium** any launch map | Win 0 farms |
| 3 | Farm-only cannot clear wave 15 Normal | Lives lost / lose before 15 |
| 4 | **Hard Short Canyon** requires ≥2 tower **families** | (design target—if Dart-only wins, nerf bounty or buff dens) |
| 5 | Starship Long requires ≥2 tower families | Win uses ≥2 defs |
| 6 | Control alone (Chill-only) cannot beat freeplay dens after wave 30 | Lose or leak spiral by 30 freeplay |
| 7 | Bomb-only fails pure camo rush wave (test wave) | Leak without Village/Sniper/ability camo plan |
| 8 | Sniper-only fails mass green rush | Leak (insufficient stitch) |
| 9 | Battery-only fails Gauntlet Short Normal | Leak (cleanup) |
| 10 | 2-2 crosspath legal; 3-2 legal; 3-3 purchase blocked | UI + sim reject |
| 11 | Interest at 10k BAN < 2× interest at 2k | Softcap working |
| 12 | Drop×10 in one run < income of one 4xx Farm over 20 rounds | Anti-snowball |
| 13 | Reverse Canyon changes optimal first tower tile | Playtest note |
| 14 | Auto-wave will not soft-lock when broke+CD+leaked | Guard true |
| 15 | Short remap still spawns ceramic/boss before end | contentLevel check |
| 16 | Fever does not increase interest payout | Unit test |
| 17 | Fortified + pop1 dart sparks; pop2 peels | Matrix |
| 18 | Sell refund 70% ±0 on integer BAN | Unit test |
| 19 | Sandbox god cash grants **no** atlas badges | ranked false |
| 20 | Daily seed same commands → same lives at wave 10 | Determinism |

---

## 14. Parameter JSON

Copy-paste defaults (comments are `//` — strip or use JSONC loader):

```jsonc
{
  // ---- sim ----
  "simHz": 60,
  "maxSimStepsPerFrame": 6,
  "productName": "Banano TD",

  // ---- grid / path ----
  "cols": 40,
  "rows": 25,
  "sellRate": 0.70,
  "slowFloor": 0.18,
  "slowStackExponent": 0.85,
  "maxSlowSources": 4,
  "maxFreezeSec": 1.25,
  "maxFreezeSecMoab": 0.45,
  "freezeUptimeCap": 0.40,
  "bossSlowFloor": 0.55,
  "regrowIntervalSec": 3.5,
  "fortifiedPopMul": 0.5,
  "fortifiedBlocksPop1": true,
  "shellPopValue": 1,

  // ---- layers: speed, value ----
  "layers": {
    "green":  { "name": "Unripe",  "next": null,     "speed": 50,  "value": 2,  "r": 13, "lives": 1 },
    "ripe":   { "name": "Ripe",    "next": "green",  "speed": 60,  "value": 3,  "r": 14, "lives": 1 },
    "gold":   { "name": "Golden",  "next": "ripe",   "speed": 72,  "value": 5,  "r": 15, "lives": 2 },
    "purple": { "name": "Meme",    "next": "gold",   "speed": 88,  "value": 7,  "r": 16, "lives": 3 },
    "star":   { "name": "Cosmic",  "next": "purple", "speed": 105, "value": 9,  "r": 17, "lives": 4 },
    "zebra":  { "name": "Zebra",   "next": "star",   "speed": 96,  "value": 12, "r": 18, "lives": 5 },
    "golden": { "name": "JACKPOT", "next": "zebra",  "speed": 70,  "value": 40, "r": 20, "lives": 6 }
  },

  // ---- shells ----
  "specials": {
    "ceramic":       { "hp": 14,   "speed": 44, "value": 32,   "lives": 5,  "children": "zebra",   "childCount": 2 },
    "boss":          { "hp": 260,  "speed": 24, "value": 220,  "lives": 25, "children": "ceramic", "childCount": 4, "lead": true },
    "freighter":     { "hp": 800,  "speed": 16, "value": 500,  "lives": 50, "children": "boss",    "childCount": 2, "lead": true },
    "titan":         { "hp": 2000, "speed": 12, "value": 1200, "lives": 99, "children": "freighter","childCount": 2, "lead": true }
  },

  // ---- difficulty ----
  "difficulties": {
    "normal":   { "startBan": 900, "lives": 300, "scale": 1.0,  "dens": 1.0,  "reward": 1.0, "interestCap": 300 },
    "hard":     { "startBan": 750, "lives": 200, "scale": 1.35, "dens": 1.15, "reward": 1.3, "interestCap": 380 },
    "starship": { "startBan": 650, "lives": 140, "scale": 1.75, "dens": 1.3,  "reward": 1.6, "interestCap": 500 }
  },

  // ---- modes ----
  "modes": {
    "classic": { "startBan": 0,   "dens": 1.0,  "ban": 1.0,  "eventScale": 1.0, "jackpot": 1.0, "feverStart": 0 },
    "tour":    { "startBan": 150, "dens": 1.08, "ban": 1.18, "eventScale": 0.9, "jackpot": 1.15, "tourEvery": 20 },
    "rush":    { "startBan": 300, "dens": 1.42, "ban": 1.55, "eventScale": 0.75,"jackpot": 1.9, "feverStart": 12 },
    "party":   { "startBan": 200, "dens": 1.22, "ban": 1.35, "eventScale": 0.4, "jackpot": 1.7, "feverStart": 0 }
  },

  // ---- lengths ----
  "lengths": {
    "short":  { "contentSpan": 90,  "dens": 1.05, "ban": 1.08, "scoreMul": 0.85,
                "waves": { "classic": 30, "tour": 40, "rush": 25, "party": 30 } },
    "medium": { "contentSpan": 120, "dens": 1.0,  "ban": 1.0,  "scoreMul": 1.0,
                "waves": { "classic": 75, "tour": 80, "rush": 50, "party": 60 } },
    "long":   { "contentSpan": 150, "dens": 1.0,  "ban": 1.0,  "scoreMul": 1.35,
                "waves": { "classic": 150,"tour": 120,"rush": 80, "party": 100 } }
  },

  // ---- mutators ----
  "blitz": { "dens": 1.38, "speed": 1.42, "ban": 1.12 },
  "reverse": { "ban": 1.05 },

  // ---- economy ----
  "interestRate": 0.12,
  "interestTiers": [
    { "upTo": 150, "mul": 1.0 },
    { "upTo": 300, "mul": 0.6 },
    { "upTo": 500, "mul": 0.35 },
    { "upTo": 99999, "mul": 0.15 }
  ],
  "farmSoftcapTiers": [
    { "upTo": 200, "mul": 1.0 },
    { "upTo": 400, "mul": 0.7 },
    { "upTo": 99999, "mul": 0.4 }
  ],
  "clearBonusBase": 50,
  "clearBonusPerWave": 5,
  "perfectClearMul": 1.15,
  "streakMulPerKill": 0.025,
  "streakMulCap": 0.75,
  "waveMulPerWave": 0.012,
  "feverBountyMul": 2.0,
  "feverRofMul": 1.25,
  "killStreakIdleResetSec": 3.2,
  "feverStreakTriggers": [15, 30, 50],
  "feverStreakEvery": 25,
  "dropBase": 80,
  "dropPerWave": 12,
  "dropDiminishPerUse": 0.08,
  "dropMin": 40,
  "maxBananasSoft": 280,
  "minSpawnSpacing": 0.04,

  // ---- abilities ----
  "abilities": {
    "storm": { "maxCd": 22, "baseTargets": 12, "perWaveTargets": 0.1, "moabDamage": 15, "pop": 1 },
    "freeze": { "maxCd": 18, "packFreezeSec": 1.0, "bossFreezeSec": 0.35 },
    "cash":   { "maxCd": 28 },
    "rage":   { "maxCd": 32, "duration": 6, "rofMul": 1.45 }
  },

  // ---- dual path ----
  "maxPathTier": 4,
  "freeCrosspathTier": 2,
  "deepPathMinTier": 3,

  // ---- targeting modes launch ----
  "targetModes": ["first", "last", "strong", "close"],

  // ---- performance / juice ----
  "maxParticles": 200,
  "maxFloats": 48,
  "floatThrottleSec": 0.05
}
```

### Tower base stats (compact)

```jsonc
{
  "towers": {
    "dart":     { "cost": 175, "range": 170, "rof": 0.46, "pierce": 1, "pop": 1, "splash": 0, "camo": false, "lead": false },
    "boomer":   { "cost": 320, "range": 150, "rof": 0.85, "pierce": 6, "pop": 1, "splash": 0, "camo": false, "lead": false, "boomerang": true },
    "sniper":   { "cost": 380, "range": 420, "rof": 1.0,  "pierce": 1, "pop": 2, "splash": 0, "camo": true,  "lead": false, "preferStrong": true },
    "bomb":     { "cost": 550, "range": 160, "rof": 1.1,  "pierce": 1, "pop": 1, "splash": 78,"camo": false, "lead": true },
    "ice":      { "cost": 400, "range": 145, "rof": 1.2,  "pierce": 1, "pop": 0, "splash": 100,"slow": 0.52, "camo": false, "lead": false, "freezePulse": true },
    "farm":     { "cost": 750, "range": 90,  "farm": true },
    "village":  { "cost": 1000,"range": 190, "support": true },
    "super":    { "cost": 2400,"range": 200, "rof": 0.10, "pierce": 1, "pop": 1, "camo": true, "lead": true, "multishot": 1 },
    "battery":  { "cost": 4800,"range": 460, "rof": 1.7,  "pierce": 1, "pop": 14,"camo": true, "lead": true, "preferStrong": true, "rail": true },
    "alchemist":{ "cost": 500, "range": 155, "rof": 0.9,  "pierce": 1, "pop": 0, "splash": 60,"camo": false, "lead": false, "coat": true }
  }
}
```

*(Full path upgrade tables: port from current `TOWER_DEFS` in `playTD.js` with Banano renames; t3–4 must pass identity tests §5.3.)*

---

## Document control

| Doc | Role |
|------|------|
| DESIGN-LOCK.md | Product pillars, roster fantasy, modes |
| ARCHITECTURE.md | Modules, phases, stack |
| **SYSTEMS-BIBLE.md** | Combat/economy formulas — **this file** |

**Amendment rule:** change numbers here first, then code; note date in footer log.

| Date | Note |
|------|------|
| 2026-07-22 | Initial Systems Bible (Prompt 2) |

---

**NEXT: paste PROMPT 3**
