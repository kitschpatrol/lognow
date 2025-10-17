/**
 * Node.js entry point - includes file logging support
 */

import { setPlatformAdapter } from '../log.js'
import { nodePlatformAdapter } from './platform.js'

setPlatformAdapter(nodePlatformAdapter)

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
