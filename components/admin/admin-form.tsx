"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, LENGTHS, SPEEDS, type Mezmur } from "@/lib/constants";
import { apiCall } from "./admin-api";

const emptyForm = {
  title: "",
  topics: "",
  language: LANGUAGES[0] as string,
  speed: SPEEDS[1] as string, // medium
  length: LENGTHS[0] as string, // short
  mediaUrl: "",
  lyrics: "",
};

function formFromEntry(entry: Mezmur) {
  return {
    title: entry.title,
    topics: (entry.topics || []).join(", "),
    language: entry.language,
    speed: entry.speed,
    length: entry.length,
    mediaUrl: entry.media_url || "",
    lyrics: entry.lyrics,
  };
}

export function AdminForm({
  editingEntry,
  onSaved,
  onCancelEdit,
}: {
  editingEntry: Mezmur | null;
  onSaved: () => void;
  onCancelEdit: () => void;
}) {
  // The parent remounts this component (via `key`) whenever editingEntry
  // changes identity, so a lazy initializer is enough to seed the form —
  // no effect needed to keep resyncing it.
  const [form, setForm] = useState(() => (editingEntry ? formFromEntry(editingEntry) : emptyForm));
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("Saving...");
    const payload = {
      title: form.title.trim(),
      topics: form.topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      language: form.language,
      speed: form.speed,
      length: form.length,
      media_url: form.mediaUrl.trim() || null,
      lyrics: form.lyrics,
    };
    try {
      if (editingEntry) {
        await apiCall("PUT", { id: editingEntry.id, ...payload });
      } else {
        await apiCall("POST", payload);
      }
      setStatus("Saved.");
      setForm(emptyForm);
      onSaved();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
    >
      <h2 className="font-heading text-lg font-semibold text-foreground">
        {editingEntry ? `Edit: ${editingEntry.title}` : "Add mezmur"}
      </h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fTitle">Title</Label>
        <Input
          id="fTitle"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fTopic">
          Themes / topics (comma-separated, a mezmur can have more than one)
        </Label>
        <Input
          id="fTopic"
          required
          placeholder="e.g. Praise, St. Mary"
          value={form.topics}
          onChange={(e) => setForm((f) => ({ ...f, topics: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fLanguage">Language</Label>
          <Select
            value={form.language}
            onValueChange={(v) => v && setForm((f) => ({ ...f, language: v }))}
          >
            <SelectTrigger id="fLanguage" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fSpeed">Speed</Label>
          <Select value={form.speed} onValueChange={(v) => v && setForm((f) => ({ ...f, speed: v }))}>
            <SelectTrigger id="fSpeed" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEEDS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fLength">Length</Label>
          <Select value={form.length} onValueChange={(v) => v && setForm((f) => ({ ...f, length: v }))}>
            <SelectTrigger id="fLength" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LENGTHS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l[0].toUpperCase() + l.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fMedia">Recording / YouTube link (optional)</Label>
        <Input
          id="fMedia"
          type="url"
          placeholder="https://..."
          value={form.mediaUrl}
          onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fLyrics">Lyrics</Label>
        <Textarea
          id="fLyrics"
          required
          className="min-h-36 whitespace-pre-wrap"
          value={form.lyrics}
          onChange={(e) => setForm((f) => ({ ...f, lyrics: e.target.value }))}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {editingEntry ? "Update" : "Save"}
        </Button>
        {editingEntry && (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel edit
          </Button>
        )}
      </div>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </form>
  );
}
