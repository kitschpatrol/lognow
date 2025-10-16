import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: ['src/index.ts'],
	external: ['node:process', 'node:path', 'node:os', 'unicorn-magic'],
	minify: false,
	platform: 'neutral', // Or 'browser' if you want browser-first
	// Optional: use shims for Node globals
	tsconfig: 'tsconfig.build.json',
})
