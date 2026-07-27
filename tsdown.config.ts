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
		deps: {
			alwaysBundle: [
				'@kitschpatrol/node-inspect-extracted',
				'@kitschpatrol/safe-stable-stringify',
				'@loglayer/context-manager',
				'@loglayer/transport',
				'defu',
				'loglayer',
				'next-json',
				'serialize-error',
				'tinyrainbow',
				'wrap-ansi',
			],
			// Everything is bundled by design, so the accidental-inlining
			// whitelist doesn't apply here
			onlyBundle: false,
		},
		// Declarations come from the dedicated entry below — generating them
		// here would split a shared rolldown-runtime chunk out of the JS
		dts: false,
		entry: 'src/browser/index.ts',
		fixedExtension: false,
		format: 'esm',
		minify: true,
		outDir: 'dist/standalone',
		platform: 'browser',
	},
	// Browser Standalone types (self-contained declaration bundle)
	{
		deps: {
			dts: {
				// Inline all types, including type-only deps absent from the JS
				// bundle, so the standalone declaration file is self-contained
				alwaysBundle: [
					'@kitschpatrol/node-inspect-extracted',
					'@kitschpatrol/safe-stable-stringify',
					'@loglayer/context-manager',
					'@loglayer/plugin',
					'@loglayer/shared',
					'@loglayer/transport',
					'@loglayer/transport-log-file-rotation',
					'loglayer',
					'tinyrainbow',
				],
			},
		},
		dts: { emitDtsOnly: true },
		entry: 'src/browser/index.ts',
		fixedExtension: false,
		format: 'esm',
		outDir: 'dist/standalone',
		platform: 'browser',
		tsconfig: 'tsconfig.build.json',
	},
	// Electron preload
	{
		deps: {
			neverBundle: ['electron'],
			onlyBundle: [],
		},
		dts: true,
		entry: 'src/electron-preload/index.ts',
		outDir: 'dist/electron-preload',
		platform: 'browser',
		tsconfig: 'tsconfig.build.json',
	},
])
