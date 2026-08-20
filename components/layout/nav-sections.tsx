import { BookOpenText, KeyRound, ListMusic, Music2 } from "lucide-react";

export type SectionId = "tuner" | "key" | "playlist" | "mezmur";

export interface NavSection {
  id: SectionId;
  label: string;
  icon: typeof Music2;
}

export const NAV_SECTIONS: NavSection[] = [
  { id: "tuner", label: "Tuner", icon: Music2 },
  { id: "key", label: "Key Detector", icon: KeyRound },
  { id: "playlist", label: "Mezmur Playlist", icon: ListMusic },
  { id: "mezmur", label: "Mezmur", icon: BookOpenText },
];

// Sections that need microphone access — the mic bar only shows for these.
export const MIC_SECTIONS = new Set<SectionId>(["tuner", "key"]);
