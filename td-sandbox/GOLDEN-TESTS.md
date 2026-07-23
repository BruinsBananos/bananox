# Golden tests checklist — Phase 1 sandbox

Automated: `npm test` (Vitest)

| # | Claim | Result |
|---|-------|--------|
| 1 | Dual path free 2-2 then deep OK | **PASS** `allows 2-2 free` |
| 2 | Cannot upgrade second path past 2 when other is deep | **PASS** `blocks second deep path 3-3` |
| 3 | Sell refund 70% | **PASS** |
| 4 | Camo blocks targeting without detect | **PASS** |
| 5 | Camo visible with camo flag | **PASS** |
| 6 | Lead blocks damage without lead | **PASS** |
| 7 | Lead damagable with lead flag | **PASS** |
| 8 | Peel / sim runs with towers | **PASS** |
| 9 | Wave start + sim loop stable | **PASS** |
| 10 | Upgrade spends BAN and raises path | **PASS** |

## Manual (playtest)

| # | Claim | How |
|---|-------|-----|
| M1 | Dart-only can clear wave 1–3 Normal | Place 3 darts, send |
| M2 | Camo wave 10 leaks without sniper | Force wave 10, dart only |
| M3 | Lead dens need bomb or sniper A1 | Force wave 12+ |
| M4 | Deep path confirm appears | Upgrade to t3 |
| M5 | Ranges / immunities debug toggles | Debug buttons |
| M6 | Speed 1–3× | F or button |
| M7 | Farm pays on clear | Place farm+upgrade, clear wave |

*Automated suite last run: 10/10 passed.*
