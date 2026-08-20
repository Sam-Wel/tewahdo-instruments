"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "@/components/audio/audio-provider";
import { autoCorrelate, tuningColor } from "@/lib/pitch";
import {
  CENTS_SMOOTHING,
  NOTE_NAMES,
  TUNER_BUFFER_SIZE,
  TUNER_CLARITY_THRESHOLD,
} from "@/lib/constants";

// Drives the tuner display imperatively (direct DOM writes on refs) rather
// than through React state, since pitch readings arrive every animation
// frame (~60Hz) and routing that through setState would re-render the
// whole tree 60 times a second for no benefit — the same tradeoff the
// original vanilla implementation made.
export function useTuner() {
  const { subscribe } = useAudio();
  const noteNameRef = useRef<HTMLDivElement>(null);
  const noteFreqRef = useRef<HTMLDivElement>(null);
  const centsRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<SVGLineElement>(null);
  const smoothedCentsRef = useRef<number | null>(null);

  useEffect(() => {
    function reset() {
      smoothedCentsRef.current = null;
      if (noteNameRef.current) {
        noteNameRef.current.textContent = "--";
        noteNameRef.current.style.color = "";
      }
      if (noteFreqRef.current) noteFreqRef.current.textContent = "0.0 Hz";
      if (centsRef.current) {
        centsRef.current.textContent = "0 cents";
        centsRef.current.style.color = "";
      }
      if (needleRef.current) {
        needleRef.current.style.stroke = "";
        needleRef.current.style.transform = "rotate(0deg)";
      }
    }
    reset();

    const unsubscribe = subscribe((timeData, _freqData, sampleRate) => {
      const buf = timeData.subarray(0, TUNER_BUFFER_SIZE);
      const { freq, clarity } = autoCorrelate(buf, sampleRate);
      if (freq === -1 || clarity < TUNER_CLARITY_THRESHOLD) {
        reset();
        return;
      }

      const noteNum = Math.round(12 * Math.log2(freq / 440) + 69);
      const noteFreq = 440 * Math.pow(2, (noteNum - 69) / 12);
      const cents = Math.floor(1200 * Math.log2(freq / noteFreq));
      const name = NOTE_NAMES[((noteNum % 12) + 12) % 12];

      smoothedCentsRef.current =
        smoothedCentsRef.current === null
          ? cents
          : smoothedCentsRef.current + (cents - smoothedCentsRef.current) * CENTS_SMOOTHING;
      const smoothedCents = smoothedCentsRef.current;
      const displayCents = Math.round(smoothedCents);
      const color = tuningColor(smoothedCents);

      if (noteNameRef.current) {
        noteNameRef.current.textContent = name;
        noteNameRef.current.style.color = color;
      }
      if (noteFreqRef.current) noteFreqRef.current.textContent = `${freq.toFixed(1)} Hz`;
      if (centsRef.current) {
        centsRef.current.textContent = `${displayCents > 0 ? "+" : ""}${displayCents} cents`;
        centsRef.current.style.color = color;
      }
      if (needleRef.current) {
        const clamped = Math.max(-50, Math.min(50, smoothedCents));
        const angle = (clamped / 50) * 90;
        needleRef.current.style.transform = `rotate(${angle}deg)`;
        needleRef.current.style.stroke = color;
      }
    });

    return () => {
      unsubscribe();
      reset();
    };
  }, [subscribe]);

  return { noteNameRef, noteFreqRef, centsRef, needleRef };
}
