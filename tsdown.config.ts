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
])
