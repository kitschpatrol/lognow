import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { readPackageUpSync } from 'read-package-up'
import { isNode } from 'std-env'
/**
 * Helper function to get the platform-specific log path. Based on the platform,
 * the log path is different.
 *
 * - macOS: `~/Library/Logs/app`
 * - Windows: `%LOCALAPPDATA%\app\Log`
 * - Linux/Unix: `~/.local/state/app`
 */
export function getPlatformLogPath(name?: string): string {
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

	// Linux/Unix
	return path.join(env.XDG_STATE_HOME ?? path.join(homedir, '.local', 'state'), resolvedName)
}

/**
 * Helper function to get the name of the package. Based on the package.json file.
 */
export function getName(): string {
	if (isNode) {
		const packageJson = readPackageUpSync()
		return packageJson?.packageJson.name ?? 'default'
	}
	return 'default'
}
