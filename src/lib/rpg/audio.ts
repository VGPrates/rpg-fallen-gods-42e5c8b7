let sharedCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  if (sharedCtx.state === "suspended") void sharedCtx.resume();
  return sharedCtx;
}

function noiseBuffer(audio: AudioContext, duration: number) {
  const length = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function tone(
  audio: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  slideTo?: number,
) {
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Resume the shared context inside a user gesture so later chimes are not blocked. */
export function unlockAudio() {
  ctx();
}

/** Soft major chime — points landed. Call unlockAudio() in the same click first. */
export function playPointsAppliedSound(muted: boolean) {
  if (muted) return;
  const audio = ctx();
  if (!audio) return;
  const t = audio.currentTime + 0.01;
  tone(audio, 392, t, 0.14, "sine", 0.045);
  tone(audio, 523, t + 0.07, 0.16, "sine", 0.05);
  tone(audio, 659, t + 0.14, 0.22, "triangle", 0.04);
  tone(audio, 784, t + 0.2, 0.32, "sine", 0.035);
}

export function playDiceSound(value: number, muted: boolean) {
  if (muted) return;
  const audio = ctx();
  if (!audio) return;
  const t = audio.currentTime;

  const src = audio.createBufferSource();
  src.buffer = noiseBuffer(audio, 0.28);
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.8;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.22, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  src.connect(filter);
  filter.connect(g);
  g.connect(audio.destination);
  src.start(t);
  src.stop(t + 0.32);

  for (let i = 0; i < 5; i += 1) {
    const clickAt = t + 0.04 * i;
    tone(audio, 180 + Math.random() * 90, clickAt, 0.05, "triangle", 0.08);
  }

  const hit = t + 0.38;
  if (value === 1) {
    tone(audio, 90, hit, 0.7, "sawtooth", 0.12, 40);
    tone(audio, 70, hit + 0.08, 0.6, "square", 0.06, 36);
  } else if (value <= 8) {
    tone(audio, 160, hit, 0.28, "triangle", 0.08, 90);
  } else if (value <= 15) {
    tone(audio, 320, hit, 0.22, "sine", 0.1);
    tone(audio, 480, hit + 0.08, 0.18, "sine", 0.05);
  } else if (value < 20) {
    tone(audio, 440, hit, 0.28, "sine", 0.11);
    tone(audio, 660, hit + 0.1, 0.26, "triangle", 0.07);
    tone(audio, 880, hit + 0.18, 0.3, "sine", 0.05);
  } else {
    tone(audio, 523, hit, 0.45, "sine", 0.12);
    tone(audio, 659, hit + 0.08, 0.42, "sine", 0.1);
    tone(audio, 784, hit + 0.16, 0.5, "triangle", 0.08);
    tone(audio, 1046, hit + 0.24, 0.55, "sine", 0.06);
  }
}
