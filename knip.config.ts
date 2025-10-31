import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	entry: [
		'src/node/index.ts',
		'src/browser/index.ts',
		'src/electron/main/index.ts',
		'src/electron/renderer/index.ts',
		'src/electron/preload/index.ts',
		'test/assets/nightmare-object.ts',
	],
})
