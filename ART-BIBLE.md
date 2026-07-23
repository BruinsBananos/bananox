# Banano TD — Art Bible + Imagine Prompts (Prompt 5)

**Status:** PRODUCTION ART LOCK  
**Depends on:** `DESIGN-LOCK.md`, `CONTENT-BIBLE.md`, `SYSTEMS-BIBLE.md`  
**Product name in art/UI chrome:** Banano TD (no baked text in sprites)  
**Engine:** Pixi atlases · code HUD/numbers/rings · Imagine for stills + modular tiles  

---

# Part A — Art Bible

## A0. North star

> **Premium banana warfare — readable board game clarity + jungle mythic juice.**

Every asset must answer: *Can a stranger parse the board in half a second?*  
If it only looks “cool” but fails 50% zoom readability, it fails.

## A1. Style pillars

| Pillar | Spec |
|--------|------|
| **Medium** | Stylized illustration / premium cartoon (not photoreal, not chibi mush) |
| **Silhouette** | Strong outer shape; towers readable as roles at **64px** |
| **Contrast factions** | Towers (warm yellow/leaf + dark outlines) vs bananas (layer colors) vs Core (sacred gold-cyan) |
| **Juice** | Mythic jungle glow, potassium sparkles, clean VFX—never mud |
| **Clarity first** | Board language beats detail density |

## A2. Explicit NOT list

- Muddy brown spam / desaturated dirt soup  
- Unreadable yellow-on-yellow (tower on path, gold on gold UI)  
- Text, numbers, logos, or BAN amounts **baked into sprites**  
- Photoreal bananas or uncanny ape faces  
- Bloons/Nintendo-lookalike trademarks  
- Busy noise that kills silhouette at 64px  
- Drop shadows so soft the sprite melts into grass  

## A3. Global palette (canonical hex)

| Token | Hex | Use |
|-------|-----|-----|
| **grass** | `#2F6B45` | Placeable jungle grass (primary) |
| **grass_light** | `#3D8B5A` | Highlight / hover placeable |
| **grass_deep** | `#1B3D2F` | Shadow grass / panel jungle |
| **path** | `#E8D4A8` | Walkable trail (light, high contrast vs grass) |
| **path_edge** | `#C4A574` | Path rim / groove |
| **blocked** | `#12141A` | Void / rock / unplaceable (dark) |
| **water_void** | `#0B1C24` | Water / abyss / off-map void |
| **ui_panel** | `#152018` | HUD panels (deep jungle glass) |
| **ui_stroke** | `#3D8B5A` | Panel borders |
| **ui_cream** | `#FFF6D1` | Soft fill / secondary text (code) |
| **ban_gold** | `#FBDD11` | BAN currency, primary accent, fever-adjacent gold |
| **ban_gold_ui** | `#F5D041` | Softer UI gold |
| **alert** | `#E83E8C` | Leak, danger, lives hit (alert magenta-red family) |
| **alert_red** | `#FF3B4A` | Hard fail / strip lives pop |
| **camo_purple** | `#A78BFA` | Camo property, shimmer |
| **lead_grey** | `#94A3B8` | Lead metal rim / armor |
| **fever_pink** | `#F472B6` | Fever rim / streak heat (not alert leak) |
| **cryo_cyan** | `#3DE0FF` | Chill, Cryo, info |
| **bomb_orange** | `#FF7A18` | Blast / military heat |
| **core_glow** | `#FFE566` | Core sacred light |
| **outline** | `#0A0C0F` | Universal dark outline on sprites |

**50% zoom board rule**

| Surface | Must read as |
|---------|----------------|
| Path | Light warm sand (`path`) |
| Placeable | Mid green (`grass`) |
| Blocked / void | Near-black (`blocked` / `water_void`) |
| Towers | Dark outline + role accent, never same value as path |
| Bananas | Layer fill brighter than path OR strongly outlined |

## A4. Board language

| Element | Art treatment |
|---------|----------------|
| Path | Smooth dirt ribbon, subtle stone grit, **lighter** than grass |
| Grass | Soft stipple or leaf noise; still flat enough to tile |
| Blocked | Rock, cliff, deep water—**darker**, no placeable confusion |
| Spawn | Glowing banana crate portal (cyan-gold) |
| Core / Vault | Monumental idol at path end (see B4) |
| Chevrons | Code-drawn path arrows toward Core (not baked in map art) |

## A5. Tower art rules

| Rule | Spec |
|------|------|
| Base | One **MonKey / structure** base per family |
| Size master | Author at **256×256** (or 512), display down to **64** |
| Outline | 3–6px equiv dark outline at master res |
| Key BG | Flat `#00FF00` or `#FF00FF` only—no gradients on BG |
| Role color | Accent prop matches role (dart yellow, bomb orange, chill cyan, etc.) |
| Path 1–2 | Gear / prop add; silhouette **mostly same** |
| Path 3–4 | **Silhouette upgrade** required (hat, weapon scale, aura hardware, dual arms, rail dish) |
| No text | Names only in UI code |

**64px role checklist (must pass blind test)**

| id | Must read as |
|----|----------------|
| dart | Small thrower + dart/javelin |
| boomer | Wide rang / disc weapon |
| sniper | Long barrel / scope |
| bomb | Round bomb / launcher |
| ice | Frost aura disc / ice |
| farm | Trees / grove (no combat pose) |
| village | Hut / building |
| super | Hero cape / energy stance |
| battery | Dish / rail / orbital gear |
| alchemist | Flask / coat vial |

## A6. Enemy art rules

| Layer | Fill cue | Packed readability |
|-------|----------|-------------------|
| Unripe | Leaf green `#86EFAC` | Smallest |
| Ripe | Yellow `#FACC15` | Default |
| Golden | Amber `#F59E0B` | Slightly larger |
| Meme | Purple `#C084FC` | Fast pose lean |
| Cosmic | Pink-magenta `#F472B6` | Star flecks (sparse) |
| Zebra | White + black stripes | High contrast stripes |
| JACKPOT | Hot gold + sparkle rim | Largest standard |
| Ceramic | Clay shell over banana | Thick crust ring |
| BAN-Barge | Monumental floating barge | 3–4× banana height |
| Freighter / Titan | Scale ladder up | HP bar is code |

Properties: camo shimmer + purple tint; lead metal rim grey—**overlays can be code** if base art stays clean.

## A7. Code-first vs Imagine

| Imagine | Code |
|---------|------|
| Tower bases + path tier stills | Projectiles, trails, pierce lines |
| Core idol still | Range rings, damage floats, BAN numbers |
| Enemy stills / boss stills | Camo dash, freeze tint, fever rim |
| Map modular tiles / key art mood | Path chevrons, grid hover |
| Marketing / share frames | HUD text, ability CD sweeps |
| Empty UI panel chrome | All labels, costs, timers |

## A8. File / atlas conventions

```
assets/td/
  towers/{id}/base.png          # 256 or 512, key BG
  towers/{id}/a3.png a4.png b3.png b4.png   # silhouette upgrades
  towers/{id}/a1.png …          # optional light variants
  enemies/layers/{id}.png
  enemies/bosses/{id}.png
  core/core_idol.png
  maps/tiles/{grass,path,blocked,water}.png
  maps/keyart/{mapId}.jpg       # mood only
  ui/panels/{shop,upgrade,ability}.png
  marketing/key_16x9.png
```

Strip key color in pipeline → premultiplied transparent PNG.

---

# Part B — Imagine prompts

*Each prompt: 2–5 sentences, positive phrasing. Generate with listed `aspect_ratio`. Do not bake text/numbers/UI labels into the image.*

---

### B1. Marketing key art

| | |
|--|--|
| **aspect_ratio** | `16:9` |
| **purpose** | Site OG image, arcade trailer still, share default |
| **file** | `marketing/key_16x9.png` |

**Prompt**  
A cinematic wide illustration of heroic cartoon MonKeys defending a glowing golden Jungle Core vault at the end of a winding dirt path through lush tropical jungle. Waves of colorful layered banana threats stream along the path while MonKeys throw banana darts, boomerangs, and frost auras under dramatic potassium-gold light. Stylized premium game key art, strong silhouettes, high contrast, readable factions, vibrant Banano yellow accents, mythic jungle atmosphere, polished indie AAA presentation.

**Success checklist**
- [ ] 16:9 composition with clear focal Core + defenders  
- [ ] MonKeys vs bananas instantly readable  
- [ ] No mud, no baked text/logos  
- [ ] Banano yellow + jungle green dominant, not brown soup  
- [ ] Works as small OG thumbnail (~600px wide still reads)

---

### B2. Board style frame (Canyon sample)

| | |
|--|--|
| **aspect_ratio** | `16:9` |
| **purpose** | Style guide for path/grass/blocked language; art ref for tiles |
| **file** | `maps/style/canyon_board_language.png` |

**Prompt**  
Top-down tower defense map sample of a jungle canyon trail: a light warm sand-colored winding path through mid green placeable grass, with dark rock cliffs and deep shadowed voids blocking placement. Soft stylized illustration, board-game clarity, high contrast between path, grass, and blocked terrain, subtle palm and crystal decor that never confuses the path. Premium readable TD board language, even lighting, clean edges, potassium-gold glow only at a small spawn crate and distant Core shrine.

**Success checklist**
- [ ] Path clearly lightest playable ribbon  
- [ ] Grass mid-green placeable zones obvious  
- [ ] Blocked/void darkest regions  
- [ ] Readable at 50% zoom / small preview  
- [ ] No UI chrome, no text, no yellow-on-yellow towers required (empty board OK)

---

### B3. Tower lineup product shot

| | |
|--|--|
| **aspect_ratio** | `16:9` |
| **purpose** | Roster marketing + art consistency lineup |
| **file** | `towers/_lineup_16x9.png` |

**Prompt**  
A clean product lineup of ten stylized cartoon MonKey tower characters and structures in a single row on a flat pure chroma green background: dart thrower, boomerang fighter, sniper, bomber, frost mage, banana farm grove, jungle village hut, super hero MonKey, starship rail battery dish, and alchemist with flask. Each figure has a strong unique silhouette, dark outlines, Banano yellow and jungle accents, game-sprite product presentation, even studio lighting, isolated subjects with generous spacing.

**Success checklist**
- [ ] Flat key BG only (`#00FF00` preferred)  
- [ ] 9–10 distinct silhouettes  
- [ ] No text, no pedestals with labels  
- [ ] Consistent style/scale across row  
- [ ] Croppable into individual towers (spacing)

*Production note: prefer generating **individual bases** (Part C) for pipeline; B3 is hero lineup / marketing. If lineup fails separation, generate per-tower bases instead.*

---

### B4. Hero / Core idol

| | |
|--|--|
| **aspect_ratio** | `1:1` |
| **purpose** | End-of-path Core players defend; vault identity |
| **file** | `core/core_idol.png` |

**Prompt**  
A sacred Jungle Core idol on a flat pure chroma green background: a monumental crystalline banana-vault shrine with gold and cyan glow, carved monkey reliefs, and a bright potassium heart of light. Stylized game prop, strong central silhouette, dark outline, premium cartoon illustration, readable at small size, isolated single object, no ground plane scene, no text.

**Success checklist**
- [ ] 1:1, isolated, key BG  
- [ ] Reads as “defend this” monument  
- [ ] Gold/cyan sacred glow, not muddy  
- [ ] No text; clean silhouette at 64–128px  
- [ ] Distinct from farm/village buildings

---

### B5. Enemy scale sheet

| | |
|--|--|
| **aspect_ratio** | `16:9` |
| **purpose** | Layer scale bible + boss monument reference |
| **file** | `enemies/_scale_sheet.png` |

**Prompt**  
A horizontal scale sheet on a flat pure chroma green background showing stylized cartoon banana enemies in ascending size and color: small green unripe, yellow ripe, amber golden, purple meme, pink cosmic, striped zebra, sparkling jackpot gold, plus one monumental BAN-barge boss banana freighter. Clean dark outlines, high contrast fills, game sprite product style, even lighting, isolated subjects in a single neat row, no text labels, no environment.

**Success checklist**
- [ ] Size ladder obvious left→right  
- [ ] Layer colors distinct when packed (no yellow mush)  
- [ ] Boss clearly monumental  
- [ ] Flat key BG, no text  
- [ ] Stripes/jackpot readable at small scale

---

### B6. UI panels empty (no text)

| | |
|--|--|
| **aspect_ratio** | `16:9` |
| **purpose** | 9-slice-friendly chrome for shop, upgrade, abilities |
| **file** | `ui/panels/empty_chrome_16x9.png` |

**Prompt**  
A UI kit layout on a flat dark void background showing three empty game interface frames in Banano jungle style: a tall shop card frame, a wide upgrade card frame, and a long horizontal ability bar frame with four circular ability sockets. Deep green glass panels, gold rim accents, soft rounded corners, 9-slice friendly edges, no text, no numbers, no icons inside, premium mobile-desktop HUD chrome, clean empty centers for code to fill.

**Success checklist**
- [ ] Zero text/numbers/icons in content areas  
- [ ] Shop / upgrade / ability bar all present  
- [ ] Corners/edges usable for 9-slice  
- [ ] Gold + deep jungle only; high contrast empty centers  
- [ ] Works in light and dark site themes (dark panel base)

---

### B7. Per-map key arts × 6 (mood only)

| | |
|--|--|
| **aspect_ratio** | `16:9` each |
| **purpose** | Hub/map select mood; **not** playable tile maps |
| **files** | `maps/keyart/{canyon,helix,spiral,fork,runway,gauntlet}.jpg` |

#### B7.1 `canyon` — Potassium Canyon  
**Prompt**  
Wide mood painting of a sunlit jungle canyon with a pale winding trail and a distant glowing vault, inviting and readable, Banano yellow light on leaf canopy, premium stylized illustration. Tourist-friendly adventure energy, clear depth, no UI, no text.  
**Success:** Warm readable default map vibe; path motif visible; not dark soup.

#### B7.2 `helix` — Double Helix  
**Prompt**  
Moody jungle night with twin curving bioluminescent trails forming a double-helix suggestion through glowing potassium vines, stylized top-down-ish scenic illustration. Mysterious crossfire beauty, cyan and gold sparks, no text.  
**Success:** Dual-curve motif; magical; still jungle not sci-fi lab only.

#### B7.3 `spiral` — Peel Spiral  
**Prompt**  
Aerial scenic view of a spiral dirt path curling through lush green terraces like a peeled banana motif, soft golden hour light, stylized premium illustration. Calm eco-friendly beauty, clear spiral read, no text.  
**Success:** Spiral readable at thumbnail; peaceful vs Gauntlet.

#### B7.4 `fork` — Twin Fork Trail  
**Prompt**  
Jungle crossroads mood piece where a warm trail appears to split around ancient stone markers then rejoin toward a glowing core shrine, stylized illustration. Decision and travel energy, high contrast path, no text.  
**Success:** Fork/choice motif; readable paths.

#### B7.5 `runway` — Starship Runway  
**Prompt**  
Jungle airstrip fantasy: long straight glowing chevron lights and a starship silhouette framed by palms, yellow guidance lines, stylized cinematic illustration. Sci-fi myth meets Banano jungle, no text, no readable fake UI.  
**Success:** Long straight runway read; yellow chevrons; jungle still present.

#### B7.6 `gauntlet` — Gauntlet Gorge  
**Prompt**  
Dark narrow gorge with a tight zig-zag pale path under stormy purple-green sky, tense premium illustration, cliffs crowding the trail. High pressure expert energy, strong contrast path vs dark rock, no text.  
**Success:** Claustrophobic; zig-zag implied; darkest of the six.

**Shared B7 checklist**
- [ ] 16:9 mood, not a tileable playable map  
- [ ] Distinct identity from other five at thumbnail  
- [ ] No baked map name text  
- [ ] Palette aligned to global tokens  
- [ ] Usable as hub card background under code title

---

# Part C — Consistency protocol

## C1. Towers — base → path tiers

```
1. image_gen  → towers/{id}/base.png     (1:1, key BG, silhouette locked)
2. QC silhouette at 64px
3. image_edit → a1, a2 (prop add, same body)
4. image_edit → a3, a4 (MUST change silhouette)
5. image_edit → b1–b4 from same base (never new gen from blank)
6. Strip key → atlas
```

| Rule | |
|------|--|
| One base per family | Never regenerate base mid-production |
| Edit prompt style | Describe **only what changes**; keep pose, face, outline weight |
| Path A vs B | A = weapon/pierce fantasy; B = speed/multi or eco fantasy per Content Bible |
| Fail if | Tier 4 still looks like base at 64px |

**Per-tower base gen prompt template** (fill `{SUBJECT}`):  
> Stylized cartoon MonKey tower character, {SUBJECT}, full body, facing three-quarter toward camera, strong dark outline, Banano yellow and jungle green accents, isolated on flat pure chroma green background, game sprite product art, even lighting, clean silhouette, no text, no ground shadow scene.

| id | {SUBJECT} |
|----|-----------|
| dart | small agile dart-thrower holding a banana dart |
| boomer | athletic fighter holding a wide K-shaped banana boomerang |
| sniper | tall marksman with long banana rail rifle and leaf ghillie |
| bomb | stocky grenadier with round banana bomb |
| ice | frost mage with icy aura disc and chill crystals |
| farm | jungle grove structure with banana trees (building, not ape required) |
| village | wooden jungle hut support building with drum |
| super | heroic caped super MonKey in power stance |
| battery | orbital rail battery dish structure with tech banana motifs |
| alchemist | clever MonKey with glowing flask of peel serum |

**Path tier edit template:**  
> Same character and pose as the reference, keep identical face and outline style, upgrade to {TIER_FANTASY}: larger silhouette hardware, richer {PATH_COLOR} accents, still isolated on the same flat chroma green background, no text.

## C2. Enemies — family edit-chain

```
1. image_gen → ripe (canonical banana body)
2. image_edit → green, gold, purple, star, zebra, jackpot (color/size/stripe/sparkle only)
3. image_edit → ceramic (add clay shell)
4. image_gen or edit-upscale → BAN-Barge (monumental; may start from jackpot body massively scaled)
5. freighter/titan edit-chain from barge
```

Camo/lead **overlays preferred in code** for clarity variants.

## C3. Map tiles — modular

| Tile | Spec | Seamless |
|------|------|----------|
| grass | `#2F6B45` family noise | Yes 2×2 test |
| path | `#E8D4A8` grit | Edge-aware or orthog strip set |
| blocked | dark rock `#12141A` | Yes |
| water_void | `#0B1C24` | Yes |

- Generate **tile** with tileable instruction; verify 2×2 composite  
- Key arts (B7) never used as playable ground  
- Path vs grass value contrast tested at 50% zoom before ship  

## C4. UI chrome

- B6 panels → slice; **all text in code**  
- Ability icons: optional separate 128 icon set later; sockets empty in frame art  

## C5. QC gate (any asset)

| Gate | Fail if |
|------|---------|
| Key BG | Not flat single chroma |
| Text | Any letters/numbers in sprite |
| 64px tower | Role ambiguous  
| 50% board | Path/grass/blocked confusable |
| Yellow-on-yellow | Tower value ≈ path value |
| Consistency | New gen instead of edit-chain for same family |

## C6. Generation order (recommended)

1. B4 Core idol  
2. Per-tower bases (C1) → path 3–4 edits  
3. Enemy ripe → chain (C2) → B5 scale sheet optional check  
4. Modular tiles (C3) + B2 board language ref  
5. B6 UI chrome  
6. B7 map moods  
7. B1 marketing last (can composite heroes once bases exist via edit)

---

## Doc map

| Doc | Role |
|------|------|
| DESIGN-LOCK | Product |
| CONTENT-BIBLE | What exists |
| SYSTEMS-BIBLE | How it plays |
| TECH-ARCHITECTURE | How it builds |
| **ART-BIBLE** | How it looks + Imagine prompts |

| Date | Note |
|------|------|
| 2026-07-22 | Prompt 5 Art Bible + Imagine prompts |

---

**NEXT: paste PROMPT 6A**
