"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { OrnamentDivider } from "@/components/layout/ornament-divider";
import { MIC_SECTIONS, type SectionId } from "@/components/layout/nav-sections";
import { MicBar } from "@/components/audio/mic-bar";
import { Tuner } from "@/components/tuner/tuner";
import { KeyDetector } from "@/components/key-detector/key-detector";
import { PlaylistGrid } from "@/components/playlist/playlist-grid";
import { MezmurSection } from "@/components/mezmur/mezmur-section";

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionId>("tuner");

  return (
    <>
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />
      {MIC_SECTIONS.has(activeSection) && <MicBar />}

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {/*
          key={activeSection} forces a full remount on every section switch,
          which replays the initial->animate transition below — the same
          entry-animation effect AnimatePresence would give us, without its
          exit-animation bookkeeping (which, combined with Turbopack + React
          19 here, was leaving previous sections stuck in the DOM instead of
          unmounting — verified via headless DOM inspection, not a visual
          guess). A plain remount is simpler and gives up nothing since we
          never actually need an *exit* animation, just an entrance one.
        */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {activeSection === "tuner" && <Tuner />}
          {activeSection === "key" && <KeyDetector />}
          {activeSection === "playlist" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Mezmur, browsed by musical key. Tap a key to play its playlist.
              </p>
              <PlaylistGrid />
            </div>
          )}
          {activeSection === "mezmur" && <MezmurSection />}
        </motion.div>
      </main>

      <footer className="mt-auto">
        <OrnamentDivider />
        <p className="py-4 text-center font-heading text-sm text-muted-foreground">
          ዝማሬ · Zimare
        </p>
      </footer>
    </>
  );
}
