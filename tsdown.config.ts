import { defineConfig } from 'tsdown'

export default defineConfig([
	// Node
	{
		entry: 'src/node/index.ts',
		fixedExtension: false,
		outDir: 'dist/node',
		platform: 'node',
		tsconfig: 'tsconfig.build.json',
		dts: true,
	},
	// Browser
	{
		entry: 'src/browser/index.ts',
		minify: true,
		outDir: 'dist/browser',
		platform: 'browser',
		tsconfig: 'tsconfig.build.json',
		dts: true,
	},
	// Electron
	{
		entry: 'src/electron/renderer/index.ts',
		external: ['electron'],
		outDir: 'dist/electron/renderer',
		platform: 'browser',
		tsconfig: 'tsconfig.build.json',
		dts: true,
	},
	{
		entry: 'src/electron/main/index.ts',
		external: ['electron'],
		fixedExtension: false,
		outDir: 'dist/electron/main',
		tsconfig: 'tsconfig.build.json',
		dts: true,
		platform: 'node',
	},
	{
		entry: 'src/electron/preload/index.ts',
		external: ['electron'],
		outDir: 'dist/electron/preload',
		tsconfig: 'tsconfig.build.json',
		dts: true,
		platform: 'browser',
	},
])
