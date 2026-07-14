/**
 * Unit tests for the shared JSON serialization helpers. These pin the
 * metadata-omission, staticData-merge, and error-serialization behavior that
 * the JSON transports rely on.
 */

import type { LogLayerTransportParams } from '@loglayer/transport'
import { describe, expect, it } from 'vitest'
import { paramsToJsonString } from '../../src/loglayer/json-shared.js'

function baseParams(overrides: Partial<LogLayerTransportParams> = {}): LogLayerTransportParams {
	return {
		context: {},
		logLevel: 'info',
		messages: ['message'],
		...overrides,
	}
}

function parse(value: string): Record<string, unknown> {
	return JSON.parse(value) as Record<string, unknown>
}

describe('paramsToJsonString: metadata', () => {
	it('should include metadata when it has properties', () => {
		const parsed = parse(paramsToJsonString(baseParams({ metadata: { count: 42, key: 'value' } })))
		expect(parsed.metadata).toStrictEqual({ count: 42, key: 'value' })
	})

	it('should omit an empty metadata object', () => {
		const parsed = parse(paramsToJsonString(baseParams({ metadata: {} })))
		expect(parsed).not.toHaveProperty('metadata')
	})

	it('should omit metadata when the key is absent', () => {
		const parsed = parse(paramsToJsonString(baseParams()))
		expect(parsed).not.toHaveProperty('metadata')
	})
})

describe('paramsToJsonString: staticData', () => {
	it('should merge staticData supplied as an object', () => {
		const parsed = parse(paramsToJsonString(baseParams(), { staticData: { app: 'test-app' } }))
		expect(parsed.app).toBe('test-app')
	})

	it('should merge staticData supplied as a function', () => {
		const parsed = parse(
			paramsToJsonString(baseParams(), { staticData: () => ({ app: 'test-app' }) }),
		)
		expect(parsed.app).toBe('test-app')
	})

	it('should not add keys when staticData is absent', () => {
		const parsed = parse(paramsToJsonString(baseParams()))
		expect(parsed).not.toHaveProperty('app')
	})
})

describe('paramsToJsonString: errors', () => {
	it('should serialize an Error via the error replacer', () => {
		const parsed = parse(paramsToJsonString(baseParams({ error: new Error('boom') })))
		expect(parsed.error).toMatchObject({ message: 'boom' })
	})

	it('should omit the error key when no error is present', () => {
		const parsed = parse(paramsToJsonString(baseParams()))
		expect(parsed).not.toHaveProperty('error')
	})
})
