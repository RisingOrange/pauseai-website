import { test } from '@chromatic-com/playwright'
import { ROUTES } from './routes'

test.describe('routes', () => {
	for (const path of ROUTES) {
		const name = path === '/' ? 'home' : path.slice(1).replace(/\//g, '-')
		test(name, async ({ page }) => {
			const response = await page.goto(path, { waitUntil: 'networkidle' })
			if (!response || !response.ok()) {
				throw new Error(`${path} returned ${response?.status() ?? 'no response'}`)
			}
			await page.evaluate(() => document.fonts.ready)
		})
	}
})
