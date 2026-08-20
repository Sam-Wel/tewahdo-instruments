"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Mezmur } from "@/lib/constants";
import { apiCall, fetchAllMezmur } from "./admin-api";

export function AdminList({
  onEdit,
  refreshToken,
}: {
  onEdit: (entry: Mezmur) => void;
  refreshToken: number;
}) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Mezmur[]>([]);
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function refresh(currentSearch: string) {
    try {
      const data = await fetchAllMezmur(currentSearch.trim());
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    // Data-fetching effect (synchronizing with Supabase, an external
    // system) — not the "copy a prop into state" pattern the
    // set-state-in-effect rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(search);
    // refreshToken bumps after a save/delete to force a re-fetch, and is
    // intentionally the only trigger here — search changes are handled by
    // the debounced effect below, so `search` is deliberately left out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => refresh(search), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  async function handleDelete(entry: Mezmur) {
    try {
      await apiCall("DELETE", null, entry.id);
      refresh(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">Existing entries</h2>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No entries yet.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {rows.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{entry.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {(entry.topics || []).join(", ")} · {entry.language} · {entry.speed} ·{" "}
                  {entry.length}
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-1.5">
                <Button variant="outline" size="icon-sm" onClick={() => onEdit(entry)}>
                  <Pencil className="size-3.5" />
                  <span className="sr-only">Edit</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="destructive" size="icon-sm" />}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Delete</span>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete “{entry.title}”?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes the entry from the mezmur library. This cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(entry)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
