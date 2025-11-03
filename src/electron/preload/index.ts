import { contextBridge, ipcRenderer } from 'electron'

/**
 * Setup the logger to send messages to the main process.
 */
export function preload() {
	contextBridge.exposeInMainWorld('logToMain', (message: string) => {
		ipcRenderer.send('lognow-electron-channel', message)
	})
}

// Run automatically, tsk tsk
preload()
