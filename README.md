# ApplyApp — Personal Job Search Tracker

A local-first web app to track job applications during your search. Runs on `localhost`, no accounts, no deployment needed.

## Prerequisites

- Node.js 18+
- npm

## Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Where your data lives

```
db/applyapp.sqlite
```

SQLite file, created automatically on first run. All data persists between server restarts.

## Backing up your data

```bash
cp db/applyapp.sqlite db/applyapp.sqlite.bak
```

Or to a dated backup:

```bash
cp db/applyapp.sqlite "db/backup-$(date +%Y%m%d).sqlite"
```

The `db/` directory is gitignored so your data won't be committed accidentally.

## What's built

| Page | What it does |
|------|-------------|
| `/` | Dashboard: status counters, upcoming interviews, stale applications, recent activity |
| `/applications` | Table of all applications, filterable by status, searchable |
| `/applications/[id]` | Application detail: overview, job description, interviews, take-homes, notes, status history |
| `/applications/[id]/interviews/[id]` | Full interview round form: prep notes, questions asked, performance notes, outcome |
| `/applications/[id]/takehomes/[id]` | Take-home assignment form: prompt, solution URL, reflection |
| `/companies` | Company list |
| `/companies/[id]` | Company detail with all linked applications |
| `/calendar` | Month grid showing interview and deadline dates |
| `/search` | Full-text search across companies, roles, job descriptions, interview notes |

## Decisions noted

- **Notes field on applications**: Added a free-form `notes` column to the `applications` table to support the Notes tab on the detail page (the original schema didn't list it explicitly but the UI required it).
- **No loading skeletons**: Plain "Loading…" text used as specified.
- **Calendar library**: Pure CSS grid — no external calendar library needed.
- **Status filter persistence**: Stored in `localStorage` so filters survive reload.
- **Dark mode**: Defaults to system preference via `next-themes`.
