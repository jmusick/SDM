# Agent Instructions — Stone Dragon Media Website

This file is the source of truth for AI coding agents working in this repo. `CLAUDE.md` just points
here — keep this file, not that one, up to date. `README.md` is the human-facing companion; when you
change something documented in both, change both.

## What this project is

The website for Stone Dragon Media, LLC, a web design and digital strategy agency based in Sandusky,
Ohio, live at [stonedragonmedia.com](https://stonedragonmedia.com). It is two things in one Astro
app:

1. **Marketing site** (`/`, `/about`, `/services`, `/products`, `/work`, `/contact`, `/thank-you`,
   `/privacy-policy`, `/404`) — prerendered to static HTML at build time.
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

Always run `npm run build` after non-trivial changes before considering a task done. For anything
touching `/dashboard`, `/admin`, or auth, also exercise the real flow via `npm run dev` — `astro
check` and `build` will not catch a broken redirect or a missing D1 binding.

**`npm run preview` is broken.** It maps to `astro preview`, which exits with `No build output
found` even straight after a successful build, because `astro.config.mjs` sets `build.client: './'`
and `build.server: './_worker.js'` — a layout the adapter's preview does not expect. To eyeball the
built output, serve `dist/` with any static file server, or use `npm run dev`. Don't "fix" this by
changing the `build` paths; they are what produce a Pages-compatible `_worker.js/`.

## Deployment

- Cloudflare **Pages** project named `sdm`, git-integrated with GitHub `jmusick/SDM`. Pushing to
  `master` auto-deploys to production. A manual `wrangler pages deploy dist --project-name=sdm` also
  works but registers as a "direct upload" rather than a commit-tied deployment.
- **Git-integrated Pages builds do not read bindings from `wrangler.toml`.** The D1 binding must be
  added in the Cloudflare dashboard (Pages project → Settings → Bindings → D1, variable name `DB`),
  and only takes effect on the *next* deployment. If production 500s on portal routes after a schema
  or config change, check this first.
- `fix-wrangler.js` runs at the end of every build: it deletes `.wrangler/deploy/config.json` and
  `dist/_worker.js/wrangler.json`, then writes `dist/_worker.js/index.js` re-exporting `entry.mjs`.
- **`wrangler.toml` has no `main` field, deliberately.** Adding one breaks `astro build` — the
  Cloudflare Vite plugin resolves it against a build-output path that doesn't exist yet during the
  pre-build sync step. `npm run dev` passes the worker entry and `--assets dist` as CLI flags
  instead. (`[assets]` and `[[d1_databases]]` *are* in the toml and are fine; only `main` is the
  problem.)

## Portal / admin architecture

- **Every new marketing page must be prerendered.** Add `export const prerender = true;` to its
  frontmatter, or it runs through the Worker on every request. Only `/login`, `/dashboard/*`,
  `/admin/*`, and `/api/*` should be dynamic.
- **Auth guards return, never throw.** `src/lib/http.ts`'s `ensureRole`/`requireUser`/
  `ensureClientContext` return a redirect `Response` on failure. Astro frontmatter only
  short-circuits rendering via `return <Response>` — a *thrown* Response is not caught by the
  renderer and produces an unhandled 500. Every call site must do
  `if (result instanceof Response) return result;` before using the value. Applies in both `.astro`
  pages and `.ts` API routes.
- **D1 access** goes through `src/lib/db.ts`'s `ensureDB(locals)`, which reads the `DB` binding via
  `cloudflare:workers`' `env` — *not* `Astro.locals.runtime.env`, which is for a different
  `@astrojs/cloudflare` config shape than this project uses.
- **`src/middleware.ts`** resolves session, user, and impersonated client on every request.
- **Data access** lives in `src/lib/{auth,clients,db,features,http,invoices,projects,tickets,users}.ts`.
  Keep SQL there, not in pages.
- **Auth model**: `users` holds both `admin` and `client` roles; `clients` holds the business profile
  for client accounts. Sessions are a first-party cookie (`sdm_session`, httpOnly/SameSite=Lax,
  14-day expiry) with PBKDF2 hashing via Web Crypto. No external auth provider.
- **`/admin/setup`** is a one-time bootstrap that only works while zero users exist.
- **Impersonation** ("View as client" in `/admin/clients`) is strictly read-only by design — ticket
  submission/reply forms are hidden and the underlying API routes reject the write whenever
  `Astro.locals.impersonatedClient` is set. Don't add new client-side mutations without repeating
  that check.
- **`projects.client_id` is nullable.** `NULL` means an internal (no-client) project — don't assume
  every project row has a client, and don't join with `INNER JOIN clients` (use `LEFT JOIN`, as
  `listAllProjects` does).
- **Client deletion is deliberately cascading.** `deleteClient()` in `src/lib/clients.ts` deletes the
  client's row in `users`, and the schema's `ON DELETE CASCADE` chain handles the rest in one
  statement — sessions, the `clients` profile, and everything keyed to that client (`projects`,
  `invoices`, `tickets`, `ticket_messages`). It's gated behind the admin re-entering their own
  password (`/api/clients/delete.ts` via `verifyUserPassword`). **Archiving** (`clients.isActive` via
  `set-active.ts`) is the reversible alternative — prefer it in any new "remove this client" UI
  unless permanent removal is explicitly requested.
- **Invoices are a manual record** (description, amount, status, dates) in D1. Nothing is synced from
  Stripe/QuickBooks — don't imply otherwise in copy or code.

## Database migrations

Add a new numbered file under `migrations/` — never edit `0001_initial.sql` after it has been
applied anywhere. Then run `npm run d1:migrate:local` (and `:remote` for production). Current
migrations: `0001_initial.sql` (users, sessions, clients, projects, invoices, tickets,
ticket_messages) and `0002_project_features.sql` (nullable `projects.client_id` + `project_features`).

## SEO is a first-class concern

This site is actively worked on for local SEO, targeting "Sandusky Ohio web design" and the
surrounding region (Toledo/Cleveland/Columbus and between). Before changing metadata, copy, or
structured data:

- Every marketing page goes through `src/layouts/BaseLayout.astro`, which sets `<title>`, meta
  description, canonical URL, Open Graph, Twitter card, the optional `robots` directive, the GA4
  gtag snippet (`G-GBG97CSL2Z`), and the sitemap `<link>`. Always pass `title`, `description`, and
  `canonical`/`ogUrl` for new pages — never leave them to defaults.
- `src/pages/index.astro` carries the site's `LocalBusiness`/`Organization` JSON-LD. If the service
  area, phone number, or `areaServed` list changes, update it there.
- **No street address anywhere.** The business runs out of a residential address. Only city/state
  (Sandusky, OH) appears in visible copy, the footer, and structured data. Never reintroduce a street
  address without being explicitly asked.
- The sitemap is generated entirely by `@astrojs/sitemap` at `/sitemap-index.xml`, filtered in
  `astro.config.mjs` to exclude `/thank-you`, `/login`, `/dashboard`, `/admin`, `/api`. **Do not add
  a hand-maintained sitemap route** — one existed, went stale because it needed manual updates on
  every new page, and was removed for that reason. `robots.txt` and the footer/`<link rel="sitemap">`
  all point at `/sitemap-index.xml`; keep them in sync if that URL changes.
- `noindex, nofollow` is set on exactly four pages (`404`, `thank-you`, `login`, `admin/setup`) plus
  everything under `AdminLayout`/`DashboardLayout`. `/privacy-policy` is intentionally indexable.
- Every real page (except `404`) must render `<SiteHeader />` and `<SiteFooter />`. A page with no
  nav is a dead end for users and crawlers alike — this was a real bug fixed on `privacy-policy` and
  `404`; don't reintroduce it.

## Page conventions

Every marketing content page (`about`, `services`, `products`, `work`, `contact`) follows the same
shape:

1. Imports: `Icon` from `astro-icon/components`, `SiteHeader`, `SiteFooter`, `BaseLayout`.
2. `export const prerender = true;`
3. `<BaseLayout>` with `title`, `description`, `canonical`, `ogUrl`.
4. `<Fragment slot="head"><style>…</style></Fragment>` with page-scoped CSS. Each page owns its own
   `<style>` block rather than relying on a shared component library — this is intentional. Follow it
   rather than introducing a new shared-styles pattern.
5. `<SiteHeader active="…" />`, a full-bleed `.header-hero` image with `.header-overlay` text, then a
   `.page` wrapper with the content, ending in `<SiteFooter />`.

`public/universal.css` holds the global design tokens (`--ink`, `--ink-soft`, `--surface`, `--line`,
`--brand`, `--brand-strong`, `--highlight`), typography, resets, and the shared header/footer/button
rules. Site-wide visual changes belong there; one-page changes belong in that page's `<style>`.

`SiteHeader`'s `active` prop drives which nav link is highlighted — its type union must include any
new route added to the nav. The header nav ends with a **Client Login** link (`.nav-login`, visually
separated from the marketing links); the footer carries Privacy Policy, Sitemap, and the version read
from `package.json`. The mobile nav collapses to a hamburger at `max-width: 920px`; the toggle script
closes the panel on any `<a>` click inside it, so new nav links get that for free.

## Code style

There is no linter or formatter, and conventions differ by directory. **Match the file you're
editing** — check before you write, especially with tools that do exact string matching:

| Path | Line endings | Indent |
|---|---|---|
| `src/components/*.astro`, `public/universal.css` | CRLF | tabs |
| `src/layouts/*.astro` | CRLF | 2 spaces |
| `src/pages/**`, `src/lib/*.ts` | LF | 2 spaces |
| `*.md` | LF | — |

## Images

- Use `sharp` (already present as a transitive dependency via Astro — resolve it at `node_modules/
  sharp`, don't add it to `package.json`) to compress and resize any new image before committing.
  Hero and portfolio screenshots go to `.webp` at quality ~80–85; the logo and favicon are
  palette-compressed `.png` — lossy WebP blurs flat-color logo edges, avoid it there.
- Target well under 200 KB per hero image and well under 100 KB for the logo/favicon. This site had a
  real page-speed problem from unoptimized multi-MB PNGs (some near 2 MB) — don't reintroduce that.
- Portfolio thumbnails in `public/work/` are 1180×615 WebP, ~30–40 KB, cropped from the top of a
  full-page screenshot. Match those dimensions so the `.work-thumb` grid stays even.
- New `<img>` tags need real `alt` text describing the content, not filler.
- Large originals and editable design files belong in the separate project library
  (`C:\Users\JD\Projects\Stone Dragon Media`), not in this repo.

## Business content — don't invent it

Pricing, service-area cities, phone number, portfolio claims, and business details come directly from
the business owner, not from assumptions. If a task implies adding or changing this kind of content,
get it from the user rather than guessing a plausible-sounding value. The same applies to describing
client work: base feature claims on the actual delivered site, not on what a site like that usually
has.

Contact-form integration keys (Web3Forms `access_key`, hCaptcha `sitekey`) are inlined in
`src/pages/contact.astro`. They're client-side values by nature, but treat them as
implementation-sensitive — don't copy them into docs or new files.

`/privacy-policy` covers both the marketing contact form/analytics **and** client portal account data
stored in D1. If either half changes — new third-party service, new data collected, changed retention
— update the policy and its effective date in the same change.

## License

This code is public for transparency and reference only — no commercial use. See `LICENSE.md`. Don't
add an OSS license badge, contribution guide, or anything implying this project accepts outside
contributions.
