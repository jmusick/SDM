# Stone Dragon Media Website

Official website for Stone Dragon Media — a web design and digital strategy agency based in Sandusky, OH. Built with Astro and deployed via Cloudflare.

## Overview

This repository powers the public-facing Stone Dragon Media site at [stonedragonmedia.com](https://stonedragonmedia.com), including:

- Marketing homepage with hero, services summary, and metrics
- About page
- Services and products pages
- Contact form with hCaptcha and Web3Forms submission
- Privacy policy
- Auto-generated sitemap and direct `/sitemap.xml` endpoint

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 6 (static output) |
| Icons | astro-icon + Lucide icon set |
| Language | TypeScript |
| Sitemap | @astrojs/sitemap + custom `sitemap.xml` route |
| Analytics | Google Analytics 4 (GA4) — `G-GBG97CSL2Z` via gtag.js |
| Contact form | Web3Forms API |
| CAPTCHA | hCaptcha |
| CDN / proxy | Cloudflare |

## Site Pages

| Route | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/services` | Services |
| `/products` | Products |
| `/contact` | Contact |
| `/privacy-policy` | Privacy Policy (noindex) |
| `/sitemap.xml` | Direct sitemap (submitted to Search Console) |
| `/sitemap-index.xml` | Astro-generated sitemap index |
| `/robots.txt` | Crawl rules + sitemap reference |

## Key Implementation Notes

- **Shared layout** — `src/layouts/BaseLayout.astro` manages all `<head>` metadata: canonical URLs, Open Graph, Twitter cards, robots meta, GA4 gtag snippet, and the sitemap `<link>`.
- **Navigation/footer** — `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`. The footer reads the version from `package.json` at build time.
- **Global stylesheet** — `public/universal.css` (design tokens, typography, resets).
- **Sitemap** — `src/pages/sitemap.xml.ts` emits a plain XML sitemap at `/sitemap.xml`. This is what is submitted to Google Search Console. The Astro integration also generates `sitemap-index.xml` / `sitemap-0.xml` as a secondary reference.
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
│   ├── universal.css
│   ├── robots.txt
│   └── (page background images)
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
│       ├── privacy-policy.astro
│       ├── 404.astro
│       └── sitemap.xml.ts
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```
