"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { KEY_PLAYLISTS } from "@/lib/constants";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function PlaylistGrid() {
  const [playing, setPlaying] = useState<Set<string>>(new Set());

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
    >
      {KEY_PLAYLISTS.map(({ key, label, playlistId }) => (
        <motion.div key={key} variants={item}>
          {playing.has(key) ? (
            <div className="aspect-video overflow-hidden rounded-xl border border-border">
              <iframe
                src={`https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1`}
                title={`${label} mezmur playlist`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPlaying((prev) => new Set(prev).add(key))}
              className="group flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary hover:bg-muted"
            >
              <span className="font-heading text-2xl font-bold text-primary">{key}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                {label} <Play className="size-3" />
              </span>
            </button>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
