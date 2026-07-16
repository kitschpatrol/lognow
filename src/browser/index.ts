/**
 * Browser entry point - no file logging
 */

import { setPlatformAdapter } from '../log.js'
// Re-export everything from core
export type { ILogBasic, ILogLayer, LogOptions } from '../log.js'
import { browserPlatformAdapter } from './platform'

// The platform adapter must be registered when this entry point is imported
// eslint-disable-next-line unicorn/no-top-level-side-effects
setPlatformAdapter(browserPlatformAdapter)

export {
	createLogger,
	DEFAULT_LOG_OPTIONS,
	getChildLogger,
	getJsonFileTransportDestinations,
	injectionHelper,
	log,
	setDefaultLogOptions,
} from '../log.js'

export { HierarchicalContextManager } from '../loglayer/hierarchical-context-manager.js'
export type { JsonBasicTransportConfig } from '../loglayer/json-basic-transport.js'
export type { JsonFileTransportConfig } from '../loglayer/json-file-transport.js'
export type { PrettyBasicTransportConfig } from '../loglayer/pretty-basic-transport.js'
export * as LogLayerModule from 'loglayer'
