# Stone Dragon Media Website

Official website for Stone Dragon Media — a web design and digital strategy agency based in Sandusky, OH. Built with Astro and deployed via Cloudflare.

## Overview

This repository powers the public-facing Stone Dragon Media site at [stonedragonmedia.com](https://stonedragonmedia.com), including:

- Marketing homepage with hero, services summary, areas served, and our-work highlights
- About page
- Services page, including a "How Much Does It Cost?" pricing-philosophy section
- Products page (Tagstash)
- Our Work portfolio page (Simon Rook, Dorian Black, Pneumaris, Tagstash)
- Contact form with hCaptcha and Web3Forms submission
- Privacy policy
- Auto-generated sitemap
- Authenticated client dashboard (`/dashboard`) and admin area (`/admin`) — projects with a Kanban task board, notes, time tracking, billing, support tickets, and account settings, backed by Cloudflare D1

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 6, `output: 'server'` (marketing pages are still individually prerendered to static HTML; only `/login`, `/dashboard/*`, `/admin/*`, `/api/*` are dynamic) |
| Icons | astro-icon + Lucide icon set (Simple Icons for brand/social marks) |
| Language | TypeScript |
| Sitemap | @astrojs/sitemap (`/sitemap-index.xml`) — dashboard/admin/login/api routes are excluded |
| Analytics | Google Analytics 4 (GA4) — `G-GBG97CSL2Z` via gtag.js |
| Contact form | Web3Forms API |
| CAPTCHA | hCaptcha |
| Hosting | Cloudflare Pages project `sdm` (via `@astrojs/cloudflare`), git-integrated — pushing to `master` deploys to production |
| Database | Cloudflare D1 (`sdm-db`), binding `DB` — client/project/task/note/time-entry/invoice/ticket data |
| Auth | Cookie-based sessions (`sdm_session`), PBKDF2 password hashing via Web Crypto — no external auth provider |

## Client Dashboard & Admin Area

A handful of clients log in at `/login` to see their own projects, invoices, and support tickets (and can open new tickets). The business owner manages everything through `/admin` — clients, projects, billing, and ticket replies — including a **"View as client"** action that lets the owner see the dashboard exactly as a given client does (read-only; can't post messages while impersonating).

- **First-time setup**: visit `/admin/setup` once — it only works while zero users exist in the database, and creates the owner's admin account.
- **Auth model**: `users` table holds both `admin` and `client` roles; `clients` holds the business-facing profile for client accounts. Sessions live in the `sessions` table (14-day expiry), cookie is httpOnly/SameSite=Lax.
- **Data model**: see `migrations/*.sql` for the full schema — `users`, `sessions`, `clients`, `projects`, `tasks`, `project_notes`, `task_notes`, `time_entries`, `invoices`, `tickets`, `ticket_messages`.
- **Internal projects**: `projects.client_id` is nullable — a project with no client is an internal (Stone Dragon Media's own) project. It's shown with an "Internal" badge in the admin UI and is filtered out of anything client-facing by construction (client pages always query by a specific `clientId`).
- **Project task board**: each project has a drag-and-drop Kanban board (lanes: planning / to do / in progress / QA / done) on `/admin/projects/[id]`. Tasks carry a type (story/bug/task/chore), priority, and an optional assignee (admin users only). Everything about a task — details, notes, and time entries — is edited in a single modal on that page; there is no separate task page. Projects also have their own notes thread, and time is logged per task as add/delete-only entries (stored in minutes; the form accepts hours or minutes).
- **Client-side project view**: clients see the same board read-only at `/dashboard/projects/[id]` — no drag handles, no note or time forms. Every write endpoint under `/api/tasks/*`, `/api/project-notes/*`, `/api/task-notes/*`, and `/api/time-entries/*` is admin-only regardless.
- **Account settings**: both roles manage their own name, email, and password at `/admin/settings` / `/dashboard/settings` (shared `SettingsForm.astro`). These are strictly self-service — the API routes always act on the logged-in user, never on a `userId` from form input. Changing a password does not sign out the user's other sessions.
- **Client lifecycle**: clients can be **archived** (reversible — blocks login, keeps all data) or **deleted** (irreversible — permanently removes their login and cascades through all of their projects, invoices, tickets, and ticket messages via `ON DELETE CASCADE`). Deletion requires the admin to re-enter their own password.
- **Filtering/sorting**: the admin Projects and Clients list pages support status/client filters and sortable columns via query params, following the same pattern (see either page for the template).
- **Library code**: `src/lib/{db,auth,http,users,clients,projects,tasks,notes,timeEntries,invoices,tickets}.ts`. `src/middleware.ts` resolves the session/user/impersonated-client on every request. `src/lib/http.ts`'s `ensureRole`/`ensureClientContext` guards **return** a redirect `Response` rather than throwing one — Astro page frontmatter only short-circuits via `return <Response>`, a thrown Response is not caught by the renderer. Every call site does `if (result instanceof Response) return result;`.
- **Not wired to a real billing/accounting system** — invoices are a simple manually-entered record (description, amount, status, dates) in D1, not synced from Stripe/QuickBooks/etc.

## Site Pages

| Route | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/services` | Services (incl. pricing philosophy) |
| `/products` | Products |
| `/work` | Our Work |
| `/contact` | Contact |
| `/thank-you` | Post-submission confirmation, used for conversion tracking (noindex) |
| `/privacy-policy` | Privacy Policy (indexed — in the sitemap) |
| `/404` | Not Found (noindex) |
| `/sitemap-index.xml` | Astro-generated sitemap (submitted to Search Console) |
| `/robots.txt` | Crawl rules + sitemap reference |
| `/login` | Client/admin login (noindex) |
| `/admin/setup` | One-time admin account bootstrap — only reachable while no users exist (noindex) |
| `/dashboard/*` | Client dashboard: overview, projects (read-only task board), billing, tickets, settings (noindex, auth required) |
| `/admin/*` | Admin area: clients, projects (task board, notes, time), billing, tickets, settings (noindex, auth required) |

## Key Implementation Notes

- **Shared layout** — `src/layouts/BaseLayout.astro` manages all `<head>` metadata: canonical URLs, Open Graph (each marketing page passes its own `ogImage`/`ogImageAlt` hero), Twitter cards, robots meta, the optional `breadcrumb` JSON-LD, GA4 gtag snippet, and the sitemap `<link>`.
- **Navigation/footer** — `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`. The header opens with a slim utility bar carrying the phone number, city, and social icons above the logo/nav row; the nav ends with a Client Login link into the portal and collapses to a hamburger at `max-width: 920px`. The footer carries Privacy Policy and Sitemap links, the business NAP (name, city/state, phone), social profile icons, and the version read from `package.json` at build time.
- **Social profiles** — `src\lib\social.ts` is the single source of truth for the business's Facebook, X, Nextdoor, and Yelp URLs. It feeds the `SocialLinks.astro` component (used in both the header utility bar and the footer) and the `sameAs` array in the homepage `Organization`/`LocalBusiness` JSON-LD, so they can't drift apart. Brand icons come from `@iconify-json/simple-icons`, except Nextdoor — that set ships the wordmark logotype, which is illegible at icon size, so the square house glyph is vendored at `src\icons\nextdoor.svg`.
- **Global stylesheet** — `public/universal.css` (design tokens, typography, resets).
- **Sitemap** — Generated entirely by `@astrojs/sitemap` at `/sitemap-index.xml` / `/sitemap-0.xml`. There is no hand-maintained sitemap route — a prior custom `sitemap.xml.ts` route was removed because it went stale (missing pages) and is intentionally not reintroduced. `robots.txt` and the footer/`<link rel="sitemap">` all point at `/sitemap-index.xml`.
- **Local SEO / structured data** — Every marketing page carries JSON-LD. `src/pages/index.astro` has the `LocalBusiness`/`Organization` block (phone, city/state, `areaServed`); the other pages add `ItemList`/`Service` (services), `CollectionPage` (work), `SoftwareApplication` (products), `AboutPage`, and `ContactPage`. `BreadcrumbList` is emitted by `BaseLayout.astro` from its `breadcrumb` prop. The business is home-based, so no street address is published anywhere on the site or in structured data — only city/state. `areaServed` and the visible "Areas We Serve" list are kept in sync, and cover the in-person ring only; farther cities are described as remote.
- **Images** — Hero/portfolio images are compressed WebP; the logo and favicon are palette-compressed PNG (to preserve transparency) via `sharp` (already a transitive dependency of Astro). Keep new image assets small — avoid committing multi-MB source screenshots/exports directly.
- **Analytics** — `BaseLayout.astro` loads GA4 only on `stonedragonmedia.com`/`www.stonedragonmedia.com`, so local and Cloudflare preview traffic do not contaminate production reporting. The contact form emits a `generate_lead` event only after Web3Forms confirms a successful submission; form contents are never included.
- **Contact form** — Posts to `https://api.web3forms.com/submit` via fetch; hCaptcha response is validated before submission. Keys (`access_key`, hCaptcha `sitekey`) are currently inlined in `contact.astro`.

## Development

### Prerequisites

- Node.js `>=22.12.0`
- npm

### Install

```bash
npm install
```

### Run Dev Server

For marketing-page work only (fast, hot-reloading, but no D1/auth — those routes will error without the `DB` binding):

```bash
npm run dev:astro
```

For dashboard/admin/auth work, run the full Cloudflare runtime (D1, cookies, everything) — builds first, then serves via `wrangler dev`; re-run after each change since it doesn't hot-reload:

```bash
npm run dev
```

First time only, set up the local D1 database:

```bash
npx wrangler d1 create sdm-db   # paste the returned database_id into wrangler.toml
npm run d1:migrate:local
```

Then visit `/admin/setup` to create the owner's admin account.

### Build

```bash
npm run build
```

### Preview Build

> **`npm run preview` does not currently work.** `astro preview` exits with `No build output found`
> even immediately after a successful build, because `astro.config.mjs` sets `build.client: './'` and
> `build.server: './_worker.js'` — a layout the Cloudflare adapter's preview doesn't expect. Those
> paths are what produce the Pages-compatible `_worker.js/`, so they shouldn't be changed to satisfy
> preview.
>
> To inspect the built output, either run `npm run dev` (full Cloudflare runtime) or serve `dist/`
> with any static file server.

### Database Migrations

```bash
npm run d1:migrate:local    # apply to local D1 (used by `npm run dev`)
npm run d1:migrate:remote   # apply to production D1
```

## Project Structure

```text
.
├── public/
│   ├── favicon.png
│   ├── logo.png / logo-cropped.png
│   ├── universal.css
│   ├── robots.txt
│   ├── work/                     # portfolio thumbnails, 1180x615 .webp
│   │   ├── dorianblack.webp
│   │   ├── pneumaris.webp
│   │   ├── simonrook.webp
│   │   └── tagstash.webp
│   └── (page hero images, .webp)
├── migrations/
│   ├── 0001_initial.sql         # D1 schema: users, sessions, clients, projects, invoices, tickets, ticket_messages
│   ├── 0002_project_features.sql # projects.client_id made nullable (internal projects) + project_features table
│   ├── 0003_tasks_notes_time.sql # project_features -> tasks (type/lane/priority) + project_notes, task_notes, time_entries
│   ├── 0004_task_lanes_assignee.sql # adds the planning/to_do lanes + tasks.assigned_to_user_id
│   └── 0005_user_names.sql       # users.first_name / users.last_name
├── scripts/
│   ├── seed-local.mjs           # generates local test-data SQL (not in package.json — pipe into wrangler d1 execute --local)
│   └── seed-local.sql
├── src/
│   ├── components/
│   │   ├── SiteHeader.astro
│   │   ├── SiteFooter.astro
│   │   ├── SocialLinks.astro    # shared social icon row (header utility bar + footer)
│   │   └── SettingsForm.astro   # shared profile/password forms for both settings pages
│   ├── layouts/
│   │   ├── BaseLayout.astro     # marketing pages
│   │   ├── AdminLayout.astro    # admin shell (sidebar nav, shared table/form/badge styles)
│   │   └── DashboardLayout.astro # client dashboard shell (+ impersonation banner)
│   ├── lib/                     # D1 data access + auth (db, auth, http, users, clients, projects, tasks, notes, timeEntries, invoices, tickets)
│   ├── middleware.ts            # resolves session/user/impersonated-client on every request
│   ├── env.d.ts                 # App.Locals typing (UserRecord, SessionRecord, ClientRecord)
│   └── pages/
│       ├── index.astro / about.astro / contact.astro / services.astro / products.astro / work.astro / privacy-policy.astro / 404.astro / thank-you.astro
│       ├── login.astro
│       ├── admin/                # setup.astro, index.astro, settings.astro, clients/, projects/ (board + task modal), billing/, tickets/
│       ├── dashboard/             # index.astro, projects.astro, projects/[id].astro, billing.astro, settings.astro, tickets/
│       └── api/
│           ├── auth/ (login.ts, logout.ts)
│           ├── setup/create-admin.ts
│           ├── clients/ (save.ts, delete.ts, reset-password.ts, set-active.ts)
│           ├── projects/ (save.ts, delete.ts)
│           ├── tasks/ (save.ts, delete.ts, update-lane.ts)
│           ├── project-notes/ (save.ts, delete.ts)
│           ├── task-notes/ (save.ts, delete.ts)
│           ├── time-entries/ (save.ts, delete.ts)
│           ├── settings/ (profile.ts, password.ts)
│           ├── invoices/ (save.ts, delete.ts)
│           ├── tickets/ (create.ts, reply.ts, update-status.ts)
│           └── admin/impersonate/ (start.ts, stop.ts)
├── astro.config.mjs
├── wrangler.toml                 # D1 binding + assets config (no `main` — see AGENTS.md)
├── worker-configuration.d.ts      # generated by `npm run cf:types`
├── fix-wrangler.js                # post-build worker entry patch (run by `npm run build`)
├── tsconfig.json
├── package.json
├── AGENTS.md
├── CLAUDE.md
├── LICENSE.md
└── README.md
```

## License

This code is published for transparency and reference only — no commercial use is permitted. See [LICENSE.md](LICENSE.md).
