import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	entry: ['test/assets/nightmare-object.ts'],
	ignoreDependencies: [
		'@kitschpatrol/chagent', // Typically invoked through bumpp's --execute argument, which Knip doesn't parse
	],
})
