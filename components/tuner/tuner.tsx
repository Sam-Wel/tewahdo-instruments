"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTuner } from "@/hooks/use-tuner";

export function Tuner() {
  const { noteNameRef, noteFreqRef, centsRef, needleRef } = useTuner();

  return (
    <Card className="mx-auto max-w-md border-border bg-card">
      <CardContent className="flex flex-col items-center gap-4 py-6">
        <div className="text-center">
          <div
            ref={noteNameRef}
            className="font-heading text-6xl font-bold leading-none text-primary transition-colors duration-150"
          >
            --
          </div>
          <div ref={noteFreqRef} className="mt-2 text-sm text-muted-foreground">
            0.0 Hz
          </div>
        </div>

        <svg viewBox="0 0 200 110" className="w-full max-w-[280px]">
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke="var(--border)"
            strokeWidth="6"
          />
          <line
            ref={needleRef}
            x1="100"
            y1="100"
            x2="100"
            y2="20"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ transformOrigin: "100px 100px", transition: "transform 80ms linear, stroke 150ms linear" }}
          />
          <circle cx="100" cy="100" r="5" fill="var(--primary)" />
        </svg>
        <div className="flex w-full max-w-[280px] justify-between text-xs text-muted-foreground">
          <span>-50c</span>
          <span>in tune</span>
          <span>+50c</span>
        </div>

        <div ref={centsRef} className="text-lg font-semibold text-primary transition-colors duration-150">
          0 cents
        </div>
      </CardContent>
    </Card>
  );
}
