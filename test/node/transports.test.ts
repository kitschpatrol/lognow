/**
 * Transport tests for Node.js environment
 */

import { describe, expect, it, vi } from 'vitest'
import { JsonBasicTransport } from '../../src/loglayer/json-basic-transport.js'
import { PrettyBasicTransport } from '../../src/loglayer/pretty-basic-transport.js'
import { createLogger } from '../../src/node/index.js'

describe('PrettyBasicTransport', () => {
	it('should create a pretty transport', () => {
		const transport = new PrettyBasicTransport({
			logger: process.stdout,
		})

		expect(transport).toBeDefined()
	})

	it('should format log messages', () => {
		const mockWrite = vi.fn()
		const mockStream = {
			write: mockWrite,
		}

		const transport = new PrettyBasicTransport({
			colorize: false,
			logger: mockStream,
		})

		transport.shipToLogger({
			context: {},
			logLevel: 'info',
			messages: ['Test message'],
		})

		expect(mockWrite).toHaveBeenCalled()
	})

	it('should respect showTime option', () => {
		const output: string[] = []
		const mockStream = {
			write(chunk: string) {
				output.push(chunk)
			},
		}

		const transport = new PrettyBasicTransport({
			colorize: false,
			logger: mockStream,
			showTime: false,
		})

		transport.shipToLogger({
			context: {},
			logLevel: 'info',
			messages: ['No timestamp'],
		})

		expect(output.length).toBeGreaterThan(0)
		// Should not contain timestamp pattern (HH:MM:SS.mmm)
		expect(output[0]).not.toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/)
	})

	it('should respect showLevel option', () => {
		const output: string[] = []
		const mockStream = {
			write(chunk: string) {
				output.push(chunk)
			},
		}

		const transport = new PrettyBasicTransport({
			colorize: false,
			logger: mockStream,
			showLevel: false,
			showTime: false,
		})

		transport.shipToLogger({
			context: {},
			logLevel: 'info',
			messages: ['No level'],
		})

		expect(output.length).toBeGreaterThan(0)
		expect(output[0]).not.toContain('INFO')
	})

	it('should respect showName option', () => {
		const output: string[] = []
		const mockStream = {
			write(chunk: string) {
				output.push(chunk)
			},
		}

		const transport = new PrettyBasicTransport({
			colorize: false,
			logger: mockStream,
			showLevel: false,
			showName: false,
			showTime: false,
		})

		transport.shipToLogger({
			context: { name: 'test-logger' },
			logLevel: 'info',
			messages: ['No name'],
		})

		expect(output.length).toBeGreaterThan(0)
		expect(output[0]).not.toContain('[test-logger]')
	})

	it('should handle colorize option', () => {
		const mockWrite = vi.fn()
		const mockStream = { write: mockWrite }

		const colorTransport = new PrettyBasicTransport({
			colorize: true,
			logger: mockStream,
		})

		const noColorTransport = new PrettyBasicTransport({
			colorize: false,
			logger: mockStream,
		})

		expect(colorTransport).toBeDefined()
		expect(noColorTransport).toBeDefined()
	})

	it('should respect NO_COLOR environment variable', () => {
		const originalNoColor = process.env.NO_COLOR
		process.env.NO_COLOR = '1'

		const transport = new PrettyBasicTransport({
			logger: process.stdout,
		})

		expect(transport).toBeDefined()

		if (originalNoColor === undefined) {
			delete process.env.NO_COLOR
		} else {
			process.env.NO_COLOR = originalNoColor
		}
	})

	it('should respect FORCE_COLOR environment variable', () => {
		const originalForceColor = process.env.FORCE_COLOR
		process.env.FORCE_COLOR = '1'

		const transport = new PrettyBasicTransport({
			logger: process.stdout,
		})

		expect(transport).toBeDefined()

		if (originalForceColor === undefined) {
			delete process.env.FORCE_COLOR
		} else {
			process.env.FORCE_COLOR = originalForceColor
		}
	})

	it('should format different log levels', () => {
		const mockWrite = vi.fn()
		const mockStream = { write: mockWrite }

		const transport = new PrettyBasicTransport({
			colorize: false,
			logger: mockStream,
		})

		const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const

		for (const level of levels) {
			transport.shipToLogger({
				context: {},
				logLevel: level,
				messages: [`${level} message`],
			})
		}

		expect(mockWrite).toHaveBeenCalledTimes(levels.length)
	})

	it('should handle metadata objects', () => {
		const mockWrite = vi.fn()
		const mockStream = { write: mockWrite }

		const transport = new PrettyBasicTransport({
			colorize: false,
			logger: mockStream,
		})

		transport.shipToLogger({
			context: {},
			logLevel: 'info',
			messages: ['Message with metadata'],
			metadata: { count: 42, key: 'value' },
		})

		expect(mockWrite).toHaveBeenCalled()
	})

	it('should handle error objects', () => {
		const mockWrite = vi.fn()
		const mockStream = { write: mockWrite }

		const transport = new PrettyBasicTransport({
			colorize: false,
			logger: mockStream,
		})

		const error = new Error('Test error')

		transport.shipToLogger({
			context: {},
			error,
			logLevel: 'error',
			messages: ['Error occurred'],
		})

		expect(mockWrite).toHaveBeenCalled()
	})

	it('should handle console-like targets', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const transport = new PrettyBasicTransport({
			colorize: false,
			logger: mockConsole,
		})

		transport.shipToLogger({
			context: {},
			logLevel: 'info',
			messages: ['Console test'],
		})

		expect(mockConsole.info).toHaveBeenCalled()
	})

	it('should style different value types', () => {
		const transport = new PrettyBasicTransport({
			colorize: false,
			logger: process.stdout,
		})

		const undef = undefined
		expect(transport.style(undef)).toBe('undefined')
		expect(transport.style(undef)).toBe('undefined')
		expect(transport.style(true)).toBe('true')
		expect(transport.style(42)).toBe('42')
		expect(transport.style('string')).toBe('string')
	})
})

describe('JsonBasicTransport', () => {
	it('should create a JSON transport', () => {
		const transport = new JsonBasicTransport({
			logger: process.stdout,
		})

		expect(transport).toBeDefined()
	})

	it('should output JSON strings', () => {
		const output: string[] = []
		const mockStream = {
			write(chunk: string) {
				output.push(chunk)
			},
		}

		const transport = new JsonBasicTransport({
			logger: mockStream,
		})

		transport.shipToLogger({
			context: {},
			logLevel: 'info',
			messages: ['JSON test'],
		})

		expect(output.length).toBeGreaterThan(0)
		expect(() => {
			JSON.parse(output[0])
		}).not.toThrow()
	})

	it('should include all log properties in JSON', () => {
		const output: string[] = []
		const mockStream = {
			write(chunk: string) {
				output.push(chunk)
			},
		}

		const transport = new JsonBasicTransport({
			logger: mockStream,
		})

		transport.shipToLogger({
			context: { name: 'test' },
			logLevel: 'info',
			messages: ['Test message'],
			metadata: { key: 'value' },
		})

		expect(output.length).toBeGreaterThan(0)
		const parsed: unknown = JSON.parse(output[0])

		expect(parsed).toHaveProperty('level', 'info')
		expect(parsed).toHaveProperty('messages')
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			'messages' in parsed &&
			Array.isArray(parsed.messages)
		) {
			expect(parsed.messages).toContain('Test message')
		}
	})

	it('should respect pretty option', () => {
		const mockWrite = vi.fn()
		const mockStream = { write: mockWrite }

		const transport = new JsonBasicTransport({
			logger: mockStream,
			pretty: true,
		})

		transport.shipToLogger({
			context: {},
			logLevel: 'info',
			messages: ['Pretty JSON'],
		})

		expect(mockWrite).toHaveBeenCalled()
	})

	it('should handle different log levels', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const transport = new JsonBasicTransport({
			logger: mockConsole,
		})

		const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const

		for (const level of levels) {
			transport.shipToLogger({
				context: {},
				logLevel: level,
				messages: [`${level} message`],
			})
		}

		expect(mockConsole.trace).toHaveBeenCalled()
		expect(mockConsole.debug).toHaveBeenCalled()
		expect(mockConsole.info).toHaveBeenCalled()
		expect(mockConsole.warn).toHaveBeenCalled()
		expect(mockConsole.error).toHaveBeenCalledTimes(2) // Error and fatal
	})

	it('should serialize complex objects', () => {
		const output: string[] = []
		const mockStream = {
			write(chunk: string) {
				output.push(chunk)
			},
		}

		const transport = new JsonBasicTransport({
			logger: mockStream,
		})

		const complexObject = {
			array: [1, 2, 3],
			nested: {
				deep: {
					value: 'test',
				},
			},
		}

		transport.shipToLogger({
			context: complexObject,
			logLevel: 'info',
			messages: ['Complex object'],
		})

		expect(output.length).toBeGreaterThan(0)
		expect(() => {
			JSON.parse(output[0])
		}).not.toThrow()
	})

	it('should handle circular references', () => {
		const mockWrite = vi.fn()
		const mockStream = { write: mockWrite }

		const transport = new JsonBasicTransport({
			logger: mockStream,
		})

		const circular: Record<string, unknown> = { name: 'circular' }
		circular.self = circular

		expect(() => {
			transport.shipToLogger({
				context: circular,
				logLevel: 'info',
				messages: ['Circular'],
			})
		}).not.toThrow()
	})
})

describe('Transport integration', () => {
	it('should support multiple transports', () => {
		const mockConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const mockJsonConsole = {
			debug: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			trace: vi.fn(),
			warn: vi.fn(),
		}

		const logger = createLogger({
			logJsonToConsole: mockJsonConsole,
			logToConsole: mockConsole,
			name: 'multi-transport',
		})

		logger.info('Multiple transports')
		expect(mockConsole.info).toHaveBeenCalled()
		expect(mockJsonConsole.info).toHaveBeenCalled()
	})

	it('should allow disabling transports', () => {
		const logger = createLogger({
			logJsonToConsole: false,
			logJsonToFile: false,
			logToConsole: false,
			name: 'no-transports',
		})

		expect(() => {
			logger.info('No output')
		}).not.toThrow()
	})
})

describe('Custom transport targets', () => {
	it('should support process.stdout', () => {
		const mockStream = {
			write: vi.fn(),
		}

		const logger = createLogger({
			logToConsole: mockStream,
			name: 'stdout-test',
		})

		logger.info('To stdout')
		expect(mockStream.write).toHaveBeenCalled()
	})

	it('should support process.stderr', () => {
		const mockStream = {
			write: vi.fn(),
		}

		const logger = createLogger({
			logToConsole: mockStream,
			name: 'stderr-test',
		})

		logger.error('To stderr')
		expect(mockStream.write).toHaveBeenCalled()
	})

	it('should support custom stream', () => {
		const mockStream = {
			write: vi.fn(),
		}

		const logger = createLogger({
			logToConsole: mockStream,
			name: 'custom-stream',
		})

		logger.info('Custom stream test')
		expect(mockStream.write).toHaveBeenCalled()
	})
})
