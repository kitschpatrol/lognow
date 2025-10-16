import type { ILogLayer, LogLayerTransport } from 'loglayer'
import { LogFileRotationTransport } from '@loglayer/transport-log-file-rotation'
import filenamify from 'filenamify/browser'
import { BlankTransport, ConsoleTransport, LogLayer, LogLevel } from 'loglayer'
import path from 'node:path'
import { serializeError } from 'serialize-error'
import { isNode } from 'std-env'
import { HierarchicalContextManager } from './hierarchical-context-manager'
import { getName, getPlatformLogPath } from './node-utilities'

console.log('LogLayer module loaded')

export type { ILogLayer } from 'loglayer'

// eslint-disable-next-line ts/naming-convention
export type ILogBasic =
	| Console
	| {
			debug(data: unknown[]): void
			error(data: unknown[]): void
			info(data: unknown[]): void
			trace(data: unknown[]): void
			warn(data: unknown[]): void
	  }

type LogOptions = {
	/** Log to the console in JSON format. Useful for debugging structured logging. */
	logJsonToConsole?: boolean | ILogBasic
	/** Log to a typical log file path. If a string is passed, log to the given directory path. Logs are gzipped and rotated daily, and are never removed. */
	logJsonToFile?: boolean | string
	/** Log to the console in a pretty and human-readable format. */
	logToConsole?: boolean | ILogBasic
	/** The name of the logger, also used as the log file name if file logging is enabled. */
	name?: string
	verbose?: boolean
}

type RequiredExcept<T, K extends keyof T> = Pick<T, K> & Required<Omit<T, K>>

const defaultLogOptions: RequiredExcept<LogOptions, 'name'> = {
	logJsonToConsole: false,
	logJsonToFile: false,
	logToConsole: true,
	name: getName(),
	verbose: false,
}

/**
 * Helper function to create a child logger with a given name. Pairs with the
 * HierarchicalContextManager to maintain a hierarchy of ancestor logger names.
 * Based on convention of storing the log name in the context.name value.
 */
export function getChildLogger(logger: ILogLayer, name?: string): ILogLayer {
	const childLogger = logger.child()
	if (name) {
		childLogger.withContext({
			name,
		})
	}
	return childLogger
}

/**
 * Helper function to get the default log directory.
 */
export function getDefaultLogDirectory(): string {
	return './logs'
}

// File transports must be reused, so we cache them by path
const fileTransportsByPath = new Map<string, LogLayerTransport>()

/**
 * Helper function to create a logger with a given options.
 */
export function createLogger(options?: LogOptions): ILogLayer {
	console.log('createLogger', options)
	const resolvedOptions = { ...defaultLogOptions, ...options }

	const transports: LogLayerTransport[] = []

	if (resolvedOptions.logToConsole) {
		const consoleInstance =
			typeof resolvedOptions.logToConsole === 'boolean'
				? console
				: // eslint-disable-next-line ts/no-unsafe-type-assertion
					(resolvedOptions.logToConsole as Console)

		transports.push(
			new ConsoleTransport({
				appendObjectData: true,
				logger: consoleInstance,
			}),
		)
	}

	if (resolvedOptions.logJsonToConsole) {
		const consoleInstance =
			typeof resolvedOptions.logToConsole === 'boolean'
				? console
				: // eslint-disable-next-line ts/no-unsafe-type-assertion
					(resolvedOptions.logToConsole as Console)

		transports.push(
			new BlankTransport({
				shipToLogger(params) {
					consoleInstance.info(JSON.stringify(params, undefined, 2))

					// eslint-disable-next-line ts/no-unsafe-return
					return params.messages
				},
			}),
		)
	}

	if (typeof resolvedOptions.logJsonToFile === 'string' || resolvedOptions.logJsonToFile) {
		if (!isNode) {
			throw new Error('File logging is not supported in Node environments')
		}

		const cleanName = filenamify(resolvedOptions.name ?? 'default', { replacement: '-' })

		const filename = path.join(
			typeof resolvedOptions.logJsonToFile === 'string'
				? resolvedOptions.logJsonToFile
				: getPlatformLogPath(cleanName),
			`${cleanName}-%DATE%.log`,
		)

		if (!fileTransportsByPath.has(filename)) {
			fileTransportsByPath.set(
				filename,
				new LogFileRotationTransport({
					compressOnRotate: true,
					dateFormat: 'YMD',
					filename,
					frequency: 'daily',
				}),
			)
		}

		transports.push(fileTransportsByPath.get(filename)!)
	}

	const logLayer = new LogLayer({
		errorSerializer: serializeError,
		transport: transports,
	}).withContextManager(new HierarchicalContextManager())

	if (resolvedOptions.name !== undefined) {
		logLayer.withContext({
			name: resolvedOptions.name,
		})
	}

	if (resolvedOptions.verbose) {
		logLayer.setLevel(LogLevel.trace)
	} else {
		logLayer.setLevel(LogLevel.info)
	}

	return logLayer
}

/**
 * Create a LogLayer logger targeting a specific basic target logger.
 * Pretty much only used when doing dependency injection on a library.
 */
export function createBasicLogger(target: ILogBasic): ILogLayer {
	return createLogger({
		logJsonToConsole: false,
		logJsonToFile: false,
		logToConsole: target,
		name: undefined,
		verbose: true,
	})
}

/**
 * Check if a value is a LogLayer instance.
 */
export function isILogLayer(instance: unknown): instance is ILogLayer {
	return (
		typeof instance === 'object' &&
		instance !== null &&
		'withContext' in instance &&
		'child' in instance &&
		typeof instance.withContext === 'function' &&
		typeof instance.child === 'function'
	)
}

// ------------------------------------------------------------------------------------------------

// Default singleton logger instance, for convenience

let _log: ILogLayer | undefined
let currentOptions: LogOptions = defaultLogOptions

// eslint-disable-next-line ts/no-unsafe-type-assertion
export const log = new Proxy({} as ILogLayer, {
	get(_, property: keyof ILogLayer) {
		_log ??= createLogger(currentOptions)
		const value = _log[property]
		return typeof value === 'function' ? value.bind(_log) : value
	},
}) satisfies ILogLayer

/**
 * Configure the default singleton logger instance with custom options.
 * If specific options are not provided, the singleton's previous options are preserved.
 * @param options - The options to configure the logger with.
 */
export function configureDefaultLogger(options: LogOptions): void {
	currentOptions = { ...currentOptions, ...options }
	// Will be lazily recreated on next access through the proxy
	_log = undefined
}
