/**
 * Browser platform adapter
 */

import type { LoggerlessTransport } from '@loglayer/transport'
import { inspect as nodeInspectExtracted } from '@kitschpatrol/node-inspect-extracted'
import { BlankTransport } from 'loglayer'
import { NJSON } from 'next-json'
import type { PlatformAdapter } from '../log.js'
import { getElectronBridge } from '../electron-bridge.js'

/**
 * Get the terminal width.
 */
function getTerminalWidth(): number {
	// TODO reconsider
	return Number.MAX_SAFE_INTEGER
}

/**
 * When running in an Electron renderer with the `lognow/electron-preload`
 * bridge in place, forward logs to the main process. Returns undefined in a
 * plain browser so the logger degrades gracefully to console-only output.
 */
function createElectronTransport(): LoggerlessTransport | undefined {
	const bridge = getElectronBridge()
	if (bridge === undefined) {
		return undefined
	}

	return new BlankTransport({
		shipToLogger(params) {
			bridge.sendToMain(NJSON.stringify(params))

			// eslint-disable-next-line ts/no-unsafe-return
			return params.messages
		},
	})
}

export const browserPlatformAdapter: PlatformAdapter = {
	createElectronTransport,
	getName() {
		return getElectronBridge() === undefined ? undefined : 'Renderer'
	},
	getTerminalWidth,
	inspect: nodeInspectExtracted,
}
