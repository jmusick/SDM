# Website copy review

September 30, 2026. Reviewed with the copy-editing skill's seven sweeps and final checklist.

This records the initial proposed editing pass from the local repository. The owner subsequently authorized implementation and production release as v2.22.0. The release applies the wording improvements below, including metadata repairs and a portfolio contact CTA. Payment copy preserves the existing ownership transfer and low-upfront offer, while explaining that hosting and support are discussed separately; it adds no prices, minimum commitments, or new contractual terms.

## Editorial direction

Write for a business owner deciding whether Stone Dragon Media can help with a website, application, or ongoing support. The main action is to send an inquiry through `/contact/`. Product visitors also have a direct path to Tagstash.

The site's strongest material is its concrete portfolio detail: a book catalogue maintained in one file, album pages with listening links, and a working bookmarking product with a Firefox extension. Keep that specificity and the local identity. Bring the same plain language to the homepage, About page, and service introductions.

The largest opportunities are to explain services through their practical uses, remove stock agency language, and make each call to action accurately describe the next step.

## Seven-sweep findings

| Sweep | Finding | Recommended treatment |
|---|---|---|
| Clarity | “Custom web solutions,” “digital transformation,” and “project roadmapping” make readers translate agency language. | Name websites, tools, technology choices, and project plans. Keep technical terms where useful, with plain explanations. |
| Voice and tone | The portfolio sounds specific and conversational; About shifts into “business acumen,” “relentless focus,” and “something remarkable.” | Use a practical, confident voice across pages. Preserve the portfolio's individual project character. |
| So what | Some homepage cards list capabilities without explaining their use. | Connect tracking to understanding inquiries, branding to consistency, and applications to everyday work. |
| Prove it | “Measurable growth,” “lightning fast,” and “loads fast anywhere” are stronger than the evidence presented nearby. | Describe the work and intended purpose; reserve performance and results claims for documented measurements. |
| Specificity | “End-to-end,” “full-service,” and “digital-first world” occupy space without explaining the offer. | Name the actual stages or services instead. |
| Heightened emotion | The general agency copy is detached from the reader's everyday problems. | Use recognizable situations: an outdated site, repetitive work, or a saved link that is hard to find. Avoid manufactured urgency. |
| Zero risk | “Book Discovery Call” leads to an inquiry form; pricing leaves room for differing interpretations of ongoing costs. | Match button labels to the form, reuse the existing free-consultation reassurance, and clarify commercial terms. |

## 1. Homepage: explain the offer and the next step

Source: `src/pages/index.astro`, hero and service cards.

**Current H1:** “Sandusky, Ohio web design for growing brands”

**Suggested H1:** “Sandusky, Ohio web design for your business”

“Business” matches the rest of the site's audience more closely than “brands.” Keep the location and web design keywords.

**Suggested hero description:**

> Custom websites, business applications, and ongoing support built around your goals. Based in Sandusky, Ohio, with {yearsExperience} years of IT and development experience.

Keep the existing dynamic experience value. It describes IT and development experience, not the age of the agency.

**Primary button:** Change “Book Discovery Call” to “Discuss Your Project.” The destination is a contact form with a follow-up, rather than a booking calendar. “View Services” remains a useful secondary action.

Suggested card copy, retaining the existing headings and links:

| Card | Suggested paragraph |
|---|---|
| Custom Web Solutions | Custom websites, online stores, and landing pages that help visitors understand your business and take the next step. |
| Custom Application Development | Internal tools, customer portals, and workflow automation built around your day-to-day operations. |
| Marketing | Search, paid advertising, social media, email, and content strategies to help the right customers find your business. |
| Analytics & Reporting | Google Analytics setup, conversion tracking, and dashboards to help you understand which pages and campaigns bring inquiries. |
| Hosting & Infrastructure | Domain management, hosting setup, performance improvements, and backup planning to support your website. |
| Security & Maintenance | Updates, security checks, and uptime monitoring to help you keep your website maintained after launch. |
| Branding & Design | Logos, brand guides, and print and digital assets to give your business a consistent visual identity. |
| Consulting & Strategy | Help choosing technology, planning projects, and moving data as your business changes. |

These summaries introduce the offer; the category pages retain the detailed capabilities, including API integrations and infrastructure terminology.

**Metadata replacement:**

> Custom web design, business applications, and digital strategy in Sandusky, Ohio. Serving local businesses and remote clients across the US.

This also removes the malformed dash in the current description.

## 2. About: replace broad claims with a useful introduction

Source: `src/pages/about.astro`.

The current opening combines location, service area, experience, and a “rare blend” claim in one long paragraph. The next paragraph adds several generic quality claims. A shorter introduction can carry the same message.

**Suggested H1:** “A Web Design Agency in Sandusky, Ohio”

This brings the H1 into line with the repository's keyword requirement; the current H1 only names the company.

**Suggested hero description:**

> We design websites, build business applications, and help you choose the technology to support your work.

**Suggested first two paragraphs:**

> Stone Dragon Media is a web design and digital strategy agency based in Sandusky, Ohio. We work in person with businesses across Erie County and northern Ohio, from Toledo to Cleveland, and remotely with clients anywhere.

> With {yearsExperience} years of IT and development experience, we connect design decisions with how your website or application needs to work. Our focus is clear navigation, accessibility, reliable performance, and software you can maintain as your needs change.

Keep the linked services list, with these tighter descriptions:

- **Custom web design & development:** Websites and applications built around your goals, from planning to launch.
- **Digital strategy & consulting:** Help choosing technology, improving processes, and planning your next project.
- **Ongoing support & optimization:** Maintenance and improvements as your website and business change.

**Suggested closing paragraph:**

> Browse our recent work to see what we've built. If you have a project in mind, tell us what you need and we'll talk through the options.

For the experience card, replace “Deep background across infrastructure, industries, and modern web stacks” with “IT and development experience spanning websites, applications, and infrastructure.” For the business-first card, replace “not vanity output” with “Design and technology decisions guided by your business goals.”

## 3. Services hub: reduce repetition and clarify pricing

Source: `src/pages/services/index.astro`.

The hero and lead both begin with “end-to-end digital services.” Use the hero to summarize scope and the lead to help the reader identify their need.

**Suggested hero description:**

> Website design, custom applications, marketing, hosting, branding, and practical technology advice.

**Suggested lead:**

> Need a new website, help maintaining an existing one, or software for your business? Explore our services below. We work in person across Erie County and northern Ohio, from Toledo to Cleveland, and remotely with clients anywhere.

**Suggested pricing introduction:**

> Pricing depends on your project's scope, timeline, and support needs. We offer one-time development, managed plans, and custom payment arrangements. Tell us your goals and budget, and we'll discuss the options.

The existing free, no-obligation quote is useful reassurance and should remain.

### Commercial wording to clarify before replacing

The one-time option currently promises a complete license transfer with “no ongoing fees, subscriptions, or dependency on us to keep running.” A reader could interpret this as including all future hosting, domain, and third-party costs. Clarify what the promise covers.

**Draft, only if it accurately reflects the offer:**

> Pay a one-time development fee. Once payment is complete, the code and its license transfer to you. Any hosting, domain, third-party service, or optional support costs are set out in your quote.

The managed option promises “little to no money down” and “affordable” payments. Preserve the existing low-upfront offer, but explain what recurring payments cover and any minimum commitment or ownership terms if those exist. Do not invent them.

**Suggested heading:** “Managed Plans with Low Upfront Costs.”

**Draft preserving the current offer:**

> A professionally built and managed website or application, with little to no upfront payment and costs spread across monthly or yearly payments.

“Affordable” is subjective; the payment structure is the useful detail.

## 4. Service category pages: describe purpose without guaranteeing results

Source: `src/lib/services.ts`; the shared page is `src/pages/services/[category].astro`.

Keep category names, service names, slugs, anchor IDs, and detailed bullet lists. Proposed text edits belong in `services.ts`, which also feeds structured data and related cards.

| Category | Suggested hero description | Suggested introduction |
|---|---|---|
| Design & Development | Custom websites and business applications built around your customers and your workflow. | Help visitors understand your business, shop online, or contact you. We build custom websites and applications with attention to speed, accessibility, and maintenance. We work in person across Erie County and northern Ohio, and remotely with clients anywhere. |
| Marketing & Analytics | Help customers find your business and understand which campaigns bring results. | We plan search, advertising, social media, and email campaigns around your audience. Tracking and reporting help you see what brings traffic and inquiries, so you can make informed decisions about your budget. |
| Hosting & Security | Website hosting, updates, monitoring, and backup planning for ongoing site care. | Your website needs care after launch. We configure hosting, maintain software, monitor availability, and plan backups and recovery to help you keep it running. |
| Branding & Consulting | A consistent visual identity and practical advice on technology and project planning. | Give your business a consistent look across your website, print materials, and digital content. We also help you choose platforms, plan projects, and improve the processes behind your work. |

Further phrase edits:

- “Stay lightning fast” → “support fast page loads.”
- “Tailored software solutions built around your workflow, not the other way around” → “Custom software for your team's tools, tasks, and workflows.”
- “Somewhere fast and secure to run” → “Website hosting and ongoing maintenance after launch.”
- “A visual identity people trust” → “A consistent visual identity across your website and marketing materials.”
- “Digital transformation planning” → “Planning technology changes for your business.”
- “IT process improvement and project roadmapping” → “IT process improvement and project planning.”

**Shared closing CTA proposal:**

> **Tell us about your project**
>
> Share what you need help with, your timeline, and any questions. We'll follow up within one business day. Your consultation is free, with no obligation.

Button: “Discuss Your Project.” These response and consultation terms already appear on the contact page. Reuse them consistently rather than adding a new promise.

## 5. Contact: make the form easier to approach

Source: `src/pages/contact.astro`.

Keep the existing one-business-day response promise, free consultations, and call/text option. These are already stronger than the hero's vague “vision” and “guide you through the process.”

**Suggested H1:** “Contact a Sandusky, Ohio Web Designer.”

**Suggested hero description:**

> Tell us what you need help with. We'll follow up within one business day to discuss your project. Consultations are free, with no obligation.

**Form heading:** “Tell Us About Your Project.”

**Form introduction:** “A few details are enough to start the conversation.”

**Project Details placeholder:** “What does your business need? Tell us about your current website or the project you have in mind.”

**Helper beside submit button:** “Still exploring? You're welcome to ask a question.”

**Submit button:** “Send Message.”

The current placeholder asks for “goals, scope, and desired outcomes,” which can make a visitor feel they need a completed brief. The revised wording invites an ordinary description.

For “Full-Service,” replace “entire project lifecycle” with “Help with planning, design, development, and ongoing support.”

**Form failure copy:** “We couldn't send your message. Please try again, or call or text (567) 450-0960.”

The current catch block can display raw messages such as `HTTP 500` or `Failed to fetch`. A plain explanation with an alternative contact method is more useful. Keep errors announced through the existing live region and preserve the entered details.

## 6. Products: lead with Tagstash's concrete use

Source: `src/pages/products.astro`.

The bookmarking example already gives readers a recognizable problem. Keep it. The hero is less specific than the content below it.

**Suggested H1:** “Tagstash: Bookmarking by Tags.”

**Suggested hero description:** “Save links, organize them with tags, and find them again when you need them.”

**Suggested first feature bullet:** “Add multiple tags to each bookmark so you can find it by topic, project, or purpose.”

**Shortened Firefox bullet:** “Save pages in one click with the Firefox extension. Browse, search, edit, and tag bookmarks from its sidebar.”

Keep the Free and Pro plans, bookmark import, verified accounts, public profiles, and in-house build statement. “Visit Tagstash” remains an accurate CTA. Do not change it to “Start Free” unless the destination actually starts that flow.

**Suggested metadata:** “Tagstash is a bookmarking tool from Stone Dragon Media. Save links, organize them with tags, import bookmarks, and share collections.”

## 7. Portfolio: preserve the specifics, trim unsupported outcomes

Source: `src/pages/work.astro`.

The project descriptions are the strongest copy on the site. Keep the book and album details, visual design choices, listening links, and product features. Shorten the longest implementation bullets while preserving what shipped.

**Simon Rook catalogue bullet:**

> Add a book to one catalogue file to generate its page, chapter breakdown, reader takeaways, and purchase links.

**Simon Rook structured-data bullet:**

> Book and author structured data describes each title, its cover, and its format for search engines.

**Dorian Black structured-data bullet:**

> Album and artist structured data describes the release for search engines.

These describe the implementation without predicting a particular search presentation.

**Simon Rook hosting bullet:**

> Static pages delivered through a global content delivery network, with an automatically generated sitemap.

**Dorian Black hosting bullet:**

> Static pages delivered through a global content delivery network.

Only restore stronger speed or traffic-capacity claims if supported by measurements or testing. No evidence is presented on the page for “loads fast anywhere” or handling a release-day traffic spike.

**Optional closing text and contact link:**

> Have a website or application in mind? Tell us about your project.

The current portfolio ends after outbound project links. A closing contact link would provide an obvious route back to an inquiry.

## 8. Metadata and supporting pages

- **Encoding:** Nine reader-facing metadata fields across the homepage, About, Products, Work, Contact, services hub, and shared service template contain malformed punctuation such as `â€”` or `â€™`. Restore the intended punctuation. One template comment also has this issue. This is present in the source, not just terminal display.
- **About image metadata:** “The Stone Dragon Media team's approach…” implies a team and describes an approach rather than the image. Use the existing image description: “Desk workspace with design sketches and a laptop.”
- **Sitemap:** Replace “Portfolio of recent client projects” with “Websites and products we've designed and built.” This matches the portfolio's inclusion of Tagstash.
- **Thank-you:** The message and one-business-day follow-up are clear. Keep them; no substantial edit needed.
- **404:** Replace “The URL you requested does not exist. Please return to the homepage or use the main navigation” with “We couldn't find that page. Head back to the homepage to explore our services and work.” The current page has no main navigation, so that instruction is unhelpful.
- **Header/footer:** Navigation labels and “Client Login” are clear. Keep them. The homepage header's “Start a Project” and hero's “Discuss Your Project” both accurately lead to an inquiry form.
- **Privacy policy:** Its headings and lists make it reasonably scannable. Keep the disclosures and effective date intact for this marketing copy pass. This review does not assess legal compliance or verify third-party retention practices.

## Editorial quality gate

This is a single editor's assessment through four perspectives, not independent reviewers or conversion testing. Scores are subjective. Revised scores assess the proposed wording, assuming the commercial questions are resolved.

| Perspective | Current | Proposed | Main improvement |
|---|---|---|---|
| Conversion copywriter | 6/10 | 8/10 | A contact CTA that matches its destination and reassurance near the ask. |
| UX writer | 7/10 | 9/10 | Easier form prompts, shorter introductions, and helpful failure wording. |
| Prospective business owner | 6/10 | 8/10 | Concrete services and less pressure to provide a formal project brief. |
| Brand strategist | 7/10 | 8/10 | A practical voice that connects the agency pages with the specific portfolio copy. |

## Recommended order

1. Correct malformed metadata punctuation and the misleading booking CTA.
2. Clarify one-time and managed payment terms.
3. Apply the homepage, About, and contact edits.
4. Tighten the shared service copy and portfolio claims.
5. Finish Products and supporting-page wording.

Before implementation, keep local SEO titles and H1s, the experience calculation, service URLs, and the in-person/remote service-area distinction. Preserve catalogue-driven JSON-LD; align separately maintained descriptions when their meaning changes. Do not add unverified testimonials, numerical results, guarantees, prices, or an FAQ.

Release validation includes the required build and a review of rendered pages, especially headings, cards, buttons, and form feedback. Production is checked after allowing time for the git-integrated deployment to complete.
