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
  heroDesc: string;
  services: ServiceItem[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    slug: "design-development",
    name: "Design & Development",
    icon: "lucide:layout-template",
    summary: "Websites, online stores, and custom software built around your business.",
    title: "Web Design & App Development in Sandusky, OH",
    description:
      "Custom websites, eCommerce, landing pages, client portals, internal tools, and API integrations built for speed and reliability by Stone Dragon Media in Sandusky, Ohio.",
    h1: "Web Design & Application Development in Sandusky, Ohio",
    intro:
      "Help visitors understand your business, shop online, or contact you. We build custom websites and applications with attention to speed, accessibility, and maintenance. We work in person across Erie County and northern Ohio, and remotely with clients anywhere.",
    heroDesc: "Custom websites and business applications built around your customers and your workflow.",
    services: [
      {
        id: "custom-web-solutions",
        name: "Custom Web Solutions",
        icon: "lucide:layout-template",
        summary: "Custom websites and web systems designed to communicate your value, help visitors take action, and support fast page loads.",
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
        summary: "Custom software for your team's tools, tasks, and workflows.",
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
    summary: "Marketing campaigns to reach your audience, with reporting to help you understand the results.",
    title: "SEO, PPC & Analytics Services in Sandusky, OH",
    description:
      "Search engine optimization, pay-per-click management, social and email campaigns, conversion tracking, and custom reporting dashboards from Stone Dragon Media in Sandusky, Ohio.",
    h1: "Digital Marketing & Analytics in Sandusky, Ohio",
    intro:
      "We plan search, advertising, social media, and email campaigns around your audience. Tracking and reporting help you see what brings traffic and inquiries, so you can make informed decisions about your budget.",
    heroDesc: "Help customers find your business and understand which campaigns bring results.",
    services: [
      {
        id: "marketing",
        name: "Marketing",
        icon: "lucide:megaphone",
        summary: "Search, advertising, social media, and email campaigns to help the right customers find your business.",
        bullets: [
          "Search engine optimization (SEO)",
          "Pay-per-click (PPC) advertising management",
          "Social media, email, and text message marketing",
          "Content strategy and copywriting",
        ],
      },
      {
        id: "analytics-reporting",
        name: "Analytics & Reporting",
        icon: "lucide:bar-chart-2",
        summary: "Tracking and reporting to help you understand which pages and campaigns bring traffic and inquiries.",
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
    summary: "Website hosting and ongoing maintenance after launch.",
    title: "Website Hosting & Security in Sandusky, OH",
    description:
      "Managed hosting, domain and SSL management, cloud and VPS setup, security hardening, uptime monitoring, backups, and ongoing maintenance plans from Stone Dragon Media in Sandusky, Ohio.",
    h1: "Website Hosting, Security & Maintenance in Sandusky, Ohio",
    intro:
      "Your website needs care after launch. We configure hosting, maintain software, monitor availability, and plan backups and recovery to help you keep it running.",
    heroDesc: "Website hosting, updates, monitoring, and backup planning for ongoing site care.",
    services: [
      {
        id: "hosting-infrastructure",
        name: "Hosting & Infrastructure",
        icon: "lucide:server",
        summary: "Hosting setup, domain management, and recovery planning to support your website.",
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
        summary: "Updates, security checks, and uptime monitoring to help you maintain your website after launch.",
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
    summary: "A consistent visual identity across your website and marketing materials, with practical technology advice.",
    title: "Branding & Digital Strategy in Sandusky, OH",
    description:
      "Logo and brand identity design, style guides, color and typography systems, and help choosing technology and planning projects from Stone Dragon Media in Sandusky, Ohio.",
    h1: "Branding, Design & Digital Strategy in Sandusky, Ohio",
    intro:
      "Give your business a consistent look across your website, print materials, and digital content. We also help you choose platforms, plan projects, and improve the processes behind your work.",
    heroDesc: "A consistent visual identity and practical advice on technology and project planning.",
    services: [
      {
        id: "branding-design",
        name: "Branding & Design",
        icon: "lucide:palette",
        summary: "Logos, brand guides, and design assets that give your business a consistent visual identity.",
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
        summary: "Help choosing technology, improving processes, and planning your next project.",
        bullets: [
          "Technology and platform selection",
          "Planning technology changes for your business",
          "Data migration and architecture",
          "IT process improvement and project planning",
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
