import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		// Shared configuration for all projects
		exclude: ['**/node_modules/**', '**/dist/**'],
		// Define separate projects for browser and node tests
		projects: [
			{
				// Browser project
				test: {
					browser: {
						enabled: true,
						headless: true,
						instances: [{ browser: 'chromium' }],
						provider: playwright(),
						screenshotFailures: false,
					},
					include: ['test/browser/**/*.{test,spec}.{js,ts}'],
					name: 'browser',
				},
			},
			{
				// Node project
				test: {
					environment: 'node',
					include: ['test/node/**/*.{test,spec}.{js,ts}'],
					name: 'node',
				},
			},
		],
		silent: 'passed-only', // Suppress console output during tests
	},
})
