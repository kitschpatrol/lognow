/**
 * Browser platform adapter
 */

import { inspect as nodeInspectExtracted } from 'node-inspect-extracted'
import type { PlatformAdapter } from '../log.js'

/**
 * Get the terminal width.
 */
export function getTerminalWidth(): number {
	// TODO reconsider
	return Number.MAX_SAFE_INTEGER
}

export const browserPlatformAdapter: PlatformAdapter = {
	getName() {
		// eslint-disable-next-line unicorn/no-useless-undefined
		return undefined
	},
	getTerminalWidth,
	inspect: nodeInspectExtracted,
}
