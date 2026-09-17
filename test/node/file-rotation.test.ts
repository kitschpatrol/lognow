import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JsonFileTransport } from '../../src/loglayer/json-file-transport.js'
import {
	createLogger,
	DEFAULT_LOG_OPTIONS,
	log,
	setDefaultLogOptions,
} from '../../src/node/index.js'
import { nodePlatformAdapter } from '../../src/node/platform.js'

describe('JSON file rotation', () => {
	const originalCwd = process.cwd()
	let temporaryDirectory: string
	let directory: string
	const transports: JsonFileTransport[] = []

	beforeEach(async () => {
		temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'lognow-rotation-'))
		directory = path.join(temporaryDirectory, 'logs')
		await mkdir(directory)
		// The dependency also writes a relative audit.json file in the working directory.
		process.chdir(temporaryDirectory)
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(new Date(2026, 8, 15, 12))

		// Keep the platform-standard path used by logJsonToFile: true in a temporary directory.
		vi.spyOn(os, 'homedir').mockReturnValue(directory)
		vi.stubEnv('LOCALAPPDATA', directory)
		vi.stubEnv('XDG_STATE_HOME', directory)

		const createFileTransport = nodePlatformAdapter.createFileTransport!
		vi.spyOn(nodePlatformAdapter, 'createFileTransport').mockImplementation((...args) => {
			const transport = createFileTransport(...args)
			if (transport instanceof JsonFileTransport) {
				transports.push(transport)
			}

			return transport
		})
	})

	afterEach(async () => {
		setDefaultLogOptions(DEFAULT_LOG_OPTIONS)
		for (const transport of transports) {
			// eslint-disable-next-line unicorn/no-nonstandard-builtin-properties -- The transport's public cleanup API.
			transport[Symbol.dispose]()
		}

		transports.length = 0
		vi.useRealTimers()
		vi.restoreAllMocks()
		vi.unstubAllEnvs()
		process.chdir(originalCwd)
		await rm(temporaryDirectory, { force: true, recursive: true })
	})

	it.each(['default', 'directory'] as const)(
		'gzips daily rotations without callbacks using the %s destination',
		async (destination) => {
			setDefaultLogOptions({
				logJsonToFile: destination === 'default' ? true : directory,
				logToConsole: false,
				name: 'Ten Kings',
			})
			log.info('Before midnight')

			const oldFile = nodePlatformAdapter.getFileTransportDestinations!().find((file) =>
				file.startsWith(directory),
			)!
			expect(path.basename(oldFile)).toBe('Ten Kings-20260915.log')
			await vi.waitFor(async () => {
				expect(await readFile(oldFile, 'utf8')).toContain('Before midnight')
			})
			const original = await readFile(oldFile, 'utf8')

			vi.setSystemTime(new Date(2026, 8, 16, 12))
			log.info('After midnight')

			await vi.waitFor(async () => {
				const files = await readdir(path.dirname(oldFile))
				expect(files.toSorted()).toEqual(['Ten Kings-20260915.log.gz', 'Ten Kings-20260916.log'])
				expect(gunzipSync(await readFile(`${oldFile}.gz`)).toString()).toBe(original)
				expect(
					await readFile(path.join(path.dirname(oldFile), 'Ten Kings-20260916.log'), 'utf8'),
				).toContain('After midnight')
			})
		},
	)

	it.each([true, false])(
		'preserves custom callbacks with compressOnRotate: %s',
		async (compressOnRotate) => {
			const onRotate = vi.fn<(oldFile: string, newFile: string) => void>()
			const onError = vi.fn<(error: Error) => void>()
			const logger = createLogger({
				logJsonToFile: {
					callbacks: { onError, onRotate },
					compressOnRotate,
					filename: path.join(directory, 'custom-%DATE%.log'),
				},
				logToConsole: false,
			})
			logger.info('Before midnight')
			const oldFile = path.join(directory, 'custom-20260915.log')
			const newFile = path.join(directory, 'custom-20260916.log')
			await vi.waitFor(async () => {
				expect(await readFile(oldFile, 'utf8')).toContain('Before midnight')
			})
			const original = await readFile(oldFile, 'utf8')

			vi.setSystemTime(new Date(2026, 8, 16, 12))
			logger.info('After midnight')

			await vi.waitFor(async () => {
				expect(onRotate).toHaveBeenCalledTimes(1)
				expect(onRotate.mock.calls[0]?.slice(0, 2)).toEqual([
					compressOnRotate ? `${oldFile}.gz` : oldFile,
					newFile,
				])
				expect(await readFile(newFile, 'utf8')).toContain('After midnight')
			})
			expect(onError).not.toHaveBeenCalled()
			const files = await readdir(directory)
			expect(files.toSorted()).toEqual([
				`custom-20260915.log${compressOnRotate ? '.gz' : ''}`,
				'custom-20260916.log',
			])
			const rotated = await readFile(compressOnRotate ? `${oldFile}.gz` : oldFile)
			expect((compressOnRotate ? gunzipSync(rotated) : rotated).toString()).toBe(original)
		},
	)
})
