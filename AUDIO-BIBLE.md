# Banano TD — Audio Bible (Prompt 8)

**Status:** IMPLEMENTATION-READY  
**Product:** Banano TD  
**Depends on:** `DESIGN-LOCK.md`, `SYSTEMS-BIBLE.md`, `UI-UX-SPEC.md`, `CONTENT-BIBLE.md`  
**Stack default:** Web Audio API · procedural first · optional compressed assets later  
**Rule:** Mute is sacred; never autoplay music before user gesture (Boot “arm sound”).

---

## 0. Audio pillars

| Pillar | Spec |
|--------|------|
| **Soul** | Jungle + potassium comedy; light, feeless, not casino slot spam |
| **Clarity** | Combat reads through ear: lead fail ≠ pop; leak ≠ ability |
| **Density** | Late waves: SFX polyphony caps + priority ducking |
| **Mobile** | Mix for tiny mono speakers first; headphones = bonus |
| **A11y** | Settings: Master / Music / SFX; mute all; reduce escalating stingers |

---

## 1. Music bed catalog

All loops **seamlessly**; 100–120 BPM jungle-chiptune / light afro-percussion cartoon hybrid.  
No vocals with lyrics (optional distant “ooh” vocalise OK).  
Key center: bright minor/major flip — **F minor → A♭** jungle night energy; victory resolve to **B♭ major**.

| id | Name | When | Mood | BPM | Loop | Intensity |
|----|------|------|------|-----|------|-----------|
| `mus_menu` | Jungle Lobby | Hub, Boot ready, Mode select | Warm, inviting, low percussion | 104 | yes | 0.35 |
| `mus_early` | Peel Path Calm | Waves ~1–15 / Short early | Sparse marimba + soft shaker | 108 | yes | 0.40 |
| `mus_mid` | Potassium Pressure | Waves ~16–40 mid craft | Add bass pulse, offbeat hats | 112 | yes | 0.55 |
| `mus_boss` | Barge Bearing | Boss on field / boss chapter | Low brass hit motif + taut drums | 116 | yes | 0.70 |
| `mus_fever` | Fever Glow | `feverT > 0` | Filtered gold riser, sidechain pump | 120 | yes | 0.75 |
| `mus_victory` | Core Secure | Victory overlay | Bright resolve fanfare → soft out | oneshot+tail | no | 0.65 |
| `mus_defeat` | Vault Dim | Defeat overlay | Descending fourths, muted | oneshot+tail | no | 0.50 |

### Crossfade rules

| Transition | Spec |
|------------|------|
| Early → mid | Crossfade 2.5s when `waveContentLevel` crosses mid band |
| Mid → boss | Duck bed −6 dB, start `mus_boss` 0.4s; restore when no MOAB-class alive |
| Any → fever | Layer `mus_fever` or swap with 1s crossfade; **never** stack full volume both |
| Combat → victory/defeat | 0.3s duck all music → stinger → stop loops |
| Pause | Music −8 dB or filter lowpass; SFX mute optional setting |
| Tab hidden | Suspend AudioContext; resume on visible + gesture if needed |

**Placeholder:** oscillator arpeggios matching BPM (see §5).

---

## 2. SFX matrix

### 2.1 Economy / build

| Event | id | Character | Notes |
|-------|-----|-----------|-------|
| Place tower | `sfx_place` | Soft thud + leaf | Higher pitch for cheap towers |
| Upgrade | `sfx_upgrade` | Rising two-tone “ding-ding” | Deeper for t3–t4 |
| Sell | `sfx_sell` | Soft whoosh down | Quiet |
| Not enough BAN | `sfx_deny` | Muted low blip | Max 1 / 300ms |
| Interest tick | `sfx_interest` | Coin tick soft | On round payout only |
| Drop ability BAN | `sfx_drop_ban` | Coin rain short | Cap polyphony 1 |
| Round clear bonus | `sfx_round_clear` | Warm chime | With perfect = extra sparkle |

### 2.2 Combat — shoot per family

| Family | id | Character |
|--------|-----|-----------|
| Dart | `sfx_shoot_dart` | Light wood/thip |
| Boomer | `sfx_shoot_boomer` | Whoop spin |
| Sniper | `sfx_shoot_sniper` | Sharp crack (short) |
| Bomb | `sfx_shoot_bomb` | Hollow *pfoom* launch |
| Ice | `sfx_shoot_ice` | Crystal tick / frost puff |
| Super | `sfx_shoot_super` | Energy zip |
| Battery | `sfx_shoot_battery` | Rail charge + release |
| Alchemist | `sfx_shoot_alch` | Liquid plip |
| Farm / Village | — | No shoot; optional ambient rustle on place only |

**Polyphony:** max **6** concurrent shoot voices; steal oldest.  
**ROF spam:** if same family >8/s, play every Nth + quieter layer.

### 2.3 Pop / properties

| Event | id | Character |
|-------|-----|-----------|
| Pop Unripe–Ripe | `sfx_pop_light` | Soft squish high |
| Pop Golden–Meme | `sfx_pop_mid` | Fuller peel |
| Pop Cosmic–Zebra | `sfx_pop_heavy` | Juicy + short tail |
| Pop JACKPOT | `sfx_pop_jackpot` | Bright fanfare sparkle |
| Ceramic chip | `sfx_ceramic_chip` | Pottery crack |
| Ceramic break | `sfx_ceramic_break` | Shell shatter |
| MOAB chip | `sfx_moab_chip` | Metal thud |
| MOAB death | `sfx_moab_death` | Deep boom + confetti whoosh |
| **Lead clink** (fail) | `sfx_lead_clink` | Metallic *tink* — **must ≠ pop** |
| **Camo whoosh** (untargetable attempt or camo spawn) | `sfx_camo_whoosh` | Airy filtered whoosh |
| Fortified block pop1 | `sfx_fort_block` | Dull rubber thunk |
| Regen tick | `sfx_regen` | Soft reverse squish (rare, throttle) |

### 2.4 Lives / fail

| Event | id | Character |
|-------|-----|-----------|
| Leak (banana exits) | `sfx_leak` | Low saw dip + warning |
| Life loss tick | `sfx_life_loss` | Heart crack soft (stack with leak) |
| Core critical (&lt;20% lives) | `sfx_core_warn` | Slow pulse (interval ≥4s) |
| Defeat | (music) + `sfx_defeat_hit` | Final crack |

### 2.5 Abilities ×4

| Ability | id | Character | Length |
|---------|-----|-----------|--------|
| Peel Storm | `sfx_ability_storm` | Lightning zip + peel rain | ~0.4s |
| Cryo Core | `sfx_ability_cryo` | Ice bloom + wind | ~0.5s |
| Banana Drop | `sfx_ability_drop` | Crate land + coins | ~0.45s |
| Jungle Rage | `sfx_ability_rage` | Drum hit + roar short | ~0.4s |

Also: `sfx_ability_ready` subtle tick when CD hits 0 (optional, rate-limit).

### 2.6 Meta systems

| Event | id | Character |
|-------|-----|-----------|
| Fever start | `sfx_fever` | Rising fanfare (SYSTEMS juice) |
| Fever end | `sfx_fever_end` | Filter close soft |
| Streak ×10 | `sfx_streak` | Pitch steps up |
| Event start | `sfx_event` | Party whistle soft |
| Wave start | `sfx_wave_start` | Portal thump |
| Boss intro | `sfx_boss_intro` | Deep stinger |
| Badge unlock | `sfx_badge` | Medallion chime |
| UI tap | `sfx_ui_tap` | Soft tick |
| UI confirm | `sfx_ui_confirm` | Higher tick |
| UI back | `sfx_ui_back` | Lower tick |
| Coach mark | `sfx_coach` | Friendly blip |
| Pause | `sfx_pause` | Tape stop micro |
| Share | `sfx_share` | Camera shutter soft |

---

## 3. Mix buses

```
Master
├── MusicBus     (ducked by important SFX)
├── SFXBus
│   ├── SFX_Combat   (shoots, pops)
│   ├── SFX_Feedback (lead, deny, UI)
│   ├── SFX_Alert    (leak, life, boss)  ← highest priority
│   └── SFX_Ability  (abilities, fever, jackpot)
└── (optional) AmbienceBus  jungle bed bed under music −18 dB
```

### Target levels (relative, peak normalize in engine)

| Bus | Default gain | Notes |
|-----|--------------|-------|
| Master | 1.0 (user 0–1) | Settings slider |
| Music | 0.45 × master | Duck −6 to −10 dB for 200ms on Alert/Ability |
| SFX_Combat | 0.70 | Aggressive under density |
| SFX_Feedback | 0.75 | Lead clink cuts through |
| SFX_Alert | 0.90 | Never fully ducked |
| SFX_Ability | 0.80 | Duck music |

### Ducking matrix

| Trigger | Duck Music | Duck Combat |
|---------|------------|-------------|
| Leak / life loss | −8 dB 400ms | −4 dB |
| Ability cast | −6 dB 300ms | — |
| Boss intro / jackpot | −10 dB 500ms | −3 dB |
| Fever start | −4 dB 600ms | — |
| UI | none | none |

### Polyphony caps (mobile-safe)

| Category | Max voices |
|----------|------------|
| Shoot | 6 |
| Pop | 8 (merge to `pop_light` if over) |
| Alert | 2 |
| Ability | 2 |
| UI | 2 |
| Music | 1 bed + 1 stinger |

---

## 4. Mobile speaker notes

| Issue | Mitigation |
|-------|------------|
| Tinny highs | Keep lead/pop fundamentals ~400–2000 Hz; avoid pure 8 kHz spikes |
| Inaudible bass | Boss/leak use mid thump 120–250 Hz, not sub-only |
| Mono collapse | Avoid phase-inverted stereo tricks; center important SFX |
| Compression | Soft limiter on Master (−1 dBTP ceiling) |
| Silent switch (iOS) | Respect; don’t fight OS mute |
| Low power mode | Prefer procedural beeps over decoding many assets |
| Latency | Schedule with `AudioContext.currentTime`; unlock on Boot gesture |
| Ringer | Settings copy: “Turn up media volume — not ringer.” |

**Mix check device:** mid Android speaker + iPhone earpiece-distance at arm’s length; if leak inaudible among pops, raise Alert bus.

---

## 5. Placeholder plan (ship before custom audio)

### Phase P0 — Procedural only (current DNA upgrade)

| Need | Implementation |
|------|----------------|
| All SFX | Oscillator beeps: frequency/type map per id (see table below) |
| Music | Optional sequenced arpeggio patterns per `mus_*` state machine |
| Mute | Existing `muted` flag + bus gains 0 |

**Procedural cheat sheet**

| id | type | f0 | dur | notes |
|----|------|----|-----|-------|
| place | triangle | 320→480 | 0.08 | |
| upgrade | square | 520→780 | 0.12 | two notes |
| shoot_dart | square | 600+rng | 0.03 | quiet |
| pop_light | square | 520+rng | 0.03 | |
| lead_clink | triangle | 880 | 0.05 | dry |
| camo_whoosh | saw→lpf | 200–600 | 0.12 | |
| leak | saw | 110 | 0.18 | |
| ability_* | sine stack | 600/900 | 0.12 | |
| fever | saw+square | 400→900 | 0.2 | |
| interest | sine | 990 | 0.04 | |

### Phase P1 — Asset swap

Drop files in `assets/td/audio/` matching §6; loader maps id → buffer.  
Procedural remains fallback if load fails.

### Phase P2 — Full music loops

Replace arpeggios with OGG/MP3 loops; keep same ids.

---

## 6. Filename list

**Root:** `assets/td/audio/`  
**Formats:** `.ogg` preferred + `.mp3` fallback (or encode at build).  
**Naming:** `{bus}_{category}_{name}` optional; flat ids below match code constants.

### Music

```
audio/music/mus_menu.ogg
audio/music/mus_early.ogg
audio/music/mus_mid.ogg
audio/music/mus_boss.ogg
audio/music/mus_fever.ogg
audio/music/mus_victory.ogg
audio/music/mus_defeat.ogg
```

### SFX — build / UI

```
audio/sfx/sfx_place.ogg
audio/sfx/sfx_upgrade.ogg
audio/sfx/sfx_sell.ogg
audio/sfx/sfx_deny.ogg
audio/sfx/sfx_interest.ogg
audio/sfx/sfx_drop_ban.ogg
audio/sfx/sfx_round_clear.ogg
audio/sfx/sfx_ui_tap.ogg
audio/sfx/sfx_ui_confirm.ogg
audio/sfx/sfx_ui_back.ogg
audio/sfx/sfx_coach.ogg
audio/sfx/sfx_pause.ogg
audio/sfx/sfx_share.ogg
audio/sfx/sfx_badge.ogg
```

### SFX — shoot

```
audio/sfx/sfx_shoot_dart.ogg
audio/sfx/sfx_shoot_boomer.ogg
audio/sfx/sfx_shoot_sniper.ogg
audio/sfx/sfx_shoot_bomb.ogg
audio/sfx/sfx_shoot_ice.ogg
audio/sfx/sfx_shoot_super.ogg
audio/sfx/sfx_shoot_battery.ogg
audio/sfx/sfx_shoot_alch.ogg
```

### SFX — combat feedback

```
audio/sfx/sfx_pop_light.ogg
audio/sfx/sfx_pop_mid.ogg
audio/sfx/sfx_pop_heavy.ogg
audio/sfx/sfx_pop_jackpot.ogg
audio/sfx/sfx_ceramic_chip.ogg
audio/sfx/sfx_ceramic_break.ogg
audio/sfx/sfx_moab_chip.ogg
audio/sfx/sfx_moab_death.ogg
audio/sfx/sfx_lead_clink.ogg
audio/sfx/sfx_camo_whoosh.ogg
audio/sfx/sfx_fort_block.ogg
audio/sfx/sfx_regen.ogg
```

### SFX — alert / meta / abilities

```
audio/sfx/sfx_leak.ogg
audio/sfx/sfx_life_loss.ogg
audio/sfx/sfx_core_warn.ogg
audio/sfx/sfx_defeat_hit.ogg
audio/sfx/sfx_ability_storm.ogg
audio/sfx/sfx_ability_cryo.ogg
audio/sfx/sfx_ability_drop.ogg
audio/sfx/sfx_ability_rage.ogg
audio/sfx/sfx_ability_ready.ogg
audio/sfx/sfx_fever.ogg
audio/sfx/sfx_fever_end.ogg
audio/sfx/sfx_streak.ogg
audio/sfx/sfx_event.ogg
audio/sfx/sfx_wave_start.ogg
audio/sfx/sfx_boss_intro.ogg
```

**Count:** 7 music + ~48 sfx ≈ **55 files** (P1 full set).  
**Vertical slice minimum (P0/P1 lite):**  
`place, upgrade, shoot_dart, shoot_bomb, shoot_sniper, shoot_ice, pop_light, pop_mid, lead_clink, camo_whoosh, leak, life_loss, ability×4, fever, wave_start, ui_tap, deny` + `mus_menu, mus_early, mus_boss, mus_victory, mus_defeat`.

---

## 7. Code API sketch

```ts
// audio/Sfx.ts — no Pixi
play(id: SoundId, opts?: { gain?: number; rate?: number; throttleMs?: number }): void;
setMuted(m: boolean): void;
setBusGain(bus: BusId, g: number): void;
setMusicState(state: MusicState): void; // menu|early|mid|boss|fever|off
unlock(): Promise<void>; // user gesture
```

Wire from `SimEvents` (TECH-ARCHITECTURE): `pop`, `leak`, `place`, `upgrade`, `ability`, `fever`, `waveStart`, `bossSpawn`, `leadFail`, `camoFail`.

---

## 8. Acceptance checklist

- [ ] Lead clink ≠ pop (playtest blind)  
- [ ] Leak audible on phone speaker under dense pops  
- [ ] Music ducks on boss/ability/leak  
- [ ] Mute persists (save settings)  
- [ ] No audio before Boot gesture  
- [ ] Polyphony caps prevent crackle mid-Party  
- [ ] Filename ids match loader map  

---

## 9. Doc control

| Date | Note |
|------|------|
| 2026-07-22 | Prompt 8 Audio Bible |

---

**NEXT: PROMPT 9**
