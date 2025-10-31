import type { LogLayerTransportParams } from '@loglayer/transport'
import type { LogFileRotationTransportConfig } from '@loglayer/transport-log-file-rotation'
import { LogFileRotationTransport } from '@loglayer/transport-log-file-rotation'
import { paramsToJsonString } from './json-shared'

function isEmptyObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && Object.keys(value).length === 0
}

/**
 * Semi-flattened JSON transport for file logging, designed for integration with
 * the lognow package. Privileges name, parentNames, and timestamp as top-level keys.
 * Any other context values are nested under a `context` key.
 * Metadata is nested under a `metadata` key.
 * Error is nested under an `error` key, and are serialized using serialize-error.
 * Keys are omitted if they are undefined.
 * Messages are kept as arrays.
 */
export class JsonFileTransport extends LogFileRotationTransport {
	constructor(params: LogFileRotationTransportConfig) {
		super(params)

		// Certain options are not supported
		if (
			// @ts-expect-error - Private
			// eslint-disable-next-line ts/no-unsafe-member-access
			this.fieldNames.timestamp !== 'timestamp' ||
			// @ts-expect-error - Private
			// eslint-disable-next-line ts/no-unsafe-member-access
			!(this.fieldNames.message === 'message' || this.fieldNames.message === 'messages') ||
			// @ts-expect-error - Private
			// eslint-disable-next-line ts/no-unsafe-member-access
			this.fieldNames.level !== 'level'
		) {
			throw new Error('Field name customization is not supported')
		}

		if (
			// @ts-expect-error - Private
			!isEmptyObject(this.levelMap)
		) {
			throw new Error('Level map customization is not supported')
		}
	}

	shipToLogger(params: LogLayerTransportParams) {
		const logString = `${paramsToJsonString(params, {
			// @ts-expect-error - Private
			// eslint-disable-next-line ts/no-unsafe-assignment
			staticData: this.staticData,
			// @ts-expect-error - Private
			// eslint-disable-next-line ts/no-unsafe-assignment
			timestampFn: this.timestampFn,
		})}${
			// @ts-expect-error - Private
			this.delimiter
		}`

		// @ts-expect-error - Accessing private properties for batching logic
		if (this.batchEnabled) {
			// @ts-expect-error - Private
			// eslint-disable-next-line ts/no-unsafe-call, ts/no-unsafe-member-access
			this.batchQueue.push(logString)

			// @ts-expect-error - Private
			// eslint-disable-next-line ts/no-unsafe-member-access
			if (this.batchQueue.length >= this.batchSize) {
				// @ts-expect-error - Private
				// eslint-disable-next-line ts/no-unsafe-call
				this.flush()
			} else {
				// @ts-expect-error - Private
				// eslint-disable-next-line ts/no-unsafe-call
				this.scheduleBatchFlush()
			}
		} else {
			// @ts-expect-error - Private
			// eslint-disable-next-line ts/no-unsafe-call, ts/no-unsafe-member-access
			this.stream.write(logString)
		}

		// eslint-disable-next-line ts/no-unsafe-return
		return params.messages
	}
}
