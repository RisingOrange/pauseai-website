import { test, expect } from '@chromatic-com/playwright'
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
				await expect(page.getByText('Sample news item one')).toBeVisible()
			}
			const screenshot = await page.screenshot({ fullPage: true })
			await testInfo.attach('full-page', { body: screenshot, contentType: 'image/png' })
		})
	}
})
