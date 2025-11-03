import { contextBridge, ipcRenderer } from 'electron'

/**
 * Setup the logger to send messages to the main process.
 */
export function preload() {
	contextBridge.exposeInMainWorld('logToMain', (message: string) => {
		ipcRenderer.send('kitschpatrol-log', message)
	})
}

// Run automatically, tsk tsk
preload()
