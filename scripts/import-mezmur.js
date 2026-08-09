#!/usr/bin/env node
// Bulk-import mezmur entries from a plain-text file into Supabase.
// Not tied to any specific book — it just parses the text format
// documented in mezmur-import-template.txt.
//
// Usage:
//   node scripts/import-mezmur.js path/to/file.txt --dry-run   (preview only)
//   node scripts/import-mezmur.js path/to/file.txt             (actually insert)
//
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local in the
// project root (same file `vercel env pull` writes to).

const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
  return env;
}

// Parses the plain-text import format into an array of entries:
// { title, topics: [...], language, speed, length, media_url, lyrics }
function parseImportFile(text) {
  const lines = text.split(/\r?\n/);
  const entries = [];
  const errors = [];

  let currentTheme = null;
  let defaultLanguage = "Amharic";
  let defaultSpeed = "medium";
  let defaultLength = "short";

  let inEntry = false;
  let inLyrics = false;
  let entry = null;
  let lyricsLines = [];

  function finishEntry(lineNo) {
    if (!entry) return;
    if (!entry.title) errors.push(`Line ${lineNo}: entry has no TITLE`);
    if (lyricsLines.length === 0) errors.push(`Line ${lineNo}: "${entry.title || "(untitled)"}" has no lyrics`);
    entry.lyrics = lyricsLines.join("\n").trim();
    if (!entry.topics || entry.topics.length === 0) {
      entry.topics = currentTheme ? [currentTheme] : [];
    }
    if (entry.topics.length === 0) errors.push(`Line ${lineNo}: "${entry.title}" has no theme (no THEME: set and no THEMES: override)`);
    entries.push(entry);
    entry = null;
    lyricsLines = [];
    inEntry = false;
    inLyrics = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i];
    const line = raw.trim();

    if (line.startsWith("#")) continue;

    if (inLyrics) {
      if (line === "---") {
        finishEntry(lineNo);
        continue;
      }
      lyricsLines.push(raw);
      continue;
    }

    if (line === "---") continue;

    if (line.startsWith("THEME:")) {
      currentTheme = line.slice("THEME:".length).trim();
      continue;
    }
    if (line.startsWith("LANGUAGE:") && !inEntry) {
      defaultLanguage = line.slice("LANGUAGE:".length).trim();
      continue;
    }
    if (line.startsWith("SPEED:") && !inEntry) {
      defaultSpeed = line.slice("SPEED:".length).trim();
      continue;
    }
    if (line.startsWith("LENGTH:") && !inEntry) {
      defaultLength = line.slice("LENGTH:".length).trim();
      continue;
    }
    if (line.startsWith("TITLE:")) {
      inEntry = true;
      entry = {
        title: line.slice("TITLE:".length).trim(),
        topics: [],
        language: defaultLanguage,
        speed: defaultSpeed,
        length: defaultLength,
        media_url: null,
      };
      continue;
    }
    if (inEntry && line.startsWith("THEMES:")) {
      entry.topics = line.slice("THEMES:".length).trim().split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    if (inEntry && line.startsWith("LANGUAGE:")) {
      entry.language = line.slice("LANGUAGE:".length).trim();
      continue;
    }
    if (inEntry && line.startsWith("SPEED:")) {
      entry.speed = line.slice("SPEED:".length).trim();
      continue;
    }
    if (inEntry && line.startsWith("LENGTH:")) {
      entry.length = line.slice("LENGTH:".length).trim();
      continue;
    }
    if (inEntry && line.startsWith("MEDIA:")) {
      entry.media_url = line.slice("MEDIA:".length).trim();
      continue;
    }
    if (inEntry && line === "LYRICS:") {
      inLyrics = true;
      continue;
    }
  }
  if (inEntry) finishEntry(lines.length);

  return { entries, errors };
}

async function insertBatch(supabaseUrl, serviceKey, entries) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/mezmur`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(entries),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Insert failed (${resp.status}): ${text}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");

  if (!filePath) {
    console.error("Usage: node scripts/import-mezmur.js <file.txt> [--dry-run]");
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const text = fs.readFileSync(filePath, "utf8");
  const { entries, errors } = parseImportFile(text);

  const themeCounts = {};
  for (const e of entries) {
    for (const t of e.topics) themeCounts[t] = (themeCounts[t] || 0) + 1;
  }

  console.log(`Parsed ${entries.length} entries from ${filePath}`);
  console.log("By theme:");
  for (const [theme, count] of Object.entries(themeCounts)) {
    console.log(`  ${theme}: ${count}`);
  }
  if (errors.length > 0) {
    console.log(`\n${errors.length} problem(s) found:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  if (dryRun) {
    console.log("\nDry run — nothing was inserted. Re-run without --dry-run to import.");
    return;
  }
  if (errors.length > 0) {
    console.error("\nFix the problems above before importing (or they'll be skipped/invalid).");
    process.exit(1);
  }
  if (entries.length === 0) {
    console.log("Nothing to import.");
    return;
  }

  const env = loadEnvLocal();
  const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (expected in .env.local).");
    process.exit(1);
  }

  const BATCH_SIZE = 50;
  let inserted = 0;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    await insertBatch(supabaseUrl, serviceKey, batch);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${entries.length}...`);
  }

  console.log(`\nDone. Imported ${inserted} entries.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
