/**
 * Core logging functionality tests for browser environment
 */

import { describe, expect, it, vi } from 'vitest'
import {
	createLogger,
	getChildLogger,
	injectionHelper,
	log,
	setDefaultLogOptions,
} from '../../src/browser/index.js'
import { getCallString, stripDynamic } from '../helpers/test-helpers.js'

describe('browser: createLogger', () => {
	it('should create a logger instance in browser', () => {
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
		const logger = createLogger({ name: 'browser-logger' })
		expect(logger.getContext()).toHaveProperty('name', 'browser-logger')
	})

	it('should accept a string as shortcut for name', () => {
		const logger = createLogger('browser-shortcut')
		expect(logger.getContext()).toHaveProperty('name', 'browser-shortcut')
	})

	it('should support logJsonToConsole in browser', () => {
		const logger = createLogger({
			logJsonToConsole: true,
			name: 'json-browser',
		})
		expect(logger).toBeDefined()
		expect(() => {
			logger.info('JSON in browser')
		}).not.toThrow()
	})

	it('should throw error for file logging in browser', () => {
		// File logging should not be supported in browser
		expect(() => {
			createLogger({
				logJsonToFile: true,
				name: 'file-browser',
			})
		}).toThrow()
	})

	it('should log to console by default', () => {
		const logger = createLogger({ name: 'console-test' })
		expect(() => {
			logger.info('Browser console test')
		}).not.toThrow()
	})
})

describe('browser: default log instance', () => {
	it('should have a working default log instance', () => {
		expect(log).toBeDefined()
		expect(typeof log.info).toBe('function')
	})

	it('should support all log levels', () => {
		// Just verify the log methods exist and can be called
		// Output goes to real console in this test
		log.trace('browser trace')
		log.debug('browser debug')
		log.info('browser info')
		log.warn('browser warn')
		log.error('browser error')
		log.fatal('browser fatal')
		expect(log).toBeDefined()
	})
})

describe('browser: console output', () => {
	it('should log to console.info', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({
			logToConsole: mockConsole,
			name: 'info-test',
		})

		logger.info('Info message')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [info-test] Info message"`)
	})

	it('should log to console.error', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({
			logToConsole: mockConsole,
			name: 'error-test',
		})

		logger.error('Error message')

		expect(mockConsole.error).toHaveBeenCalled()
		const call = getCallString(mockConsole.error)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME ERROR [error-test] Error message"`)
	})

	it('should support custom console-like objects', () => {
		const customConsole = {
			debug() {
				// No-op for testing
			},
			error() {
				// No-op for testing
			},
			info() {
				// No-op for testing
			},
			trace() {
				// No-op for testing
			},
			warn() {
				// No-op for testing
			},
		}

		const logger = createLogger({
			logToConsole: customConsole,
			name: 'custom-console',
		})

		expect(() => {
			logger.info('Custom console test')
		}).not.toThrow()
	})
})

describe('browser: metadata and context', () => {
	it('should support withMetadata in browser', () => {
		const logger = createLogger({ name: 'metadata-browser' })
		expect(() => {
			logger.withMetadata({ browserId: 'chrome', version: 100 }).info('Browser metadata')
		}).not.toThrow()
	})

	it('should support withContext in browser', () => {
		const logger = createLogger({ name: 'context-browser' })
		const contextLogger = logger.withContext({ pageId: 'home' })

		expect(contextLogger.getContext()).toHaveProperty('pageId', 'home')
		expect(() => {
			contextLogger.info('Browser context test')
		}).not.toThrow()
	})

	it('should preserve context across logs', () => {
		const logger = createLogger({ name: 'persistent-context' })
		const contextLogger = logger.withContext({ sessionId: 'xyz789' })

		contextLogger.info('First log')
		contextLogger.info('Second log')

		expect(contextLogger.getContext()).toHaveProperty('sessionId', 'xyz789')
	})
})

describe('browser: child loggers', () => {
	it('should create child loggers in browser', () => {
		const parent = createLogger({ name: 'parent-browser' })
		const child = getChildLogger(parent, 'child-browser')

		expect(child).toBeDefined()
		expect(child.getContext()).toHaveProperty('name', 'child-browser')
	})

	it('should maintain hierarchy in browser', () => {
		const parent = createLogger({ name: 'parent' })
		const child = getChildLogger(parent, 'child')

		const context = child.getContext()
		expect(context).toHaveProperty('parentNames')
		expect(context.parentNames).toContain('parent')
	})
})

describe('browser: error handling', () => {
	it('should handle browser errors', () => {
		const logger = createLogger({ name: 'browser-errors' })
		const error = new Error('Browser error')

		expect(() => {
			logger.withError(error).error('Error in browser')
		}).not.toThrow()
	})

	it('should handle DOMException errors', () => {
		const logger = createLogger({ name: 'dom-errors' })

		// Create a DOMException-like error
		const domError = new Error('DOM Exception')
		domError.name = 'NotFoundError'

		expect(() => {
			logger.withError(domError).error('DOM error')
		}).not.toThrow()
	})
})

describe('browser: complex objects', () => {
	it('should handle DOM elements', () => {
		const logger = createLogger({ logToConsole: false, name: 'dom-test' })

		// Create a simple object that mimics a DOM element
		const fakeElement = {
			className: 'test-class',
			id: 'test',
			tagName: 'DIV',
		}

		expect(() => {
			logger.withMetadata({ fakeElement }).info('DOM element:')
		}).not.toThrow()
	})

	it('should handle arrays in browser', () => {
		const logger = createLogger({ logToConsole: false, name: 'array-test' })
		expect(() => {
			logger.withMetadata({ array: [1, 2, 3, { nested: true }] }).info('Array:')
		}).not.toThrow()
	})

	it('should handle nested objects in browser', () => {
		const logger = createLogger({ logToConsole: false, name: 'nested-test' })
		const nested = {
			level1: {
				level2: {
					level3: 'deep value',
				},
			},
		}
		expect(() => {
			logger.withMetadata(nested).info('Nested:')
		}).not.toThrow()
	})

	it('should handle circular references in browser', () => {
		const logger = createLogger({ logToConsole: false, name: 'circular-test' })
		const circular: Record<string, unknown> = { name: 'circular' }
		circular.self = circular

		expect(() => {
			logger.withMetadata(circular).info('circular')
		}).not.toThrow()
	})
})

describe('browser: setDefaultLogOptions', () => {
	it('should configure default logger in browser', () => {
		setDefaultLogOptions({
			name: 'browser-configured',
			verbose: true,
		})

		expect(log.getContext()).toHaveProperty('name', 'browser-configured')
	})
})

describe('browser: injection helper', () => {
	it('should work with console in browser', () => {
		const logger = injectionHelper(console)
		expect(logger).toBeDefined()
		expect(() => {
			logger.info('Injected console')
		}).not.toThrow()
	})

	it('should return MockLogLayer for undefined in browser', () => {
		const logger = injectionHelper()
		expect(logger).toBeDefined()
		expect(() => {
			logger.info('Mock logger')
		}).not.toThrow()
	})

	it('should preserve ILogLayer instance in browser', () => {
		const original = createLogger({ name: 'original-browser' })
		const result = injectionHelper(original)
		expect(result).toBe(original)
	})
})

describe('browser: multiple messages', () => {
	it('should support multiple arguments in browser', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'multi-msg' })
		logger.info('first', 'second', 'third')

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [multi-msg] first second third"`)
	})

	it('should support mixed types in browser', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({ logToConsole: mockConsole, name: 'mixed-types' })
		logger.withMetadata({ key: 'value' }).info('string', 123, true)

		expect(mockConsole.info).toHaveBeenCalled()
		const call = getCallString(mockConsole.info)
		expect(stripDynamic(call)).toMatchInlineSnapshot(`"TIME INFO  [mixed-types] string 123 true"`)
	})
})

describe('browser: JSON console output', () => {
	it('should output JSON to console', () => {
		const logger = createLogger({
			logJsonToConsole: true,
			logToConsole: false,
			name: 'json-console',
		})

		expect(() => {
			logger.info('JSON output test')
		}).not.toThrow()
	})

	it('should output JSON with metadata', () => {
		const logger = createLogger({
			logJsonToConsole: true,
			logToConsole: false,
			name: 'json-metadata',
		})

		expect(() => {
			logger.withMetadata({ test: true }).info('JSON with metadata')
		}).not.toThrow()
	})
})

describe('browser: configuration options', () => {
	it('should respect logToConsole: false', () => {
		const logger = createLogger({
			logToConsole: false,
			name: 'no-console',
		})

		expect(() => {
			logger.info('Should not appear')
		}).not.toThrow()
	})

	it('should support dual JSON and pretty output', () => {
		const logger = createLogger({
			logJsonToConsole: true,
			logToConsole: true,
			name: 'dual',
		})

		expect(() => {
			logger.info('Dual output')
		}).not.toThrow()
	})

	it('should handle verbose mode in browser', () => {
		const logger = createLogger({
			name: 'verbose-browser',
			verbose: true,
		})

		expect(() => {
			logger.trace('Trace in verbose mode')
		}).not.toThrow()
		expect(() => {
			logger.debug('Debug in verbose mode')
		}).not.toThrow()
	})
})
