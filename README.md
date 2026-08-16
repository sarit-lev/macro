# Macro — one-tap nutrition logger

A small, fast, offline-first PWA for logging calories + protein from a personal food
database. Built mobile-first for iPhone (add to home screen). Bilingual (Hebrew / English),
RTL-aware. No backend, no login, no tracking — data lives on the device (IndexedDB).

Design language: the labs.google system (cream ground, soft-charcoal ink, Onest type,
flat geometric shapes).

## What it does
- **One-tap logging** of repeat meals from a frequency-ranked tile grid.
- **Live daily rings** — protein and calories vs editable targets (fresh install starts at
  1400 kcal / 150 g; a stored value always wins).
- **Food database** of ~55 seeded Israeli/protein-forward foods + combos; add/edit your own.
- **Ask about a dish**: describe it in Hebrew in "add food" and the Claude Messages API fills
  kcal, protein, carbs, fat, serving and category. Estimates are labelled with a confidence
  level; nothing saves until you confirm. Needs your own API key (Settings), stored on-device.
- **Paste-parse**: paste a Gemini/Claude reply into "add food" and it pulls out kcal + protein.
- **Undo**, per-entry quantity, day navigation.
- **Backup**: one-tap share to Files/Drive, optional daily auto-backup to Google Drive, and
  JSON export/import.
- **Offline**: installs to the home screen and works with no network (service worker). The ask
  box hides without a key or a connection; everything else keeps working.

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
- **foods**: `{id, name_he, name_en, kcal, protein_g, carbs_g?, fat_g?, serving_label, kind, components, category, favorite, use_count, last_used}` — `carbs_g`/`fat_g` are optional; unset means *unknown*, which is not the same as 0. They are captured but deliberately not shown on the main screen, so the seeded foods can't render a misleading zero.
- **days**: `{date, entries:[{eid, food_id, name_he, name_en, kcal, protein, carbs, fat, qty, at}]}` — macros are snapshotted at log time, so editing a food never rewrites history.
- **meta/settings**: targets + language. Included in every backup.
- **meta/secrets**: Anthropic API key, model, Google OAuth client ID, Drive file id + last-backup time. **Never** serialised into a backup, a share sheet, or Drive — `buildBackup()` is the single place a payload is built and it never reads this record.

Adding `carbs_g`/`fat_g` needed no `DB_VER` bump: IndexedDB object stores are schemaless, so
records simply gained fields. Bump `DB_VER` only for a new store or index.

## Setup for the optional bits
Both are off until configured, and the app works fully without either.

- **Ask about a dish** — needs an Anthropic API key with credit at
  [console.anthropic.com](https://console.anthropic.com) (a Claude subscription does *not*
  cover API usage). Paste it into Settings; it stays in this device's IndexedDB. Default
  model is `claude-opus-5`, editable in Settings.
- **Google Drive backup** — create an OAuth 2.0 Client ID (type *Web application*) in a
  Google Cloud project with authorized JavaScript origin `https://<user>.github.io`, and
  paste the client ID into Settings. The client ID is public by design, so unlike the API
  key it is safe to commit. Scope is `drive.file`, so the app only ever sees the one backup
  file it created. Note a browser client gets no refresh token: the access token lasts about
  an hour, so occasional reconnecting is expected — the share-sheet export is the fallback
  that always works, offline and without auth.

## Roadmap
- **Phase 2 — weekly sync to the vault + Coach.** Now that the daily log lands in Drive, a
  local `/nutrition-sync` command on the Mac can pull it into the Obsidian `20 Health/Logs/`
  notes, so the Coach agent reads real per-day protein/kcal. Health data stays local.
- **Phase 3 — photo funnel.** Extend the ask box to accept a photo of a label or plate.

Personal project. Contains no health data in source — the database of *what was eaten* lives
only on-device and (later) in the local Obsidian vault.
