/**
 * Browser platform adapter
 */

import type { PlatformAdapter } from '../log.js'

export const browserPlatformAdapter: PlatformAdapter = {
	getName() {
		// eslint-disable-next-line unicorn/no-useless-undefined
		return undefined
	},
}
