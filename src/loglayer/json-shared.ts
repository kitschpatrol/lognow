import type { LogLayerTransportParams } from '@loglayer/transport'
import { stringify as safeStableStringify } from 'safe-stable-stringify'
import { serializeError } from 'serialize-error'

/**
 * Check if object has a property
 */
export function hasOwnProperties(object: Record<string, unknown>): boolean {
	// Optimization
	// eslint-disable-next-line guard-for-in, no-unreachable-loop, ts/naming-convention
	for (const _ in object) return true
	return false
}

/**
 * Options for paramsToJsonString function
 * @public
 */
export type ParamsToJsonStringOptions = {
	staticData?: (() => Record<string, unknown>) | Record<string, unknown>
	timestampFn?: () => number | string
}

/**
 * Build a structured log entry object from transport params.
 */
export function paramsToLogEntry(
	params: LogLayerTransportParams,
	options?: ParamsToJsonStringOptions,
): Record<string, unknown> {
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
		!hasOwnProperties(params.metadata as Record<string, unknown>)
			? undefined
			: params.metadata

	const restOfContextObject = hasOwnProperties(restOfContext) ? restOfContext : undefined

	// Strip undefined values so inspect() doesn't render them
	return Object.fromEntries(
		Object.entries({
			context: restOfContextObject,
			error: errorObject,
			level: params.logLevel,
			messages: params.messages,
			metadata: metadataObject,
			name,
			parentNames,
			timestamp: timestamp ?? timestampFn(),
			...(staticData ? (typeof staticData === 'function' ? staticData() : staticData) : {}),
		}).filter(([, v]) => v !== undefined),
	)
}

/**
 * Much mirrored from FileRotationTransport
 */
export function paramsToJsonString(
	params: LogLayerTransportParams,
	options?: ParamsToJsonStringOptions,
): string {
	return safeStableStringify(paramsToLogEntry(params, options), replacer) ?? ''
}

function replacer(this: unknown, _: unknown, value: unknown) {
	if (value instanceof Error) {
		return serializeError(value)
	}
	return value
}
