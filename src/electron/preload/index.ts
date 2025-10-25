import { contextBridge, ipcRenderer } from 'electron'

/**
 * Setup the logger to send messages to the main process.
 */
export function preload() {
	console.log('----------------------------------')
	console.log('preload')
	contextBridge.exposeInMainWorld('logToMain', (message: string) => {
		ipcRenderer.send('kitschpatrol-log', message)
	})
}

// Run automatically, tsk tsk
preload()
