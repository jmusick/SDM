// Runs before `npm run build` (the `prebuild` script). Workers Builds clones shallow,
// and astro.config.mjs leaves sitemap <lastmod> out on a shallow clone, so fetch the
// full history first. A no-op on a full clone; never fails the build.
import { execFileSync } from 'node:child_process';

try {
	const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim();
	if (shallow === 'true') {
		console.log('[unshallow] shallow clone detected, fetching full history for sitemap lastmod');
		execFileSync('git', ['fetch', '--unshallow', '--quiet'], { stdio: 'inherit' });
	}
} catch (err) {
	console.warn(`[unshallow] skipped, sitemap lastmod may be omitted: ${err.message}`);
}
