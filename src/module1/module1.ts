import { log } from './log.js'

/**
 * Do something.
 */
export function doSomething() {
	log.info('Hello, module1!')
}

export { setLogger } from './log.js'
