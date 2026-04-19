import { test } from '@chromatic-com/playwright'

const ROUTES = [
	'/',
	'/outcomes',
	'/funding',
	'/donate',
	'/action',
	'/learn',
	'/about',
	'/communities',
	'/press'
]

for (const path of ROUTES) {
	test(`visit ${path}`, async ({ page }) => {
		await page.goto(path)
		await page.evaluate(() => document.fonts.ready)
	})
}
