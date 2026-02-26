import { defineConfig } from 'tsdown'

export default defineConfig([
	// Node
	{
		dts: true,
		entry: 'src/node/index.ts',
		fixedExtension: false,
		outDir: 'dist/node',
		platform: 'node',
		tsconfig: 'tsconfig.build.json',
	},
	// Browser
	{
		dts: true,
		entry: 'src/browser/index.ts',
		outDir: 'dist/browser',
		platform: 'browser',
		tsconfig: 'tsconfig.build.json',
	},
	// Browser Standalone (Bundled for CDNs)
	{
		dts: false,
		entry: 'src/browser/index.ts',
		fixedExtension: false,
		format: 'esm',
		minify: true,
		noExternal: [
			'@loglayer/context-manager',
			'@loglayer/transport',
			'node-inspect-extracted',
			'ansi-colors',
			'defu',
			'loglayer',
			'safe-stable-stringify',
			'serialize-error',
			'wrap-ansi',
		],
		outDir: 'dist/standalone',
		platform: 'browser',
	},
	// Electron
	{
		dts: true,
		entry: 'src/electron/renderer/index.ts',
		external: ['electron'],
		outDir: 'dist/electron/renderer',
		platform: 'browser',
		tsconfig: 'tsconfig.build.json',
	},
	{
		dts: true,
		entry: 'src/electron/main/index.ts',
		external: ['electron'],
		fixedExtension: false,
		outDir: 'dist/electron/main',
		platform: 'node',
		tsconfig: 'tsconfig.build.json',
	},
	{
		dts: true,
		entry: 'src/electron/preload/index.ts',
		external: ['electron'],
		outDir: 'dist/electron/preload',
		platform: 'browser',
		tsconfig: 'tsconfig.build.json',
	},
])
