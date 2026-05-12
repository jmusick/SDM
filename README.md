# Stone Dragon Media

Official website for Stone Dragon Media, built with [Astro](https://astro.build).

## 📖 About

A modern, fast, and accessible website showcasing Stone Dragon Media's services, products, and company information. Built with Astro for optimal performance and static site generation.

## ✨ Features

- ⚡ **Lightning-fast performance** - Static site generation with Astro
- 🎨 **Icon integration** - Lucide icons via astro-icon
- 📱 **Fully responsive** - Mobile-first design
- ♿ **Accessible** - WCAG compliant component structure
- 🔧 **TypeScript** - Full type safety
- 🎯 **SEO optimized** - Built-in Astro optimizations

## 📄 Pages

- **Home** (`/`) - Landing page
- **About** (`/about`) - Company information
- **Services** (`/services`) - Service offerings
- **Products** (`/products`) - Product catalog
- **Contact** (`/contact`) - Contact form and information
- **Privacy Policy** (`/privacy-policy`) - Privacy terms

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 22.12.0
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the local development server:

```bash
npm run dev
```

The site will be available at `http://localhost:4321` (or `http://ark-prime:4321` on the local network).

### Build

Build for production:

```bash
npm run build
```

The compiled site will be in the `./dist/` directory.

### Preview

Preview the production build locally:

```bash
npm run preview
```

## 🏗️ Project Structure

```
/
├── public/
│   └── universal.css      # Global styles
├── src/
│   ├── components/
│   │   ├── SiteHeader.astro
│   │   └── SiteFooter.astro
│   └── pages/
│       ├── index.astro
│       ├── about.astro
│       ├── contact.astro
│       ├── privacy-policy.astro
│       ├── products.astro
│       └── services.astro
├── astro.config.mjs       # Astro configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project metadata and dependencies
```

## 📦 Dependencies

- **astro** - Web framework
- **astro-icon** - Icon component system
- **@iconify-json/lucide** - Lucide icon set

## 🛠️ Configuration

### Debug Mode

To debug in Firefox from VS Code:

1. Install the "Debugger for Firefox" extension
2. Select "Firefox Debug" from the Run and Debug view
3. Press **F5** to launch with debugging enabled

## 📝 License

[Add your license information here]

## 📧 Contact

For inquiries, visit our [contact page](/contact).
