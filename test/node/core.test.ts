/**
 * Core logging functionality tests for Node.js environment
 */

import { describe, expect, it, vi } from 'vitest'
import {
	createLogger,
	DEFAULT_LOG_OPTIONS,
	getChildLogger,
	injectionHelper,
	log,
	setDefaultLogOptions,
} from '../../src/node/index.js'
import { getCallString, parseAndStripTimestamp, stripDynamic } from '../helpers/test-helpers.js'

describe('createLogger', () => {
	it('should create a logger instance', () => {
		const logger = createLogger()
		expect(logger).toBeDefined()
		expect(typeof logger.info).toBe('function')
		expect(typeof logger.error).toBe('function')
		expect(typeof logger.warn).toBe('function')
		expect(typeof logger.debug).toBe('function')
		expect(typeof logger.trace).toBe('function')
		expect(typeof logger.fatal).toBe('function')
	})

	it('should create a logger with a name', () => {
		const logger = createLogger({ name: 'test-logger' })
		expect(logger.getContext()).toHaveProperty('name', 'test-logger')
	})

	it('should accept a string as shortcut for name', () => {
		const logger = createLogger('shortcut-name')
		expect(logger.getContext()).toHaveProperty('name', 'shortcut-name')
	})

	it('should respect verbose option', () => {
		const verboseLogger = createLogger({ logToConsole: false, verbose: true })
		expect(verboseLogger).toBeDefined()
		// Verbose logger should allow trace level logs
		expect(() => {
			verboseLogger.trace('test')
		}).not.toThrow()

		const normalLogger = createLogger({ logToConsole: false, verbose: false })
		expect(normalLogger).toBeDefined()
	})

	it('should respect DEBUG environment variable', () => {
		const originalDebug = process.env.DEBUG
		process.env.DEBUG = '1'

		try {
			const mockConsole = {
				debug: vi.fn(),
				error: vi.fn(),
				info: vi.fn(),
				trace: vi.fn(),
				warn: vi.fn(),
			}

			// Without verbose, trace is below the default (info) level; DEBUG forces verbose.
			const logger = createLogger({ logToConsole: mockConsole })
			logger.trace('debug test')
			expect(mockConsole.trace).toHaveBeenCalled()
		} finally {
			if (originalDebug === undefined) {
				delete process.env.DEBUG
			} else {
				process.env.DEBUG = originalDebug
			}
		}
	})

	it('should support logJsonToConsole option', () => {
		const logger = createLogger({ logJsonToConsole: true })
		expect(logger).toBeDefined()
	})

	it('should support logToConsole option', () => {
		const logger = createLogger({ logToConsole: false })
		expect(logger).toBeDefined()
	})

	it('should treat an empty name as unset', () => {
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
			name: '',
		})

		expect(logger.getContext()).not.toHaveProperty('name')

		logger.info('no name')
		expect(mockConsole.info).toHaveBeenCalled()
		expect(parseAndStripTimestamp(getCallString(mockConsole.info))).not.toHaveProperty('name')
	})
})

describe('transport selection', () => {
	it('should add the pretty transport unless logToConsole is false', () => {
		expect(
			createLogger({ logToConsole: false }).getLoggerInstance('pretty-basic-transport'),
		).toBeUndefined()
		expect(
			createLogger({ logToConsole: true }).getLoggerInstance('pretty-basic-transport'),
		).toBeDefined()
		expect(
			createLogger({ logToConsole: process.stderr }).getLoggerInstance('pretty-basic-transport'),
		).toBeDefined()
	})

	it('should add the JSON console transport only when logJsonToConsole is not false', () => {
		expect(
			createLogger({ logJsonToConsole: false, logToConsole: false }).getLoggerInstance(
				'json-basic-transport',
			),
		).toBeUndefined()
		expect(
			createLogger({ logJsonToConsole: true, logToConsole: false }).getLoggerInstance(
				'json-basic-transport',
			),
		).toBeDefined()
		expect(
			createLogger({ logJsonToConsole: process.stderr, logToConsole: false }).getLoggerInstance(
				'json-basic-transport',
			),
		).toBeDefined()
	})
})

describe('default log instance', () => {
	it('should have a working default log instance', () => {
		expect(log).toBeDefined()
		expect(typeof log.info).toBe('function')
	})

	it('should support all log levels', () => {
		// Verify the log methods exist
		expect(typeof log.trace).toBe('function')
		expect(typeof log.debug).toBe('function')
		expect(typeof log.info).toBe('function')
		expect(typeof log.warn).toBe('function')
		expect(typeof log.error).toBe('function')
		expect(typeof log.fatal).toBe('function')
	})

	it('should support withMetadata', () => {
		// Verify that withMetadata returns a logger
		const metadataLogger = log.withMetadata({ key: 'value' })
		expect(typeof metadataLogger.info).toBe('function')
	})

	it('should support withContext', () => {
		const contextLogger = log.withContext({ requestId: '123' })
		const getContext = contextLogger.getContext.bind(contextLogger)
		expect(getContext()).toHaveProperty('requestId', '123')
	})
})

describe('setDefaultLogOptions', () => {
	it('should configure the default log instance', () => {
		setDefaultLogOptions({ name: 'configured-logger' })
		expect(log.getContext()).toHaveProperty('name', 'configured-logger')
	})

	it('should merge options with existing ones', () => {
		setDefaultLogOptions({ name: 'first-name' })
		setDefaultLogOptions({ verbose: true })
		expect(log.getContext()).toHaveProperty('name', 'first-name')
	})
})

describe('getChildLogger', () => {
	it('should create a child logger', () => {
		const parent = createLogger({ name: 'parent' })
		const child = getChildLogger(parent, 'child')

		expect(child).toBeDefined()
		expect(child.getContext()).toHaveProperty('name', 'child')
	})

	it('should maintain parent hierarchy', () => {
		const parent = createLogger({ name: 'parent' })
		const child = getChildLogger(parent, 'child')

		const context = child.getContext()
		expect(context).toHaveProperty('parentNames')
		expect(context.parentNames).toContain('parent')
	})

	it('should create child without name', () => {
		const parent = createLogger({ name: 'parent' })
		const child = getChildLogger(parent)

		expect(child).toBeDefined()
	})

	it('should treat an empty name the same as no name', () => {
		const parent = createLogger({ logToConsole: false, name: 'parent' })
		const childNoName = getChildLogger(parent)
		const childEmptyName = getChildLogger(parent, '')

		expect(childEmptyName.getContext()).toStrictEqual(childNoName.getContext())
	})
})

describe('injectionHelper', () => {
	it('should return MockLogLayer for undefined', () => {
		const undef = undefined
		const logger = injectionHelper(undef)
		expect(logger).toBeDefined()
		const logInfo = logger.info.bind(logger)
		expect(() => {
			logInfo('test')
		}).not.toThrow()
	})

	it('should return same instance for ILogLayer', () => {
		const original = createLogger({ name: 'original' })
		const result = injectionHelper(original)
		expect(result).toBe(original)
	})

	it('should wrap Console instance', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = injectionHelper(mockConsole)
		expect(logger).toBeDefined()
		expect(typeof logger.info).toBe('function')
	})

	it('should wrap process.stdout', () => {
		const logger = injectionHelper(process.stdout)
		expect(logger).toBeDefined()
	})

	it('should wrap process.stderr', () => {
		const logger = injectionHelper(process.stderr)
		expect(logger).toBeDefined()
	})
})

function stubElectronMain() {
	Object.defineProperty(process.versions, 'electron', {
		configurable: true,
		value: '39.0.0',
	})
	;(process as NodeJS.Process & { type?: string }).type = 'browser'
}

function restoreElectronMain() {
	Reflect.deleteProperty(process.versions, 'electron')
	Reflect.deleteProperty(process, 'type')
}

describe('electron main detection', () => {
	it('should default to the Main name in the electron main process', async () => {
		stubElectronMain()
		vi.resetModules()
		vi.doMock('electron', () => ({ ipcMain: { on: vi.fn() } }))

		try {
			// Fresh import so the module-level name cache re-resolves against the stubs.
			const { createLogger: freshCreateLogger } = await import('../../src/node/index.js')
			const logger = freshCreateLogger({ logToConsole: false })
			expect(logger.getContext().name).toBe('Main')
		} finally {
			restoreElectronMain()
			vi.doUnmock('electron')
			vi.resetModules()
		}
	})

	it('should forward renderer logs to loggers that opt in via receiveRendererLogs', async () => {
		const on = vi.fn()
		stubElectronMain()
		vi.resetModules()
		vi.doMock('electron', () => ({ ipcMain: { on } }))

		try {
			const { createLogger: freshCreateLogger } = await import('../../src/node/index.js')
			const { NJSON: njson } = await import('next-json')

			const mockConsole = {
				debug: vi.fn(),
				error: vi.fn(),
				info: vi.fn(),
				trace: vi.fn(),
				warn: vi.fn(),
			}

			const optedOut = freshCreateLogger({ logToConsole: mockConsole })
			const optedIn = freshCreateLogger({ logToConsole: mockConsole, receiveRendererLogs: true })
			expect(optedOut).toBeDefined()
			expect(optedIn).toBeDefined()

			// The IPC listener registers in a microtask after module load
			await vi.waitFor(() => {
				expect(on).toHaveBeenCalledTimes(1)
			})

			const [channel, listener] = on.mock.calls[0] as [
				string,
				(event: unknown, message: string) => void,
			]
			expect(channel).toBe('lognow-electron-channel')

			listener(undefined, njson.stringify({ logLevel: 'info', messages: ['From renderer'] }))

			// Only the opted-in logger re-emits the message — no duplication
			expect(mockConsole.info).toHaveBeenCalledTimes(1)
			expect(getCallString(mockConsole.info)).toContain('From renderer')
		} finally {
			restoreElectronMain()
			vi.doUnmock('electron')
			vi.resetModules()
		}
	})
})

describe('error handling', () => {
	it('should log errors with stack traces', () => {
		const logger = createLogger({ logToConsole: false })
		const error = new Error('Test error')

		expect(() => {
			logger.withMetadata({ error: error.message, stack: error.stack }).error('Error occurred')
		}).not.toThrow()
	})

	it('should serialize complex errors', () => {
		const logger = createLogger({ logToConsole: false })
		const cause = new Error('Cause error')
		const error = new Error('Complex error', { cause })

		expect(() => {
			logger
				.withMetadata({ cause: String(error.cause), error: error.message })
				.error('Complex error occurred')
		}).not.toThrow()
	})
})

describe('multiple messages', () => {
	it('should support multiple message arguments', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole })
		logger.info('first', 'second', 'third')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [lognow] first second third"`)
	})

	it('should support mixed types in messages', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole })
		logger.withMetadata({ key: 'value' }).info('string', 123, true)

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [lognow] string 123 true"`)
	})
})

describe('context and metadata', () => {
	it('should separate context from metadata', () => {
		const logger = createLogger({ logToConsole: false })
		const contextLogger = logger.withContext({ persistent: true })

		expect(contextLogger.getContext()).toHaveProperty('persistent', true)
		expect(() => {
			contextLogger.withMetadata({ oneTime: true }).info('test')
		}).not.toThrow()
	})

	it('should preserve context across multiple logs', () => {
		const logger = createLogger({ logToConsole: false })
		const contextLogger = logger.withContext({ sessionId: 'abc123' })

		contextLogger.info('first log')
		contextLogger.info('second log')

		expect(contextLogger.getContext()).toHaveProperty('sessionId', 'abc123')
	})
})

describe('DEFAULT_LOG_OPTIONS', () => {
	it('should have expected default values', () => {
		expect(DEFAULT_LOG_OPTIONS.logJsonToConsole).toBe(false)
		expect(DEFAULT_LOG_OPTIONS.logJsonToFile).toBe(false)
		expect(DEFAULT_LOG_OPTIONS.logToConsole).toBe(true)
		expect(DEFAULT_LOG_OPTIONS.verbose).toBe(false)
	})
})

describe('log levels', () => {
	it('should respect log level filtering', () => {
		const logger = createLogger({ logToConsole: false, verbose: false })

		// Logger should be created successfully
		expect(logger).toBeDefined()
		// At info level, all methods should be callable
		expect(() => {
			logger.info('info')
		}).not.toThrow()
	})

	it('should show all levels when verbose', () => {
		const logger = createLogger({ logToConsole: false, verbose: true })
		expect(logger).toBeDefined()
		// All levels including trace should work
		expect(() => {
			logger.trace('trace')
		}).not.toThrow()
	})
})

describe('complex objects', () => {
	it('should handle circular references', () => {
		const logger = createLogger({ logToConsole: false })
		const circular: Record<string, unknown> = { name: 'circular' }
		circular.self = circular

		expect(() => {
			logger.withMetadata(circular).info('circular test')
		}).not.toThrow()
	})

	it('should handle arrays', () => {
		const logger = createLogger({ logToConsole: false })
		expect(() => {
			logger.withMetadata({ array: [1, 2, 3, { nested: true }] }).info('array')
		}).not.toThrow()
	})

	it('should handle nested objects', () => {
		const logger = createLogger({ logToConsole: false })
		const nested = {
			level1: {
				level2: {
					level3: {
						value: 'deep',
					},
				},
			},
		}
		expect(() => {
			logger.withMetadata(nested).info('nested')
		}).not.toThrow()
	})
})
