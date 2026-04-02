import type { LogLayerPlugin } from 'loglayer'

// Create a timestamp plugin
export const timestampPlugin: LogLayerPlugin = {
	onContextCalled(context) {
		// Mutate directly — loglayer assembles a fresh context per call
		context.timestamp = new Date().toISOString()
		return context
	},
}
