import type { LogLayerTransportConfig, LogLayerTransportParams } from '@loglayer/transport'
import { BaseTransport, LogLevel } from '@loglayer/transport'
import type { ILogBasic, LogBasicTypedTarget } from '../log'
import { createLogBasicTypedTarget, pickLogTarget } from '../log'
import { paramsToJsonString } from './json-shared'

// Dance to make the config interface convertible to a type
// eslint-disable-next-line ts/consistent-type-definitions
interface JsonBasicTransportConfigInterface extends LogLayerTransportConfig<ILogBasic> {
	colorize?: boolean
	getTerminalWidth: () => number
}

export type JsonBasicTransportConfig = JsonBasicTransportConfigInterface

const JSON_BASIC_TRANSPORT_CONFIG_DEFAULTS: Required<JsonBasicTransportConfig> = {
	colorize: false,
	consoleDebug: false,
	enabled: true,
	getTerminalWidth: () => Number.MAX_SAFE_INTEGER,
	id: 'pretty-basic-transport',
	// Overridden by the logger instance...
	level: 'trace',
	logger: pickLogTarget(true),
}

// TODO
// const MAX_WIDTH = 120

/**
 * TK
 */
export class JsonBasicTransport extends BaseTransport<ILogBasic> {
	/** Configuration options */
	private readonly config: Required<JsonBasicTransportConfig>
	private readonly typedTarget: LogBasicTypedTarget

	constructor(config: JsonBasicTransportConfig) {
		const resolvedConfig = {
			...JSON_BASIC_TRANSPORT_CONFIG_DEFAULTS,
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
		// if (
		// 	this.typedTarget.type === 'Console' &&
		// 	'window' in globalThis &&
		// 	'chrome' in globalThis.window
		// ) {
		// 	c.enabled = true
		// }
	}

	/**
	 * TK
	 */
	shipToLogger(params: LogLayerTransportParams): unknown[] {
		// If transport is disabled, return messages without processing
		if (!this.config.enabled) {
			return params.messages
		}

		const logString = paramsToJsonString(params)

		// Type narrowing based on the discriminated union
		switch (this.typedTarget.type) {
			case 'Console':
			case 'ConsoleLike': {
				// This.typedTarget.target is narrowed to Console | ConsoleLike

				switch (params.logLevel) {
					case 'debug':
					case LogLevel.debug: {
						this.typedTarget.target.debug(logString)
						break
					}

					case 'error':
					case 'fatal':
					case LogLevel.error:
					case LogLevel.fatal: {
						this.typedTarget.target.error(logString)
						break
					}

					case 'info':
					case LogLevel.info: {
						this.typedTarget.target.info(logString)
						break
					}

					case LogLevel.trace:
					case 'trace': {
						this.typedTarget.target.trace(logString)
						break
					}

					case LogLevel.warn:
					case 'warn': {
						this.typedTarget.target.warn(logString)
						break
					}
				}
				break
			}
			case 'StreamLike':
			case 'StreamStderr':
			case 'StreamStdout': {
				// This.typedTarget.target is narrowed to a stream type
				void this.typedTarget.target.write(`${logString}\n`)
				break
			}
		}

		return params.messages
	}
}
