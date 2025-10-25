import type { LoggerlessTransport } from '@loglayer/transport'
import { BlankTransport } from 'loglayer'
import { NJSON } from 'next-json'
import { inspect as nodeInspectExtracted } from 'node-inspect-extracted'
import type { PlatformAdapter } from '../../log'
import { getTerminalWidth } from '../../browser/platform'

function getName(): string | undefined {
	return 'Renderer'
}

function createElectronTransport(): LoggerlessTransport {
	return new BlankTransport({
		shipToLogger(params) {
			const stringifiedParams = NJSON.stringify(params)
			// @ts-expect-error - logToMain is defined in the preload script
			// eslint-disable-next-line unicorn/prefer-global-this, ts/no-unsafe-call
			window.logToMain(stringifiedParams)

			// eslint-disable-next-line ts/no-unsafe-return
			return params.messages
		},
	})
}

export const electronRendererPlatformAdapter: PlatformAdapter = {
	createElectronTransport,
	getName,
	getTerminalWidth,
	inspect: nodeInspectExtracted,
}
