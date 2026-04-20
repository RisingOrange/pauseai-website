// Reads the Vite client manifest to find which CSS files a given post's module
// tree depends on, so we can inject <link rel="stylesheet"> tags into the
// prerendered HTML. Without this, component CSS inside .md files loads only
// after hydration (dynamic chunk boundary), causing a flash of unstyled content.
//
// Manifest shape: https://vite.dev/guide/backend-integration.html
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface ManifestEntry {
	file: string
	css?: string[]
	imports?: string[]
}

type Manifest = Record<string, ManifestEntry>

let cachedManifest: Manifest | null | undefined

function loadManifest(): Manifest | null {
	if (cachedManifest !== undefined) return cachedManifest
	const path = join(process.cwd(), '.svelte-kit/output/client/.vite/manifest.json')
	try {
		cachedManifest = JSON.parse(readFileSync(path, 'utf-8')) as Manifest
	} catch (err) {
		// Missing file is expected in dev (Vite serves unbundled, no FOUC). Any
		// other failure in a build/prerender context would silently ship FOUC
		// for every post, so surface it rather than swallowing.
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
			cachedManifest = null
		} else {
			throw err
		}
	}
	return cachedManifest
}

function manifestKey(slug: string, locale: string): string {
	return locale === 'en' ? `src/posts/${slug}.md` : `l10n-cage/md/${locale}/${slug}.md`
}

export function cssForPost(slug: string, locale: string): string[] {
	const manifest = loadManifest()
	if (!manifest) return []
	const seen = new Set<string>()
	const css = new Set<string>()
	const walk = (k: string) => {
		if (seen.has(k)) return
		seen.add(k)
		const entry = manifest[k]
		if (!entry) return
		// Recurse first so dependency CSS lands earlier in <link> order,
		// matching Vite's preload ordering (cascade: deps before dependents).
		for (const imp of entry.imports ?? []) walk(imp)
		for (const c of entry.css ?? []) css.add(`/${c}`)
	}
	walk(manifestKey(slug, locale))
	return [...css]
}
