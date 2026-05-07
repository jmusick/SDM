// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	server: {
		host: true,
		port: 4321,
	},
	vite: {
		server: {
			allowedHosts: ["ark-prime", "localhost"],
		},
	},
	integrations: [icon()],
});
