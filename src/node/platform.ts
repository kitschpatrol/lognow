import type { LogLayerTransportParams } from '@loglayer/transport'
import type { ILogLayer, LogLayerTransport } from 'loglayer'
import { defu } from 'defu'
import filenamify from 'filenamify'
import { NJSON } from 'next-json'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { inspect as nodeInspect } from 'node:util'
import { readPackageUpSync } from 'read-package-up'
import terminalSize from 'terminal-size'
import untildify from 'untildify'
import type { PlatformAdapter } from '../log.js'
import type { JsonFileTransportConfig } from '../loglayer/json-file-transport.js'
import { LOGNOW_ELECTRON_IPC_CHANNEL } from '../electron-bridge.js'
import { JsonFileTransport } from '../loglayer/json-file-transport.js'

/**
 * Detect the Electron main process at runtime. False in plain Node.js, Electron
 * renderers, utility processes, and `ELECTRON_RUN_AS_NODE` children.
 */
function isElectronMain(): boolean {
	// Index access sidesteps Electron's ambient types, which claim these are
	// always present — at runtime they only exist inside Electron
	const { type, versions } = process as unknown as {
		type?: string
		versions: Record<string, string | undefined>
	}
	return versions.electron !== undefined && type === 'browser'
}

/**
 * Helper function to get the platform-specific log path.
 *
 * - On macOS: `~/Library/Logs/app`
 * - On Windows: `%LOCALAPPDATA%\app\Log`
 * - On Linux/UNIX: `~/.local/state/app`
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

// Cache the package name since it never changes at runtime.
let cachedName: string | undefined
let nameResolved = false

/**
 * Helper function to get the name of the package. Based on the package.json
 * file.
 */
function getName(): string | undefined {
	if (nameResolved) {
		return cachedName
	}

	cachedName = isElectronMain() ? 'Main' : readPackageUpSync()?.packageJson.name

	nameResolved = true
	return cachedName
}

// File transports must be reused, so we cache them by path
const fileTransportsByPath = new Map<string, JsonFileTransport>()

/**
 * Get the destinations of the active file transports.
 *
 * @returns The destinations of the file transports.
 */
function getFileTransportDestinations(): string[] {
	return Array.from(
		fileTransportsByPath.values(),
		// TODO clean this up?
		// @ts-expect-error - Private access
		// eslint-disable-next-line ts/no-unsafe-member-access
		(transport) => transport.stream?.currentFile as string | undefined,
	).filter((file): file is string => file !== undefined)
}

/**
 * Create a file transport for the given name and log directory.
 *
 * @param name - The name of the log file.
 * @param logDirectoryOrOptions - The directory to log to, or a
 *   JsonFileTransportConfig object (which might override name).
 *
 * @returns The file transport.
 */
function createFileTransport(
	name = 'default',
	logDirectoryOrOptions?: JsonFileTransportConfig | string,
): LogLayerTransport {
	const cleanName = filenamify(name, { replacement: '-' })

	// Ensure filename is used for map key and that any other options don't overwrite it
	const { filename: filenameFromOptions, ...restOfOptions } =
		typeof logDirectoryOrOptions === 'object' ? logDirectoryOrOptions : {}

	// JsonFileTransport will also expand a tilde in the filename,
	// but we do it here as well to ensure the map keys are roughly
	// consistent with the stream target
	const filename = untildify(
		typeof filenameFromOptions === 'string'
			? filenameFromOptions
			: path.join(
					typeof logDirectoryOrOptions === 'string'
						? logDirectoryOrOptions
						: getPlatformLogPath(cleanName),
					`${cleanName}-%DATE%.log`,
				),
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

// Cache terminal width to avoid expensive per-call system queries.
// On macOS with redirected streams, terminalSize() opens /dev/tty synchronously.
let cachedTerminalWidth: number | undefined

/**
 * Get the terminal width.
 *
 * @returns The terminal width.
 */
function getTerminalWidth(): number {
	if (cachedTerminalWidth === undefined) {
		cachedTerminalWidth = terminalSize().columns
		process.on('SIGWINCH', () => {
			cachedTerminalWidth = terminalSize().columns
		})
	}

	return cachedTerminalWidth
}

// Loggers that opted in to receiving renderer logs via `receiveRendererLogs`
const rendererLogReceivers = new Set<ILogLayer>()
let droppedMessageWarningShown = false

function registerRendererLogReceiver(logger: ILogLayer): void {
	if (isElectronMain()) {
		rendererLogReceivers.add(logger)
	}
}

// Register the IPC listener once when running in the Electron main process.
// The dynamic import keeps `electron` out of plain Node.js module graphs
// (statically importing it there throws, since the npm `electron` package is
// just a path stub outside the Electron binary).
if (isElectronMain()) {
	void import('electron').then(({ ipcMain }) => {
		ipcMain.on(LOGNOW_ELECTRON_IPC_CHANNEL, (_, message: string) => {
			if (rendererLogReceivers.size === 0) {
				if (!droppedMessageWarningShown) {
					droppedMessageWarningShown = true
					console.warn(
						'[lognow] Received a renderer log, but no main process logger is set up to receive it. Use the default `log` instance in the main process, or create a logger with `receiveRendererLogs: true`.',
					)
				}

				return
			}

			const params = NJSON.parse<LogLayerTransportParams>(message)

			for (const logger of rendererLogReceivers) {
				logger.raw({
					// eslint-disable-next-line ts/no-unsafe-assignment
					error: params.error,
					logLevel: params.logLevel,
					messages: params.messages,
					...(params.context && { context: params.context }),
					...(params.metadata && { metadata: params.metadata }),
				})
			}
		})
	})
}

export const nodePlatformAdapter: PlatformAdapter = {
	createFileTransport,
	getFileTransportDestinations,
	getName,
	getTerminalWidth,
	inspect: nodeInspect,
	registerRendererLogReceiver,
}
