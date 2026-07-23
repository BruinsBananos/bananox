# Phase 2 Vertical Slice — notes

## Acceptance mapping

| Criterion | Implementation |
|-----------|----------------|
| Canyon + second map | `canyon` + `helix` |
| Classic Short/Med/Long | `LENGTHS` 25/50/75 + contentSpan |
| Normal/Hard | `DIFFS` lives/BAN/scale/dens/reward |
| 5–7 towers dual path | 6 towers |
| Storm + Cryo + Drop | `castAbility` |
| Fever OR event | **Fever only** (full) |
| Interest + round bonus | soft tiers + perfect mul |
| Hub / results / retry / settings | multi-screen `index.html` |
| Imagine art | `public/art` + sprite draw |
| Save migration | `migrateFromLive` from `bananox_td_v1` |
| Share card | text block + clipboard |
| Perf dense mid | MAX_THREATS 220, projectiles 280, floats 40, LOD |

## vs Phase 1 sandbox

+ Hub shell, win/lose, config wizard  
+ Helix, lengths, Hard  
+ Boomer, abilities, fever  
+ Save + share  
+ Art integration  
+ Coach marks  

## Manual QA

- [ ] Short Normal clear with coach  
- [ ] Hard Medium interesting tradeoffs  
- [ ] Camo wave needs sniper  
- [ ] Lead dens need bomb/sniper A1  
- [ ] Deep path confirm  
- [ ] Share copy works  
- [ ] Live save import message if `bananox_td_v1` present  
