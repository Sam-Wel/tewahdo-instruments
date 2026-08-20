"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useKeyDetector } from "@/hooks/use-key-detector";
import { NOTE_NAMES } from "@/lib/constants";

export function KeyDetector() {
  const { keyNameRef, keyConfidenceRef, barRefs } = useKeyDetector();

  return (
    <Card className="mx-auto max-w-md border-border bg-card">
      <CardContent className="flex flex-col items-center gap-5 py-6">
        <div className="text-center">
          <div
            ref={keyNameRef}
            className="font-heading text-2xl font-bold text-primary"
          >
            --
          </div>
          <div ref={keyConfidenceRef} className="mt-1 text-sm text-muted-foreground">
            confidence: 0%
          </div>
        </div>

        <div className="flex h-[150px] w-full items-end justify-center gap-1.5">
          {NOTE_NAMES.map((name, i) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <div className="flex h-[130px] w-4 items-end">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                  className="w-full rounded-t bg-border transition-[height] duration-100"
                  style={{ height: "2px" }}
                />
              </div>
              <span className="text-[0.65rem] text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Currently detects <strong className="text-foreground">major pentatonic</strong> only
          (e.g. F major = F G A C D). Minor and other Ethiopian qenet (Tizita, Bati, Ambassel,
          Anchihoye) are coming later.
        </p>
      </CardContent>
    </Card>
  );
}
