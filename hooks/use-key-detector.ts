"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "@/components/audio/audio-provider";
import { bestPentatonicRoot, extractFrameChroma } from "@/lib/chroma";
import {
  BLOCK_MS,
  DISPLAY_DECAY,
  MAJOR_PENTATONIC_OFFSETS,
  MIN_BLOCK_CONFIDENCE,
  NOTE_NAMES,
} from "@/lib/constants";

// Same imperative-DOM-write approach as useTuner, and for the same
// reason: chroma updates arrive every animation frame.
export function useKeyDetector() {
  const { subscribe } = useAudio();
  const keyNameRef = useRef<HTMLDivElement>(null);
  const keyConfidenceRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>(new Array(12).fill(null));

  const displayChroma = useRef(new Array(12).fill(0));
  const blockChroma = useRef(new Array(12).fill(0));
  const blockStartTime = useRef<number | null>(null);
  const votes = useRef(new Array(12).fill(0));

  useEffect(() => {
    function renderDisplay() {
      const totalVotes = votes.current.reduce((a, b) => a + b, 0);

      if (totalVotes === 0) {
        const [root, ratio] = bestPentatonicRoot(blockChroma.current);
        if (keyNameRef.current && keyConfidenceRef.current) {
          if (root === null) {
            keyNameRef.current.textContent = "--";
            keyConfidenceRef.current.textContent = "confidence: 0%";
          } else {
            keyNameRef.current.textContent = `${NOTE_NAMES[root]} Major (pentatonic)`;
            keyConfidenceRef.current.textContent = `confidence: ${Math.round(ratio * 100)}% (listening...)`;
          }
        }
      } else {
        let bestRoot = 0;
        for (let i = 1; i < 12; i++) {
          if (votes.current[i] > votes.current[bestRoot]) bestRoot = i;
        }
        const confidence = Math.round((votes.current[bestRoot] / totalVotes) * 100);
        if (keyNameRef.current && keyConfidenceRef.current) {
          keyNameRef.current.textContent = `${NOTE_NAMES[bestRoot]} Major (pentatonic)`;
          keyConfidenceRef.current.textContent = `confidence: ${confidence}% (${totalVotes} sample${totalVotes > 1 ? "s" : ""})`;
        }
      }

      const [displayRoot] = bestPentatonicRoot(displayChroma.current);
      const scaleTones = new Set(
        displayRoot === null ? [] : MAJOR_PENTATONIC_OFFSETS.map((o) => (displayRoot + o) % 12)
      );
      const maxVal = Math.max(...displayChroma.current, 1e-6);
      displayChroma.current.forEach((val, i) => {
        const bar = barRefs.current[i];
        if (!bar) return;
        const heightPx = Math.max(2, (val / maxVal) * 130);
        bar.style.height = `${heightPx}px`;
        bar.classList.toggle("bg-primary", scaleTones.has(i));
        bar.classList.toggle("bg-border", !scaleTones.has(i));
      });
    }

    function reset() {
      displayChroma.current = new Array(12).fill(0);
      blockChroma.current = new Array(12).fill(0);
      blockStartTime.current = null;
      votes.current = new Array(12).fill(0);
      renderDisplay();
    }
    reset();

    const unsubscribe = subscribe((_timeData, freqData, sampleRate, fftSize) => {
      if (blockStartTime.current === null) blockStartTime.current = performance.now();

      const frameEnergy = extractFrameChroma(freqData, sampleRate, fftSize);
      if (frameEnergy) {
        for (let i = 0; i < 12; i++) {
          blockChroma.current[i] += frameEnergy[i];
          displayChroma.current[i] =
            displayChroma.current[i] * DISPLAY_DECAY + frameEnergy[i] * (1 - DISPLAY_DECAY);
        }

        const now = performance.now();
        if (now - blockStartTime.current >= BLOCK_MS) {
          const [root, ratio] = bestPentatonicRoot(blockChroma.current);
          if (root !== null && ratio >= MIN_BLOCK_CONFIDENCE) votes.current[root]++;
          blockChroma.current = new Array(12).fill(0);
          blockStartTime.current = now;
        }
      }

      renderDisplay();
    });

    return () => {
      unsubscribe();
      reset();
    };
  }, [subscribe]);

  return { keyNameRef, keyConfidenceRef, barRefs };
}
