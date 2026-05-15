// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://stonedragonmedia.com',
	server: {
		host: true,
		port: 4321,
	},
	vite: {
		server: {
			allowedHosts: [".ark-prime", "localhost"],
		},
	},
	integrations: [icon(), sitemap()],
});
