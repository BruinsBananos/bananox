# Per-map QA checklist — Phase 3

Softlocks, impossible Short, trivial Starship cheese.

## Global

| Check | Pass criteria |
|-------|----------------|
| Dual path cannot 3-3 | UI + sim reject |
| Auto softlock | N/A ranked auto-wave off in slice |
| Interest softcap | 10k bank interest &lt; linear 12% |
| Drop diminish | 10 drops &lt; one 4xx farm over 20 rounds (design) |
| Starship lives | 140 — no free win with 1 dart |
| Reverse | Spawn/core swap; still placeable ≥30 |
| Blitz | Faster + denser; still clearable Hard Medium Canyon |
| Tour re-place | Towers never stuck on path after rotate |

## Maps

| Map | Softlock | Impossible Short | Starship cheese |
|-----|----------|------------------|-----------------|
| **Canyon** | Path free cells plenty | Short teaches camo/lead | Line farm ≠ free win if dens ok |
| **Helix** | Crossfire OK | Short still remaps content | Boomer strong not auto-win |
| **Spiral** | Eco trap: under-DPS bosses | Boss waves via contentSpan | Farm stack softcapped |
| **Fork** | False fork still single path | Targeting literacy only | No dual-lane exploit |
| **Runway** | Long straights | Sniper not mandatory Short | Battery expensive gate |
| **Gauntlet** | Dense zig — reaction | Short denser not longer | No infinite freeze (caps) |

## Modes

| Mode | QA |
|------|-----|
| Classic | Baseline |
| Tour | Map rotates; upgrades stay; free re-place |
| Fever Rush | Starts with fever stacks; dens high |
| Party | Events fire; rain capped; no market_crash wipe |

## Manual sign-off

- [ ] Canyon Short Normal clear (coach)
- [ ] Helix Short Normal clear
- [ ] Spiral Medium Hard — needs farm OR skill
- [ ] Fork + Reverse win
- [ ] Runway + Battery path visible late
- [ ] Gauntlet Blitz Hard Medium survives mid
- [ ] Tour Medium completes without stuck towers
- [ ] Party events don't softlock broke
- [ ] Starship Short not free with dart spam
- [ ] Atlas badge progress after map×length clears

## Known cheese / mitigations

| Cheese | Mitigation |
|--------|------------|
| Infinite farm Super | Farm softcap + Super cost |
| Cryo lock freeplay | Freeze caps on MOAB |
| Drop spam | diminish per use |
| Party double+fever | bounty mult softcap ×3 |
