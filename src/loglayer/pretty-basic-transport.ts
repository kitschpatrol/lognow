import type {
	LogLayerTransportConfig,
	LogLayerTransportParams,
	LogLevelType,
} from '@loglayer/transport'
import type { InspectOptions } from 'node-inspect-extracted'
import { BaseTransport, LogLevel } from '@loglayer/transport'
import c from 'ansi-colors'
import wrapAnsi from 'wrap-ansi'
import type { ILogBasic, LogBasicTypedTarget } from '../log'
import { createLogBasicTypedTarget, pickLogTarget } from '../log'

// Dance to make the config interface convertible to a type
// eslint-disable-next-line ts/consistent-type-definitions
interface PrettyBasicTransportConfigInterface extends LogLayerTransportConfig<ILogBasic> {
	colorize?: boolean
	getTerminalWidth: () => number
	inspect: (object: unknown, options?: InspectOptions) => string
}

/**
 * Configuration for the pretty basic transport
 * @public
 */
export type PrettyBasicTransportConfig = PrettyBasicTransportConfigInterface

const PRETTY_BASIC_TRANSPORT_CONFIG_DEFAULTS: Omit<
	Required<PrettyBasicTransportConfig>,
	'inspect'
> = {
	colorize: true,
	consoleDebug: false,
	enabled: true,
	getTerminalWidth: () => Number.MAX_SAFE_INTEGER,
	id: 'pretty-basic-transport',
	// Overridden by the logger instance...
	level: 'trace',
	logger: pickLogTarget(true),
}

const MAX_WIDTH = 120

/**
 * TK
 */
export class PrettyBasicTransport extends BaseTransport<ILogBasic> {
	/** Configuration options */
	private readonly config: Required<PrettyBasicTransportConfig>

	private readonly typedTarget: LogBasicTypedTarget
	/**
	 * Creates a new SimplePrettyTerminalTransport instance.
	 * @param config - Configuration options for the transport
	 */
	constructor(config: PrettyBasicTransportConfig) {
		const resolvedConfig = {
			...PRETTY_BASIC_TRANSPORT_CONFIG_DEFAULTS,
			...config,
		}
		super(resolvedConfig)

		// Store configuration
		this.config = resolvedConfig

		// Detect and narrow log type once...
		this.typedTarget = createLogBasicTypedTarget(this.config.logger)

		// Enable ANSI colors if we're using a chrome console
		// The ansi-colors library typically only activates in Node.js environments.
		// Tried to use `asChromeConsoleLogArguments` from
		// https://github.com/xpl/ansicolor, but Chrome already renders ANSI colors
		// correctly, and it had some bugs in Safari
		if (
			this.typedTarget.type === 'Console' &&
			'window' in globalThis &&
			'chrome' in globalThis.window
		) {
			c.enabled = true
		}
	}

	/**
	 * TK
	 */
	// eslint-disable-next-line complexity
	shipToLogger(params: LogLayerTransportParams): unknown[] {
		// If transport is disabled, return messages without processing
		if (!this.config.enabled) {
			return params.messages
		}

		// const entry = {
		// 	data: hasData ? JSON.stringify(data) : null,
		// 	id: this.generateId(),
		// 	level: logLevel,
		// 	message: messages.join(' '),
		// 	timestamp: Date.now(),
		// }

		const { name, parentNames, timestamp, ...restOfContext } = (params.context ?? {}) as {
			name?: string | undefined
			parentNames?: string[] | undefined
			timestamp?: string | undefined
		}

		const localTimeString = formatTime(new Date(timestamp ?? Date.now()), this.config.colorize)
		const logLevelString = getLogLevelString(params.logLevel, this.config.colorize)
		const namePrefix = getNamePrefix(name, parentNames, this.config.colorize)
		const messages = this.styleMessages(params.messages)

		// TODO slow to call this every time?
		const maxWidth = Math.min(this.config.getTerminalWidth(), MAX_WIDTH)

		const errorObject =
			!('error' in params) || params.error === null || params.error === undefined
				? undefined
				: // eslint-disable-next-line ts/no-unsafe-type-assertion
					(params.error as unknown as Error)

		const metadataObject =
			!('metadata' in params) ||
			// eslint-disable-next-line ts/no-unnecessary-condition
			params.metadata === null ||
			params.metadata === undefined ||
			Object.keys(params.metadata).length === 0
				? undefined
				: params.metadata

		const restOfContextObject = Object.keys(restOfContext).length === 0 ? undefined : restOfContext

		const prefixAndMessages = wrapAnsi(
			[localTimeString, logLevelString, namePrefix, messages].join(' '),
			maxWidth,
		)

		// Type narrowing based on the discriminated union
		switch (this.typedTarget.type) {
			case 'Console':
			case 'ConsoleLike': {
				// This.typedTarget.target is narrowed to Console | ConsoleLike

				const extraParts = [errorObject, metadataObject, restOfContextObject].filter(Boolean)
				//
				// .flatMap((part) => [part, '\n'])
				// .slice(0, -1)

				const logParts = [prefixAndMessages, ...(extraParts.length > 0 ? [] : []), ...extraParts]

				switch (params.logLevel) {
					case 'debug':
					case LogLevel.debug: {
						this.typedTarget.target.debug(...logParts)
						break
					}

					case 'error':
					case 'fatal':
					case LogLevel.error:
					case LogLevel.fatal: {
						this.typedTarget.target.error(...logParts)
						break
					}

					case 'info':
					case LogLevel.info: {
						this.typedTarget.target.info(...logParts)
						break
					}

					case LogLevel.trace:
					case 'trace': {
						this.typedTarget.target.trace(...logParts)
						break
					}

					case LogLevel.warn:
					case 'warn': {
						this.typedTarget.target.warn(...logParts)
						break
					}
				}
				break
			}
			case 'StreamLike':
			case 'StreamStderr':
			case 'StreamStdout': {
				// Currently only used in stream targets
				const metadataString = metadataObject
					? this.config.inspect(metadataObject, {
							breakLength: maxWidth,
							colors: this.config.colorize,
							depth: Infinity,
						})
					: undefined
				const restOfContextString = restOfContextObject
					? this.config.inspect(restOfContextObject, {
							breakLength: maxWidth,
							colors: this.config.colorize,
							depth: Infinity,
						})
					: undefined

				const errorString = errorObject
					? this.config.inspect(errorObject, {
							breakLength: maxWidth,
							colors: this.config.colorize,
							depth: Infinity,
						})
					: undefined

				// Add down arrow if the message is empty and there are other parts
				const isObjectOnly =
					messages.length === 0 &&
					(errorObject !== undefined ||
						metadataObject !== undefined ||
						restOfContextObject !== undefined)

				const completeMessage = [
					isObjectOnly ? [prefixAndMessages, '↴'].join(' ') : prefixAndMessages,
					errorString,
					metadataString,
					restOfContextString,
				]
					.filter(Boolean)
					.join('\n')

				// This.typedTarget.target is narrowed to a stream type
				void this.typedTarget.target.write(`${completeMessage}\n`)
				break
			}
		}

		// This.renderer.renderLogLine(entry)
		return params.messages
	}

	/**
	 * Value colors roughly match node's inspect utility.
	 */
	style(value: unknown): string {
		if (value === undefined) {
			return this.config.colorize ? c.gray('undefined') : 'undefined'
		}
		if (value === null) {
			return this.config.colorize ? c.gray('null') : 'null'
		}
		if (typeof value === 'boolean') {
			return this.config.colorize ? c.cyan(value.toString()) : value.toString()
		}
		if (typeof value === 'number') {
			return this.config.colorize ? c.yellow(value.toString()) : value.toString()
		}
		if (typeof value === 'string') {
			return value
		}
		if (typeof value === 'function') {
			return this.config.colorize ? c.green(value.name) : value.name
		}

		// Check if it's an object
		if (typeof value === 'object') {
			return this.config.inspect(value, {
				colors: this.config.colorize,
				compact: true,
				depth: Infinity,
			})
		}

		// eslint-disable-next-line ts/no-base-to-string
		return String(value)
	}

	styleMessages(messages: unknown[]): string {
		return messages.map((message) => this.style(message)).join(' ')
	}
}

function formatTime(date: Date, colorize: boolean): string {
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	const seconds = date.getSeconds().toString().padStart(2, '0')
	const milliseconds = date.getMilliseconds().toString().padStart(3, '0')
	const timeString = `${hours}:${minutes}:${seconds}.${milliseconds}`
	return colorize ? c.gray(timeString) : timeString
}

function getLogLevelString(level: LogLevelType, colorize: boolean): string {
	switch (level) {
		case 'debug':
		case LogLevel.debug: {
			return colorize ? c.bold.green('DEBUG') : 'DEBUG'
		}
		case 'error':
		case LogLevel.error: {
			return colorize ? c.bold.red('ERROR') : 'ERROR'
		}
		case 'fatal':
		case LogLevel.fatal: {
			return colorize ? c.bold.red('FATAL') : 'FATAL'
		}
		case 'info':
		case LogLevel.info: {
			return colorize ? c.bold.blue('INFO ') : 'INFO '
		}
		case LogLevel.trace:
		case 'trace': {
			return colorize ? c.bold.gray('TRACE') : 'TRACE'
		}
		case LogLevel.warn:
		case 'warn': {
			return colorize ? c.bold.yellow('WARN ') : 'WARN '
		}
	}
}

function getNamePrefix(
	name: string | undefined,
	parentNames: string[] | undefined,
	colorize: boolean,
): string {
	if (name === undefined && parentNames === undefined) {
		return '|'
	}
	const result = [...(parentNames ?? []), ...(name ? [name] : [])]
		.map((name) => `[${name}]`)
		.join('')
	return colorize ? c.bold.gray(result) : result
}
