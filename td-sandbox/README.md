# Banano TD — Phase 3 Content Expansion

Full content layer on the modular slice: **6 maps**, **4 modes**, **10 towers**, mutators, events, badges, codex, cosmetics stubs.

## Run

```bash
cd td-sandbox
npm install
npm run dev
npm test
npm run build
```

## Content matrix

| Area | Contents |
|------|----------|
| **Maps** | Canyon, Helix, Spiral, Fork, Runway, Gauntlet (+ Reverse) |
| **Modes** | Classic, World Tour, Fever Rush, Party |
| **Length** | Short / Medium / Long (mode wave tables + contentSpan) |
| **Diff** | Normal, Hard, Starship |
| **Mutators** | Reverse, Blitz |
| **Towers** | Dart, Boomer, Bomb, Sniper, Chill, Farm, Village, Super, Battery, Alchemist |
| **Abilities** | Storm, Cryo, Drop, Rage |
| **Bosses** | Ceramic, BAN-Barge, Freighter, Titan |
| **Events** | 12 catalog entries (Party-heavy) |
| **Meta** | Badges matrix, Codex, Cosmetics stubs (no power) |
| **Save** | `bananox_td_slice_v2` + live `bananox_td_v1` import |

## Docs

- `QA-MAPS.md` — per-map softlock / cheese checklist  
- `PHASE2-NOTES.md` — prior slice notes  
- Parent: `SYSTEMS-BIBLE.md`, `CONTENT-BIBLE.md`, `DESIGN-LOCK.md`

## Acceptance (play)

1. New player: Short Normal Canyon + coach clear  
2. Hard Medium buildcraft on any map  
3. Tour run without stuck towers  
4. Badge unlock + cosmetics unlock message  
5. Codex readable offline  

## Phase 4 (social + polish)

| Feature | Notes |
|---------|--------|
| Global LB contract | `src/net/types.ts` + mock client |
| Daily challenge | Seeded map/mode; **cosmetic ₡ only** |
| Juice | Boss banner, fever/rage rim, 4xx ceremony, shake |
| Trailer | `TRAILER.md` shot list + ffmpeg notes |
| Site | Arcade + index cards + BAN ≠ chain BAN |
| Ship | `SHIP-CHECKLIST.md` · `ROADMAP-POST-1.0.md` |

```bash
npm run dev   # hub → Daily / LB / Play
npm test
npm run build
```
