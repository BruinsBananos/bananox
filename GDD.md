# Banano Tower Defense — Game Design Document

**Working title:** Don’t Let Your Memes Be Dreams: Banano TD  
**Genre:** 2D Bloons-style tower defense  
**Platform:** Browser (static HTML5 Canvas + JS)  
**Tone:** Wholesome, meme-y, colorful, potassium-rich

---

## 1. High Concept

Players command heroic **MonKeys** defending the **Banano Republic Jungle**. Waves of cartoon **Threat balloons** (rethemed bloons) float along a winding jungle path toward the **Mega Potassium Core**. Pop every layer before they drain the Core’s lives. Earn **BAN** to place and upgrade towers. Survive all waves to keep the memes alive.

**Slogan integration:** UI copy, win/lose lines, and airdrop toasts use Banano culture (“Don’t let your memes be dreams,” feeless speed, rains, potassium).

---

## 2. Core Loop

1. Place MonKeys on buildable jungle tiles (not on path).  
2. Start wave → Threats spawn and follow the path.  
3. Towers shoot → layers **pop** (Bloons-style child spawns).  
4. Earn BAN per layer popped + round clear bonus.  
5. Upgrade / sell / place more towers.  
6. Threats that reach the Core cost lives.  
7. Clear all waves → win. Lives hit 0 → lose.

**Pace:** Fast rounds, speed toggle (1x / 2x / 3x), satisfying pops and particles.

---

## 3. Map

**Map name:** Potassium Canyon Trail  

- Single winding path through cartoon jungle.  
- Buildable grass tiles beside the path.  
- Visuals: jungle greens/yellows, banana trees, path dirt with “blockchain vine” glow accents, floating potassium orbs (decorative particles).  
- Core at path end; spawn portal at path start.

---

## 4. Economy

| Source | Amount (baseline) |
|--------|-------------------|
| Pop R / B / G / Y / P layers | 1 / 2 / 3 / 4 / 5 BAN |
| Specials / bosses | Scaled higher |
| Round clear | 50 + wave × 5 |
| Airdrop event (random mid-wave, rare) | 25–80 BAN |
| Starting BAN | 650 |
| Sell refund | ~70% of spent |

Lives start at **200** (Bloons-like large pool; ceramics/bosses hurt more).

---

## 5. Towers (MonKeys)

| Tower | Role | Cost | Notes |
|-------|------|------|-------|
| Banana Dart MonKey | Primary single-target | 200 | Fast banana darts |
| Boomerang K⁺ MonKey | Multi-hit return arc | 325 | Good cleanup |
| Sniper MonKey | Long range, high pierce dmg | 350 | Prioritizes strong |
| Bomb MonKey | AOE peel explosions | 550 | Splash layers |
| Chill K⁺ MonKey | Slow / freeze | 400 | Utility |
| Village Buff MonKey | Aura + airdrop passive | 1000 | Buffs nearby |
| Super MonKey | Late power | 2500 | Multi-shot meme flair |

### Upgrades
Each tower has **3 sequential tiers** (Tier 1 → 2 → 3). Costs scale ~1× / 1.5× / 2.5× base upgrade price. Visual flair increases each tier (size, projectiles, particles).

Towers can be **selected**, **upgraded**, and **sold**. Placement uses mouse/touch; invalid tiles flash red.

---

## 6. Threats (Layered “Bloons”)

### Standard layers (pop chain)
- **FUD Red** → gone  
- **Scam Blue** → Red  
- **FOMO Green** → Blue  
- **Hype Yellow** → Green  
- **Meme Pink** → Yellow  

### Specials
- **Camo FUD** — Only Sniper / Super / high-tier towers with camo detect  
- **Regrow Meme** — Slowly regrows one layer if not fully popped  
- **Lead Scam** — Immune to darts/boomerang until Bomb/Sniper high tier  
- **Ceramic Rug** — High HP shell then pinks  
- **Mega Dump Whale** (boss) — Huge HP, spawns children on death  

Waves **1–40**, density/speed/specials escalate. Boss waves every 10.

---

## 7. Combat Rules

- Projectiles deal **pop power** (layers removed) and optional **pierce**.  
- Splash applies pop power in radius.  
- Slow multiplies path speed for duration.  
- Camo: tower needs `camo: true` to target.  
- Lead: needs `lead: true` to damage.  
- Children spawn with slight path offset and inherit progress.

---

## 8. UI

- Top bar: BAN · Lives/Potassium · Wave · Speed  
- Bottom/side shop: tower cards with cost + portrait icon  
- Selected tower panel: upgrades, sell, range ring on map  
- Overlays: start, pause, win, lose (pun-heavy copy)  
- Floating BAN numbers, POP text, confetti on big clears  

---

## 9. Audio

- Procedural Web Audio: pop, place, upgrade, wave start, leak, win/lose  
- Optional light jungle-chiptune loop via oscillators (no external music file required)

---

## 10. Asset Strategy

**Primary:** Procedural canvas cartoon rendering (MonKeys, balloons, path, particles) for a cohesive Bloons-like look with zero broken asset links on GitHub Pages.

**Inspiration sources (style reference, free ecosystems):** Kenney.nl, OpenGameArt, itch.io free cartoon packs — aesthetics mirrored via drawing code rather than mismatched sprites.

**Custom Banano flair:** Banana projectiles, potassium spark colors (#f5d041, #86efac), meme labels.

---

## 11. Balance Guidelines

- Early waves teach darts + one AOE.  
- Mid game forces camo/regrow answers.  
- Late game: ceramics + bosses need splash + snipers.  
- Village is investment for dense maps.  
- Super is win-more / clutch, not mandatory if well upgraded.

---

## 12. Win / Lose

- **Win:** Survive wave 40.  
- **Lose:** Lives ≤ 0.  
- Stats: waves cleared, pops, BAN earned, towers built.

---

## 13. Out of Scope (v1)

- Multiplayer, map editor, 3-path 5-tier full BTD6 trees, mobile native apps.  
- Endless mode optional stretch after core ships.
