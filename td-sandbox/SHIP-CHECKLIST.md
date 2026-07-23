# Banano TD — Ship checklist (Phase 4)

## Product

- [x] Name **Banano TD** in HUD / results / share  
- [x] In-game BAN ≠ chain BAN (hub + arcade copy)  
- [x] No pay power / no forced wallet  
- [x] Dual path 2-2 / deep 3–4  
- [x] 6 maps + mutators  
- [x] 4 modes + lengths + Normal/Hard/Starship  
- [x] 10 towers  
- [x] Abilities Storm/Cryo/Drop/Rage  
- [x] Fever + events  
- [x] Badges / codex / cosmetics stubs  
- [x] Daily seeded challenge (cosmetic only)  
- [x] Local LB + global contract mock  
- [x] Save migrate from `bananox_td_v1`  
- [x] Juice: boss banner, fever, 4xx ceremony, shake  

## Engineering

- [x] Fixed timestep sim  
- [x] Perf caps dense waves  
- [x] Vitest suite green  
- [x] `npm run build`  
- [ ] Deploy slice build to bananox.com (or link from playTD)  
- [ ] Optional `?legacy=1` for old playTD.js one release  
- [ ] Lighthouse / mid-mobile FPS spot check  

## Content / QA

- [ ] Manual QA-MAPS.md sign-off  
- [ ] Short Normal coach clear (stranger)  
- [ ] Hard Medium enjoyable (vet)  
- [ ] Tour no stuck towers  
- [ ] Daily claim once / day  
- [ ] Mock global LB submit/fetch  

## Legal / soul

- [x] No NFT / wallet power gates  
- [x] Classy Banano tone  
- [ ] Privacy note if real global LB ships (hash only)  

## Trailer

- [ ] Capture shots per TRAILER.md  
- [ ] ffmpeg master  
- [ ] Post to social with bananox.com/playTD.html  

## Cutover

1. Build `td-sandbox` → publish under `/td/` or replace playTD entry  
2. Keep playTD.legacy.js one week  
3. Update arcade + index cards  
4. Announce daily + disclaimer  
