"use client";

import { Mic, MicVocal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudio } from "./audio-provider";

export function MicBar() {
  const { isListening, status, start } = useAudio();

  return (
    <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 px-4 py-4">
      <Button onClick={start} disabled={isListening} size="lg" className="gap-2">
        {isListening ? <MicVocal className="size-4" /> : <Mic className="size-4" />}
        {isListening ? "Microphone Active" : "Start Microphone"}
      </Button>
      <span className="text-sm text-muted-foreground">{status}</span>
    </div>
  );
}
