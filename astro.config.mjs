// @ts-check
import { defineConfig } from 'astro/config';
import { sessionDrivers } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	site: 'https://stonedragonmedia.com',
	output: 'server',
	build: {
		client: './',
		server: './_worker.js',
	},
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
		}),
	],
});
