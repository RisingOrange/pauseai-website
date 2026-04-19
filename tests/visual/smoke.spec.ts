import { test } from '@chromatic-com/playwright'
import { ROUTES } from './routes'

for (const path of ROUTES) {
	test(`visit ${path}`, async ({ page }) => {
		await page.goto(path)
		await page.evaluate(() => document.fonts.ready)
	})
}
