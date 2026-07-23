# Banano TD — UI/UX Spec (Prompt 7)

**Status:** IMPLEMENTATION-READY  
**Product name (all chrome):** **Banano TD**  
**Depends on:** `DESIGN-LOCK.md`, `CONTENT-BIBLE.md`, `SYSTEMS-BIBLE.md`, `TECH-ARCHITECTURE.md`, `ART-BIBLE.md`  
**Shell:** Banano X nav + theme · game fills canvas host · HUD text = DOM/code  

**Touch law (locked):** Desktop-class precision on mobile — drag place, large hit targets, radial upgrade; **no gesture-only critical actions**.

---

## 0. Design tokens (UI)

| Token | Use |
|-------|-----|
| `--ban-gold` `#FBDD11` / `#F5D041` | Primary CTA, BAN, ready flash |
| `--jungle` `#1B3D2F` / panel `#152018` | Panels |
| `--cream` `#FFF6D1` | Body text on dark |
| `--alert` `#E83E8C` / `#FF3B4A` | Leak, danger |
| `--cryo` `#3DE0FF` | Info, freeze |
| `--fever` `#F472B6` | Fever only (not leak) |
| `--ok` `#3D8B5A` | Valid place |
| Min tap | **44×44 CSS px** (48 preferred abilities) |
| Type | Syne titles · DM Sans body (site fonts) |

**Density:** Desktop = side shop + wide HUD. Mobile = bottom sheet shop + compact top HUD. Breakpoint ~900px.

---

## 1. Screen map

```
Boot → Hub ─┬─ Play flow: Mode → Map → Diff/Length/Mutators → (Loadout) → In-run
            ├─ Codex
            ├─ Badges
            ├─ Settings
            ├─ Sandbox/Lab
            └─ (Cosmetics / Loadout from Hub or pre-run)
In-run ↔ Pause → Resume | Surrender → Defeat/Hub
In-run → Victory → Share | Freeplay | Hub
In-run → Defeat → Share | Retry | Hub
```

---

## 2. Screen specs + text wireframes

### 2.1 Boot

**Purpose:** Theme flash, load progress, audio unlock gesture.  
**Duration:** &lt;2s typical; spinner if asset fetch.

```
┌─────────────────────────────────────┐
│           BANANO TD                 │
│         [ banana mark ]             │
│      ████████░░░░  loading…         │
│   Tap / click anywhere to arm sound │
└─────────────────────────────────────┘
```

**States:** loading · ready · error (“Couldn’t load. Retry”)  
**Microcopy:** “Arming MonKeys…” · “Core online.”

---

### 2.2 Hub

**Purpose:** Home — continue, play, meta, social local.

```
┌─ Banano X nav ──────────────────────┐
│ BANANO TD                    [?][⚙] │
│ ★ Best score · Atlas S/M/L pips     │
│                                     │
│  [ PLAY ]     [ CONTINUE ]          │
│  [ SANDBOX ]  [ CODEX ]  [ BADGES ] │
│                                     │
│  Local leaderboard (top 5)          │
│  Daily challenge card (cosmetic)    │
└─────────────────────────────────────┘
```

| Control | Action |
|---------|--------|
| Play | → Mode select |
| Continue | Last config + if mid-run save exists → resume confirm |
| Sandbox | → Lab (`ranked=false`) |
| Codex / Badges | Meta screens |
| ? | Short “How to play” sheet |

**Microcopy:** “General of the Jungle Core.” · “Hard is the proud clear.”

---

### 2.3 Mode / Map / Diff select (Run Config wizard)

**Steps:** 1 Mode → 2 Map (if pickMap) → 3 Length → 4 Diff → 5 Mutators → Confirm  
Mobile: one step per screen. Desktop: single scrollable panel OK.

```
┌─ STEP 1 · MODE ─────────────────────┐
│ (○ Classic) (○ Tour) (○ Rush) (○ Party) │
│ tagline…                            │
│              [ Next ]               │
├─ STEP 2 · MAP ──────────────────────┤
│ [Canyon][Helix][Spiral][Fork]…      │
│ preview art + lesson one-liner      │
├─ STEP 3 · LENGTH ───────────────────┤
│ [ Short ] [ Medium ] [ Long ]       │
│ waves / content note                │
├─ STEP 4 · DIFFICULTY ───────────────┤
│ [ Normal ] [ Hard ★default ] [ Starship ] │
│ lives · start BAN · scale blurb     │
├─ STEP 5 · MUTATORS ─────────────────┤
│ [ ] Reverse   [ ] Blitz             │
│              [ DEPLOY ]             │
└─────────────────────────────────────┘
```

**Default proud:** Hard selected on first open after tutorial; Normal forced for first-run coach.  
**Deploy** → optional Loadout → In-run prep.

---

### 2.4 Loadout / Cosmetics

**Purpose:** Equip skins/titles only — **no DPS**.

```
┌─ LOADOUT ───────────────────────────┐
│ Tower skins   [Dart v] [preview]    │
│ Projectile    [default v]           │
│ Map skin      [default v]           │
│ Banner / Title[General v]           │
│ Locked items show unlock rule       │
│        [ Play without ] [ Confirm ] │
└─────────────────────────────────────┘
```

**States:** owned · equipped · locked (tap → “Unlock: Clear Short Canyon”)  
**Sandbox:** all cosmetics free preview, not saved as ranked unlocks.

---

### 2.5 Codex

**Purpose:** Enemy properties + tower verbs (knowledge, not power).

```
┌─ CODEX ─────────────────────────────┐
│ Tabs: Bananas | Bosses | Properties | Towers │
│ [icon] Name                         │
│ blurb · first appears · counters    │
│ Camo / Lead / Fortified chips       │
└─────────────────────────────────────┘
```

Undiscovered = silhouette “???” until first encounter (optional soft gate).

---

### 2.6 Badges

```
┌─ BADGES / ATLAS ────────────────────┐
│ Filter: All | Atlas | Challenge     │
│ Grid of badge tiles                 │
│ Locked: grey + requirement          │
│ Unlocked: color + date              │
│ Atlas: 6 maps × S/M/L check matrix  │
└─────────────────────────────────────┘
```

Tap badge → detail sheet (name, desc, reward cosmetic).

---

### 2.7 Settings

| Control | Options |
|---------|---------|
| Sound | On/Off |
| Quality | High / Med / Low / Auto |
| Auto-wave | On/Off (+ ethics note) |
| Reduce motion | On/Off |
| Color assist | On (icons always + patterns) |
| Nickname | for share / local LB |
| Export / Import progress | buttons |
| Reset progress | typed confirm |
| Credits / version | |

**No** pay walls, wallet, or “buy power.”

---

### 2.8 In-run HUD

```
Desktop:
┌ BAN 1200  ♥ 200  W12/75  STREAK x12  FEVER│EVENT  [1x|2x|3x] [❚❚] [☰] ┐
│ NEXT: 🟣camo 🟡lead  · Round +84 · Interest ~36                          │
│ ┌ canvas ──────────────────────────────────────────────┐ ┌ SHOP ───┐   │
│ │  path · towers · range                               │ │ cards   │   │
│ │                                                      │ │         │   │
│ │                              [abilities 1–4]         │ │ SELECT  │   │
│ └──────────────────────────────────────────────────────┘ └─────────┘   │
│ [▶ Wave] [Auto]                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Mobile:
┌ BAN ♥ W  streak fever  [⏩][❚❚][☰] ┐
│ NEXT icons                          │
│ [======== canvas ========]          │
│ [Storm][Cryo][Drop][Rage]           │
│ [▶ Wave] [Auto]  [Shop ▄]           │
└─────────────────────────────────────┘
Shop = bottom sheet; select = half-sheet + radial.
```

---

### 2.9 Shop / Upgrade panel

**Shop card states:** affordable · unaffordable (dim) · selected · locked (meta) · hover/focus  

```
┌ SHOP ─────────────┐
│ 🍌 Dart    175    │  ← cost gold if can buy
│ 💣 Bomb    550    │
│ …                 │
└───────────────────┘

┌ SELECTED: Dart MonKey 2-1 ─────────────┐
│ Target: [First ▾]  cycle               │
│ Path A Sharp     Path B Frenzy         │
│ [T1 140] [T2…]   [T1…] [T2…]           │
│ [T3 LOCK]        [T3 1100]             │
│ [T4]             [T4]                  │
│ Sell 70% · ████ BAN                    │
└────────────────────────────────────────┘
```

See §4 Dual-path UX.

---

### 2.10 Ability bar

| Slot | Ability | Key |
|------|---------|-----|
| 1 | Peel Storm | 1 |
| 2 | Cryo Core | 2 |
| 3 | Banana Drop | 3 |
| 4 | Jungle Rage | 4 |

**States:** ready (gold pulse once) · cooldown (radial fill) · disabled (prep? no) · active (rage/fever tint)  
**Hit target:** ≥48×48. Labels under icons on desktop; icon+tooltip on mobile long-press.

---

### 2.11 Pause

```
┌─ PAUSED ──────────────┐
│ [ Resume ]            │
│ [ Settings ]          │
│ [ Surrender ]         │
│  Run: Hard · Canyon · M │
└───────────────────────┘
```

Surrender → confirm → Defeat (ranked score still finalizes).

---

### 2.12 Victory

```
┌─ CORE SECURE ───────────────────────┐
│ Banano TD · Classic · Hard · Medium │
│ Canyon · score · waves · pops       │
│ badges unlocked this run            │
│ [ Share ] [ Freeplay ] [ Hub ]      │
└─────────────────────────────────────┘
```

---

### 2.13 Defeat

```
┌─ CORE CRACKED ──────────────────────┐
│ Wave reached · score · tip line     │
│ [ Share ] [ Retry ] [ Hub ]         │
└─────────────────────────────────────┘
```

**Microcopy:** see Content Bible; never shame-wallet.

---

### 2.14 Share card

**Fields (render image or text block):**

| Field | Example |
|-------|---------|
| Product | Banano TD |
| Mode / Length / Map / Diff | Classic · Medium · Canyon · Hard |
| Mutators | Reverse · Blitz |
| Result | Victory / Defeat · Wave 40/75 |
| Score · Pops · Streak · Jackpots | numbers |
| Perfect waves | n |
| Badge (if any) | name |
| Nickname | optional |
| URL | bananox.com/playTD.html |

**No** wallet address, seed, or real-BAN balance.

---

### 2.15 Sandbox / Lab

Banner always: **SANDBOX — badges off**  
Tools drawer: god cash, force wave, show ranges, show immunities, seed display, 5–10× speed, clear CDs (SYSTEMS-BIBLE §12).  
**Cannot** write ranked atlas badges.

---

## 3. Must-solve flows

### 3.1 Place tower precision (desktop + mobile)

| Step | Desktop | Mobile |
|------|---------|--------|
| 1 Select shop card | Click | Tap |
| 2 Aim | Cursor ghost on tile | **Drag** from shop or tap-to-arm then drag ghost |
| 3 Valid | Green footprint + range ring | Same; ghost snaps to cell center |
| 4 Invalid | Red flash + shake 1 frame | Same + haptic if available |
| 5 Commit | Click / release on valid | Release on valid |
| 6 Cancel | Esc / right-click / tap shop X | Tap X / drag off board |

**Rules**
- Ghost uses **cell center** snap (grid), not free pixel place.  
- Shop cards and canvas both ≥44px.  
- **Never** require double-tap only or long-press only to place.  
- Optional: second tap on same valid cell confirms on mobile if drag disabled in settings (both paths available).

**Blocked feedback**
- Path cell / occupied / out of bounds / blocked mask → red ghost  
- Toast once per reason per 3s: “Path — can’t build here.” · “Tile taken.” · “Not enough BAN.”

**Range preview**
- While placing: full range ring in `--ban-gold` 25% fill  
- While selected: same + aura ring cyan if village  

---

### 3.2 Dual-path upgrade UX

**Model:** free to **2-2**; only one path may buy **3+**.

```
Path A          Path B
● ● ○ ○         ● ● ○ ○     (filled = owned)
```

| Situation | UI |
|-----------|-----|
| Buy t1/t2 either path | Immediate if BAN OK |
| Both paths at 2; tap t3 on A | **Confirm sheet:** “Deep path: Sharp Path. You won’t unlock Frenzy 3–4 this tower. Continue?” [Cancel] [Go deep] |
| Path A already ≥3; path B t3 | T3/T4 on B **grey + lock icon**; tooltip “Other path is deep” |
| Mis-tap fear | Confirm **only** on first deep purchase (3+); not on t1/t2 |
| Undo | Sell tower only (70%); no free path refund |

**Softlock prevention:** never hide sell; never auto-buy t3; confirm copy is plain language.

**Radial upgrade (mobile primary)**  
Select tower → radial: segments A1–A4 left, B1–B4 right, center Sell, outer Target.  
Illegal deep segments = locked appearance; activating opens same confirm.

---

### 3.3 Targeting cycle discoverability

| Surface | Behavior |
|---------|----------|
| Selected panel | Chip `First ▾` always visible; tap cycles First→Last→Strong→Close→… |
| Keyboard | `T` cycle when tower selected |
| Radial | “Target” wedge opens 4 large chips |
| First-run coach | “Retarget: Strong for big fruit.” on first barge |
| Tower default | Sniper/Battery Strong; others First (content) |

**Visual on board:** small mode glyph under selected tower pedestal (F/L/S/C).

---

### 3.4 Wave info — next wave preview

**HUD strip `NEXT:`** shows up to 4 **property / unit icons** for upcoming wave (from wave def scan):

| Icon | Meaning |
|------|---------|
| Layer color pip | Dominant layer |
| 👁 purple | Camo present |
| ⚙ grey | Lead present |
| 🛡 | Fortified / ceramic |
| ♻ | Regen |
| 🚢 | Boss insert |

**Tap NEXT** → sheet: “Wave 13 — Camo Memes ×8, Ripe ×12” (text list).  
Between waves only (or always dimmed mid-wave for current remaining).

---

### 3.5 Speed controls without misclicks

```
[ 1x ] [ 2x ] [ 3x ]   separate buttons, not a single tiny toggle
```

| Rule | Spec |
|------|------|
| Size | Each ≥44×44; active filled gold |
| Ranked max | 3x |
| Sandbox | up to 10x in Lab tools, separate UI |
| Pause | Own button; never share hit box with 3x |
| Keyboard | `+`/`-` or `F` cycle speed; `Space` pause/wave context-sensitive with care |
| Misclick guard | 100ms debounce on speed change; no toggle on scroll |

**Space:** If prep → send wave; if combat → pause (document in settings). Or: Space = pause always; Enter = send wave. **Lock: Enter/▶ send · Space pause ·** avoid dual-use Space.

---

### 3.6 Leak direction / lives drama without clutter

| Channel | Spec |
|---------|------|
| Path chevrons | Subtle animated arrows toward Core (code) always low alpha |
| Leak | Magenta flash on Core + float `−N` lives; brief screen edge vignette 200ms |
| Lives HUD | Heart-banana icon; pulses red when &lt;20% or on leak |
| Streak | Resets on leak; toast only if streak was ≥10 |
| Not | Full-screen block, long modal every leak (only first-run coach once) |

---

### 3.7 First-run coach marks

**Trigger:** first Classic Short Canyon Normal only (`tutorialComplete` in save).

| # | When | Anchor | Copy | Dismiss |
|---|------|--------|------|---------|
| 1 | Prep | Shop Dart | “Drag a Dart MonKey onto the grass.” | Place 1 tower |
| 2 | After place | ▶ Wave | “Start the wave when ready.” | Send wave |
| 3 | After pops | BAN HUD | “BAN pays for MonKeys. Live pops pay you.” | Tap or 4s |
| 4 | First upgrade afford | Path panel | “Two paths. Only one goes deep (3–4).” | Buy any upgrade or skip |
| 5 | First camo wave preview | NEXT | “Purple eye = camo. Snipers see them.” | 5s / tap |
| 6 | First barge | Boss + target | “Big fruit → set Strong.” | Change target or 6s |

**Rules:** never block canvas with opaque wall; spotlight hole + one sentence; Skip all in Settings; no coach in Sandbox unless toggled.

---

## 4. Component state matrix (core)

| Component | States |
|-----------|--------|
| Shop card | default, hover/focus, selected, disabled (broke), locked |
| Path tier btn | available, afford, unafford, owned, locked-deep, confirm-pending |
| Ability | ready, cd, pressed, disabled |
| Speed btn | off, on |
| Wave btn | idle prep, combat (disabled or “in progress”), auto-on |
| Toast | info, success, danger · max 1–2 stacked |
| Modal | open, confirm-danger (surrender/reset) |

---

## 5. Accessibility

| Requirement | Spec |
|-------------|------|
| Focus | All controls keyboard reachable; focus ring gold 2px |
| Screen reader | HUD live region polite for wave clear; assertive for leak/defeat |
| Color | Properties use **icon + color**; color-assist mode forces patterns |
| Reduce motion | Disable shake, fever full-screen pulse, coach parallax |
| Contrast | Text on panels ≥ WCAG AA vs `#152018` |
| Touch | 44px min; no hover-only actions |
| Captions | Ability names always available via aria-label |

---

## 6. Microcopy bank (UI chrome)

| Context | Line |
|---------|------|
| Place invalid path | “That’s the trail — build on the grass.” |
| Broke | “Need more BAN.” |
| Deep path confirm | “Go deep on {PathName}? The other path stops at 2.” |
| Auto-wave on | “Auto-wave on — pauses if you’re stuck broke.” |
| Leak (first) | “Lives = Vault Integrity. Plug the hole.” |
| Victory | “Core secure. Memes may dream another day.” |
| Defeat | “Core cracked. Retry when the peel calls.” |
| Export OK | “Progress copied. Guard it like potassium.” |
| Sandbox | “Lab toys only — no ranked badges.” |
| Share title | “Banano TD — {Result}” |

Ability button labels: **Storm · Cryo · Drop · Rage** (short); full names in tooltip (Peel Storm, Cryo Core, Banana Drop, Jungle Rage).

---

## 7. Input map (summary)

| Action | Desktop | Mobile |
|--------|---------|--------|
| Place | Click shop → click tile | Drag shop → tile |
| Select tower | Click | Tap |
| Upgrade | Panel / keys | Radial + panel |
| Target | Panel / `T` | Radial chips |
| Ability | Click / 1–4 | Tap buttons |
| Send wave | ▶ / Enter | ▶ |
| Pause | Button / Space | Button |
| Speed | 1x 2x 3x buttons | Same, spaced |
| Cancel place | Esc | X / drag off |

---

## 8. Safe areas & layout

- Respect Banano X nav height (~64px)  
- Mobile: ability bar above home indicator; shop sheet `padding-bottom: env(safe-area-inset-bottom)`  
- Canvas scales letterbox; HUD never covers Core without opacity  

---

## 9. Analytics hooks (optional, privacy-safe)

Events: `tutor_step_complete`, `place_fail_reason`, `deep_path_confirm_accept|cancel`, `first_leak`, `share_click` — no PII.

---

## 10. Acceptance checklist

- [ ] Place works drag + click; invalid always red + reason  
- [ ] Deep path confirm once; cannot buy illegal 3-3  
- [ ] Target cycle visible without reading manual  
- [ ] NEXT wave property icons  
- [ ] Speed 1/2/3 separate large controls  
- [ ] Leak readable; coach once; skippable  
- [ ] Share fields complete; name Banano TD  
- [ ] Sandbox banner + no ranked badges  
- [ ] a11y focus + 44px taps  

---

**NEXT: PROMPT 8**
