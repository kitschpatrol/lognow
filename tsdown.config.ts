import { defineConfig } from 'tsdown'

export default defineConfig([
	{
		dts: false,
		entry: 'src/node/index.ts',
		outDir: 'dist/node',
		platform: 'node',
	},
	{
		dts: false,
		entry: 'src/browser/index.ts',
		minify: true,
		outDir: 'dist/browser',
		platform: 'browser',
	},
	{
		dts: false,
		entry: 'src/electron/renderer/index.ts',
		external: ['electron'],
		outDir: 'dist/electron/renderer',
		platform: 'browser',
	},
	{
		dts: false,
		entry: 'src/electron/main/index.ts',
		external: ['electron'],
		outDir: 'dist/electron/main',
		platform: 'node',
	},
	{
		dts: false,
		entry: 'src/electron/preload/index.ts',
		external: ['electron'],
		outDir: 'dist/electron/preload',
		platform: 'browser',
	},
])
