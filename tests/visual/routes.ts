import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ROUTES_DIR = join(here, '../../src/routes')

// Pages intentionally skipped — covered by filesystem filter only if they'd
// otherwise be discovered.
const EXCLUDE_ROUTES = new Set([
	'/email-builder', // admin-only tool
	'/submitted', // post-form state
	'/verify', // token-dependent
	'/uk-email-mp', // form flow
	'/contact-us', // form state
	'/chat', // OpenAI-dependent
	'/quotes', // ~22,000px tall — exceeds Chromatic's 25M-pixel snapshot cap
	'/posts', // chronological listing; every new post would produce a noise diff
	'/communities' // embeds Mapbox + Luma iframes — third-party content churn
	// /sayno top-level is included; /sayno/share is included via recursive walk
])

function hasPage(dir: string): boolean {
	return existsSync(join(dir, '+page.svelte')) || existsSync(join(dir, '+page.ts'))
}

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

function walk(dir: string, prefix: string, out: string[]): void {
	if (hasPage(dir)) {
		const route = prefix || '/'
		if (!EXCLUDE_ROUTES.has(route)) out.push(route)
	}
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue
		if (entry.name.startsWith('[')) continue // dynamic segment, can't visit directly
		walk(join(dir, entry.name), prefix + '/' + entry.name, out)
	}
}

function discoverRouteDirs(): string[] {
	const routes: string[] = []
	walk(ROUTES_DIR, '', routes)
	return routes
}

export const ROUTES = [...discoverRouteDirs(), ...POST_SAMPLES].sort()

if (ROUTES.length < 5) {
	throw new Error(
		`Visual route discovery found only ${ROUTES.length} routes — src/routes/ probably moved`
	)
}
