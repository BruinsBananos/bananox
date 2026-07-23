# Combat Sandbox vs live playTD.js

| Area | playTD.js (live) | td-sandbox (Phase 1) |
|------|------------------|----------------------|
| Structure | ~4k line IIFE | Modules: sim / path / content / render |
| Render | Canvas 2D | Canvas 2D (Pixi deferred) |
| Timestep | rAF × speed | Fixed 1/60 + speed steps |
| Maps | 6 | Canyon only |
| Towers | 9 | 5 archetypes |
| Modes / length | Full | None — infinite wave send |
| Fever / events / abilities | Yes | No |
| Meta / badges / save | Yes | Debug cash only |
| Camo / lead | Yes | Explicit matrix + tests |
| Dual path | Yes | Same rules + deep confirm |
| Economy | Rich (streak, fever mult) | Basics: pop · clear · interest · farm |
| Touch | Partial | Click + drag-capable place |

## Feel goals this sandbox proves

1. **Peel chain** income feedback without full juice system  
2. **Lead clink** (damage fail) vs successful pop  
3. **Camo** requires Sniper / ice high path  
4. **Dual path** cannot 3-3  
5. **Target Strong** on barge week  
6. **Farm** only pays on wave clear  

## Gaps to close before “better than live”

- Abilities Storm/Cryo/Drop/Rage  
- Juice (particles, floats, shake)  
- Fever / streak  
- Full tower art  
- Pixi + atlas  
- Save + hub  

## Next

PROMPT 10 — vertical slice toward product shell when this sandbox is approved.
