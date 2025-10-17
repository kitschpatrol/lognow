/**
 * Node.js entry point - includes file logging support
 */

import { setPlatformAdapter } from '../log.js'
import { nodePlatformAdapter } from './platform.js'

setPlatformAdapter(nodePlatformAdapter)

// Re-export everything from core
export type { ILogBasic, ILogLayer, LogOptions } from '../log.js'
export {
	createLogger,
	DEFAULT_LOG_OPTIONS,
	getChildLogger,
	injectionHelper,
	log,
	setDefaultLogOptions,
} from '../log.js'

export { HierarchicalContextManager } from '../loglayer/hierarchical-context-manager.js'
export * as LogLayerModule from 'loglayer'
