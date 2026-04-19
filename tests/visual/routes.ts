import { readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ROUTES_DIR = join(here, '../../src/routes')

// Route dirs that aren't real pages or aren't useful to snapshot.
const EXCLUDE_ROUTE_DIRS = new Set([
	'api',
	'[slug]',
	'posts',
	'rss.xml',
	'sitemap.txt',
	'sitemap.xml',
	'email-builder', // admin-only tool
	'submitted', // post-form state
	'verify', // token-dependent
	'uk-email-mp', // form flow
	'contact-us', // form state
	'chat' // OpenAI-dependent
	// /sayno top-level is included; /sayno/[id] has random IDs but isn't prerendered
])

// Markdown posts (rendered via [slug]) that share the same layout — pick a few
// representatives so we catch regressions to the post layout without snapshotting
// all 100+ posts.
const POST_SAMPLES = [
	'/funding', // markdown post with embedded Svelte components
	'/join', // markdown post with embedded Svelte components
	'/values', // plain long-form markdown
	'/action', // link-heavy post
	'/learn' // long-form with many headings
]

function discoverRouteDirs(): string[] {
	const routes: string[] = ['/']
	for (const entry of readdirSync(ROUTES_DIR)) {
		if (EXCLUDE_ROUTE_DIRS.has(entry)) continue
		const full = join(ROUTES_DIR, entry)
		if (!statSync(full).isDirectory()) continue
		routes.push('/' + entry)
	}
	return routes
}

export const ROUTES = [...discoverRouteDirs(), ...POST_SAMPLES].sort()
