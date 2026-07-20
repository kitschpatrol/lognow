import { generateDtsBundle } from 'dts-bundle-generator'
import { writeFileSync } from 'node:fs'
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
				'@loglayer/context-manager',
				'@loglayer/transport',
				'node-inspect-extracted',
				'ansi-colors',
				'defu',
				'loglayer',
				'next-json',
				'safe-stable-stringify',
				'serialize-error',
				'wrap-ansi',
			],
		},
		dts: false,
		entry: 'src/browser/index.ts',
		fixedExtension: false,
		format: 'esm',
		hooks: {
			'build:done'() {
				// Tsdown's type bundling doesn't work since we can't separately externalize
				// type definitions and source code, but `dts-bundle-generator` seems to
				// work fine.
				const result = generateDtsBundle(
					[
						{
							filePath: './src/browser/index.ts',
							libraries: {
								inlinedLibraries: [
									'@loglayer/context-manager',
									'@loglayer/plugin',
									'@loglayer/shared',
									'@loglayer/transport-log-file-rotation',
									'@loglayer/transport',
									'loglayer',
									'node-inspect-extracted',
								],
							},
							output: {
								noBanner: true,
							},
						},
					],
					{
						preferredConfigPath: './tsconfig.build.json',
					},
				)

				// GenerateDtsBundle returns string[] (one per entry point)
				const [dtsBundle] = result
				if (dtsBundle === undefined) {
					throw new Error('dts-bundle-generator returned no output for the standalone bundle')
				}

				writeFileSync('./dist/standalone/index.d.ts', dtsBundle)
			},
		},
		minify: true,
		outDir: 'dist/standalone',
		platform: 'browser',
	},
	// Electron preload
	{
		deps: {
			neverBundle: ['electron'],
		},
		dts: true,
		entry: 'src/electron-preload/index.ts',
		outDir: 'dist/electron-preload',
		platform: 'browser',
		tsconfig: 'tsconfig.build.json',
	},
])
