# Mega Potassium Tower — Game Design Document

**Working title:** Mega Potassium Tower  
**Genre:** 2D Icy Tower–style endless vertical climber  
**Platform:** Browser (HTML5 Canvas + vanilla JS)  
**Tone:** Wholesome, meme-y, icy blues + Banano gold  
**Entry:** `play.html` + `play.js` (site-integrated, zero external game deps)

---

## 1. High Concept

You are a cute **MonKey** climbing the **Mega Potassium Tower** — a frozen blockchain spire rising from the Banano Republic Jungle. Slippery ice platforms, banana coins, combo multipliers, and FUD hazards await. Climb forever. Don’t let your memes be dreams.

---

## 2. Core Loop

1. Run left/right on icy platforms (slide-y momentum).  
2. Jump (Space / W / ↑ / touch) — chain landings for combos.  
3. Collect BAN coins + power-ups.  
4. Avoid FUD snowballs, scam spikes, crumbling peels.  
5. Camera rises with height; falling below the screen = game over.  
6. Beat your local high score. One more run.

---

## 3. Controls

| Input | Action |
|--------|--------|
| A / ← | Move left |
| D / → | Move right |
| Space / W / ↑ | Jump (buffer + coyote) |
| Hold jump | Slightly higher jump (variable height) |
| Wall contact + jump | Wall jump |
| P / Esc | Pause |
| Touch buttons | Left / Right / Jump (mobile) |

---

## 4. Physics (Icy Tower feel)

| Param | Intent |
|--------|--------|
| High air control | Responsive mid-air steering |
| Low ice friction | Slide on platforms; carry speed into jumps |
| Strong jump | Snappy vertical pops |
| Coyote time (~0.1s) | Fair edge jumps |
| Jump buffer (~0.12s) | Forgiving input |
| Wall slide | Slow descent on walls; wall jump kicks out |
| Max fall speed | Cap for readability |

---

## 5. Platform Generation

- Infinite upward generation; recycle platforms far below camera.  
- Base vertical gap increases with height (difficulty).  
- Horizontal placement: random within bounds, with max lateral jump reach.  
- Types by height bands:  
  - **Ice slab** — standard slippery  
  - **Banana peel** — extra slip  
  - **Blockchain block** — slightly grippier  
  - **Crumble peel** — breaks after stand time  
  - **Moving ice** — horizontal patrol  
  - **Spring potassium** — mega bounce  

---

## 6. Scoring

```
score = floor(height_m * 10) + coins * 25 + style
style += combo * landing_bonus
```

- **Combo:** +1 per successful platform landing without long air stall; resets on hard fall / long freefall.  
- **Multiplier display:** “POTASSIUM COMBO xN!” with Banano puns at tiers.  
- **High score:** `localStorage` key `bx-potassium-tower-v1` (height + score + best combo).

---

## 7. Hazards & Power-ups

**Hazards:** FUD snowballs (fall from above), scam spike pads on platforms.  
**Power-ups:** Super Jump, Peel Shield, Airdrop Float (slow fall), Magnet BAN, Speed Rush.

---

## 8. Difficulty Curve

| Height | Changes |
|--------|---------|
| 0–50m | Tutorial spacing, mostly ice |
| 50–150m | Gaps grow, peel platforms, coins denser |
| 150–300m | Moving + crumble, snowballs |
| 300m+ | Faster scroll pressure, mixed hazards, springs required |

---

## 9. Visual / Audio

- Procedural canvas art (no broken asset links): MonKey, ice, bananas, particles.  
- Palette: icy `#7dd3fc` / `#e0f2fe`, Banano `#f5d041`, jungle night `#0a1620`.  
- Web Audio: jump, land, coin, combo, die, power-up beeps.  
- Particles: snow, sparks, peel trails, confetti on big combos.

---

## 10. Screens

1. **Menu** — Start / How to Play / High Scores  
2. **Playing** — HUD (height, score, combo, coins)  
3. **Paused**  
4. **Game Over** — stats + retry + menu  

---

## 11. Out of Scope (v1)

- Accounts, leaderboards online, multiplayer.  
- Heavy external sprite packs / music files (synth SFX only).
