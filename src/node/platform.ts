import type { LogLayerTransport } from 'loglayer'
import { LogFileRotationTransport } from '@loglayer/transport-log-file-rotation'
import filenamify from 'filenamify'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { inspect as nodeInspect } from 'node:util'
import { readPackageUpSync } from 'read-package-up'
import terminalSize from 'terminal-size'
import type { PlatformAdapter } from '../log.js'

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
	const packageJson = readPackageUpSync()
	return packageJson?.packageJson.name
}

// File transports must be reused, so we cache them by path
const fileTransportsByPath = new Map<string, LogLayerTransport>()

function createFileTransport(name = 'default', logDirectory?: string): LogLayerTransport {
	const cleanName = filenamify(name, { replacement: '-' })

	const filename = path.join(
		logDirectory ?? getPlatformLogPath(cleanName),
		`${cleanName}-%DATE%.log`,
	)

	if (!fileTransportsByPath.has(filename)) {
		fileTransportsByPath.set(
			filename,
			new LogFileRotationTransport({
				compressOnRotate: true,
				dateFormat: 'YMD',
				filename,
				frequency: 'daily',
			}),
		)
	}

	return fileTransportsByPath.get(filename)!
}

export const nodePlatformAdapter: PlatformAdapter = {
	createFileTransport,
	getName,
	getTerminalWidth() {
		// TODO reconsider
		return terminalSize().columns
	},
	inspect: nodeInspect,
}
