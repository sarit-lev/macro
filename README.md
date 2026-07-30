# Macro — one-tap nutrition logger

A small, fast, offline-first PWA for logging calories + protein from a personal food
database. Built mobile-first for iPhone (add to home screen). Bilingual (Hebrew / English),
RTL-aware. No backend, no login, no tracking — data lives on the device (IndexedDB).

Design language: the labs.google system (cream ground, soft-charcoal ink, Onest type,
flat geometric shapes).

## What it does
- **One-tap logging** of repeat meals from a frequency-ranked tile grid.
- **Live daily rings** — protein and calories vs editable targets (default 1200 kcal / 105 g).
- **Food database** of ~55 seeded Israeli/protein-forward foods + combos; add/edit your own.
- **Paste-parse**: paste a Gemini/Claude reply into "add food" and it pulls out kcal + protein.
- **Undo**, per-entry quantity, day navigation, JSON export/import backup.
- **Offline**: installs to the home screen and works with no network (service worker).

## Run locally
```bash
cd ~/Developer/macro
python3 -m http.server 8765
# open http://127.0.0.1:8765
```
Must be served over http(s), not opened as a `file://` (the seed DB is fetched).

## Structure
```
index.html              app shell (markup + i18n hooks)
styles.css              bespoke mobile styles on labs tokens
app.js                  logic: IndexedDB, logging, rings, add/edit, export/import
assets/labs-font.css    embedded Onest (LabsSans) font
data/seed-foods.json    initial bilingual food database
manifest.webmanifest    PWA manifest
sw.js                   service worker (offline shell; bump CACHE to ship updates)
icons/                  app icons (512 / 192 / 180)
```

## Data model
- **foods**: `{id, name_he, name_en, kcal, protein_g, serving_label, kind, components, category, favorite, use_count, last_used}`
- **days**: `{date, entries:[{eid, food_id, name_he, name_en, kcal, protein, qty, at}]}` — macros are snapshotted at log time, so editing a food never rewrites history.
- **meta/settings**: targets + language.

## Roadmap
- **Phase 2 — weekly sync to the vault + Coach.** Export the daily log into the Obsidian
  `20 Health/Logs/` notes (via Google Drive + a local `/nutrition-sync` command on the Mac),
  so the Coach agent reads real per-day protein/kcal. Health data stays local.
- **Phase 3 — photo funnel.** Deeper paste-parse + a prompt-handoff button so a new food
  photographed and read in the chat app becomes a permanent one-tap tile.

Personal project. Contains no health data in source — the database of *what was eaten* lives
only on-device and (later) in the local Obsidian vault.
