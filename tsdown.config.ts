import { defineConfig } from 'tsdown'

export default defineConfig([
	{
		dts: true,
		entry: 'src/node/index.ts',
		outDir: 'dist/node',
		platform: 'node',
		tsconfig: 'tsconfig.build.json',
	},
	{
		dts: true,
		entry: 'src/browser/index.ts',
		minify: true,
		outDir: 'dist/browser',
		platform: 'browser',
		tsconfig: 'tsconfig.build.json',
	},
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
