"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type FrameCallback = (
  timeData: Float32Array,
  freqData: Float32Array,
  sampleRate: number,
  fftSize: number
) => void;

interface AudioContextValue {
  isListening: boolean;
  status: string;
  start: () => void;
  subscribe: (cb: FrameCallback) => () => void;
}

const Ctx = createContext<AudioContextValue | null>(null);

// Owns a single microphone stream + AudioContext + AnalyserNode, shared by
// the Tuner and Key Detector so switching between them doesn't re-request
// mic permission or restart analysis. Runs one requestAnimationFrame loop
// that fans analyser data out to whichever components are subscribed
// (i.e. currently mounted), rather than each component running its own loop.
export function AudioProvider({ children }: { children: ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Microphone not started");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timeDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const freqDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const callbacksRef = useRef<Set<FrameCallback>>(new Set());
  const rafRef = useRef<number | null>(null);

  // Initialized once (not reassigned on every render) — its body only
  // reads other refs at call time, so a single stable closure is enough.
  // Held in a ref rather than a plain function/useCallback so the
  // recursive requestAnimationFrame scheduling can call it without
  // referencing a `const` before its own binding is guaranteed assigned.
  const loopRef = useRef<() => void>(() => {
    const analyser = analyserRef.current;
    const audioCtx = audioCtxRef.current;
    const timeData = timeDataRef.current;
    const freqData = freqDataRef.current;
    if (analyser && audioCtx && timeData && freqData) {
      analyser.getFloatTimeDomainData(timeData);
      analyser.getFloatFrequencyData(freqData);
      callbacksRef.current.forEach((cb) =>
        cb(timeData, freqData, audioCtx.sampleRate, analyser.fftSize)
      );
    }
    rafRef.current = requestAnimationFrame(() => loopRef.current());
  });

  const start = useCallback(async () => {
    if (audioCtxRef.current) return;
    try {
      setStatus("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextCtor();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      timeDataRef.current = new Float32Array(analyser.fftSize);
      freqDataRef.current = new Float32Array(analyser.frequencyBinCount);

      setStatus("Listening");
      setIsListening(true);
      rafRef.current = requestAnimationFrame(() => loopRef.current());
    } catch (err) {
      setStatus("Microphone access denied");
      console.error(err);
    }
  }, []);

  const subscribe = useCallback((cb: FrameCallback) => {
    callbacksRef.current.add(cb);
    return () => callbacksRef.current.delete(cb);
  }, []);

  return (
    <Ctx.Provider value={{ isListening, status, start, subscribe }}>{children}</Ctx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAudio must be used within an AudioProvider");
  return ctx;
}
