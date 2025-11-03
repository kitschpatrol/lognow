import type { LogLayerTransportConfig, LogLayerTransportParams } from '@loglayer/transport'
import type { InspectOptions } from 'node-inspect-extracted'
import { BaseTransport, LogLevel } from '@loglayer/transport'
import { defu } from 'defu'
import type { ILogBasic, LogBasicTypedTarget } from '../log'
import {
	createLogBasicTypedTarget,
	defaultInspector,
	isForceColorSet,
	isNoColorSet,
	pickLogTarget,
} from '../log'
import { paramsToJsonString } from './json-shared'

// Dance to make the config interface convertible to a type
// eslint-disable-next-line ts/consistent-type-definitions
interface JsonBasicTransportConfigInterface extends Partial<LogLayerTransportConfig<ILogBasic>> {
	colorize?: boolean
	getTerminalWidth?: () => number
	inspect?: (object: unknown, options?: InspectOptions) => string
	pretty?: boolean
}

/**
 * Configuration for the JSON basic transport
 * @public
 */
export type JsonBasicTransportConfig = JsonBasicTransportConfigInterface

const JSON_BASIC_TRANSPORT_CONFIG_DEFAULTS: Required<JsonBasicTransportConfig> = {
	colorize: false,
	consoleDebug: false,
	enabled: true,
	getTerminalWidth: () => Number.MAX_SAFE_INTEGER,
	id: 'json-basic-transport',
	inspect: defaultInspector,
	level: 'trace', // Overridden by the logger instance...
	logger: pickLogTarget(),
	pretty: false,
}

const MAX_WIDTH = 120

/**
 * TK
 */
export class JsonBasicTransport extends BaseTransport<ILogBasic> {
	/** Configuration options */
	private readonly config: Required<JsonBasicTransportConfig>
	private readonly typedTarget: LogBasicTypedTarget

	constructor(config: JsonBasicTransportConfig) {
		// eslint-disable-next-line ts/no-unsafe-type-assertion
		const resolvedConfig = defu(
			config,
			JSON_BASIC_TRANSPORT_CONFIG_DEFAULTS,
		) as Required<JsonBasicTransportConfig>

		if (isNoColorSet()) {
			resolvedConfig.colorize = false
		}

		if (isForceColorSet()) {
			resolvedConfig.colorize = true
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

	// eslint-disable-next-line complexity
	shipToLogger(params: LogLayerTransportParams): unknown[] {
		// If transport is disabled, return messages without processing
		if (!this.config.enabled) {
			return params.messages
		}

		const jsonString = paramsToJsonString(params)
		const logString =
			this.config.pretty || this.config.colorize
				? this.config.inspect(JSON.parse(jsonString), {
						breakLength: this.config.pretty
							? Math.min(this.config.getTerminalWidth(), MAX_WIDTH)
							: Number.MAX_SAFE_INTEGER,
						colors: this.config.colorize,
						compact: !this.config.pretty,
						depth: Infinity,
					})
				: jsonString

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
