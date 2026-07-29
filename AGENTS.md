# Agent Instructions — Stone Dragon Media Website

This file is the source of truth for AI coding agents working in this repo. `CLAUDE.md` just points here — keep this file, not that one, up to date.

## What this project is

The public marketing site for Stone Dragon Media, LLC, a web design and digital strategy agency based in Sandusky, Ohio. It's a static Astro site deployed behind Cloudflare at [stonedragonmedia.com](https://stonedragonmedia.com). See `README.md` for stack details, page routes, and dev commands.

## SEO is a first-class concern

This site is actively worked on for local SEO (targeting "Sandusky Ohio web design" and the surrounding region — Toledo/Cleveland/Columbus and everything in between). Before changing metadata, copy, or structured data, keep in mind:

- Every page goes through `BaseLayout.astro`, which sets `<title>`, meta description, canonical URL, Open Graph, and Twitter card tags via props. Always pass `title`, `description`, and `canonical`/`ogUrl` for new pages — don't leave them to defaults.
- The homepage (`src/pages/index.astro`) carries the site's `LocalBusiness`/`Organization` JSON-LD block. If you change the business's service area, phone number, or `areaServed` list, update it there.
- **No street address anywhere.** The business is run out of a residential address. Only city/state (Sandusky, OH) appears in visible copy, the footer, and structured data. Never reintroduce a street address without being explicitly asked.
- The sitemap is generated entirely by `@astrojs/sitemap` at `/sitemap-index.xml`. **Do not add a hand-maintained sitemap route** (e.g. a `sitemap.xml.ts` page) — one existed before, went stale because it required manual updates whenever a page was added, and was removed for that reason. `robots.txt` and the footer/`<link rel="sitemap">` all point at `/sitemap-index.xml`; keep them in sync if that URL ever changes.
- Every real page (except `404.astro`, which is `noindex`) should render `<SiteHeader />` and `<SiteFooter />`. A page with no nav is a dead end for users and crawlers alike — this was a bug that got fixed on `privacy-policy.astro` and `404.astro`; don't reintroduce it on new pages.

## Page conventions

Every content page (`about.astro`, `services.astro`, `products.astro`, `work.astro`, `contact.astro`) follows the same shape:

1. Imports: `Icon` from `astro-icon/components`, `SiteHeader`, `SiteFooter`, `BaseLayout`.
2. A `<BaseLayout>` with `title`, `description`, `canonical`, `ogUrl` props.
3. A `<Fragment slot="head"><style>...</style></Fragment>` with page-scoped CSS (each page owns its own `<style>` block rather than relying on a shared component library — this is intentional, keep following it rather than introducing a new shared-styles pattern).
4. `<SiteHeader active="..." />`, a full-bleed `.header-hero` image with `.header-overlay` text, then a `.page` wrapper with the actual content, ending in `<SiteFooter />`.

`SiteHeader`'s `active` prop drives which nav link is highlighted — its type union in `src/components/SiteHeader.astro` must include any new route added to the nav.

## Images

- Use `sharp` (already present as a transitive dependency via Astro — resolve it at `node_modules/sharp`, don't add it to `package.json`) to compress and resize any new image before committing it. Hero/portfolio screenshots go through `.webp` at quality ~80–85; the logo and favicon are palette-compressed `.png` (to preserve transparency and crisp flat-color edges — lossy webp blurs logo edges, avoid it there).
- Target well under 200KB per hero image and well under 100KB for the logo/favicon. This site had a real page-speed problem from unoptimized multi-MB PNGs (some pushing 2MB) — don't reintroduce that.
- New `<img>` tags for hero images should include real `alt` text describing the page/content, not filler.

## Business content — don't invent it

Pricing, service-area cities, phone number, and business details in this site's copy come directly from the business owner, not from assumptions. If a task implies adding or changing this kind of content (pricing figures, new service areas, licensing terms, contact info), get it from the user rather than guessing a plausible-sounding value.

## Commands

```bash
npm install       # install deps
npm run dev        # dev server (astro dev) — does NOT serve /sitemap-index.xml (build-only)
npm run build       # production build to dist/
npm run preview     # serve the built dist/ output, for verifying build-only routes like the sitemap
```

Always run `npm run build` after non-trivial changes to confirm the site still builds cleanly before considering a task done.

## License

This code is public for transparency/reference only — no commercial use. See `LICENSE.md`. Don't add an OSS license badge, contribution guide, or anything implying this is an open-source project accepting outside contributions.
