// @ts-check
import { defineConfig } from 'astro/config';
import { sessionDrivers } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Sitemap <lastmod> = the last git commit touching a page's source file (plus the
// services catalogue for /services/*), not the build time — a lastmod that changes
// on every deploy is one crawlers learn to ignore. If git history isn't available
// (no git, or a shallow clone where every file looks last-touched by one commit),
// lastmod is left out rather than guessed.
const gitHistory = (() => {
	try {
		return execFileSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim() === 'false';
	} catch {
		return false;
	}
})();

/** @param {string[]} files */
function lastCommitDate(files) {
	try {
		const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...files], { encoding: 'utf8' }).trim();
		return out || undefined;
	} catch {
		return undefined;
	}
}

/** @param {string} pathname */
function sourceFilesFor(pathname) {
	const route = pathname.replace(/^\/|\/$/g, '');
	if (route === 'services') return ['src/pages/services/index.astro', 'src/lib/services.ts'];
	if (route.startsWith('services/')) return ['src/pages/services/[category].astro', 'src/lib/services.ts'];
	const candidates = route === '' ? ['src/pages/index.astro'] : [`src/pages/${route}.astro`, `src/pages/${route}/index.astro`];
	return candidates.filter((file) => existsSync(file));
}

// https://astro.build/config
export default defineConfig({
	site: 'https://stonedragonmedia.com',
	output: 'server',
	// Astro 7 defaults to 'jsx', which strips whitespace between inline elements
	// ("<b>a</b> <i>b</i>" renders as "ab"). Keep the v6 behaviour rather than audit
	// every page for it.
	compressHTML: true,
	session: {
		// This app uses custom cookie-session auth, use lruCache to avoid an auto KV binding
		driver: sessionDrivers.lruCache(),
	},
	adapter: cloudflare({
		imageService: 'compile',
	}),
	server: {
		host: true,
		port: 4321,
	},
	vite: {
		server: {
			allowedHosts: [".ark-prime", "localhost"],
		},
	},
	integrations: [
		icon(),
		sitemap({
			filter: (page) =>
				!page.includes("/thank-you") &&
				!page.includes("/login") &&
				!page.includes("/dashboard") &&
				!page.includes("/admin") &&
				!page.includes("/api"),
			serialize(item) {
				if (!gitHistory) return item;
				const files = sourceFilesFor(new URL(item.url).pathname);
				const lastmod = files.length ? lastCommitDate(files) : undefined;
				return lastmod ? { ...item, lastmod } : item;
			},
		}),
	],
});
