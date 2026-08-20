# ዝማሬ · Zimare

A tuner, Ethiopian pentatonic key detector, and mezmur companion, built with Next.js, Tailwind CSS, shadcn/ui, and the Web Audio API.

## Features

- **Tuner** — real-time pitch detection (autocorrelation, with a clarity gate that ignores non-tonal noise) with note name, Hz, cents-off display, and a needle gauge that shades green→red with tuning accuracy.
- **Key Detector** — listens live and identifies the major pentatonic key of what's being played (e.g. F major = F G A C D), by matching a running chroma histogram against the major pentatonic interval pattern across all 12 possible roots, with confidence-gated block voting. Minor and other Ethiopian qenet (Tizita, Bati, Ambassel, Anchihoye) are not implemented yet.
- **Mezmur Playlist** — mezmur browsed by musical key, playing inline via YouTube playlists.
- **Mezmur** — a searchable, filterable lyrics library (theme, language, speed, length) backed by Supabase, with an admin CRUD page at `/admin`.

The Tuner and Key Detector share a single microphone stream/`AudioContext` (see `components/audio/audio-provider.tsx`).

## Running locally

```
npm install
npm run dev
```

Then open `http://localhost:3000` and click "Start Microphone".

## Environment variables

See `.env.local` (not committed) — needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_PASSWORD`.
