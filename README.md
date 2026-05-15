# Stone Dragon Media Website

Official website for Stone Dragon Media, built with Astro.

## Overview

This repository powers the public-facing Stone Dragon Media site, including:

- Marketing homepage
- About page
- Services and products pages
- Contact form workflow
- Privacy policy

The site uses Astro static generation, shared layout-based head metadata, and per-page styling.

## Current Stack

- Astro 6
- astro-icon with Lucide icon set
- TypeScript

## Site Pages

- `/` - Home
- `/about` - About
- `/services` - Services
- `/products` - Products
- `/contact` - Contact
- `/privacy-policy` - Privacy policy

## Key Implementation Notes

- Shared head/template: `src/layouts/BaseLayout.astro`
- Shared navigation/footer components: `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`
- Global favicon source: `public/favicon.png`
- Global stylesheet: `public/universal.css`
- Contact form currently posts to Web3Forms and includes hCaptcha integration in `src/pages/contact.astro`

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
npm run dev
```

Astro defaults to `http://localhost:4321`.

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
│   ├── header-bg.png
│   ├── about-header.png
│   ├── contact-bg.png
│   └── ...
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
│       └── privacy-policy.astro
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

## Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally

## Content and SEO

- Canonical URLs, Open Graph, and Twitter meta tags are managed per page through `BaseLayout` props.
- Favicon and shared head links are centralized in `BaseLayout`.

## Contact Form Security Notes

The contact page currently includes Web3Forms `access_key` and hCaptcha `sitekey` directly in the page source. If needed, move these to environment-driven values for tighter key management.
