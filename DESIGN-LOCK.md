# Banano TD — Design Lock (GDD Lite)

**Status:** DESIGN LOCKED (Prompt 1) + OPEN QUESTIONS LOCKED (see §17 / §18)  
**Product name:** **Banano TD** (primary). Subtitle OK in marketing: “Epic Banana Defense” or “Core Defense.” **One name in HUD / results / share:** `Banano TD`.  
**Live product absorbed:** bananox.com/playTD.html · `playTD.js` / `playTD.html`  
**Tone:** Premium AAA-*feeling* browser TD · Banano soul · no pay power  
**Stack intent:** PixiJS + TypeScript + Vite (challenge only with strong reason)  
**Save continuity:** migrate `bananox_td_v1` (+ bak); never wipe player badges/atlas without export path  

### Canonical decisions (locked)

| # | Decision |
|---|----------|
| 1 | **Power fantasy:** Skill + dual-path mastery first. Meta unlocks cosmetics, badges, QoL (sandbox maps)—**never** tower DPS. |
| 2 | **Content ship:** 6 maps + 9–10 towers at launch; 2 maps + 2 towers post-launch. Full set designed in bible. |
| 3 | **Economy tone:** Tight early, expressive mid, controlled late. Interest + farms exist; **soft softcaps** block infinite scale. |
| 4 | **Difficulty:** Normal teaches; **Hard = default proud clear**; Starship = badge/brag. No assists that invalidate badges; Sandbox/Lab unrestricted. |
| 5 | **Daily challenge:** Cosmetic + title only (+ optional cosmetic currency). **No permanent power currency.** |
| 6 | **Touch/UI:** Desktop-class precision on mobile—drag place, large hit targets, radial upgrade; **no gesture-only critical actions.** |
| 7 | **Global LB:** Schema at launch; **live backend Phase 4**. Local LB + badges day one. |
| 8 | **Name:** Banano TD primary; single display name in HUD/results/share. |

---

## 1. Elevator pitch (~50 words)

Banano TD is a premium browser tower defense where you command MonKeys defending the Jungle Core from layered banana threats. Dual upgrade paths, map topology, and timed abilities force real buildcraft. Pop peels, farm BAN, survive bosses—feel free, feeless, potassium-rich chaos without wallet walls.

## 2. Player fantasy — “General of the Jungle Core”

You are not a casino whale and not a Bloons tourist with a banana sticker.

You are the **General of the Jungle Core**: a calm, slightly unserious commander who treats potassium logistics like a real war. You read the path, rotate targeting like doctrine, spend BAN like ammo, and drop Storm / Cryo / Drop / Rage as battlefield orders—not panic buttons.

**Fantasy promises**
- Your board tells a story (farm triangle → camo solution → boss melt line).
- A perfect send timing feels like genius; a leak teaches a lesson in 2 seconds.
- Wins feel earned by **decisions**, not by unlocking a pay tower.
- The jungle looks alive; the Core feels sacred; the memes feel community, not grift.

**Fantasy kills**
- Forced wallet, NFT monkeys, real-BAN power gates.
- One tower that wins every chapter.
- Illegible camo/lead/boss rules.
- Soft-lock auto-wave while broke and cooldowns dead.

---

## 3. Core loops

### Micro (≈10 seconds)
| Action | Skill expression |
|--------|------------------|
| Place / cancel place | Coverage vs. BAN opportunity cost |
| Select tower → retarget (First/Last/Strong/Close) | Boss melt vs. cleanup vs. ceramic shells |
| Ability timing (Storm / Cryo / Drop / Rage) | Save vs. spend; stutter-step rushes |
| Sell / re-roll space (mid-run) | Pivot when map/tour rotates or chapter spikes |
| Speed 1×/2×/3× | Cognitive load management; not a crutch for broken eco |

**Micro win condition:** never “lose without understanding why.” Every leak has a readable cause (camo gap, lead gap, range hole, underleveled boss damage).

### Macro (one run)
| Phase | Waves (Classic Long scale) | Player job |
|-------|----------------------------|------------|
| **Eco open** | 1–20 | Survive with cheap Primaries + one answer tower; plant first Farm/Bank decision |
| **Mid spike** | 21–50 | Camo/lead/regrow pressure; dual-path locks start mattering; first Village or strong Mid |
| **Boss chapters** | ~every 10–15 from mid; denser late | Fortified MOAB-class, immunity windows, ability windows |
| **Late craft** | 51–cap | Super / Battery / multi-path 4s; fever windows; interest stacking |
| **Victory lap / freeplay** | Post-win optional | Prestige score, atlas practice, endless density |

**Macro arc:** earn → invest → answer specials → melt bosses → surplus → flex.

### Meta (session / account)
| Loop | Reward type | Power? |
|------|-------------|--------|
| Badge chase (map × length atlas, modes, mutators) | Status + cosmetics unlock | **No combat power** |
| Tower mastery XP (pops/rounds with tower) | Titles, skins, codex lore | **No combat power** |
| Challenges / daily seeds (post-launch) | Cosmetics, banners | **No combat power** |
| Local leaderboard + share card | Social flex | N/A |
| Knowledge codex | Clarity of properties | Indirect skill only |

**Hard rule:** real BAN, wallet links, and tips never buy DPS, lives, eco rate, or map unlocks that gate power.

---

## 4. Pillar tests — “interesting build”

A midgame board (≈waves 25–45, Normal Classic Medium) is **interesting** only if the player faces **≥3 forced tradeoffs** at once, e.g.:

1. **Path lock:** Can I go 0-3/4 on Dart for cleanup, or must I leave room for 3-0 Sniper deadeye before ceramic/boss week?
2. **Camo budget:** Spend BAN on Village Radar vs. native camo Sniper vs. ability Cryo window—cannot afford all three this round.
3. **Eco vs. defense:** Second Farm now vs. Bomb for lead dens—one choice leaks, the other starves late Super.
4. **Space topology:** Chokepoint is full; place on weak secondary angle or sell a Farm for range geometry.
5. **Ability economy:** Rage for boss chapter vs. hold for freeplay score streak—using now is correct *or* greedy.
6. **Targeting doctrine:** Strong on Battery deletes barge but lets zebra pack leak; First cleans peels but bosses walk.

**Build is boring if:** one tower type + spam upgrades solves every property; or interest/Drop floods BAN so every T4 is free by mid.

**Gate for content shipping:** any new tower, map gimmick, or mode modifier must create at least one *new* tradeoff without deleting two old ones.

---

## 5. Combat readability rules

### Always visible (no tooltip required)

| Signal | Visual language (code-first) |
|--------|------------------------------|
| **Camo** | Soft silhouette shimmer / dashed outline; optional “ghost” alpha; tower without camo shows **red X** on hover attempt |
| **Lead** | Metallic rim + darker fill; darts that bounce show **spark fail** VFX |
| **Armor / Ceramic shell** | Thick crust ring + HP pip bar on shell |
| **Fortified** | Shield chevron badge; reduced pop numbers flash grey |
| **Regen** | Green pulse + tiny “+layer” tick when regrowing |
| **MOAB-class / boss** | Large silhouette, health bar under, immunity icons row (camo/lead/fortified/slow-resist) |
| **Range** | Place/select: translucent yellow ring; aura towers: second cyan ring |
| **Buff auras** | Soft pulse on affected towers; icon stack on selected tower (camo grant, ROF+) |
| **Leak direction** | Core glow + path arrow chevrons toward vault; leak = magenta flash + life float **from core** |
| **Ability CDs** | HUD radial/cooldown fill always; keyboard hints; ready = Banano yellow flash once |
| **Targeting mode** | Selected tower shows mode chip on pedestal + in panel |
| **Fever / event / rage** | Distinct full-screen rim color (fever gold, rage magenta, event cyan)—never same hue |

### Clarity rules
- **Color is not the only channel** — shape + icon + motion for colorblind / bright outdoor mobile.
- **Damage floats** throttle under density; priority: boss hits > jackpot > normal.
- **Immunity fail** must be louder than a successful pop (miss spark > silence).
- **No baked text in sprites**; HUD numbers are DOM/code.

---

## 6. Tower fantasy roster (launch: 10)

Dual-path rule (KEEP): free up to **2/2**; only **one** path may enter **3–4**.

| # | Tower | Role | Unique verb | NOT allowed (anti-samey) | Path A identity | Path B identity |
|---|-------|------|-------------|--------------------------|-----------------|-----------------|
| 1 | **Dart MonKey** | Primary | *Stitch* single-file peels | No native splash; no boss delete; no passive income | **Sharp** — pierce javelin lines | **Frenzy** — multi-dart ROF |
| 2 | **Boomer K+** | Mid | *Sweep* long arcs / return path | No map-wide range; no farm; weak vs pure lead until high | **Glaive** — pierce/ricochet | **Chase** — turbo multi-rang |
| 3 | **Sniper MonKey** | Military / Support hybrid | *Mark* priority targets map-wide | No cheap AOE spam; not early eco | **Deadeye** — lead → ceramic → boss melt | **Supply** — shrapnel + income spike |
| 4 | **Bomb MonKey** | Military | *Crack* packs + lead shells | No camo native at base; not single-target sniper | **Blast** — splash / stun-slow | **Missile** — boss-prefer rockets |
| 5 | **Chill MonKey** | Magic | *Hold* tempo with frost | No high pure DPS race with Super; no farm | **Freeze** — radius control | **Impale** — shards that gain camo/lead |
| 6 | **Banana Farm** | Economy | *Mint* end-round BAN | Zero combat (except flavor particles); no camo aura | **Harvest** — flat round income | **Bank** — stored interest / lump |
| 7 | **Jungle Village** | Support | *Buff* doctrine bubble | No strong personal DPS; not a boss killer | **Support** — ROF + camo detect aura | **Trade** — eco + light ROF |
| 8 | **Super MonKey** | Hero / late Primary | *Flood* pierce beams | Not cheap early; not best pure boss without help | **Plasma** — splash multi-beam | **Robo** — hyper multi-stream |
| 9 | **Starship Battery** | Ultimate / Anti-boss | *Rail* delete super-heavies | Bad cleanup of green swarms alone; expensive | **Rail** — pierce boss beam | **Salvo** — multi-rail cluster |
| 10 | **Peel Alchemist** *(new — replaces pure BTD glue clone)* | Magic / Mid | *Coat* bananas (weaken, brittle, gold-touch) | Not another freeze; not pure sniper | **Brittle** — +pop taken / shred shell | **Midas** — bounty buff / jackpot luck |

**Launch cut / hold**
- Emoji-as-identity → **MonKey base art** via Imagine; projectiles code-first.
- Optional post-launch 11–12: **Spike Weaver** (path traps), **DJ Ape** (party aura / fever extend)—only if roster gaps proven in playtests.

**Anti-samey law:** no two towers share the same *primary verb* (stitch / sweep / mark / crack / hold / mint / buff / flood / rail / coat).

---

## 7. Enemy / banana ecology

### Layer tree (peel chain)

```
JACKPOT (golden) → Zebra → Cosmic (star) → Meme (purple) → Golden → Ripe → Unripe (green) → gone
```

| Layer | Role | Speed ladder | Bounty ladder (base) |
|-------|------|--------------|----------------------|
| Unripe | Cleanup filler | Slowest | Lowest |
| Ripe | Early default | ↑ | ↑ |
| Golden | Mid meat | ↑ | ↑ |
| Meme | Fast pressure | Fast | Mid-high |
| Cosmic | Elite peel | Faster | High |
| Zebra | Dense multi-child pressure | High | High |
| JACKPOT | Rare juicy peel → full chain | Medium | Absurd (skill: find & secure) |

**Child rule:** pop spawns next layer(s) with path progress inheritance + tiny lateral offset; multi-pop can skip layers per tower `pop` power.

### Properties (orthogonal flags)

| Flag | Meaning | Counter philosophy |
|------|---------|--------------------|
| **Camo** | Untargetable without detect | Sniper base, Village radar, high path unlocks, some abilities |
| **Lead** | Immune to “soft” projectiles | Bomb base, upgrades, Battery/Super base |
| **Armor / Ceramic** | High shell HP then dump children | Sniper deadeye, Bomb blast, focus fire |
| **Fortified** | Shell takes reduced pop / bonus HP | Prefer Strong + anti-boss path + abilities |
| **Regen** | Regrows a layer if not fully deleted in window | Sustained DPS / multi-hit / freeze windows |
| **MOAB-class** | Boss barge hierarchy; children on death | Battery, Bomb missile, Sniper cripple, Boomer cleave |

**Boss family (rename away from pure BTD trademarks in UI copy)**
- **BAN-Barge** (entry boss) → pack of ceramics/zebras  
- **Potassium Freighter** (mid) → fortified + camo phases  
- **Vaultbreaker Titan** (late) → multi-immunity windows, ability checks  
- **Starship-class** (Starship diff / freeplay) — spectacle + score  

### Spawn philosophy by chapter

| Chapter | Content intent |
|---------|----------------|
| **Early (1–15)** | Teach path + place; mostly Unripe→Golden; rare camo tease wave |
| **Mid (16–40)** | Camo packs, lead dens, first ceramic, regen lesson; first barge |
| **Late (41–cap)** | Mixed property stacks, zebra floods, freighter/titan, dense multi-flag |
| **Freeplay** | Density/speed/HP ramps; property stacking; jackpot cadence as juice valve |

**Length remap (KEEP):** displayed wave maps to `contentSpan` so Short still teaches late threats—compressed curriculum, not “only early bananas.”

---

## 8. Maps & topology

### Launch (6)

| Map | Shape lesson | Chokepoints | Multi-lane stress | Signature gimmick |
|-----|--------------|-------------|-------------------|-------------------|
| **Potassium Canyon** | Long horizontal beats + vertical climbs; classic “line farm” | 2–3 | Low | Tutorial-grade readability; default hub map |
| **Double Helix** | Nested S-turns; boomer heaven, bad linear rails | 3–4 | Medium crossfire | Overlapping ranges reward smart Mid |
| **Peel Spiral** | Inward/outward spiral; long dwell time | 2 | Low–med | Eco-friendly; punish slow bosses poorly if under-DPS |
| **Twin Fork Trail** | Detour geometry; “which arm did I cover?” | 2 primary + false fork read | Medium | Visual fork teaches targeting Last/First |
| **Starship Runway** | Long straights + short turns; sniper/rail showcase | 1–2 | Low | Boss runway: Battery fantasy map |
| **Gauntlet Gorge** | Dense zig-zag; high pressure, short reaction | 4–5 | High | Expert density; Blitz mutator stars here |

**Mutators (KEEP)**
- **Reverse:** start/end swap; invalidates “always place spawn-side” habits; +small ban mul.
- **Blitz:** dens + speed; ability/event CD scale; score prestige.

### Post-launch (+2)

| Map | Lesson | Gimmick |
|-----|--------|---------|
| **Split Market** | True dual-lane (two independent paths, shared lives) | Forces two frontlines; Village placement puzzles |
| **Vault Rings** | Concentric loops with one exit gate | Late-game pierce geometry; camera readability test |

---

## 9. Modes (keep + refine)

| Mode | Keep core | Refine |
|------|-----------|--------|
| **Classic** | One map, pure TD | Clear chapter banners; optional freeplay toggle post-win |
| **World Tour** | Maps rotate; towers relocate; upgrades stay | Explicit “relocation preview” UI; ban compensation if placement invalid; tourEvery scales with length (KEEP) |
| **Fever Rush** | Dense, fat bounties, fever start | Cap inflation: fever multiplies **pop** more than **interest**; shorter CD abilities with weaker peels |
| **Party** | Event loop + jackpot rain | Events are *spice*, not eco engines—tune `eventScale` so Party ≠ free win |

### Post-launch modes (max 2)
1. **Atlas Seed** — fixed daily seed, shared ghost ghost-line later; cosmetics only.  
2. **Core Siege** — fewer waves, pre-set lives, boss rush chapters only (skill expression for Battery/Bomb).

### Length system (KEEP)

| Length | Role | Content |
|--------|------|---------|
| **Short** | Badge-friendly, packed | Low wave count, high dens, compressed contentSpan |
| **Medium** | Default campaign | Balanced |
| **Long** | Prestige endurance | Full span, scoreMul highest |

### Badge matrix (KEEP + extend)

- **Map × Length clears** (18 launch) → Atlas Short/Medium/Long/Full  
- Mode clears, difficulty milestones, mutator wins, streak/jackpot/ability goals  
- **New meta badges (non-power):** tower mastery tiers, codex complete, perfect boss chapter  

---

## 10. Economy

### Sources (skill vs inflation)

| Source | Skill expression | Inflation risk | Rule |
|--------|------------------|----------------|------|
| **Start BAN** | Diff/mode choice | Low if locked per diff | Normal ~900 / Hard ~750 / Starship ~650 (current DNA); mode `startBan` adds |
| **Live pop bounties** | Placement + targeting | Medium if jackpot spam | Layer value ladder; fever multiplies pops carefully |
| **End-round bonus** | Survive clean | Medium | Scale with wave + perfect-wave bonus |
| **Interest** | Bank management | **High** | Soft cap or diminishing after threshold; preview in HUD (KEEP) |
| **Farms / Banks** | Opportunity cost space | **High** | Unique verb *mint*; nerf double-dip with interest if both print free Super by mid |
| **Drop ability** | Timing under pressure | Medium | CD + diminishing return if used every CD with full bank |
| **Fever mult** | Survive to trigger / Rush start | High if ×eco | Prefer attack speed + pop value; not interest |
| **Events (rain/double)** | React | High in Party | Bound max BAN per event |

### Design targets
- Midgame (wave ~30 Medium Normal): player can afford **one** path-3 OR two path-2s—not every T4.
- Farms should feel like a **build**, not AFK.
- Sell refund ~70% (KEEP spirit)—punish panic sells lightly.

### Interest (refine)
- Keep end-round interest as skillful bank play.
- Add **soft ceiling** or tiered rates so infinite bank ≠ infinite power.
- HUD always shows next interest preview (KEEP).

---

## 11. Abilities & global systems

| Ability | Current DNA | Redesign lock |
|---------|-------------|----------------|
| **Storm** | Map peel pressure | Global pierce pops on path; weaker on MOAB-class; **reads** as lightning along path |
| **Cryo** | Freeze window | Strong slow/freeze packs; short duration on bosses; teaches hold for ceramic dumps |
| **Drop** | Cash injection | Renamed fantasy “Banana Drop”; amount scales with wave but **anti-snowball** curve; not better than a Farm over long run |
| **Rage** | Attack speed buff | Tower ROF buff window; no free camo/lead; pairs with Storm for boss chapters |

**Rules**
- All abilities free of BAN cost (KEEP) but long CDs—skill is timing.
- Cooldowns visible; use increments `abilityUses` meta (KEEP).
- No ability grants permanent power.

### Targeting (KEEP + clarity)
`First | Last | Strong | Close` — default per tower fantasy (Sniper/Battery → Strong; Dart → First).

### Speed controls (KEEP)
1× / 2× / 3×; pause; mute. Speed must not break spawn timers unfairly (deterministic sim tick).

### Send-wave / auto-wave ethics
- Manual send = skill (early eco) when rewarded modestly.
- **Auto-wave:** never starts next wave if player BAN < cheapest tower **and** all abilities on CD **and** leak last wave (soft-lock guard).
- Auto-wave delay must be interruptible.
- Disable auto-wave on boss chapter intro first time per run (onboarding).

---

## 12. Meta progression

| System | Ships | Buys power? |
|--------|-------|-------------|
| Account XP (from clears, badges, mastery) | Launch+ | **No** |
| Badges / Atlas | Launch (expand) | **No** |
| Tower mastery (use → XP → title/skin) | Overhaul | **No** |
| Cosmetics: tower skins, projectile tints, map skins, victory banners | Overhaul phased | **No** |
| Knowledge codex (enemy properties) | Overhaul | **No** (info only) |
| Export / import / dual-slot save | KEEP | N/A |
| Real BAN / wallet | Optional tip jar / cosmetic store **later only if pure cosmetic** | **Never power** |

**Explicit:** *Real BAN never buys power.*

---

## 13. Onboarding (first session)

| Moment | Teaching beat | Fail-safe |
|--------|---------------|-----------|
| **0:00–0:30** | Canyon Short Normal; place 2 Dart; range ring; start wave | Ghost arrow to shop → pathside grass |
| **0:30–1:30** | First pop floats; BAN rises live; place third tower | If 0 towers by wave 2, soft pulse shop |
| **First leak** | Magenta core flash + “Lives = Vault Integrity” + why (if camo, show camo icon) | Pause-lite tip once; never modal every leak |
| **First dual-path choice** | At first path-3 affordance: “Only one path goes deep—choose your identity” | Panel locks other path 3+ with clear icon |
| **First boss** | Banner + health bar + ability prompt (optional Rage) | Slow-mo 0.5s entrance; targeting set Strong on select |

**Do not** front-load Tour / Starship / all 10 towers. Unlock Battery after first Medium clear or wave 40 once.

---

## 14. Social / share

### Share card fields
- Mode · Length · Map · Difficulty · Mutators  
- Waves · Score · Pops · Perfect waves · Best streak · Jackpots  
- Badge unlocked (if any)  
- Banano X branding + `bananox.com/playTD.html`  
- Optional handle (local nickname only)

### Local leaderboard (KEEP schema spirit)
```
{ score, wave, pops, mode, map, difficulty, length, reverse, blitz, won, at }
```
Top 20 device-local.

### Global LB (later schema)
```
runId, userIdHash, nickname, score, wave, pops, mode, map, difficulty,
length, reverse, blitz, won, clientVersion, seed?, createdAt, sig
```
Anti-cheat: server validates seed + version; no reward power.

---

## 15. KEEP / REWRITE / CUT vs current `playTD.js`

| System | Verdict | Notes |
|--------|---------|-------|
| Dual paths 2/2 then one to 3–4 | **KEEP** | Core identity |
| 9 towers → 10 with Alchemist | **REWRITE** roster fantasy | Keep roles; rename BTD-serial names in UI where needed; art overhaul |
| Layer tree Unripe→…→JACKPOT | **KEEP** | Numbers retune later |
| Camo / lead | **KEEP** | Add armor/fortified/regen as first-class readable flags |
| Ceramic / boss kinds | **REWRITE** | Stronger silhouettes + immunities UI |
| 6 maps | **KEEP** topology | **REWRITE** art, deco, chokepoint polish; true dual-lane later |
| Reverse + Blitz | **KEEP** | |
| Modes Classic/Tour/Rush/Party | **KEEP** | **REWRITE** Tour UX + inflation guards |
| Length S/M/L + contentSpan | **KEEP** | |
| Abilities storm/freeze/cash/rage | **KEEP** verbs | **REWRITE** balance curves + VFX naming (Drop) |
| Fever / events / streak / interest | **KEEP** | **REWRITE** caps for inflation |
| Targeting First/Last/Strong/Close | **KEEP** | |
| Speed / pause / mute / auto-wave | **KEEP** | **REWRITE** auto-wave soft-lock ethics |
| Save `bananox_td_v1` migrate | **KEEP** | Schema bump with migrations |
| Badges + map×length atlas | **KEEP** | Expand mastery cosmetics |
| Local LB + export/import | **KEEP** | |
| Missions | **REWRITE** | Clearer objectives; less noise |
| Canvas 2D monolith IIFE | **REWRITE** | Pixi + TS modules |
| Emoji tower icons | **CUT** as final art | Temporary OK during port |
| Pure BTD upgrade name clones (MOAB Eliminator, Sun Temple, etc.) | **REWRITE** | Banano-original path names |
| Pay/wallet power | **CUT** forever | |
| Full Unity dump | **CUT** | Browser stack |
| Endless freeplay | **KEEP** optional | Prestige score |
| Quality / particle caps | **KEEP** spirit | Pixi pools |

---

## 16. Success metrics (measurable)

| Metric | Target (90 days post-overhaul ship) |
|--------|-------------------------------------|
| **Perf** | p50 ≥55fps, p90 ≥40fps on mid mobile at wave 40 dens (Party off) |
| **FTUE** | ≥70% of new sessions place ≥3 towers by wave 3 |
| **Comprehension** | ≥60% of first-leak sessions continue (not ragequit <60s after leak) |
| **Build diversity** | No single tower id >35% of path-4 picks in wins (telemetry opt-in later; playtest proxy OK) |
| **Atlas engagement** | ≥25% of returning players clear ≥3 map×length badges |
| **Session length** | Median completed Short Classic 8–15 min; Medium 20–40 |
| **Inflation** | Median BAN at wave 30 Medium Normal within design band (set at balance pass; track ±20%) |
| **Stability** | <1% runs with soft-lock (auto-wave + 0 agency) reports |
| **Soul** | Playtest qualitative: “Banano” not “crypto casino” ≥4/5 |

---

## 17. Open questions — LOCKED DECISIONS

| # | Question (was) | LOCKED |
|---|----------------|--------|
| 1 | Power fantasy / meta power | **Skill + dual-path mastery first.** Meta = cosmetics, badges, QoL (sandbox maps). **NOT tower DPS.** |
| 2 | Content scope | **Launch:** 6 maps + 9–10 towers. **Post-launch:** +2 maps +2 towers. Design full set in bible now. |
| 3 | Economy tone | **Tight early → expressive mid → controlled late.** Interest + farms with **soft softcaps** (no infinite scale). |
| 4 | Difficulty ladder | **Normal teaches; Hard = proud default clear; Starship = badge/brag.** No assists that invalidate badges. Sandbox/Lab unrestricted. |
| 5 | Daily challenge | **Cosmetic + title only** (+ optional cosmetic currency). No permanent power currency from dailies. |
| 6 | Touch / mobile UI | **Desktop-class precision on mobile:** drag place, large hit targets, radial upgrade. No gesture-only critical actions. |
| 7 | Global leaderboard | **Schema at launch; live backend Phase 4.** Local LB + badges day one. |
| 8 | Product name | **Banano TD** primary. Subtitle marketing-only. One name in HUD/results/share. |

### Residual engineering choices (not product blockers)

| Topic | Default until amended |
|-------|----------------------|
| Launch roster count | **10 if Alchemist vertical-slices clean; else 9** (ship without Alchemist, keep design in bible) |
| Interest softcap | **Diminishing tiers** (feels fairer than hard wall); numbers in balance pass |
| Dual-lane map | **Post-launch** (Split Market); launch stays single-path topologies |
| Tour invalid tiles | Free re-place on rotate; no BAN loss for forced move |
| Freeplay LB | Separate `freeplay` board flag in schema; not mixed with win clears |
| Real-BAN store | **Out of scope** until pure-cosmetic policy + legal review |
| Hero unit | **Out of scope for launch** |
| Telemetry | Playtest manual first; opt-in anonymous schema stub only at launch |

---

## 18. Amendment log

| Date | Source | Change |
|------|--------|--------|
| 2026-07-22 | User lock batch | §17 open questions → locked decisions; name/HUD rule; power/meta/economy/diff/daily/touch/LB |

---

## Appendix A — Product pillars (priority)

1. Decision density  
2. Readability  
3. Buildcraft  
4. Spectacle  
5. Banano soul  
6. Performance (60fps mid-mobile dense late)

## Appendix B — Non-goals

- Pay-to-win / real-BAN power  
- Forced wallet / NFT monkeys  
- 200MB Unity dump if avoidable  
- Pure BTD clone with serial numbers filed off  
- AI art spam without engine-ready specs  

## Appendix C — Brand palette (combat UI)

| Role | Hex |
|------|-----|
| Banano Yellow | `#FBDD11` / UI `#f5d041` |
| Deep Jungle | `#1B3D2F` / field `#07140e` |
| Leaf Green | `#3D8B5A` |
| Vault Black | `#12141A` |
| Cream | `#FFF6D1` |
| Alert Magenta | `#E83E8C` |
| Cool Cyan | `#3DE0FF` |
| Hot Orange | `#FF7A18` |

---

*End Design Lock — Prompt 1. Next prompts implement against this document; challenge only with dated amendment notes.*
