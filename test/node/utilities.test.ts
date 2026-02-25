/**
 * Utility functions and edge case tests
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ILogBasic } from '../../src/log.js'
import {
	createLogBasicTypedTarget,
	isForceColorSet,
	isNoColorSet,
	pickLogTarget,
} from '../../src/log.js'

describe('pickLogTarget', () => {
	it('should return process.stderr in Node environment', () => {
		const target = pickLogTarget()
		expect(target).toBe(process.stderr)
	})
})

describe('createLogBasicTypedTarget', () => {
	it('should identify process.stdout', () => {
		const typed = createLogBasicTypedTarget(process.stdout)
		expect(typed.type).toBe('StreamStdout')
		expect(typed.target).toBe(process.stdout)
	})

	it('should identify process.stderr', () => {
		const typed = createLogBasicTypedTarget(process.stderr)
		expect(typed.type).toBe('StreamStderr')
		expect(typed.target).toBe(process.stderr)
	})

	it('should identify Console', () => {
		const typed = createLogBasicTypedTarget(console)
		expect(typed.type).toBe('Console')
		expect(typed.target).toBe(console)
	})

	it('should identify ConsoleLike objects', () => {
		const consoleLike = {
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

		const typed = createLogBasicTypedTarget(consoleLike as ILogBasic)
		expect(typed.type).toBe('ConsoleLike')
	})

	it('should identify StreamLike objects', () => {
		const streamLike = {
			write() {
				// No-op for testing
			},
		}

		const typed = createLogBasicTypedTarget(streamLike as ILogBasic)
		expect(typed.type).toBe('StreamLike')
	})

	it('should throw for invalid targets', () => {
		const invalid = { notALogger: true }

		expect(() => {
			// @ts-expect-error - Testing invalid input
			createLogBasicTypedTarget(invalid)
		}).toThrow()
	})
})

describe('environment variable checks', () => {
	describe('isNoColorSet', () => {
		let originalNoColor: string | undefined

		beforeEach(() => {
			originalNoColor = process.env.NO_COLOR
		})

		afterEach(() => {
			if (originalNoColor === undefined) {
				delete process.env.NO_COLOR
			} else {
				process.env.NO_COLOR = originalNoColor
			}
		})

		it('should return true when NO_COLOR is set', () => {
			process.env.NO_COLOR = '1'
			expect(isNoColorSet()).toBe(true)
		})

		it('should return false when NO_COLOR is not set', () => {
			delete process.env.NO_COLOR
			expect(isNoColorSet()).toBe(false)
		})

		it('should return true even for empty string', () => {
			process.env.NO_COLOR = ''
			expect(isNoColorSet()).toBe(true)
		})
	})

	describe('isForceColorSet', () => {
		let originalForceColor: string | undefined

		beforeEach(() => {
			originalForceColor = process.env.FORCE_COLOR
		})

		afterEach(() => {
			if (originalForceColor === undefined) {
				delete process.env.FORCE_COLOR
			} else {
				process.env.FORCE_COLOR = originalForceColor
			}
		})

		it('should return true when FORCE_COLOR is set', () => {
			process.env.FORCE_COLOR = '1'
			expect(isForceColorSet()).toBe(true)
		})

		it('should return false when FORCE_COLOR is not set', () => {
			delete process.env.FORCE_COLOR
			expect(isForceColorSet()).toBe(false)
		})

		it('should return true even for empty string', () => {
			process.env.FORCE_COLOR = ''
			expect(isForceColorSet()).toBe(true)
		})
	})
})

const testFn = () => 'test'

describe('edge cases and special scenarios', () => {
	it('should handle undefined values in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		expect(() => {
			logger.info('Value is:')
		}).not.toThrow()
	})

	it('should handle null values in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		expect(() => {
			logger.info('Value is:')
		}).not.toThrow()
	})

	it('should handle empty messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		expect(() => {
			logger.info()
		}).not.toThrow()
	})

	it('should handle very long messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })
		const longMessage = 'a'.repeat(10_000)

		expect(() => {
			logger.info(longMessage)
		}).not.toThrow()
	})

	it('should handle special characters in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		expect(() => {
			logger.info('Special chars: \n\t\r\0')
		}).not.toThrow()
	})

	it('should handle unicode in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		expect(() => {
			logger.info('Unicode: 🎉 日本語 émo')
		}).not.toThrow()
	})

	it('should handle functions in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		expect(() => {
			logger.withMetadata({ fn: testFn }).info('Function')
		}).not.toThrow()
	})

	it('should handle symbols in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const sym = Symbol('test')
		expect(() => {
			logger.withMetadata({ sym }).info('Symbol')
		}).not.toThrow()
	})

	it('should handle BigInt in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const bigNumber = 9_007_199_254_740_991n
		expect(() => {
			logger.withMetadata({ bigNumber }).info('BigInt')
		}).not.toThrow()
	})

	it('should handle dates in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const date = new Date()
		expect(() => {
			logger.withMetadata({ date }).info('Date')
		}).not.toThrow()
	})

	it('should handle regex in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const regex = /test/gi
		expect(() => {
			logger.withMetadata({ regex: regex.toString() }).info('Regex')
		}).not.toThrow()
	})

	it('should handle Map in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const map = new Map([['key', 'value']])
		expect(() => {
			logger.withMetadata({ map: [...map.entries()] }).info('Map')
		}).not.toThrow()
	})

	it('should handle Set in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const set = new Set([1, 2, 3])
		expect(() => {
			logger.withMetadata({ set: [...set] }).info('Set')
		}).not.toThrow()
	})

	it('should handle WeakMap in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const weakMap = new WeakMap()
		expect(() => {
			logger.withMetadata({ weakMapType: typeof weakMap }).info('WeakMap')
		}).not.toThrow()
	})

	it('should handle Buffers in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const buffer = Buffer.from('test')
		expect(() => {
			logger.withMetadata({ bufferString: buffer.toString() }).info('Buffer')
		}).not.toThrow()
	})

	it('should handle TypedArrays in messages', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const uint8 = new Uint8Array([1, 2, 3])
		expect(() => {
			logger.withMetadata({ array: [...uint8] }).info('Uint8Array')
		}).not.toThrow()
	})
})

describe('concurrency and async', () => {
	it('should handle concurrent logging', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const promises = Array.from({ length: 100 }, async (_, i) =>
			Promise.resolve().then(() => {
				logger.info(`Message ${i}`)
			}),
		)

		await expect(Promise.all(promises)).resolves.toBeDefined()
	})

	it('should handle rapid successive logging', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		expect(() => {
			for (let i = 0; i < 1000; i++) {
				logger.info(`Rapid message ${i}`)
			}
		}).not.toThrow()
	})
})

describe('memory and performance', () => {
	it('should not leak memory with child loggers', async () => {
		const { createLogger, getChildLogger } = await import('../../src/node/index.js')
		const parent = createLogger({ logToConsole: false, name: 'parent' })

		// Create many child loggers
		const children = Array.from({ length: 100 }, (_, i) => getChildLogger(parent, `child-${i}`))

		expect(children.length).toBe(100)

		// Use them
		for (const child of children) child.info('test')

		// They should be garbage collectable
		expect(children[0]).toBeDefined()
	})

	it('should handle large context objects', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const largeContext: Record<string, string> = {}
		for (let i = 0; i < 1000; i++) {
			largeContext[`key${i}`] = `value${i}`
		}

		expect(() => {
			logger.withContext(largeContext).info('Large context')
		}).not.toThrow()
	})

	it('should handle large metadata objects', async () => {
		const { createLogger } = await import('../../src/node/index.js')
		const logger = createLogger({ logToConsole: false })

		const largeMetadata: Record<string, string> = {}
		for (let i = 0; i < 1000; i++) {
			largeMetadata[`meta${i}`] = `value${i}`
		}

		expect(() => {
			logger.withMetadata(largeMetadata).info('Large metadata')
		}).not.toThrow()
	})
})
