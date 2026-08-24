# Agent Instructions — Stone Dragon Media Website

This file is the source of truth for AI coding agents working in this repo. `CLAUDE.md` just points
here — keep this file, not that one, up to date. `README.md` is the human-facing companion; when you
change something documented in both, change both.

## What this project is

The website for Stone Dragon Media, LLC, a web design and digital strategy agency based in Sandusky,
Ohio, live at [stonedragonmedia.com](https://stonedragonmedia.com). It is two things in one Astro app:

1. **Marketing site** (`/`, `/about`, `/services`, `/products`, `/work`, `/contact`, `/thank-you`,
   `/privacy-policy`, `/sitemap`, `/404`) — prerendered to static HTML at build time.
2. **Client portal + admin** (`/login`, `/dashboard/*`, `/admin/*`, `/api/*`) — server-rendered per
   request, backed by Cloudflare D1.

Astro 6, TypeScript, `output: 'server'` via `@astrojs/cloudflare`. No UI framework — everything is
`.astro` with inline `<style>`/`<script>`.

## Commands

```bash
npm install                # install deps (Node >= 22.12.0)
npm run dev:astro          # fast dev server, hot reload — marketing pages only, no D1/auth/sitemap
npm run dev                # full Cloudflare runtime via wrangler dev (D1, cookies, auth)
                           #   builds first; NO hot reload — re-run after each change
npm run build              # astro build + fix-wrangler.js -> dist/
npm run d1:migrate:local   # apply migrations/*.sql to local D1
npm run d1:migrate:remote  # apply migrations/*.sql to production D1
npm run cf:types           # regenerate worker-configuration.d.ts
```

Always run `npm run build` after non-trivial changes. For anything touching `/dashboard`, `/admin`,
or auth, also exercise the real flow via `npm run dev` — `astro check`/`build` won't catch a broken
redirect or missing D1 binding.

`scripts/seed-local.mjs` generates local test-data SQL (real PBKDF2 hashes) and is **not** wired into
`package.json` — pipe its output into `npx wrangler d1 execute sdm-db --local`. Local only.

**`npm run preview` is broken** (`astro preview` → "No build output found") because `astro.config.mjs`
sets `build.client`/`build.server` to a layout the adapter's preview doesn't expect — those paths are
what produce the Pages-compatible `_worker.js/`, so don't "fix" this by changing them. Serve `dist/`
with a static file server, or use `npm run dev`, instead.

## Deployment

- Cloudflare **Pages** project `sdm`, git-integrated with GitHub `jmusick/SDM`. Pushing to `master`
  auto-deploys. A manual `wrangler pages deploy dist --project-name=sdm` works but registers as a
  "direct upload" rather than a commit-tied deployment.
- **Git-integrated Pages builds do not read bindings from `wrangler.toml`.** The D1 binding must be
  added in the Cloudflare dashboard (Pages project → Settings → Bindings → D1, variable `DB`), taking
  effect on the *next* deploy. If portal routes 500 after a schema/config change, check this first.
- `fix-wrangler.js` runs at the end of every build: deletes `.wrangler/deploy/config.json` and
  `dist/_worker.js/wrangler.json`, writes `dist/_worker.js/index.js` re-exporting `entry.mjs`.
- **`wrangler.toml` has no `main` field, deliberately** — adding one breaks `astro build` (the
  Cloudflare Vite plugin resolves it against a not-yet-existing build path). `npm run dev` passes the
  worker entry and `--assets dist` as CLI flags instead.

## Portal / admin architecture

- **Every new marketing page must be prerendered** (`export const prerender = true;`) or it runs
  through the Worker on every request. Only `/login`, `/dashboard/*`, `/admin/*`, `/api/*` are dynamic.
- **Auth guards return, never throw.** `src/lib/http.ts`'s `ensureRole`/`requireUser`/
  `ensureClientContext` return a redirect `Response` on failure — a *thrown* one isn't caught by the
  renderer. Every call site must do `if (result instanceof Response) return result;`.
- **D1 access** goes through `src/lib/db.ts`'s `ensureDB(locals)` (`cloudflare:workers`' `env`, not
  `Astro.locals.runtime.env`). `src/middleware.ts` resolves session/user/impersonated client on every
  request. SQL lives in `src/lib/{auth,clients,db,http,invoices,notes,projects,tasks,timeEntries,
  tickets,users}.ts`, not in pages.
- **Auth model**: `users` holds both `admin`/`client` roles; `clients` holds the client business
  profile. Sessions are a first-party cookie (`sdm_session`, httpOnly/SameSite=Lax, 14-day expiry),
  PBKDF2 via Web Crypto, no external provider. `/admin/setup` bootstraps the first admin and only
  works while zero users exist.
- **Impersonation** ("View as client") is strictly read-only — write forms are hidden and API routes
  reject writes whenever `Astro.locals.impersonatedClient` is set. Repeat that check in new mutations.
  `projects.client_id` is nullable (`NULL` = internal project) — use `LEFT JOIN`, not `INNER JOIN`.
- **Client deletion cascades permanently** (`deleteClient()`, via `ON DELETE CASCADE`: `clients` →
  `projects` → `tasks`/`project_notes` → `task_notes`/`time_entries`, plus `invoices`,
  `tickets`→`ticket_messages`), gated behind re-entering the admin's password. **Archiving**
  (`clients.isActive`) is the reversible alternative — prefer it unless told to delete permanently.
  Invoices are a manual D1 record (description, amount, status, dates) — nothing syncs from
  Stripe/QuickBooks.
- **Kanban task board** (`/admin/projects/[id].astro`): tasks have `type`, `priority`, optional
  `assignedToUserId` (admins only), and a `lane` (planning/to_do/in_progress/qa/done, starting in
  `planning`). Drag-and-drop lane changes go through `/api/tasks/update-lane`, the app's only
  non-redirect JSON write route — don't extend that pattern elsewhere. Task details/notes/time are all
  edited in **one shared `<dialog>` modal**, not a separate page; notes/time are pre-rendered per-task
  into `<template>` elements and cloned in on open. Writes are still plain POST + redirect, back to
  `?openTask={id}` which a page-load script uses to reopen the modal. Time entries are add/delete-only,
  stored in minutes.
- **Client dashboard task views are read-only by omission** (same markup, no drag/write forms) — the
  real guarantee is every `/api/tasks/*`, `/api/project-notes/*`, `/api/task-notes/*`,
  `/api/time-entries/*` route being `ensureRole(["admin"])`.
- **Account settings are self-service only** — `/admin/settings` and `/dashboard/settings` share
  `SettingsForm.astro`, posting to `/api/settings/{profile,password}`, which always act on
  `context.locals.user.id`, never a `userId` from input. `/dashboard/settings` redirects non-`client`
  users to `/admin/settings`. Password changes don't invalidate other sessions.

## Database migrations

Add a new numbered file under `migrations/` — never edit `0001_initial.sql` after it's been applied
anywhere — then `npm run d1:migrate:local` (`:remote` for production). Current: `0001_initial.sql`
(users, sessions, clients, projects, invoices, tickets, ticket_messages), `0002_project_features.sql`
(nullable `client_id` + `project_features`), `0003_tasks_notes_time.sql` (renames it to `tasks`, adds
notes/time tables), `0004_task_lanes_assignee.sql` (planning/to_do lanes + assignee),
`0005_user_names.sql` (`first_name`/`last_name`). Rebuilds that change `CHECK`/rename columns follow
`PRAGMA foreign_keys=OFF` → create replacement → copy → drop → rename → reindex →
`PRAGMA foreign_keys=ON`, per `0002`.

**`PRAGMA foreign_keys=OFF` does not reliably survive to later statements in the same file** —
enforcement comes back on per-statement, so a later `DROP TABLE parent` can still trigger cascading
deletes against any table with an `ON DELETE CASCADE` FK to it. This wiped `task_notes`/`time_entries`
in `0004` when the old `tasks` table was dropped. **Before rebuilding a table with live cascade
children, back up and reinsert their rows explicitly rather than dropping the parent.**

## SEO is a first-class concern

Actively worked for local SEO, targeting "Sandusky Ohio web design" and the surrounding region.

- Every marketing page goes through `BaseLayout.astro` (title, description, canonical, OG/Twitter,
  optional `robots`, GA4 gtag, sitemap link) — always pass `title`/`description`/`canonical`/`ogUrl`
  and a page-specific `ogImage`/`ogImageAlt` (its own hero `.webp`; `logo.png` is only the fallback).
  **Titles and H1s must carry keywords, not bare labels** ("Web Design Services in Sandusky, OH", not
  "Services").
- **Every marketing page carries JSON-LD** (`BreadcrumbList` from `BaseLayout`'s `breadcrumb` prop;
  `index` has `Organization`/`LocalBusiness`, plus per-page `Service`/`CollectionPage`/
  `SoftwareApplication`/`AboutPage`/`ContactPage`). Keep `schemaServices` in `services.astro` identical
  to the visible cards, and `areaServed` identical to the visible "Areas We Serve" list. No street
  address anywhere (home-based business) — only city/state in copy and structured data.
- **No FAQ section, deliberately** — a prior one duplicated content above it and was removed. If
  revisited, only answer things not covered elsewhere, and only with the Q&A visibly on the page.
- **`src/lib/social.ts`** is the single source of truth for social profile URLs, feeding
  `SocialLinks.astro` and the homepage JSON-LD `sameAs`. No Google Business Profile yet. Never add a
  placeholder/guessed profile URL. Brand icons come from `@iconify-json/simple-icons`, not `lucide` —
  check aspect ratio first, several entries are illegible wordmarks (Nextdoor's is vendored locally at
  `src/icons/nextdoor.svg`).
- `/sitemap-index.xml` is generated entirely by `@astrojs/sitemap`, filtered in `astro.config.mjs`
  (excludes thank-you/login/dashboard/admin/api) — don't add a hand-maintained duplicate. `/sitemap`
  is a separate human-facing HTML page with its own `pages` array; update it whenever a marketing page
  changes.
- `noindex, nofollow`: `404`, `thank-you`, `login`, `admin/setup`, and everything under
  `AdminLayout`/`DashboardLayout`. `/privacy-policy` is intentionally indexable. Every real page
  (except `404`) renders `<SiteHeader />` and `<SiteFooter />`.

## Page conventions

Marketing pages (`about`/`services`/`products`/`work`/`contact`) share one shape: `Icon`/
`SiteHeader`/`SiteFooter`/`BaseLayout` imports → `prerender = true` → `<BaseLayout>` with
`title`/`description`/`canonical`/`ogUrl` → `<Fragment slot="head"><style>` with page-scoped CSS (each
page owns its own block rather than a shared library — intentional) → `<SiteHeader active="…" />`, a
full-bleed `.header-hero`, `<main class="page">`, then a **sibling** `<div class="footer-wrap">` with
`<SiteFooter />`.

**The footer must stay outside `<main>`** — `<footer>` only gets the `contentinfo` role when not
nested in `main`/`article`/`aside`/`section`; `.page`/`.wrapper` carries no bottom padding so
`.footer-wrap` can carry it instead. `SocialLinks.astro` renders a `<ul>`, not a `<nav>` (it appears
twice per page — two identically labelled nav landmarks is a duplicate-landmark failure); its CSS is
scoped through `li` (`.social-links li a`) since `.site-footer a`/`:hover` would otherwise win on
specificity.

`public/universal.css` holds the global tokens (`--ink`, `--ink-soft`, `--surface`, `--line`,
`--brand`, `--brand-strong`, `--highlight`), typography, resets, and shared header/footer/button
rules — site-wide changes belong there, one-page changes in that page's `<style>`. **`--ink-soft`/
`--brand` only reach 4.5:1 contrast on light `.card`/`.surface`/`.panel` backgrounds** — text directly
on the page's (fixed-attachment) gradient background must use `--ink` instead. Body-copy links are
styled globally by `.page p a`/`.page li a` (scoped to avoid `.button`/nav links).

`SiteHeader`'s `active` prop drives nav highlighting — extend its type union for any new route. It
opens with a utility bar (phone + city + `SocialLinks`) above the logo/nav row; the nav ends with a
visually-separated **Client Login** link and collapses to a hamburger at `max-width: 920px`. It also
renders the page's first element, a skip-to-`#main-content` link — every `<main>` must keep that id.

## Code style

No linter or formatter; conventions differ by directory. **Match the file you're editing:**

| Path | Line endings | Indent |
|---|---|---|
| `src/components/*.astro`, `public/universal.css` | CRLF | tabs |
| `src/layouts/*.astro` | CRLF | 2 spaces |
| `src/pages/**`, `src/lib/*.ts` | LF | 2 spaces |
| `*.md` | LF | — |

**In client `<script>` blocks, avoid `document.querySelector<HTMLSelectElement>(...)`** (or any DOM
subtype besides `HTMLElement`) — `worker-configuration.d.ts`'s global `Element` (HTMLRewriter API)
merges with the DOM lib's and breaks querySelector's generic constraint, flagging every
`HTMLXxxElement` call as a red squiggle (doesn't fail `build`, would fail `astro check`). Use
`document.querySelector("#foo") as HTMLSelectElement | null` instead.

## Images

- Compress/resize with `sharp` (transitive Astro dependency at `node_modules/sharp` — don't add it to
  `package.json`) before committing. Hero/portfolio shots: `.webp` quality ~80–85. Logo/favicon:
  palette-compressed `.png` (lossy WebP blurs flat-color edges). Target well under 200 KB per hero
  image, under 100 KB for logo/favicon — this site had a real page-speed problem from multi-MB PNGs,
  don't reintroduce it. Portfolio thumbnails in `public/work/` are 1180×615 WebP, ~30–40 KB.
- New `<img>` tags need real descriptive `alt` text. Large originals/design files belong in the
  separate project library (`C:\Users\JD\Projects\Stone Dragon Media`), not this repo.

## Business content — don't invent it

Pricing, phone number, portfolio claims, and business details come from the business owner, not
assumptions. Base client-work claims on what actually shipped, not what a typical site would have.
**Service-area cities are an exception (2026-08-15)** — the owner authorized adding cities that help
local SEO without asking first, but the "Areas We Serve" list/`areaServed` JSON-LD covers only the
in-person ring (~1 hour from Sandusky); farther cities go in the following sentence, named as remote.
Don't move Columbus/Akron/Canton/Lima back into the in-person list — they were removed for overclaiming
the radius.

Contact-form keys (Web3Forms `access_key`, hCaptcha `sitekey`) are inlined in `contact.astro` — don't
copy them into docs or new files. `/privacy-policy` covers both the marketing form/analytics and
client portal account data in D1 — if either half changes (new third-party service, new data
collected, changed retention), update the policy and its effective date together.

## License

This code is public for transparency and reference only — no commercial use. See `LICENSE.md`. Don't
add an OSS license badge, contribution guide, or anything implying this project accepts contributions.
