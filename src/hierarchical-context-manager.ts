import type { IContextManager, OnChildLoggerCreatedParams } from '@loglayer/context-manager'
import { DefaultContextManager } from '@loglayer/context-manager'

/**
 * Maintains a hierarchy of parent context "name" values when child loggers are created.
 * Similar to how log names are treated in tslog. This is an alternative to LogLayer's `prefix` approach,
 * which pollutes the log message string.
 * A `parentName` value is added. If the parent context does not have a `name`
 * context value, it's represented as a null value in the array.
 */
export class HierarchicalContextManager extends DefaultContextManager {
	clone(): IContextManager {
		const clone = new HierarchicalContextManager()
		clone.setContext({
			...this.getContext(),
		})
		// Clone.hasContext = this.hasContext
		return clone
	}

	onChildLoggerCreated(params: OnChildLoggerCreatedParams) {
		super.onChildLoggerCreated(params)

		// eslint-disable-next-line ts/no-unsafe-assignment, unicorn/no-null
		const parentName = params.parentLogger.getContext().name ?? null
		params.childContextManager.appendContext({
			// eslint-disable-next-line ts/no-unsafe-assignment
			parentNames: [...(params.parentLogger.getContext().parentNames ?? []), parentName],
		})
	}
}
