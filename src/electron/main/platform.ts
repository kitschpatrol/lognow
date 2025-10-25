import type { LogLayerTransportParams } from '@loglayer/transport'
import { ipcMain } from 'electron'
import { NJSON } from 'next-json'
import { inspect as nodeInspect } from 'node:util'
import type { ILogLayer, PlatformAdapter } from '../../log'
import { createFileTransport, getTerminalWidth } from '../../node/platform'

function getName(): string | undefined {
	return 'Main'
}

function createElectronListener(logger: ILogLayer): void {
	ipcMain.on('kitschpatrol-log', (_, message: string) => {
		const params = NJSON.parse<LogLayerTransportParams>(message)

		logger.raw({
			context: params.context,
			// eslint-disable-next-line ts/no-unsafe-assignment
			error: params.error,
			logLevel: params.logLevel,
			messages: params.messages,
			metadata: params.metadata,
		})
	})
}
export const electronMainPlatformAdapter: PlatformAdapter = {
	createElectronListener,
	createFileTransport,
	getName,
	getTerminalWidth,
	inspect: nodeInspect,
}
