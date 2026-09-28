// Single source of truth for the /services hub and its category subpages. The Service JSON-LD on
// each of those pages is generated from this array, so the structured data can't drift from the
// visible cards the way two hand-maintained copies did.

export interface ServiceItem {
  /** Anchor id on the category page — keep stable, these are linked from / and /about. */
  id: string;
  name: string;
  /** astro-icon name, rendered as the card watermark. */
  icon: string;
  summary: string;
  bullets: string[];
}

export interface ServiceCategory {
  /** URL segment under /services/. */
  slug: string;
  /** Category name — nav dropdown, hub card heading, breadcrumb. */
  name: string;
  icon: string;
  /** One-line summary shown on the hub card. */
  summary: string;
  /** Page <title> minus the " | Stone Dragon Media" suffix — keep the whole thing under ~65 chars. */
  title: string;
  description: string;
  h1: string;
  /** Lead paragraph under the H1. */
  intro: string;
  heroLabel: string;
  heroTitle: string;
  heroDesc: string;
  services: ServiceItem[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    slug: "design-development",
    name: "Design & Development",
    icon: "lucide:layout-template",
    summary: "Websites, eCommerce, and custom software built around how your business actually works.",
    title: "Web Design & App Development in Sandusky, OH",
    description:
      "Custom websites, eCommerce, landing pages, client portals, internal tools, and API integrations built for speed and reliability by Stone Dragon Media in Sandusky, Ohio.",
    h1: "Web Design & Application Development in Sandusky, Ohio",
    intro:
      "Whether you need a website that converts or a piece of software no off-the-shelf product covers, we design and build it from scratch. Every project is built for speed, accessibility, and long-term maintainability. We work in person across Erie County and northern Ohio, and remotely with clients anywhere.",
    heroLabel: "DESIGN & DEVELOPMENT",
    heroTitle: "Design & Development",
    heroDesc: "Custom websites and web systems, plus tailored software built around your workflow.",
    services: [
      {
        id: "custom-web-solutions",
        name: "Custom Web Solutions",
        icon: "lucide:layout-template",
        summary: "Custom websites and web systems built to communicate value, drive action, and stay lightning fast.",
        bullets: [
          "eCommerce and informational websites",
          "Landing pages and microsites",
          "Platform and third-party integrations",
          "Website redesigns and migrations",
        ],
      },
      {
        id: "application-development",
        name: "Custom Application Development",
        icon: "lucide:cpu",
        summary: "Tailored software solutions built around your workflow, not the other way around.",
        bullets: [
          "Internal tools and dashboards",
          "Customer and client portals",
          "Process and workflow automation",
          "API development, integrations, and database design",
        ],
      },
    ],
  },
  {
    slug: "marketing-analytics",
    name: "Marketing & Analytics",
    icon: "lucide:megaphone",
    summary: "Campaigns that reach the right audience, and the reporting that shows what they returned.",
    title: "SEO, PPC & Analytics Services in Sandusky, OH",
    description:
      "Search engine optimization, pay-per-click management, social and email campaigns, conversion tracking, and custom reporting dashboards from Stone Dragon Media in Sandusky, Ohio.",
    h1: "Digital Marketing & Analytics in Sandusky, Ohio",
    intro:
      "Getting found is half of it; knowing what worked is the other half. We run campaigns that put your business in front of the right audience at the right time, then measure them so your budget goes where it earns its keep.",
    heroLabel: "MARKETING & ANALYTICS",
    heroTitle: "Marketing & Analytics",
    heroDesc: "Data-driven campaigns paired with the tracking and reporting that show what they returned.",
    services: [
      {
        id: "marketing",
        name: "Marketing",
        icon: "lucide:megaphone",
        summary: "Data-driven campaigns that put your business in front of the right audience at the right time.",
        bullets: [
          "Search Engine Optimization (SEO)",
          "Pay Per Click (PPC) management",
          "Social media, email, and text message marketing",
          "Content strategy and copywriting",
        ],
      },
      {
        id: "analytics-reporting",
        name: "Analytics & Reporting",
        icon: "lucide:bar-chart-2",
        summary: "Turn your data into decisions with clear, actionable insight into how your digital presence is performing.",
        bullets: [
          "Google Analytics setup and configuration",
          "Conversion tracking and goal setup",
          "Custom reporting dashboards",
          "Performance audits",
        ],
      },
    ],
  },
  {
    slug: "hosting-security",
    name: "Hosting & Security",
    icon: "lucide:server",
    summary: "Somewhere fast and secure to run, and the ongoing care that keeps it that way.",
    title: "Website Hosting & Security in Sandusky, OH",
    description:
      "Managed hosting, domain and SSL management, cloud and VPS setup, security hardening, uptime monitoring, backups, and ongoing maintenance plans from Stone Dragon Media in Sandusky, Ohio.",
    h1: "Website Hosting, Security & Maintenance in Sandusky, Ohio",
    intro:
      "A site is only as good as the platform underneath it. We set up hosting configured for performance, then keep it patched, monitored, and backed up long after launch, so problems get caught before your customers find them.",
    heroLabel: "HOSTING & SECURITY",
    heroTitle: "Hosting & Security",
    heroDesc: "Reliable hosting environments plus proactive maintenance, monitoring, and recovery planning.",
    services: [
      {
        id: "hosting-infrastructure",
        name: "Hosting & Infrastructure",
        icon: "lucide:server",
        summary: "Reliable, secure hosting environments configured for performance and peace of mind.",
        bullets: [
          "Domain registration and SSL management",
          "Cloud and VPS server setup",
          "Hosting migration and troubleshooting",
          "Performance optimization, backup, and recovery planning",
        ],
      },
      {
        id: "security-maintenance",
        name: "Security & Maintenance",
        icon: "lucide:shield",
        summary: "Proactive care to keep your site secure, up to date, and running smoothly long after launch.",
        bullets: [
          "Security hardening and monitoring",
          "Software and plugin updates",
          "Uptime monitoring and vulnerability assessments",
          "Ongoing site maintenance plans",
        ],
      },
    ],
  },
  {
    slug: "branding-consulting",
    name: "Branding & Consulting",
    icon: "lucide:palette",
    summary: "A visual identity people trust, and clear-headed guidance on where to take it next.",
    title: "Branding & Digital Strategy in Sandusky, OH",
    description:
      "Logo and brand identity design, style guides, color and typography systems, technology selection, and digital transformation planning from Stone Dragon Media in Sandusky, Ohio.",
    h1: "Branding, Design & Digital Strategy in Sandusky, Ohio",
    intro:
      "How you look and what you decide to build both come before a single line of code. We shape the visual identity your audience recognizes, and help you make confident decisions about the technology and process behind it.",
    heroLabel: "BRANDING & CONSULTING",
    heroTitle: "Branding & Consulting",
    heroDesc: "A cohesive visual identity, plus expert guidance on technology, process, and digital growth.",
    services: [
      {
        id: "branding-design",
        name: "Branding & Design",
        icon: "lucide:palette",
        summary: "A cohesive visual identity that communicates who you are and builds trust with your audience.",
        bullets: [
          "Logo design and brand mark creation",
          "Brand style guide development",
          "Color palette and typography systems",
          "Brand consultation, print, and digital asset design",
        ],
      },
      {
        id: "consulting-strategy",
        name: "Consulting & Strategy",
        icon: "lucide:compass",
        summary: "Expert guidance to help you make confident decisions about technology, process, and digital growth.",
        bullets: [
          "Technology and platform selection",
          "Digital transformation planning",
          "Data migration and architecture",
          "IT process improvement and project roadmapping",
        ],
      },
    ],
  },
];

/** Nav dropdown items, and the cross-links between category pages. */
export const serviceCategoryLinks = serviceCategories.map((category) => ({
  href: `/services/${category.slug}/`,
  label: category.name,
}));
