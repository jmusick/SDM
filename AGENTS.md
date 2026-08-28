# Agent Instructions — Stone Dragon Media Website

This file is the source of truth for AI coding agents working in this repo. `CLAUDE.md` just points
here — keep this file, not that one, up to date. `README.md` is the human-facing companion; when you
change something documented in both, change both.

## What this project is

The website for Stone Dragon Media, LLC, a web design and digital strategy agency based in Sandusky,
Ohio, live at [stonedragonmedia.com](https://stonedragonmedia.com). It is two things in one Astro app:

1. **Marketing site** (`/`, `/about`, `/services`, `/services/*`, `/products`, `/work`, `/contact`,
   `/thank-you`, `/privacy-policy`, `/sitemap`, `/404`) — prerendered to static HTML at build time.
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

Always run `npm run build` after non-trivial changes. For `/dashboard`, `/admin`, or auth work, also
exercise the real flow via `npm run dev` — `astro check`/`build` won't catch a broken redirect or a
missing D1 binding. `astro check` has 6 pre-existing errors; check your file, not the total.

`scripts/seed-local.mjs` generates local test-data SQL (real PBKDF2 hashes) and is **not** wired into
`package.json` — pipe its output into `npx wrangler d1 execute sdm-db --local`. Local only.

**`npm run preview` is broken** ("No build output found") — `astro.config.mjs` sets `build.client`/
`build.server` to the layout that produces the Pages-compatible `_worker.js/`, which preview doesn't
expect. Don't change those paths to fix it; serve `dist/` statically, or use `npm run dev`.

## Deployment

- Cloudflare **Pages** project `sdm`, git-integrated with GitHub `jmusick/SDM` — pushing to `master`
  auto-deploys. `wrangler pages deploy dist` works but registers as an untethered "direct upload".
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
  through the Worker on every request.
- **Auth guards return, never throw.** `src/lib/http.ts`'s `ensureRole`/`requireUser`/
  `ensureClientContext` return a redirect `Response` on failure — a *thrown* one isn't caught by the
  renderer. Every call site must do `if (result instanceof Response) return result;`.
- **CSRF backstop behind `SameSite=Lax`:** `assertSameOrigin(context)` (`src/lib/http.ts`) 403s any
  non-GET/HEAD request whose `Origin`/`Referer` isn't same-origin. It's folded into `requireUser`, so
  every guarded route has it; the unguarded auth/setup POST routes call it directly. A new mutating
  route that uses none of the guards must call it itself.
- **Security response headers** live in two places kept in sync by hand: `public/_headers` (`/*`
  rule) covers the prerendered marketing pages Pages serves from asset storage; portal SSR responses
  get the same set from `src/lib/security-headers.ts`'s `applySecurityHeaders`, called in
  `src/middleware.ts`. The TS module is the source of truth for the CSP string — change both together.
  CSP uses `'unsafe-inline'` for script/style (Astro inlines per-build-hashed scripts + component
  styles; a static `_headers` can't carry a nonce) and allow-lists Google Fonts, GA/gtag, hCaptcha,
  and the Web3Forms fetch.
- **D1 access** goes through `src/lib/db.ts`'s `ensureDB(locals)` (`cloudflare:workers`' `env`, not
  `Astro.locals.runtime.env`). `src/middleware.ts` resolves session/user/impersonated client per
  request. SQL lives in `src/lib/*.ts`, not in pages (`services.ts`/`social.ts` are content, not SQL).
- **Auth model**: `users` holds both `admin`/`client` roles; `clients` holds the client business
  profile. Sessions are a first-party cookie (`sdm_session`, httpOnly/SameSite=Lax, 14 days), PBKDF2
  via Web Crypto, no external provider. The cookie holds a raw token; `sessions.id` stores only its
  SHA-256 (`hashSessionToken`) — a D1 dump can't be replayed. Login runs a dummy PBKDF2
  (`verifyPasswordDummy`) on an unknown/inactive email so latency isn't a user-enumeration oracle.
- `/admin/setup` + `/api/setup/create-admin` bootstrap the first admin. Gated on **both** 0 users
  **and** env var `ADMIN_SETUP_ENABLED === "true"` (`src/lib/setup.ts`) — normally unset, so both
  302 → `/login`. Set it in the Cloudflare Pages dashboard only for a deliberate re-bootstrap, then
  unset it.
- **Impersonation** ("View as client") is strictly read-only — write forms are hidden and API routes
  reject writes whenever `Astro.locals.impersonatedClient` is set. Repeat that check in new mutations.
  `projects.client_id` is nullable (`NULL` = internal project) — use `LEFT JOIN`, not `INNER JOIN`.
- **Client deletion cascades permanently** (`deleteClient()`, `ON DELETE CASCADE`: `clients` →
  `projects` → `tasks`/`project_notes` → `task_notes`/`time_entries`, plus `invoices`,
  `tickets`→`ticket_messages`), gated behind re-entering the admin's password. **Archiving**
  (`clients.isActive`) is the reversible alternative — prefer it unless told to delete permanently.
  Invoices are a manual D1 record (description, amount, status, dates) — nothing syncs from Stripe.
- **Kanban task board** (`/admin/projects/[id].astro`): tasks have `type`, `priority`, optional
  `assignedToUserId` (admins only), and a `lane` (planning/to_do/in_progress/qa/done, starting in
  `planning`). Drag-and-drop goes through `/api/tasks/update-lane`, the app's only non-redirect JSON
  write route — don't extend that pattern. Task details/notes/time are edited in **one shared
  `<dialog>` modal**, not a separate page; notes/time are pre-rendered per-task into `<template>`
  elements and cloned in on open. Writes stay plain POST + redirect back to `?openTask={id}`, which
  reopens the modal on load. Time entries are add/delete-only, stored in minutes.
- **Client dashboard task views are read-only by omission** (same markup, no drag/write forms) — the
  guarantee is every `/api/{tasks,project-notes,task-notes,time-entries}/*` route being admin-gated.
- **Account settings are self-service only** — `/admin/settings` and `/dashboard/settings` share
  `SettingsForm.astro`, posting to `/api/settings/{profile,password}`, which always act on
  `context.locals.user.id`, never a `userId` from input. `/dashboard/settings` redirects non-`client`
  users to `/admin/settings`. A password change/reset evicts the account's other sessions
  (`updateUserPassword`/`resetClientPassword`).
- **Temporary passwords** (client create + admin reset) never travel in the URL — the plaintext is
  written to `password_flash` (one-time read, 15-min TTL) and the redirect carries only an opaque
  `?pwflash=<id>`, consumed on render in `admin/clients/[id].astro`. Such accounts get
  `users.must_change_password = 1`; middleware pins them to `/dashboard/settings?mustchange=1` (or
  `/admin/settings`) until they set a real password, which clears the flag.

## Database migrations

Add a new numbered file under `migrations/` — never edit an applied one — then `npm run
d1:migrate:local` (`:remote` for production). `0001_initial` → `0008_hash_session_tokens`; notably
`0003` renamed `project_features` to `tasks` and added the notes/time tables, `0006` added the login
lockout columns, `0007` added `must_change_password` + the `password_flash` table, and `0008` clears
`sessions` (the id column changed from raw token to its SHA-256). Rebuilds that change `CHECK`
constraints or rename columns follow `PRAGMA foreign_keys=OFF` → create replacement → copy → drop →
rename → reindex → `PRAGMA foreign_keys=ON`, per `0002`.

**`PRAGMA foreign_keys=OFF` does not reliably survive to later statements in the same file** —
enforcement returns per-statement, so a later `DROP TABLE parent` still cascades into any table with
an `ON DELETE CASCADE` FK to it. This wiped `task_notes`/`time_entries` in `0004`. **Before rebuilding
a table with live cascade children, back up and reinsert their rows rather than dropping the parent.**

## SEO is a first-class concern

Actively worked for local SEO, targeting "Sandusky Ohio web design" and the region around it.

- Every marketing page goes through `BaseLayout.astro` (all `<head>` metadata, GA4 gtag) — always
  pass `title`/`description`/`canonical`/`ogUrl` and a page-specific `ogImage`/`ogImageAlt` (its own
  hero `.webp`; `logo.png` is only the fallback). **Titles and H1s must carry keywords, not bare
  labels** ("Web Design Services in Sandusky, OH"), title + `| Stone Dragon Media` under ~65 chars.
- **Every marketing page carries JSON-LD**: `BreadcrumbList` from `BaseLayout`'s `breadcrumb` prop
  (its optional `breadcrumbParent` makes that trail three-level for pages under a hub, like the
  service subpages), `Organization`/`LocalBusiness` on `index`, plus a per-page `Service`/
  `CollectionPage`/`SoftwareApplication`/`AboutPage`/`ContactPage`. Keep `areaServed` identical to the
  visible "Areas We Serve" list. No street address anywhere (home-based business) — city/state only.
- **No FAQ section, deliberately** — a prior one duplicated content above it and was removed. If
  revisited, only answer things not covered elsewhere, and only with the Q&A visibly on the page.
- **`src/lib/services.ts`** is the single source of truth for the service catalogue: four categories,
  the two services in each, their copy, icons, and anchor ids. It feeds the `/services` hub, the
  `[category].astro` subpages, all of their JSON-LD, the header dropdown, and `/sitemap`. Anchor ids
  are linked from `/` and `/about` as `/services/<slug>/#<service-id>` — renaming means updating those.
- **`src/lib/social.ts`** is the single source of truth for social profile URLs, feeding
  `SocialLinks.astro` and the homepage JSON-LD `sameAs`. The Google Business Profile is the canonical
  `maps?cid=` URL, never a `share.google`/`maps.app.goo.gl` redirect; never add a guessed URL. Brand
  icons come from `@iconify-json/simple-icons`, not `lucide` — check aspect ratio first, several are
  illegible wordmarks (Nextdoor's square glyph is vendored at `src/icons/nextdoor.svg`).
- `/sitemap-index.xml` is generated entirely by `@astrojs/sitemap`, filtered in `astro.config.mjs`
  (excludes thank-you/login/dashboard/admin/api) — no hand-maintained duplicate. `/sitemap` is a
  separate human-facing HTML page with its own `pages` array; update it when a marketing page changes.
- `noindex, nofollow`: `404`, `thank-you`, `login`, `admin/setup`, and everything under
  `AdminLayout`/`DashboardLayout`. `/privacy-policy` is intentionally indexable. Every real page
  (except `404`) renders `<SiteHeader />` and `<SiteFooter />`.

## Page conventions

Marketing pages (`about`/`services`/`products`/`work`/`contact`) share one shape: `Icon`/`SiteHeader`/
`SiteFooter`/`BaseLayout` imports → `prerender = true` → `<BaseLayout>` with `title`/`description`/
`canonical`/`ogUrl` → `<Fragment slot="head"><style>` with page-scoped CSS (each page owns its own
block rather than a shared library — intentional) → `<SiteHeader active="…" />`, a full-bleed
`.header-hero`, `<main class="page">`, then a **sibling** `<div class="footer-wrap">` + `<SiteFooter />`.

The four service category pages are the one exception to "a page per file": a single
`src/pages/services/[category].astro` with `getStaticPaths()` over `serviceCategories`, so that shape
— CSS block included — is written once. Adding a category = one entry in `src/lib/services.ts`.

**The footer must stay outside `<main>`** — `<footer>` only gets the `contentinfo` role when not
nested in `main`/`article`/`aside`/`section`; `.page`/`.wrapper` carries no bottom padding so
`.footer-wrap` can carry it. `SocialLinks.astro` renders a `<ul>`, not a `<nav>` (it appears twice per
page — two identically labelled nav landmarks is a duplicate-landmark failure); its CSS is scoped
through `li` (`.social-links li a`) since `.site-footer a`/`:hover` would otherwise win on specificity.

`public/universal.css` holds the global tokens (`--ink`, `--ink-soft`, `--surface`, `--line`,
`--brand`, `--brand-strong`, `--highlight`), typography, resets, and shared header/footer/button
rules — site-wide changes go there, one-page changes in that page's `<style>`. **`--ink-soft`/`--brand`
only reach 4.5:1 contrast on light `.card`/`.surface`/`.panel`** — text on the page's fixed-attachment
gradient must use `--ink`. Body copy links are styled by `.page p a`/`.page li a` (not `.button`/nav).

`SiteHeader`'s `active` prop drives nav highlighting — extend its type union for any new route. It
opens with a utility bar (phone + city + `SocialLinks`) above the logo/nav row, ends with a
visually-separated **Client Login** link, collapses to a hamburger at `max-width: 920px`, and renders
the page's first element — a skip-to-`#main-content` link, so every `<main>` must keep that id.
Services is the only nav item with a submenu: `.nav-group` opens on hover and `:focus-within`, its
chevron button adding click/tap — the only way in on the stacked mobile nav, where those two rules are
forced off. **`.site-head`'s `backdrop-filter` makes it a stacking context**, so the `z-index` lifting
the header over a page's positioned `.header-hero` sits on `.site-head`, not on `.nav-dropdown`.

## Code style

No linter or formatter; conventions differ by directory. **Match the file you're editing:**

| Path | Line endings | Indent |
|---|---|---|
| `src/components/*.astro`, `public/universal.css` | CRLF | tabs |
| `src/layouts/*.astro` | CRLF | 2 spaces |
| `src/pages/**`, `src/lib/*.ts` | LF | 2 spaces |
| `*.md` | LF | — |

**In client `<script>` blocks, avoid `document.querySelector<HTMLSelectElement>(...)`** (or any DOM
subtype besides `HTMLElement`) — `worker-configuration.d.ts`'s global `Element` (HTMLRewriter) merges
with the DOM lib's and breaks querySelector's generic constraint, red-squiggling every
`HTMLXxxElement` call (fails `astro check`, not `build`). Use `... as HTMLSelectElement | null`.

## Images

Compress/resize with `sharp` (transitive Astro dependency at `node_modules/sharp` — don't add it to
`package.json`) before committing. Hero/portfolio shots: `.webp` quality ~80–85. Logo/favicon:
palette-compressed `.png` (lossy WebP blurs flat-color edges). Target well under 200 KB per hero image
and 100 KB per logo/favicon — this site had a real page-speed problem from multi-MB PNGs. Portfolio
thumbnails in `public/work/` are 1180×615 WebP, ~30–40 KB. New `<img>` tags need real descriptive
`alt`. Originals and design files live in `C:\Users\JD\Projects\Stone Dragon Media`, not this repo.

## Business content — don't invent it

Pricing, phone number, portfolio claims, and business details come from the business owner, not
assumptions. Base client-work claims on what actually shipped, not what a typical site would have.
**Service-area cities are an exception (2026-08-15)** — the owner authorized adding cities that help
local SEO without asking, but the "Areas We Serve" list/`areaServed` JSON-LD covers only the in-person
ring (~1 hour from Sandusky); farther cities go in the following sentence, named as remote. Don't move
Columbus/Akron/Canton/Lima back into the in-person list — removed for overclaiming the radius.

Contact-form keys (Web3Forms `access_key`, hCaptcha `sitekey`) are inlined in `contact.astro` — don't
copy them into docs or new files. `/privacy-policy` covers both the marketing form/analytics and
client portal account data in D1 — if either half changes (new third-party service, new data
collected, changed retention), update the policy and its effective date together.

## License

This code is public for transparency and reference only — no commercial use. See `LICENSE.md`. Don't
add an OSS license badge, contribution guide, or anything implying this project accepts contributions.
