# Stone Dragon Media Website

Official website for Stone Dragon Media — a web design and digital strategy agency based in Sandusky, OH. Built with Astro and deployed via Cloudflare.

## Overview

This repository powers the public-facing Stone Dragon Media site at [stonedragonmedia.com](https://stonedragonmedia.com), including:

- Marketing homepage with hero, services summary, areas served, and our-work highlights
- About page
- Services page, including a "How Much Does It Cost?" pricing-philosophy section
- Products page (Tagsta.sh)
- Our Work portfolio page (Pneumaris, Tagsta.sh)
- Contact form with hCaptcha and Web3Forms submission
- Privacy policy
- Auto-generated sitemap

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 6 (static output) |
| Icons | astro-icon + Lucide icon set |
| Language | TypeScript |
| Sitemap | @astrojs/sitemap (`/sitemap-index.xml`) |
| Analytics | Google Analytics 4 (GA4) — `G-GBG97CSL2Z` via gtag.js |
| Contact form | Web3Forms API |
| CAPTCHA | hCaptcha |
| CDN / proxy | Cloudflare |

## Site Pages

| Route | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/services` | Services (incl. pricing philosophy) |
| `/products` | Products |
| `/work` | Our Work |
| `/contact` | Contact |
| `/privacy-policy` | Privacy Policy (noindex) |
| `/sitemap-index.xml` | Astro-generated sitemap (submitted to Search Console) |
| `/robots.txt` | Crawl rules + sitemap reference |

## Key Implementation Notes

- **Shared layout** — `src/layouts/BaseLayout.astro` manages all `<head>` metadata: canonical URLs, Open Graph, Twitter cards, robots meta, GA4 gtag snippet, and the sitemap `<link>`.
- **Navigation/footer** — `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`. The footer reads the version from `package.json` at build time and displays the business NAP (name, address, phone).
- **Global stylesheet** — `public/universal.css` (design tokens, typography, resets).
- **Sitemap** — Generated entirely by `@astrojs/sitemap` at `/sitemap-index.xml` / `/sitemap-0.xml`. There is no hand-maintained sitemap route — a prior custom `sitemap.xml.ts` route was removed because it went stale (missing pages) and is intentionally not reintroduced. `robots.txt` and the footer/`<link rel="sitemap">` all point at `/sitemap-index.xml`.
- **Local SEO / structured data** — `src/pages/index.astro` carries a `LocalBusiness`/`Organization` JSON-LD block (phone, city/state, `areaServed`). The business is home-based, so no street address is published anywhere on the site or in structured data — only city/state.
- **Images** — Hero/portfolio images are compressed WebP; the logo and favicon are palette-compressed PNG (to preserve transparency) via `sharp` (already a transitive dependency of Astro). Keep new image assets small — avoid committing multi-MB source screenshots/exports directly.
- **Analytics** — GA4 gtag snippet is injected globally in `BaseLayout.astro` immediately after `<meta charset>`.
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

```bash
npm run dev -- --host --port 4321
```

### Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## Project Structure

```text
.
├── public/
│   ├── favicon.png
│   ├── logo.png / logo-cropped.png
│   ├── universal.css
│   ├── robots.txt
│   ├── work/
│   │   ├── pneumaris.webp
│   │   └── tagstash.webp
│   └── (page hero images, .webp)
├── src/
│   ├── components/
│   │   ├── SiteHeader.astro
│   │   └── SiteFooter.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   └── pages/
│       ├── index.astro
│       ├── about.astro
│       ├── contact.astro
│       ├── services.astro
│       ├── products.astro
│       ├── work.astro
│       ├── privacy-policy.astro
│       └── 404.astro
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── AGENTS.md
├── CLAUDE.md
├── LICENSE.md
└── README.md
```

## License

This code is published for transparency and reference only — no commercial use is permitted. See [LICENSE.md](LICENSE.md).
