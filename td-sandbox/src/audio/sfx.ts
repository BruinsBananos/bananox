/**
 * Procedural Web Audio SFX — no external assets.
 * Mute-safe; lazy AudioContext on first play (browser autoplay policy).
 */

type SfxId = "pop" | "place" | "wave" | "fever" | "leak" | "ability" | "win" | "lose" | "upgrade" | "ui";

let ctx: AudioContext | null = null;
let muted = false;
let master = 0.22;

function ac(): AudioContext | null {
  if (muted || typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
  if (m && ctx) void ctx.suspend();
}

export function isMuted() {
  return muted;
}

function beep(
  freq: number,
  dur: number,
  type: OscillatorType = "square",
  gain = 0.12,
  slide = 0
) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain * master, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noiseBurst(dur: number, gain = 0.08) {
  const a = ac();
  if (!a) return;
  const n = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1200;
  g.gain.value = gain * master;
  src.connect(f);
  f.connect(g);
  g.connect(a.destination);
  src.start();
}

export function playSfx(id: SfxId) {
  if (muted) return;
  switch (id) {
    case "pop":
      beep(520 + Math.random() * 180, 0.06, "triangle", 0.09, -120);
      break;
    case "place":
      beep(280, 0.08, "square", 0.1);
      beep(420, 0.06, "square", 0.06);
      break;
    case "wave":
      beep(180, 0.12, "sawtooth", 0.07, 220);
      break;
    case "fever":
      beep(440, 0.1, "square", 0.1);
      beep(660, 0.12, "square", 0.08);
      beep(880, 0.14, "triangle", 0.07);
      break;
    case "leak":
      beep(160, 0.18, "sawtooth", 0.1, -80);
      noiseBurst(0.12, 0.06);
      break;
    case "ability":
      beep(300, 0.08, "square", 0.1, 200);
      noiseBurst(0.1, 0.05);
      break;
    case "win":
      beep(523, 0.12, "triangle", 0.1);
      beep(659, 0.12, "triangle", 0.09);
      beep(784, 0.2, "triangle", 0.1);
      break;
    case "lose":
      beep(220, 0.2, "sawtooth", 0.1, -100);
      beep(140, 0.28, "sawtooth", 0.08);
      break;
    case "upgrade":
      beep(360, 0.06, "triangle", 0.08);
      beep(540, 0.08, "triangle", 0.07);
      break;
    case "ui":
      beep(640, 0.04, "square", 0.05);
      break;
  }
}

/** Soft pop throttle so dense peels don't clip */
let lastPopAt = 0;
export function playPopThrottled() {
  const now = performance.now();
  if (now - lastPopAt < 40) return;
  lastPopAt = now;
  playSfx("pop");
}
