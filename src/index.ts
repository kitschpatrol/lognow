import type { ILogLayer, LogLayerTransport } from 'loglayer'
import { LogFileRotationTransport } from '@loglayer/transport-log-file-rotation'
import filenamify from 'filenamify'
import { BlankTransport, ConsoleTransport, LogLayer, LogLevel } from 'loglayer'
import path from 'node:path'
import { serializeError } from 'serialize-error'
import { HierarchicalContextManager } from './hierarchical-context-manager'
import { getName, getPlatformLogPath } from './utilities'

type LogOptions = {
	/** Log to the console in JSON format. Useful for debugging structured logging. */
	logJsonToConsole?: boolean
	/** Log to a typical log file path. If a string is passed, log to the given directory path. Logs are gzipped and rotated daily, and are never removed. */
	logJsonToFile?: boolean | string
	/** Log to the console in a pretty and human-readable format. */
	logToConsole?: boolean
	/** The name of the logger, also used as the log file name if file logging is enabled. */
	name?: string
	verbose?: boolean
}

const defaultLogOptions: Required<LogOptions> = {
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

const fileTransportsByPath = new Map<string, LogLayerTransport>()

/**
 * Helper function to create a logger with a given options.
 */
export function getLogger(options?: LogOptions): ILogLayer {
	const resolvedOptions = { ...defaultLogOptions, ...options }

	const transports: LogLayerTransport[] = []

	if (resolvedOptions.logToConsole) {
		transports.push(
			new ConsoleTransport({
				appendObjectData: true,
				id: 'console',
				logger: console,
			}),
		)
	}

	if (resolvedOptions.logJsonToConsole) {
		transports.push(
			new BlankTransport({
				shipToLogger(params) {
					console.log(JSON.stringify(params, undefined, 2))

					// eslint-disable-next-line ts/no-unsafe-return
					return params.messages
				},
			}),
		)
	}

	if (typeof resolvedOptions.logJsonToFile === 'string' || resolvedOptions.logJsonToFile) {
		const cleanName = filenamify(resolvedOptions.name, { replacement: '-' })

		const filename = path.join(
			typeof resolvedOptions.logJsonToFile === 'string'
				? resolvedOptions.logJsonToFile
				: getPlatformLogPath(filenamify(resolvedOptions.name, { replacement: '-' })),
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

	logLayer.withContext({
		name: resolvedOptions.name,
	})

	if (resolvedOptions.verbose) {
		logLayer.setLevel(LogLevel.trace)
	} else {
		logLayer.setLevel(LogLevel.info)
	}

	return logLayer
}

/**
 * Singleton logger instance with default settings.
 */
export let log = getLogger()

let currentOptions: LogOptions = defaultLogOptions

/**
 * Configure the default singleton logger instance with custom options.
 * If specific options are not provided, the singleton's previous options are preserved.
 * @param options - The options to configure the logger with.
 */
export function configure(options: LogOptions): void {
	currentOptions = { ...currentOptions, ...options }
	log = getLogger(currentOptions)
}
