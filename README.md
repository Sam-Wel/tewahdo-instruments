# Tewahdo Instruments

A browser-based chromatic tuner and Ethiopian pentatonic key detector, built with plain HTML/CSS/JS and the Web Audio API. No build step, no dependencies.

## Features

- **Tuner** — real-time pitch detection (autocorrelation) with note name, Hz, cents-off display, and a needle gauge.
- **Key Detector** — listens live and identifies the major pentatonic key of what's being played (e.g. F major = F G A C D), by matching a running chroma histogram against the major pentatonic interval pattern across all 12 possible roots. Minor and other Ethiopian qenet (Tizita, Bati, Ambassel, Anchihoye) are not implemented yet.

Both modes share a single microphone stream/`AudioContext`.

## Running locally

```
python3 -m http.server
```

Then open `http://localhost:8000` and click "Start Microphone".
