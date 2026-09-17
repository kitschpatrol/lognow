import type { BenchFn } from 'vitest'
import type { JsonTestResults } from 'vitest/node'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'vitest'
import * as lognow from '../../src/node/index.js'

// Capture exports once so Vitest's module getters aren't measured in the benchmark loop.
const { createLogger, getChildLogger, injectionHelper } = lognow
const writeBaseline = process.env.npm_lifecycle_event === 'bench:baseline'
const baseline = writeBaseline
	? undefined
	: (JSON.parse(
			await readFile(new URL('../benchmarks/baseline.json', import.meta.url), 'utf8'),
		) as JsonTestResults)

function bench(name: string, fn: BenchFn): void {
	// eslint-disable-next-line test/expect-expect -- Benchmarks report measurements without asserting timing.
	test(name, async ({ bench: measure, task }) => {
		const current = measure('current', fn)
		if (writeBaseline) {
			await current.run()
			return
		}

		const previous = baseline?.testResults
			.flatMap((file) => file.assertionResults)
			.flatMap((result) => result.benchmarks)
			.find((group) => group.name === task.fullTestName)
			?.tasks.find((result) => result.name === 'current')
		if (previous === undefined) {
			throw new Error(`Missing baseline for "${task.fullTestName}". Run pnpm bench:baseline.`)
		}

		await measure.compare(
			current,
			measure.from('baseline', () => previous),
		)
	})
}

describe('logger creation', () => {
	bench('createLogger with defaults', () => {
		createLogger({ logToConsole: false })
	})

	bench('createLogger with name', () => {
		createLogger({ logToConsole: false, name: 'bench-logger' })
	})

	bench('createLogger verbose', () => {
		createLogger({ logToConsole: false, verbose: true })
	})

	bench('createLogger with JSON console', () => {
		createLogger({ logJsonToConsole: false, logToConsole: false })
	})
})

describe('logging operations', () => {
	const logger = createLogger({ logToConsole: false })

	bench('info - simple message', () => {
		logger.info('hello world')
	})

	bench('warn - simple message', () => {
		logger.warn('warning message')
	})

	bench('error - simple message', () => {
		logger.error('error message')
	})

	bench('debug - simple message', () => {
		logger.debug('debug message')
	})

	bench('info - multiple arguments', () => {
		logger.info('hello', 'world', 123, true)
	})
})

describe('metadata and context', () => {
	const logger = createLogger({ logToConsole: false })

	bench('withMetadata - simple object', () => {
		logger.withMetadata({ key: 'value' }).info('test')
	})

	bench('withMetadata - nested object', () => {
		logger.withMetadata({ level1: { level2: { value: 'deep' } } }).info('test')
	})

	bench('withContext', () => {
		logger.withContext({ requestId: 'abc-123' })
	})

	bench('withMetadata chain', () => {
		logger.withMetadata({ a: 1 }).withMetadata({ b: 2 }).info('test')
	})
})

describe('child loggers', () => {
	const parent = createLogger({ logToConsole: false, name: 'parent' })

	bench('getChildLogger', () => {
		getChildLogger(parent, 'child')
	})

	bench('getChildLogger and log', () => {
		const child = getChildLogger(parent, 'child')
		child.info('message')
	})
})

describe('error serialization', () => {
	const logger = createLogger({ logToConsole: false })
	const error = new Error('Benchmark error')

	bench('log with error metadata', () => {
		logger.withMetadata({ error: error.message, stack: error.stack }).error('failed')
	})
})

describe('transport overhead', () => {
	const noopStream = {
		write() {
			/* No Op */
		},
	}

	const prettyLogger = createLogger({ logToConsole: { logger: noopStream } })
	bench('info - pretty transport (noop stream)', () => {
		prettyLogger.info('hello world')
	})

	const jsonLogger = createLogger({
		logJsonToConsole: { logger: noopStream },
		logToConsole: false,
	})
	bench('info - JSON transport (noop stream)', () => {
		jsonLogger.info('hello world')
	})

	const jsonPrettyLogger = createLogger({
		logJsonToConsole: { logger: noopStream, pretty: true },
		logToConsole: false,
	})
	bench('info - JSON pretty transport (noop stream)', () => {
		jsonPrettyLogger.info('hello world')
	})
})

describe('injectionHelper', () => {
	bench('wrap undefined', () => {
		injectionHelper()
	})

	const existing = createLogger({ logToConsole: false })
	bench('passthrough ILogLayer', () => {
		injectionHelper(existing)
	})
})
