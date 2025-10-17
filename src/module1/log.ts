import type { ILogBasic, ILogLayer } from '../node/index.js'
import { createLogger, injectionHelper, isILogLayer } from '../node/index.js'

/**
 * The default logger instance for the module. Configure log settings here.
 */
export let log = createLogger({ name: 'module1' })

/**
 * Set the logger instance for the module. Useful for dependency injection.
 * @param logger - Accepts either a LogLayer instance or a target with typical Console-like logging methods.
 */
export function setLogger(logger: ILogBasic | ILogLayer) {
	log = injectionHelper(logger)
}
