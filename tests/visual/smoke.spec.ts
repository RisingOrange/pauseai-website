import { test } from '@chromatic-com/playwright'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROUTES } from './routes'

const here = dirname(fileURLToPath(import.meta.url))
const newsFixture = readFileSync(join(here, 'fixtures/news.json'), 'utf8')

test.describe('routes', () => {
	// Stub volatile external data so snapshots don't churn on unrelated
	// upstream changes (e.g. new Substack posts). Client-side fetches only —
	// SSR fetches would need a different approach.
	test.beforeEach(async ({ page }) => {
		await page.route('**/api/news*', (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: newsFixture })
		)
		// Block Tally form embeds (used on /statement and /join). Tally's iframe
		// reports its content height back to the parent async, producing ~20px
		// height deltas between runs. With the iframe blocked, the container
		// collapses to its CSS size — deterministic. We lose no coverage: the
		// iframe content isn't visible to Chromatic anyway.
		await page.route('**/tally.so/**', (route) => route.abort())
	})

	for (const path of ROUTES) {
		const name = path === '/' ? 'home' : path.slice(1).replace(/\//g, '-')
		test(name, async ({ page }, testInfo) => {
			const response = await page.goto(path, { waitUntil: 'networkidle' })
			if (!response || !response.ok()) {
				throw new Error(`${path} returned ${response?.status() ?? 'no response'}`)
			}
			await page.evaluate(() => document.fonts.ready)
			// Self-validate the /api/news mock is actually being used — otherwise the
			// suite would quietly capture live Substack data if the route pattern
			// stopped matching (e.g. if news ever moved to SSR).
			if (path === '/') {
				await page.getByText('Sample news item one').waitFor({ state: 'visible', timeout: 5000 })
			}
			const screenshot = await page.screenshot({ fullPage: true })
			await testInfo.attach('full-page', { body: screenshot, contentType: 'image/png' })
		})
	}
})
