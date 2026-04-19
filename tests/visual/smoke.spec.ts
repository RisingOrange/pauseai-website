import { test } from '@chromatic-com/playwright'

test('homepage', async ({ page }) => {
	await page.goto('/')
	await page.evaluate(() => document.fonts.ready)
})
