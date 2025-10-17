/**
 * Core logging functionality that works in all environments.
 * Platform-specific features are injected via the PlatformAdapter.
 */

import type { ILogLayer, LogLayerTransport } from 'loglayer'
import { BlankTransport, ConsoleTransport, LogLayer, LogLevel } from 'loglayer'
import { serializeError } from 'serialize-error'
import { HierarchicalContextManager } from './loglayer/hierarchical-context-manager'

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

export type LogOptions = {
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

/**
 * Platform-specific adapter interface
 */
export type PlatformAdapter = {
	createFileTransport?: (name?: string, logDirectory?: string) => LogLayerTransport
	getName: () => string | undefined
}

let platformAdapter: PlatformAdapter

/**
 * Set the platform adapter. This is called by the platform-specific entry points.
 * @internal
 */
export function setPlatformAdapter(adapter: PlatformAdapter): void {
	platformAdapter = adapter
}

export const defaultLogOptions: RequiredExcept<LogOptions, 'name'> = {
	logJsonToConsole: false,
	logJsonToFile: false,
	logToConsole: true,
	get name() {
		return platformAdapter.getName()
	},
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
 * Helper function to create a logger with a given options.
 */
export function createLogger(options?: LogOptions): ILogLayer {
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
		if (platformAdapter.createFileTransport === undefined) {
			throw new Error(
				'File logging is only supported in Node.js environments. Import the `@kitschpatrol/log/node` entry point instead.',
			)
		}

		transports.push(
			platformAdapter.createFileTransport(
				resolvedOptions.name,
				typeof resolvedOptions.logJsonToFile === 'string'
					? resolvedOptions.logJsonToFile
					: undefined,
			),
		)
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
 * Helper to inject a logger-like instance as a the LogLayer target.
 * @param logger Accepts either a LogLayer instance or a target with typical Console-like logging methods.
 * @returns A LogLayer instance, either the provided instance if it was a
 * LogLayer instance, or a new LogLayer console-only instance if the passed in
 * logger was a console-like instance.
 * @example
 * ```ts
 * // Logger instance in a library's module
 * export let log = createLogger()
 *
 * // Expose setter to allow dependency injection
 * export function setLogger(logger: ILogBasic | ILogLayer) {
 *   log = injectionHelper(logger) || log
 * }
 * ```
 */
export function injectionHelper(logger: ILogBasic | ILogLayer): ILogLayer {
	if (isILogLayer(logger)) {
		return logger
	}

	return createLogger({
		logJsonToConsole: false,
		logJsonToFile: false,
		logToConsole: logger,
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
