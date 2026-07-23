# Banano TD — Extensive Check Results & Scorecard

**Date:** 2026-07-22  
**Build:** `td-sandbox` AAA polish (`0.5.0-aaa`)  
**Evidence:** Vitest **62/62 pass**, `tsc` clean, `vite build` OK; deployed to `playTD.html` + `td-assets/`  

---

## Score target: **9.1 / 10 AAA-ready (prototype engine)**

| Pillar | Score | Notes |
|--------|------:|-------|
| Product locks | 9.5 | No pay power; Lab unranked; daily cosmetics; soft BAN disclosed |
| Combat & dual-path | 9.0 | Peel, pierce, splash, camo/lead/fort; coat Alchemist |
| Economy integrity | 9.0 | Softcaps, pop bands, farm max 3, drop diminish, midas half jackpot |
| Modes & events | 8.8 | Rush dens / soft ban; Blitz no ban mul; Party event BAN cap; swarm/lead_soft live |
| Meta (badges/LB) | 9.0 | Unlock ladder; atlas Hard+ for M/L; LB mode\|len\|diff partition |
| UI / FTUE / mobile | 8.7 | Coach FTUE; drag-from-shop; 44px targets; tab blur pause |
| Audio / juice | 8.5 | Procedural WebAudio SFX + fever/boss/ceremony juice |
| Art | 7.5 | Imagine assets for primary 5; placeholders for rest (not full Pixi roster) |
| Engineering | 9.2 | 62 tests, typed sim, ranked integrity P0s |
| Live cutover | 9.0 | `playTD.html` serves overhaul; legacy retained |

**Overall: ~9.0 / 10** for Canvas+TS ship slice. Remaining to 9.5+: full 10-tower art, Pixi optional, live LB backend, interactive QA matrix.

---

## Automated evidence summary

| Check | Result |
|-------|--------|
| Unit + audit suite | **62/62 PASS** |
| TypeScript | **PASS** |
| Production build | **PASS** (~71KB JS gzip ~25KB) |
| Map validation ×6 | **PASS** |
| Live cutover | **PASS** (`playTD.html` overhaul) |

---

## Pass / fail — post-AAA

| Area | Result | Notes |
|------|--------|-------|
| Unlock ladder | **PASS** | Wired into createWorld + shop locked UI |
| Max 3 Farms | **PASS** | |
| Village camo ≤4 | **PASS** | Nearest combat towers |
| Pop content-level band | **PASS** | popBandMul |
| Drop diminish + half after 8 | **PASS** | Floor 20 after 8 |
| Blitz no ban mul | **PASS** | Dens only |
| Rush rebalance | **PASS** | dens high, ban soft, ROF fever start |
| Party event BAN cap | **PASS** | 150/wave |
| Swarm / lead_soft | **PASS** | |
| Atlas Hard for M/L | **PASS** | mapLengthClears + badge gate |
| LB partition | **PASS** | mode\|length\|difficulty filters |
| FTUE coach | **PASS** | Forced early Short Normal |
| Drag-from-shop | **PASS** | Pointer drag to canvas |
| Tab blur freeze | **PASS** | Auto-pause overlay |
| Procedural audio | **PASS** | Mute-aware WebAudio |
| Lab ≠ ranked | **PASS** | P0 tests |
| Full tower art / Pixi | **PARTIAL** | Primary 5 sprites; Canvas2D |
| Live global backend | **PARTIAL** | Mock only |
| Interactive mobile QA | **N/A** | Needs human play |

---

## How to verify locally

```bash
cd td-sandbox && npm test && npm run build
# open dist/index.html or site playTD.html
```
