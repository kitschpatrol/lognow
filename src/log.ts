/**
 * Core logging functionality that works in all environments.
 * Platform-specific features are injected via the PlatformAdapter.
 */

import type { LoggerlessTransport } from '@loglayer/transport'
import type { ILogLayer, LogLayerTransport } from 'loglayer'
import type { InspectOptions } from 'node-inspect-extracted'
import { defu } from 'defu'
import { LogLayer, LogLevel, MockLogLayer } from 'loglayer'
import { serializeError } from 'serialize-error'
import type { JsonBasicTransportConfig } from './loglayer/json-basic-transport'
import type { JsonFileTransportConfig } from './loglayer/json-file-transport'
import type { PrettyBasicTransportConfig } from './loglayer/pretty-basic-transport'
import { HierarchicalContextManager } from './loglayer/hierarchical-context-manager'
import { JsonBasicTransport } from './loglayer/json-basic-transport'
import { PrettyBasicTransport } from './loglayer/pretty-basic-transport'
import { timestampPlugin } from './loglayer/timestamp-context-plugin'

export type { ILogLayer }

type ConsoleLike = {
	debug(...data: unknown[]): void
	error(...data: unknown[]): void
	info(...data: unknown[]): void
	trace(...data: unknown[]): void
	warn(...data: unknown[]): void
}

type StreamLike = {
	write(data: string | Uint8Array): Promise<void> | void
}

type StreamStdout = typeof process.stdout
type StreamStderr = typeof process.stderr

// eslint-disable-next-line ts/naming-convention
export type ILogBasic = Console | ConsoleLike | StreamLike | StreamStderr | StreamStdout

/**
 * Helper function to pick a log target based on the platform context.
 * @returns The picked log target.
 */
export function pickLogTarget(): ILogBasic {
	// Use stderr by default in a node environment, or console by default in a browser environment.
	if (typeof process !== 'undefined') {
		return process.stderr
	}
	return console
}

export type LogOptions = {
	/** Log to the console in JSON format. Useful for debugging structured logging. Pass a `boolean` to enable / disable the default transport configuration, an `ILogBasic` to target a specific log target, or a partial `JsonBasicTransportConfig` to override the default configuration. */
	logJsonToConsole?: boolean | ILogBasic | JsonBasicTransportConfig
	/** Log to a typical log file path. Pass a `boolean` to enable / disable the default configuration. Pass a directory path string to save the log to a specific paths. By default, logs are gzipped and rotated daily, and are never removed. Pass a partial `JsonFileTransportConfig` to override the default configuration. */
	logJsonToFile?: boolean | JsonFileTransportConfig | string
	/** Log to the console in a pretty and human-readable format. Pass a boolean to enable / disable the default transport configuration, an `ILogBasic` to target a specific log target, or a partial `PrettyBasicTransportConfig` to override the default configuration. */
	logToConsole?: boolean | ILogBasic | PrettyBasicTransportConfig
	/** The name of the logger, also used as the log file name if file logging is enabled. */
	name?: string
	/** A shortcut for setting the log level. If `true`, all logs are shown regardless of level. If `false`, only `info` and higher logs are shown. */
	verbose?: boolean
}

type RequiredExcept<T, K extends keyof T> = Pick<T, K> & Required<Omit<T, K>>

/**
 * Platform-specific adapter interface
 */
export type PlatformAdapter = {
	createElectronListener?: (logger: ILogLayer) => void
	createElectronTransport?: () => LoggerlessTransport
	createFileTransport?: (
		name?: string,
		logDirectoryOrOptions?: JsonFileTransportConfig | string,
	) => LogLayerTransport
	getFileTransportDestinations?: () => string[]
	getName: () => string | undefined
	getTerminalWidth: () => number
	inspect: (object: unknown, options?: InspectOptions) => string
}

let platformAdapter: PlatformAdapter

/**
 * Set the platform adapter. This is called by the platform-specific entry points.
 * @internal
 */
export function setPlatformAdapter(adapter: PlatformAdapter): void {
	platformAdapter = adapter
}

export const DEFAULT_LOG_OPTIONS: RequiredExcept<LogOptions, 'name'> = {
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
 * `HierarchicalContextManager` to maintain a hierarchy of ancestor logger names.
 * Based on convention of storing the log name in the context.name value.
 */
export function getChildLogger<T extends ILogLayer<T>>(logger: T, name?: string): T {
	const childLogger = logger.child()
	if (name) {
		childLogger.withContext({ name })
	}
	return childLogger
}

/**
 * Helper function to create a logger with a given options.
 * Or, pass a string argument as a shortcut to setting the logger
 * name.
 */
export function createLogger(optionsOrName?: LogOptions | string): ILogLayer {
	const optionsObject = typeof optionsOrName === 'string' ? { name: optionsOrName } : optionsOrName
	// eslint-disable-next-line ts/no-unsafe-type-assertion
	const resolvedOptions = defu(optionsObject, DEFAULT_LOG_OPTIONS) as RequiredExcept<
		LogOptions,
		'name'
	>

	if (isDebugSet()) {
		resolvedOptions.verbose = true
	}

	const transports: LogLayerTransport[] = []

	// Pretty transport
	if (resolvedOptions.logToConsole) {
		transports.push(
			new PrettyBasicTransport(
				defu(
					isILogBasic(resolvedOptions.logToConsole)
						? { logger: resolvedOptions.logToConsole }
						: typeof resolvedOptions.logToConsole === 'boolean'
							? { logger: pickLogTarget() }
							: resolvedOptions.logToConsole,
					{
						getTerminalWidth: platformAdapter.getTerminalWidth,
						inspect: platformAdapter.inspect,
					},
				) as PrettyBasicTransportConfig,
			),
		)
	}

	// JSON transport
	if (resolvedOptions.logJsonToConsole) {
		transports.push(
			new JsonBasicTransport(
				defu(
					isILogBasic(resolvedOptions.logJsonToConsole)
						? { logger: resolvedOptions.logJsonToConsole }
						: typeof resolvedOptions.logJsonToConsole === 'boolean'
							? { logger: pickLogTarget() }
							: resolvedOptions.logJsonToConsole,
					{
						getTerminalWidth: platformAdapter.getTerminalWidth,
						inspect: platformAdapter.inspect,
					},
				) as JsonBasicTransportConfig,
			),
		)
	}

	// File transport
	if (typeof resolvedOptions.logJsonToFile === 'string' || resolvedOptions.logJsonToFile) {
		if (platformAdapter.createFileTransport === undefined) {
			throw new Error('File logging is only supported in Node.js environments.')
		}

		transports.push(
			platformAdapter.createFileTransport(
				resolvedOptions.name,
				typeof resolvedOptions.logJsonToFile === 'boolean'
					? undefined
					: resolvedOptions.logJsonToFile,
			),
		)
	}

	// Electron transport
	if (platformAdapter.createElectronTransport) {
		transports.push(platformAdapter.createElectronTransport())
	}

	const logLayer = new LogLayer({
		errorSerializer: serializeError,
		plugins: [timestampPlugin],
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

	if (platformAdapter.createElectronListener) {
		platformAdapter.createElectronListener(logLayer)
	}

	return logLayer
}

/**
 * Helper to inject a logger-like instance as a the LogLayer target.
 * @param logger Accepts either a LogLayer instance or a target with typical
 * Console-like logging methods. If undefined, a MockLogLayer instance is
 * returned which will log nothing.
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
export function injectionHelper(logger?: ILogBasic | ILogLayer): ILogLayer {
	if (logger === undefined) {
		return new MockLogLayer()
	}

	if (isILogLayer(logger)) {
		return logger
	}

	// Must be ILogBasic,
	// so create a new LogLayer instance with the basic transport
	return createLogger({
		logJsonToFile: false,
		logToConsole: logger,
		name: undefined,
		verbose: true,
	})
}

/**
 * Type guard to check if a value is a LogLayer instance.
 */
function isILogLayer(instance: unknown): instance is ILogLayer {
	return (
		typeof instance === 'object' &&
		instance !== null &&
		'withContext' in instance &&
		'child' in instance &&
		typeof instance.withContext === 'function' &&
		typeof instance.child === 'function'
	)
}

/**
 * Type guard to check if a value is process.stdout
 */
function isStreamStdout(instance: unknown): instance is StreamStdout {
	return typeof process !== 'undefined' && instance === process.stdout
}

/**
 * Type guard to check if a value is process.stderr
 */
function isStreamStderr(instance: unknown): instance is StreamStderr {
	return typeof process !== 'undefined' && instance === process.stderr
}

/**
 * Type guard to check if a value is a StreamLike object
 */
function isStreamLike(instance: unknown): instance is StreamLike {
	return (
		typeof instance === 'object' &&
		instance !== null &&
		'write' in instance &&
		typeof instance.write === 'function'
	)
}

/**
 * Type guard to check if a value is a Console instance
 */
function isConsole(instance: unknown): instance is Console {
	return (
		typeof instance === 'object' &&
		instance !== null &&
		(instance === globalThis.console ||
			(instance as { constructor?: { name?: string } }).constructor?.name === 'Console')
	)
}

/**
 * Type guard to check if a value is a ConsoleLike object
 */
function isConsoleLike(instance: unknown): instance is ConsoleLike {
	return (
		typeof instance === 'object' &&
		instance !== null &&
		'debug' in instance &&
		'error' in instance &&
		'info' in instance &&
		'trace' in instance &&
		'warn' in instance &&
		typeof instance.debug === 'function' &&
		typeof instance.error === 'function' &&
		typeof instance.info === 'function' &&
		typeof instance.trace === 'function' &&
		typeof instance.warn === 'function'
	)
}

/**
 * Type narrowing function that identifies the specific type of ILogBasic
 * @param instance - The ILogBasic instance to check
 * @returns The specific type as a string: 'Console', 'ConsoleLike', 'StreamLike', 'StreamStderr', or 'StreamStdout'
 */

// Discriminated union for properly typed targets
export type LogBasicTypedTarget =
	| { target: Console; type: 'Console' }
	| { target: ConsoleLike; type: 'ConsoleLike' }
	| { target: StreamLike; type: 'StreamLike' }
	| { target: StreamStderr; type: 'StreamStderr' }
	| { target: StreamStdout; type: 'StreamStdout' }

/**
 * Type guard to check if a value is an ILogBasic instance.
 * Returns true if the instance matches any of the ILogBasic union types:
 * Console, ConsoleLike, StreamLike, StreamStderr, or StreamStdout.
 */
function isILogBasic(instance: unknown): instance is ILogBasic {
	return (
		isStreamStdout(instance) ||
		isStreamStderr(instance) ||
		isConsole(instance) ||
		isConsoleLike(instance) ||
		isStreamLike(instance)
	)
}

/**
 * Helper function to create a typed target from an ILogBasic instance
 */
export function createLogBasicTypedTarget(instance: ILogBasic): LogBasicTypedTarget {
	// Check most specific types first
	if (isStreamStdout(instance)) {
		return { target: instance, type: 'StreamStdout' }
	}
	if (isStreamStderr(instance)) {
		return { target: instance, type: 'StreamStderr' }
	}
	if (isConsole(instance)) {
		return { target: instance, type: 'Console' }
	}
	if (isConsoleLike(instance)) {
		return { target: instance, type: 'ConsoleLike' }
	}
	if (isStreamLike(instance)) {
		return { target: instance, type: 'StreamLike' }
	}

	throw new Error('Unable to identify ILogBasic type')
}

// ------------------------------------------------------------------------------------------------

// Default singleton logger instance, for convenience

let _log: ILogLayer | undefined
let currentOptions: LogOptions = DEFAULT_LOG_OPTIONS

/**
 * The default singleton logger instance.
 * To customize this instance, use the `setDefaultLogOptions` function.
 * This is provided for convenience and quick prototypes.
 * Libraries should manage their own instance.
 */
export const log = new Proxy(
	// eslint-disable-next-line ts/no-unsafe-type-assertion
	{} as ILogLayer,
	{
		get(_, property: keyof ILogLayer) {
			_log ??= createLogger(currentOptions)
			const value = _log[property]
			return typeof value === 'function' ? value.bind(_log) : value
		},
	},
) satisfies ILogLayer

/**
 * Configure the default singleton logger instance with custom options.
 * If specific options are not provided, the singleton's previous options are preserved.
 * @param options - The options to configure the logger with.
 */
export function setDefaultLogOptions(options: LogOptions): void {
	currentOptions = defu(options, currentOptions)
	// Will be lazily recreated on next access through the proxy
	_log = undefined
}

/**
 * Replaced by platform adapter, defined as placeholder for a complete default object
 */
export function defaultInspector(object: unknown): string {
	try {
		const formattedString = JSON.stringify(object, undefined, 2)
		return formattedString
	} catch {
		return 'Could not inspect object'
	}
}

function isEnvDefined(value: string): boolean {
	if (typeof process !== 'undefined') {
		return process.env[value] !== undefined
	}
	if (typeof globalThis !== 'undefined' && 'process' in globalThis && 'env' in globalThis.process) {
		return globalThis.process.env[value] !== undefined
	}
	// eslint-disable-next-line unicorn/prefer-global-this
	if (typeof window !== 'undefined' && 'process' in window && 'env' in window.process) {
		// eslint-disable-next-line unicorn/prefer-global-this
		return window.process.env[value] !== undefined
	}
	return false
}

/**
 * Check if the NO_COLOR environment variable is set
 * https://no-color.org/
 */
export function isNoColorSet(): boolean {
	return isEnvDefined('NO_COLOR')
}

/**
 * Check if the FORCE_COLOR environment variable is set
 * https://force-color.org/
 */
export function isForceColorSet(): boolean {
	return isEnvDefined('FORCE_COLOR')
}

/**
 * Check if the DEBUG environment variable is set
 */
function isDebugSet(): boolean {
	return isEnvDefined('DEBUG')
}

/**
 * Get the destination(s) of the active JSON file transport(s).
 * Only available after the first log has been written.
 */
export function getJsonFileTransportDestinations(): string[] {
	return platformAdapter.getFileTransportDestinations?.() ?? []
}
