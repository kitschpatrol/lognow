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
		Object.entries(object).map(([key, value]) => [
			key,
			key === 'timestamp'
				? 'TIME'
				: typeof value === 'object' && value !== null && !Array.isArray(value)
					? stripTimestamp(value as Record<string, unknown>)
					: Array.isArray(value)
						? value.map((item: unknown) =>
								typeof item === 'object' && item !== null && !Array.isArray(item)
									? stripTimestamp(item as Record<string, unknown>)
									: item,
							)
						: value,
		]),
	)
}

/**
 * Helper to safely extract string from mock call
 */
export function getCallString(mockFn: Mock, callIndex = 0): string {
	const argument: unknown = mockFn.mock.calls[callIndex]?.[0]
	if (typeof argument !== 'string') {
		throw new TypeError(`Expected a string as the first argument of mock call ${callIndex}`)
	}

	return argument
}

/**
 * Helper to check if an object is a browser console object
 */
export function isBrowserConsoleObject(object: unknown): object is Console {
	if (typeof object !== 'object' || object === null) {
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
