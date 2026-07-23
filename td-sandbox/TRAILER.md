# Banano TD — Trailer shot list (Phase 4)

**Length target:** 30–45s  
**Product name on card:** Banano TD  
**Disclaimer end card:** “In-game BAN ≠ Banano on-chain. Free in browser.”

## Shot list

| # | Duration | Visual | Audio | Source / prompt |
|---|----------|--------|-------|-----------------|
| 1 | 3s | Marketing key art push-in | mus_menu swell | `style-bible/01_marketing_key_16x9.jpg` → image_to_video |
| 2 | 4s | Canyon board language — path vs grass | soft jungle | `02_board_language_canyon` still + slow pan |
| 3 | 5s | Gameplay: place Dart, wave start, peels | sfx_place, pops | Capture from slice OR animate dart base |
| 4 | 4s | Camo pack + Sniper retarget Strong | stinger | Gameplay capture |
| 5 | 5s | BAN-Barge entrance banner + shake | sfx_boss | Boss juice in engine / barge still → video |
| 6 | 4s | Fever rim gold/pink, streak | sfx_fever | Gameplay |
| 7 | 4s | Tier-4 ceremony ring on tower | fanfare | Gameplay 4xx |
| 8 | 4s | Party event toast + jackpot | party | Gameplay |
| 9 | 3s | Hub / share card / Core Secure | victory | UI capture |
| 10 | 3s | Title card + bananox.com/playTD.html | sting | Code/export |

## Imagine frames (still)

Reuse style-bible / engine:

- `assets/td/style-bible/01_marketing_key_16x9.jpg`
- `assets/td/style-bible/02_board_language_canyon_16x9.jpg`
- `assets/td/engine/enemies/bosses/ban_barge.jpg`
- `assets/td/engine/towers/dart/base.jpg`
- `assets/td/engine/board/core_idol.jpg`

### image_to_video prompts

**S1 Key art**  
`image`: marketing key  
`prompt`: Slow cinematic push-in on heroic MonKeys defending the glowing Jungle Core as banana hordes approach. Gentle camera only, mythic jungle light.  
`duration`: 6 · `480p`

**S5 Boss**  
`image`: ban_barge  
`prompt`: The monumental banana freighter glides forward with heavy weight and a slow dramatic push-in.  
`duration`: 6 · `480p`

**S3 Dart**  
`image`: dart base  
`prompt`: The dart MonKey winds up and throws a banana dart, then recovers. Clean game-sprite motion, feet planted.  
`duration`: 6 · `480p`

## ffmpeg assembly (after clips exist)

```bash
# Normalize to same res/fps if needed, then concat
ffmpeg -f concat -safe 0 -i shots.txt -c copy trailer_banano_td.mp4
```

`shots.txt` example:
```
file 's1_key.mp4'
file 's2_board.mp4'
...
```

Prefer stream copy when all segments match; re-encode only if formats differ:

```bash
ffmpeg -i s1.mp4 -i s2.mp4 -filter_complex \
  "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" trailer.mp4
```

## Export checklist

- [ ] No wallet / NFT CTA  
- [ ] On-screen: “Banano TD” not legacy codenames only  
- [ ] End card BAN disclaimer  
- [ ] 16:9 master + 1:1 cutdown for social  

## Note

`image_to_video` may require upload_url on ZDR environments — generate clips where the tool is enabled, then assemble with ffmpeg locally.
