/**
 * Shared constants and types for the Electron IPC bridge. Used by the preload
 * entry point (which exposes the bridge), the browser platform adapter (which
 * detects and sends through it), and the node platform adapter (which receives
 * from it in the Electron main process).
 */

export const LOGNOW_ELECTRON_IPC_CHANNEL = 'lognow-electron-channel'

export const LOGNOW_ELECTRON_BRIDGE_KEY = '__lognow__'

export type LognowElectronBridge = {
	sendToMain: (message: string) => void
}

/**
 * Detect the bridge exposed by the `lognow/electron-preload` script, if
 * present. Returns undefined outside Electron (or when the preload script
 * wasn't loaded).
 */
export function getElectronBridge(): LognowElectronBridge | undefined {
	const candidate = (globalThis as Record<string, unknown>)[LOGNOW_ELECTRON_BRIDGE_KEY]

	if (
		typeof candidate === 'object' &&
		candidate !== null &&
		'sendToMain' in candidate &&
		typeof (candidate as LognowElectronBridge).sendToMain === 'function'
	) {
		return candidate as LognowElectronBridge
	}

	return undefined
}
