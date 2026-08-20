export interface PitchReading {
  freq: number;
  clarity: number;
}

const NO_PITCH: PitchReading = { freq: -1, clarity: 0 };

// Returns the detected frequency plus a clarity score. clarity is the
// autocorrelation peak normalized against lag-0 energy (1.0 = perfectly
// periodic, near 0 = noise) — how a YIN-style pitch tracker judges whether
// a reading is trustworthy rather than an artifact of noise or a transient.
export function autoCorrelate(buf: Float32Array, sampleRate: number): PitchReading {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buf[i] * buf[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return NO_PITCH;

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmed = buf.slice(r1, r2);
  const newSize = trimmed.length;
  const c = new Array(newSize).fill(0);
  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize - i; j++) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (d < newSize - 1 && c[d] > c[d + 1]) d++;

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }
  let T0 = maxPos;
  if (T0 <= 0) return NO_PITCH;

  const clarity = c[0] > 0 ? Math.max(0, maxVal / c[0]) : 0;

  const x1 = c[T0 - 1] !== undefined ? c[T0 - 1] : c[T0];
  const x2 = c[T0];
  const x3 = c[T0 + 1] !== undefined ? c[T0 + 1] : c[T0];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a !== 0) T0 = T0 - b / (2 * a);

  if (T0 <= 0) return NO_PITCH;
  return { freq: sampleRate / T0, clarity };
}

// Maps how close a reading is to being in tune to a green→red color: 0
// cents (dead on) is green, ±50 cents (a semitone off) is red.
export function tuningColor(cents: number): string {
  const abs = Math.min(50, Math.abs(cents));
  const hue = 120 - (abs / 50) * 120;
  return `hsl(${hue}, 75%, 55%)`;
}
