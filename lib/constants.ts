export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const MAJOR_PENTATONIC_OFFSETS = [0, 2, 4, 7, 9] as const;

export const LANGUAGES = ["Amharic", "Tigrinya", "Ge'ez", "Other"] as const;
export const SPEEDS = ["slow", "medium", "fast"] as const;
export const LENGTHS = ["short", "long"] as const;

export type Language = (typeof LANGUAGES)[number];
export type Speed = (typeof SPEEDS)[number];
export type Length = (typeof LENGTHS)[number];

export interface Mezmur {
  id: number;
  title: string;
  topics: string[];
  language: Language;
  speed: Speed;
  length: Length;
  lyrics: string;
  media_url: string | null;
  created_at: string;
}

// Mezmur playlists by major pentatonic key (YouTube playlist IDs).
export const KEY_PLAYLISTS = [
  { key: "F", label: "F Major", playlistId: "PLA6DphA3OcLH9jjlHlsfO22rIoUbXExEm" },
  { key: "C", label: "C Major", playlistId: "PLA6DphA3OcLEWWYHIM6wbD6WZlC7oKSMi" },
  { key: "G", label: "G Major", playlistId: "PLA6DphA3OcLHJMpfEVg2DcgGYYtoZEUTO" },
  { key: "D", label: "D Major", playlistId: "PLA6DphA3OcLEFsHiCdIAarBwG2wr6Y0kE" },
  { key: "A", label: "A Major", playlistId: "PLA6DphA3OcLG7lcHdtHl33fn2mtFjDaA3" },
  { key: "E", label: "E Major", playlistId: "PLA6DphA3OcLFuG8OiypKIOUAEJbQKGlFf" },
  { key: "B", label: "B Major", playlistId: "PLA6DphA3OcLHgdmdysNA8WvN16Dg-XPeU" },
  { key: "F#/Gb", label: "F#/Gb Major", playlistId: "PLA6DphA3OcLHls-gG3sS76G4msmIwZEig" },
  { key: "C#/Db", label: "C#/Db Major", playlistId: "PLA6DphA3OcLGac26xdAMcRu80KDbROPp1" },
  { key: "G#/Ab", label: "G#/Ab Major", playlistId: "PLA6DphA3OcLHoUa-px6R8Pr5R2A_ibW3h" },
  { key: "D#/Eb", label: "D#/Eb Major", playlistId: "PLA6DphA3OcLF3GvLp4XmD-2mR9rQ-hAuM" },
  { key: "A#/Bb", label: "A#/Bb Major", playlistId: "PLA6DphA3OcLGXdI4rAP67jd0_qwsBGAjw" },
] as const;

// Chroma extraction range/threshold and block-voting window, tuned against
// ~24 real Ethiopian mezmur clips (one 60s excerpt each for all 12 major
// pentatonic keys). Only spectral peaks (not raw broadband energy) are
// counted, which avoids percussion/harmonic noise drowning out the melody
// and fixed a "dominant note mistaken for tonic" bias in earlier testing.
export const MIN_FREQ = 150;
export const MAX_FREQ = 1800;
export const PEAK_RANGE_DB = 20;
export const SILENCE_DB = -85;
export const BLOCK_MS = 4000;
export const DISPLAY_DECAY = 0.9;
export const TUNER_BUFFER_SIZE = 2048;

// A pitch reading is only trusted (and shown) once its autocorrelation
// clarity — how strongly the signal repeats at the detected period, 1.0
// being a pure tone — clears this bar. Talking, clapping, and other
// non-tonal noise score low and get ignored instead of jerking the needle.
export const TUNER_CLARITY_THRESHOLD = 0.92;
// Smooths the displayed cents/needle across frames so a single noisy
// sample can't yank the display; low enough to still feel responsive.
export const CENTS_SMOOTHING = 0.35;
// A block only casts a key-detector vote if its best pentatonic root
// captures this fraction of the block's total chroma energy. Below it,
// the block is too ambiguous (noise, percussion, silence) to trust —
// chance alone gives ~0.42 for a random 5-of-12 scale, so this must clear
// that by a real margin.
export const MIN_BLOCK_CONFIDENCE = 0.55;
