"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDistinctTopics, fetchMezmur } from "@/lib/supabase";
import { LANGUAGES, LENGTHS, SPEEDS, type Mezmur } from "@/lib/constants";
import { FilterDropdown, type FilterGroupDef } from "./filter-dropdown";
import { MezmurCard } from "./mezmur-card";

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

function useToggleSet(initial: string[] = []) {
  const [values, setValues] = useState<string[]>(initial);
  const toggle = useCallback(
    (v: string) => setValues((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])),
    []
  );
  return [values, toggle] as const;
}

export function MezmurSection() {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopics, toggleTopic] = useToggleSet();
  const [selectedLanguages, toggleLanguage] = useToggleSet();
  const [selectedSpeeds, toggleSpeed] = useToggleSet();
  const [selectedLengths, toggleLength] = useToggleSet();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("title.asc");

  const [rows, setRows] = useState<Mezmur[] | null>(null);
  const [error, setError] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    fetchDistinctTopics()
      .then(setTopics)
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  useEffect(() => {
    // Data-fetching effect (synchronizing with Supabase) — resetting to a
    // loading state before the async fetch is the standard pattern here,
    // not the "copy a prop into state" case set-state-in-effect targets.
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(null);
    setError(false);
    fetchMezmur({
      topics: new Set(selectedTopics),
      languages: new Set(selectedLanguages),
      speeds: new Set(selectedSpeeds),
      lengths: new Set(selectedLengths),
      search: debouncedSearch,
      sort,
    })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTopics, selectedLanguages, selectedSpeeds, selectedLengths, debouncedSearch, sort]);

  const filterGroups: FilterGroupDef[] = useMemo(
    () => [
      { key: "theme", label: "Theme", values: topics, selected: selectedTopics, onToggle: toggleTopic },
      {
        key: "language",
        label: "Language",
        values: LANGUAGES,
        selected: selectedLanguages,
        onToggle: toggleLanguage,
      },
      {
        key: "speed",
        label: "Speed",
        values: SPEEDS,
        selected: selectedSpeeds,
        onToggle: toggleSpeed,
        labelFor: capitalize,
      },
      {
        key: "length",
        label: "Length",
        values: LENGTHS,
        selected: selectedLengths,
        onToggle: toggleLength,
        labelFor: capitalize,
      },
    ],
    [
      topics,
      selectedTopics,
      selectedLanguages,
      selectedSpeeds,
      selectedLengths,
      toggleTopic,
      toggleLanguage,
      toggleSpeed,
      toggleLength,
    ]
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Lyrics, organized by theme, language, and tempo.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sort} onValueChange={(value) => value && setSort(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title.asc">Title A–Z</SelectItem>
            <SelectItem value="title.desc">Title Z–A</SelectItem>
            <SelectItem value="created_at.desc">Newest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <FilterDropdown groups={filterGroups} />
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Could not load mezmur right now. Try again shortly.
        </p>
      )}

      {rows === null && !error && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {rows !== null && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No mezmur match this filter yet.
        </div>
      )}

      <AnimatePresence initial={false}>
        {rows !== null && rows.length > 0 && (
          <motion.div
            className="flex flex-col gap-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          >
            {rows.map((m) => (
              <motion.div
                key={m.id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              >
                <MezmurCard mezmur={m} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
