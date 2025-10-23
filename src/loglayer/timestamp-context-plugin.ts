import type { LogLayerPlugin } from 'loglayer'

// Create a timestamp plugin
export const timestampPlugin: LogLayerPlugin = {
	onContextCalled(context) {
		return {
			...context,

			// Overwrites timestamp set in JSON and file transports
			timestamp: new Date().toISOString(),
		}
	},
}
