import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: 'tests/visual',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: [['list']],
	use: {
		baseURL: 'http://localhost:4173'
	},
	projects: [
		{
			name: 'desktop',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }
		},
		{
			name: 'mobile',
			use: { ...devices['Pixel 5'] }
		}
	],
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		timeout: 360_000,
		reuseExistingServer: !process.env.CI
	}
})
