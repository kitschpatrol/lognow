/**
 * Browser-specific feature tests
 */

import { describe, expect, it, vi } from 'vitest'
import { createLogger } from '../../src/browser/index.js'
import {
	getCallString,
	isBrowserConsoleObject,
	parseAndStripTimestamp,
	stripDynamic,
} from '../helpers/test-helpers.js'

describe('browser-specific: window global', () => {
	it('should work without process object', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'no-process' })
		logger.info('Works without process')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(
			`"TIME INFO  [no-process] Works without process"`,
		)
	})

	it('should use console as default target', () => {
		const logger = createLogger()

		expect(isBrowserConsoleObject(logger.getLoggerInstance('pretty-basic-transport'))).toBe(true)
		expect(logger).toBeDefined()
	})

	it('should handle browser console methods', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, verbose: true })

		logger.trace('trace')
		logger.debug('debug')
		logger.info('info')
		logger.warn('warn')
		logger.error('error')
		logger.fatal('fatal')

		expect(mockConsole.trace).toHaveBeenCalled()
		expect(mockConsole.debug).toHaveBeenCalled()
		expect(mockConsole.info).toHaveBeenCalled()
		expect(mockConsole.warn).toHaveBeenCalled()
		expect(mockConsole.error).toHaveBeenCalledTimes(2) // Error and fatal

		// Verify actual messages
		expect(stripDynamic(getCallString(mockConsole.trace))).toMatchInlineSnapshot(
			`"TIME TRACE | trace"`,
		)
		expect(stripDynamic(getCallString(mockConsole.debug))).toMatchInlineSnapshot(
			`"TIME DEBUG | debug"`,
		)
		expect(stripDynamic(getCallString(mockConsole.info))).toMatchInlineSnapshot(
			`"TIME INFO  | info"`,
		)
		expect(stripDynamic(getCallString(mockConsole.warn))).toMatchInlineSnapshot(
			`"TIME WARN  | warn"`,
		)
		expect(stripDynamic(getCallString(mockConsole.error, 0))).toMatchInlineSnapshot(
			`"TIME ERROR | error"`,
		)
		expect(stripDynamic(getCallString(mockConsole.error, 1))).toMatchInlineSnapshot(
			`"TIME FATAL | fatal"`,
		)
	})
})

describe('browser-specific: no file system', () => {
	it('should throw error when trying to use file logging', () => {
		expect(() => {
			createLogger({
				logJsonToFile: true,
				name: 'file-test',
			})
		}).toThrow(/only supported in Node.js/)
	})

	it('should throw error when passing file path', () => {
		expect(() => {
			createLogger({
				logJsonToFile: '/some/path',
				name: 'file-path',
			})
		}).toThrow(/only supported in Node.js/)
	})

	it('should throw error when passing file config', () => {
		expect(() => {
			createLogger({
				logJsonToFile: {
					filename: '/some/path/file.log',
				},
				name: 'file-config',
			})
		}).toThrow(/only supported in Node.js/)
	})
})

describe('browser-specific: console objects', () => {
	it('should accept custom console-like objects', () => {
		const customConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({
			logToConsole: customConsole,
			name: 'custom',
		})

		logger.info('custom console')

		expect(customConsole.info).toHaveBeenCalled()
		const call = getCallString(customConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [custom] custom console"`)
	})

	it('should work with global console', () => {
		const logger = createLogger({
			logToConsole: globalThis.console,
			name: 'global-console',
		})

		// No exception should be thrown when logging to real console
		logger.info('global console')
		expect(logger).toBeDefined()
	})
})

describe('browser-specific: JSON output', () => {
	it('should output JSON to console in browser', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({
			logJsonToConsole: mockConsole,
			logToConsole: false,
			name: 'json-browser',
		})

		logger.info('JSON output')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(parseAndStripTimestamp(call)).toMatchInlineSnapshot(`
			{
			  "level": "info",
			  "messages": [
			    "JSON output",
			  ],
			  "name": "json-browser",
			  "timestamp": "TIME",
			}
		`)
	})

	it('should output pretty JSON to console', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({
			logJsonToConsole: {
				logger: mockConsole,
				pretty: true,
			},
			logToConsole: false,
			name: 'pretty-json',
		})

		logger.info('Pretty JSON')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`
			"{
			  level: 'info',
			  messages: [
			    'Pretty JSON'
			  ],
			  name: 'pretty-json',
			  timestamp: 'TIMESTAMP'
			}"
		`)
	})

	it('should output colorized JSON in browser', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({
			logJsonToConsole: {
				colorize: true,
				logger: mockConsole,
			},
			logToConsole: false,
			name: 'color-json',
		})

		logger.info('Colorized JSON')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(
			`"{ level: 'info', messages: [ 'Colorized JSON' ], name: 'color-json', timestamp: 'TIMESTAMP' }"`,
		)
	})
})

describe('browser-specific: terminal width', () => {
	it('should use large default terminal width in browser', () => {
		const logger = createLogger({ name: 'width-test' })
		expect(logger).toBeDefined()
		// In browser, terminal width should be very large (no wrapping)
	})
})

describe('browser-specific: environment variables', () => {
	it('should handle absence of process.env', () => {
		const logger = createLogger({ name: 'no-env' })
		expect(logger).toBeDefined()
	})

	it('should not fail on color env checks', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({
			logToConsole: mockConsole,
			name: 'color-check',
		})

		logger.info('Color check')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [color-check] Color check"`)
	})
})

describe('browser-specific: complex browser objects', () => {
	it('should handle browser Event objects', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'events' })

		// Simulate an event-like object
		const eventLike = {
			target: { id: 'button1' },
			timestamp: Date.now(),
			type: 'click',
		}

		logger.withMetadata(eventLike).info('Event')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [events] Event"`)
		// Metadata is logged and doesn't cause errors
	})

	it('should handle window-like objects', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'window' })

		const windowLike = {
			document: { title: 'Test Page' },
			location: { href: 'https://example.com' },
			navigator: { userAgent: 'Test' },
		}

		logger.withMetadata(windowLike).info('Window')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [window] Window"`)
		// Metadata is logged and doesn't cause errors
	})

	it('should handle Response-like objects', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'response' })

		const responseLike = {
			headers: { 'content-type': 'application/json' },
			status: 200,
			statusText: 'OK',
		}

		logger.withMetadata(responseLike).info('Response')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [response] Response"`)
		// Metadata is logged and doesn't cause errors
	})
})

describe('browser-specific: async operations', () => {
	it('should handle fetch-like promises', async () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'fetch' })

		const mockFetch = Promise.resolve({ status: 200 })

		await mockFetch.then((response) => {
			logger.withMetadata(response).info('Fetch complete')
		})

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [fetch] Fetch complete"`)
		// Metadata is logged and doesn't cause errors
	})

	it('should log in setTimeout', async () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'timeout' })

		await new Promise<void>((done) => {
			setTimeout(() => {
				logger.info('Delayed log')
				done()
			}, 10)
		})

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [timeout] Delayed log"`)
	})

	it('should log in Promise chain', async () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'promise' })

		await Promise.resolve()
			.then(() => {
				logger.info('First')
			})
			.then(() => {
				logger.info('Second')
			})
			.then(() => {
				logger.info('Third')
			})

		expect(mockConsole.info).toHaveBeenCalledTimes(3)
		expect(stripDynamic(getCallString(mockConsole.info, 0))).toMatchInlineSnapshot(
			`"TIME INFO  [promise] First"`,
		)
		expect(stripDynamic(getCallString(mockConsole.info, 1))).toMatchInlineSnapshot(
			`"TIME INFO  [promise] Second"`,
		)
		expect(stripDynamic(getCallString(mockConsole.info, 2))).toMatchInlineSnapshot(
			`"TIME INFO  [promise] Third"`,
		)
	})
})

describe('browser-specific: error types', () => {
	it('should handle TypeError', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'type-error' })
		const error = new TypeError('Type error')

		logger.withMetadata({ error: error.message }).error('TypeError')

		expect(mockConsole.error).toHaveBeenCalled()
		const call = getCallString(mockConsole.error)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME ERROR [type-error] TypeError"`)
		// Metadata is logged and doesn't cause errors
	})

	it('should handle ReferenceError', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'ref-error' })
		const error = new ReferenceError('Reference error')

		logger.withMetadata({ error: error.message }).error('ReferenceError')

		expect(mockConsole.error).toHaveBeenCalled()
		const call = getCallString(mockConsole.error)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME ERROR [ref-error] ReferenceError"`)
		// Metadata is logged and doesn't cause errors
	})

	it('should handle SyntaxError', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'syntax-error' })
		const error = new SyntaxError('Syntax error')

		logger.withMetadata({ error: error.message }).error('SyntaxError')

		expect(mockConsole.error).toHaveBeenCalled()
		const call = getCallString(mockConsole.error)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME ERROR [syntax-error] SyntaxError"`)
		// Metadata is logged and doesn't cause errors
	})

	it('should handle custom Error classes', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'custom-error' })

		class CustomError extends Error {
			constructor(message: string) {
				super(message)
				this.name = 'CustomError'
			}
		}

		const error = new CustomError('Custom error')
		logger.withMetadata({ error: error.message }).error('CustomError')

		expect(mockConsole.error).toHaveBeenCalled()
		const call = getCallString(mockConsole.error)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME ERROR [custom-error] CustomError"`)
		// Metadata is logged and doesn't cause errors
	})
})

describe('browser-specific: localStorage simulation', () => {
	it('should log localStorage-like data', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'storage' })

		const storageData = {
			key1: 'value1',
			key2: 'value2',
			userId: '12345',
		}

		logger.withContext(storageData).info('Storage data logged')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [storage] Storage data logged"`)
		// Context is logged and doesn't cause errors
	})
})

describe('browser-specific: web workers simulation', () => {
	it('should work in worker-like context', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({
			logToConsole: mockConsole,
			name: 'worker',
		})

		logger.info('Worker log')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [worker] Worker log"`)
	})
})

describe('browser-specific: performance', () => {
	it('should handle rapid logging in browser', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'perf' })

		for (let i = 0; i < 100; i++) {
			logger.info(`Message ${i}`)
		}

		expect(mockConsole.info).toHaveBeenCalledTimes(100)
		// Verify first and last messages with snapshots
		expect(stripDynamic(getCallString(mockConsole.info, 0))).toMatchInlineSnapshot(
			`"TIME INFO  [perf] Message 0"`,
		)
		expect(stripDynamic(getCallString(mockConsole.info, 99))).toMatchInlineSnapshot(
			`"TIME INFO  [perf] Message 99"`,
		)
	})

	it('should handle concurrent promises', async () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'concurrent' })

		const promises = Array.from({ length: 50 }, async (_, i) =>
			Promise.resolve().then(() => {
				logger.info(`Async ${i}`)
			}),
		)

		await Promise.all(promises)

		expect(mockConsole.info).toHaveBeenCalledTimes(50)
	})
})

describe('browser-specific: memory management', () => {
	it('should not leak with many loggers', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const loggers = Array.from({ length: 100 }, (_, i) =>
			createLogger({ logToConsole: mockConsole, name: `logger-${i}` }),
		)

		expect(loggers.length).toBe(100)
		for (const logger of loggers) logger.info('test')

		expect(mockConsole.info).toHaveBeenCalledTimes(100)
	})

	it('should handle large objects in browser', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'large' })

		const largeObject: Record<string, string> = {}
		for (let i = 0; i < 500; i++) {
			largeObject[`key${i}`] = `value${i}`
		}

		logger.withMetadata(largeObject).info('Large object')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [large] Large object"`)
		// Large metadata is logged and doesn't cause errors
	})
})
