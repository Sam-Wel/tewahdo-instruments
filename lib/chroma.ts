import { MAJOR_PENTATONIC_OFFSETS, MAX_FREQ, MIN_FREQ, PEAK_RANGE_DB, SILENCE_DB } from "./constants";

// Only counts local spectral peaks (not raw bin energy) within PEAK_RANGE_DB
// of the loudest peak in range, restricted to the melodic fundamental range.
// This is what separates real melody content from percussion/harmonic smear.
// Returns null if the frame is below the silence floor (nothing to add).
export function extractFrameChroma(
  freqData: Float32Array,
  sampleRate: number,
  fftSize: number
): number[] | null {
  const binHz = sampleRate / fftSize;
  const minBin = Math.max(1, Math.floor(MIN_FREQ / binHz));
  const maxBin = Math.min(freqData.length - 2, Math.floor(MAX_FREQ / binHz));

  let frameMaxDb = -Infinity;
  for (let i = minBin; i <= maxBin; i++) {
    if (freqData[i] > frameMaxDb) frameMaxDb = freqData[i];
  }
  if (frameMaxDb < SILENCE_DB) return null;

  const energy = new Array(12).fill(0);
  for (let i = minBin + 1; i < maxBin; i++) {
    const v = freqData[i];
    const isPeak = v > freqData[i - 1] && v > freqData[i + 1];
    if (!isPeak || v < frameMaxDb - PEAK_RANGE_DB) continue;
    const freq = i * binHz;
    const amp = Math.pow(10, v / 20);
    const noteNum = 12 * Math.log2(freq / 440) + 69;
    const pitchClass = ((Math.round(noteNum) % 12) + 12) % 12;
    energy[pitchClass] += amp;
  }
  return energy;
}

// Scores every possible root's major-pentatonic scale against a chroma
// vector and returns the best [root, confidenceRatio]. root is null when
// the vector carries essentially no energy (silence).
export function bestPentatonicRoot(chromaVec: number[]): [number | null, number] {
  const total = chromaVec.reduce((a, b) => a + b, 0);
  if (total < 1e-6) return [null, 0];

  let bestRoot = 0;
  let bestScore = -Infinity;
  for (let root = 0; root < 12; root++) {
    const scaleTones = MAJOR_PENTATONIC_OFFSETS.map((o) => (root + o) % 12);
    const inSum = scaleTones.reduce((sum, pc) => sum + chromaVec[pc], 0);
    if (inSum > bestScore) {
      bestScore = inSum;
      bestRoot = root;
    }
  }
  return [bestRoot, bestScore / total];
}
