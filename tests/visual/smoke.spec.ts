import { test } from '@chromatic-com/playwright'
import { ROUTES } from './routes'

for (const path of ROUTES) {
	test(`visit ${path}`, async ({ page }) => {
		const response = await page.goto(path, { waitUntil: 'networkidle' })
		if (!response || !response.ok()) {
			throw new Error(`${path} returned ${response?.status() ?? 'no response'}`)
		}
		await page.evaluate(() => document.fonts.ready)
	})
}
