import type { LogLayerTransportParams } from '@loglayer/transport'
import { stringify as safeStableStringify } from 'safe-stable-stringify'
import { serializeError } from 'serialize-error'

export type ParamsToJsonStringOptions = {
	staticData?: (() => Record<string, unknown>) | Record<string, unknown>
	timestampFn?: () => number | string
}

/**
 * Much mirrored from FileRotationTransport
 */
export function paramsToJsonString(
	params: LogLayerTransportParams,
	options?: ParamsToJsonStringOptions,
): string {
	// Defaults match FileRotationTransport
	const { staticData, timestampFn = () => new Date().toISOString() } = options ?? {}

	const { name, parentNames, timestamp, ...restOfContext } = (params.context ?? {}) as {
		name?: string | undefined
		parentNames?: string[] | undefined
		timestamp?: string | undefined
	}

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

	const logEntry = {
		context: restOfContextObject,
		error: errorObject,
		level: params.logLevel,
		messages: params.messages,
		metadata: metadataObject,
		name,
		parentNames,
		timestamp: timestamp ?? timestampFn(),
		...(staticData ? (typeof staticData === 'function' ? staticData() : staticData) : {}),
	}

	return safeStableStringify(logEntry, replacer) ?? ''
}

function replacer(this: unknown, _: unknown, value: unknown) {
	if (value instanceof Error) {
		return serializeError(value)
	}
	return value
}
