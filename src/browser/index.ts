/**
 * Browser entry point - no file logging
 */

import { setPlatformAdapter } from '../log.js'
import { browserPlatformAdapter } from './platform'

setPlatformAdapter(browserPlatformAdapter)

// Re-export everything from core
export type { ILogBasic, ILogLayer, LogOptions } from '../log.js'
export {
	configureDefaultLogger,
	createLogger,
	defaultLogOptions,
	getChildLogger,
	injectionHelper,
	log,
} from '../log.js'

export * as LogLayer from 'loglayer'
