// Mezmur playlists by major pentatonic key (YouTube playlist IDs).
const KEY_PLAYLISTS = [
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
];

// Mezmur lyrics now live in Supabase (public read via anon key + RLS,
// writes gated behind /api/mezmur + the admin password). The anon key is
// safe to expose client-side by design — it only grants what the RLS
// policies allow, which is read-only SELECT on the mezmur table.
const SUPABASE_URL = "https://lrmdiaokkuaoitwxlnqp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybWRpYW9ra3Vhb2l0d3hsbnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjUyNTUsImV4cCI6MjEwMTc0MTI1NX0.KvNft82LPv1wL84t3Avuzw6PPJR3lv8GZaYVRzNywUk";
