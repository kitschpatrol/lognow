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
			.replaceAll(/\u001B\[\d+m/g, '')
			// Remove timestamps (ISO format)
			.replaceAll(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, 'TIMESTAMP')
			// Remove time prefixes (HH:MM:SS.mmm)
			.replaceAll(/\d{2}:\d{2}:\d{2}\.\d{3}/g, 'TIME')
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
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				// eslint-disable-next-line ts/no-unsafe-type-assertion
				return [key, stripTimestamp(value as Record<string, unknown>)]
			}

			// Recursively process arrays
			if (Array.isArray(value)) {
				return [
					key,
					value.map((item) => {
						if (item && typeof item === 'object' && !Array.isArray(item)) {
							// eslint-disable-next-line ts/no-unsafe-type-assertion
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
	// eslint-disable-next-line ts/no-unsafe-return
	return mockFn.mock.calls[callIndex][0]
}

/**
 * Helper to check if an object is a browser console object
 */
export function isBrowserConsoleObject(object: unknown): object is Console {
	if (!object || typeof object !== 'object') {
		return false
	}

	// eslint-disable-next-line ts/no-unsafe-type-assertion
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
