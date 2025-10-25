/**
 * Browser entry point - no file logging
 */

import { setPlatformAdapter } from '../../log.js'
// Re-export everything from core
export type { ILogBasic, ILogLayer, LogOptions } from '../../log.js'
import { electronRendererPlatformAdapter } from './platform'

setPlatformAdapter(electronRendererPlatformAdapter)

export {
	createLogger,
	DEFAULT_LOG_OPTIONS,
	getChildLogger,
	injectionHelper,
	log,
	setDefaultLogOptions,
} from '../../log.js'

export { HierarchicalContextManager } from '../../loglayer/hierarchical-context-manager.js'
export * as LogLayerModule from 'loglayer'
