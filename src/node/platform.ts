import type { LogLayerTransport } from 'loglayer'
import { defu } from 'defu'
import filenamify from 'filenamify'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { inspect as nodeInspect } from 'node:util'
import { readPackageUpSync } from 'read-package-up'
import terminalSize from 'terminal-size'
import type { PlatformAdapter } from '../log.js'
import type { JsonFileTransportConfig } from '../loglayer/json-file-transport.js'
import { JsonFileTransport } from '../loglayer/json-file-transport.js'

/**
 * Helper function to get the platform-specific log path. Based on the platform,
 * the log path is different.
 *
 * - macOS: `~/Library/Logs/app`
 * - Windows: `%LOCALAPPDATA%\app\Log`
 * - Linux/UNIX: `~/.local/state/app`
 */
function getPlatformLogPath(name?: string): string {
	const homedir = os.homedir()
	const { env } = process

	const resolvedName = name ?? 'app'

	if (process.platform === 'darwin') {
		return path.join(homedir, 'Library', 'Logs', resolvedName)
	}

	if (process.platform === 'win32') {
		const localAppData = env.LOCALAPPDATA ?? path.join(homedir, 'AppData', 'Local')
		return path.join(localAppData, resolvedName, 'Log')
	}

	// Linux/UNIX
	return path.join(env.XDG_STATE_HOME ?? path.join(homedir, '.local', 'state'), resolvedName)
}

/**
 * Helper function to get the name of the package. Based on the package.json file.
 */
function getName(): string | undefined {
	// Detect electron main process
	if (process.env.ELECTRON_MAIN) {
		return 'Main'
	}

	const packageJson = readPackageUpSync()
	return packageJson?.packageJson.name
}

// File transports must be reused, so we cache them by path
const fileTransportsByPath = new Map<string, LogLayerTransport>()

/**
 * Create a file transport for the given name and log directory.
 * @param name - The name of the log file.
 * @param logDirectoryOrOptions - The directory to log to, or a JsonFileTransportConfig object (which might override name).
 * @returns The file transport.
 */
export function createFileTransport(
	name = 'default',
	logDirectoryOrOptions?: JsonFileTransportConfig | string,
): LogLayerTransport {
	const cleanName = filenamify(name, { replacement: '-' })

	// Ensure filename is used for map key and that any other options don't overwrite it
	const { filename: filenameFromOptions, ...restOfOptions } =
		typeof logDirectoryOrOptions === 'object' ? logDirectoryOrOptions : {}

	const filename =
		typeof filenameFromOptions === 'string'
			? filenameFromOptions
			: path.join(
					typeof logDirectoryOrOptions === 'string'
						? logDirectoryOrOptions
						: getPlatformLogPath(cleanName),
					`${cleanName}-%DATE%.log`,
				)

	if (!fileTransportsByPath.has(filename)) {
		fileTransportsByPath.set(
			filename,
			new JsonFileTransport(
				defu(restOfOptions, {
					compressOnRotate: true,
					dateFormat: 'YMD',
					filename,
					frequency: 'daily',
				}),
			),
		)
	}

	return fileTransportsByPath.get(filename)!
}

/**
 * Get the terminal width.
 * @returns The terminal width.
 */
export function getTerminalWidth(): number {
	// TODO reconsider
	return terminalSize().columns
}

export const nodePlatformAdapter: PlatformAdapter = {
	createFileTransport,
	getName,
	getTerminalWidth,
	inspect: nodeInspect,
}
