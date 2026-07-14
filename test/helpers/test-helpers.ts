/**
 * Shared test helper functions
 */

import type { Mock } from 'vitest'

/**
 * Helper to strip ANSI color codes and timestamps for comparison
 */
export function stripDynamic(string_: string): string {
	return (
		string_
			// Remove ANSI color codes
			// eslint-disable-next-line no-control-regex
			.replaceAll(/\u{1B}\[\d+m/gv, '')
			// Remove timestamps (ISO format)
			.replaceAll(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/gv, 'TIMESTAMP')
			// Remove time prefixes (HH:MM:SS.mmm)
			.replaceAll(/\d{2}:\d{2}:\d{2}\.\d{3}/gv, 'TIME')
	)
}

/**
 * Helper to parse a string and strip timestamp
 */
export function parseAndStripTimestamp(value: string): unknown {
	// eslint-disable-next-line ts/no-unsafe-argument
	return stripTimestamp(JSON.parse(value))
}

/**
 * Helper to strip timestamp from an object
 */
function stripTimestamp(object: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(object).map(([key, value]) => {
			// If this is the timestamp key, replace with 'TIME'
			if (key === 'timestamp') {
				return [key, 'TIME']
			}

			// Recursively process nested objects
			if (
				value !== null &&
				value !== undefined &&
				typeof value === 'object' &&
				!Array.isArray(value)
			) {
				return [key, stripTimestamp(value as Record<string, unknown>)]
			}

			// Recursively process arrays
			if (Array.isArray(value)) {
				return [
					key,
					value.map((item) => {
						if (
							item !== null &&
							item !== undefined &&
							typeof item === 'object' &&
							!Array.isArray(item)
						) {
							return stripTimestamp(item as Record<string, unknown>)
						}

						// eslint-disable-next-line ts/no-unsafe-return
						return item
					}),
				]
			}

			// Return primitives as-is
			return [key, value]
		}),
	)
}

/**
 * Helper to safely extract string from mock call
 */
export function getCallString(mockFn: Mock, callIndex = 0): string {
	const call = mockFn.mock.calls[callIndex]
	if (call === undefined) {
		throw new Error(`No mock call at index ${callIndex}`)
	}

	// eslint-disable-next-line ts/no-unsafe-return
	return call[0]
}

/**
 * Helper to check if an object is a browser console object
 */
export function isBrowserConsoleObject(object: unknown): object is Console {
	if (object === null || object === undefined || typeof object !== 'object') {
		return false
	}

	const consoleObject = object as Record<string, unknown>

	// Check for essential Console methods
	const requiredMethods = [
		'assert',
		'clear',
		'count',
		'countReset',
		'debug',
		'dir',
		'dirxml',
		'error',
		'group',
		'groupCollapsed',
		'groupEnd',
		'info',
		'log',
		'profile',
		'profileEnd',
		'table',
		'time',
		'timeEnd',
		'timeLog',
		'timeStamp',
		'trace',
		'warn',
	]

	return requiredMethods.every((method) => typeof consoleObject[method] === 'function')
}
