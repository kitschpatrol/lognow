import { contextBridge, ipcRenderer } from 'electron'
import { LOGNOW_ELECTRON_BRIDGE_KEY, LOGNOW_ELECTRON_IPC_CHANNEL } from '../electron-bridge.js'

/**
 * Setup the logger to send messages to the main process.
 */
export function preload(): void {
	contextBridge.exposeInMainWorld(LOGNOW_ELECTRON_BRIDGE_KEY, {
		sendToMain(message: string) {
			ipcRenderer.send(LOGNOW_ELECTRON_IPC_CHANNEL, message)
		},
	})
}

// Run automatically, tsk tsk
// eslint-disable-next-line unicorn/no-top-level-side-effects
preload()
