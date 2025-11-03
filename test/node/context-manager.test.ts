/**
 * HierarchicalContextManager tests
 */

import { describe, expect, it } from 'vitest'
import { HierarchicalContextManager } from '../../src/loglayer/hierarchical-context-manager.js'
import { createLogger, getChildLogger } from '../../src/node/index.js'

describe('HierarchicalContextManager', () => {
	it('should create a new context manager', () => {
		const manager = new HierarchicalContextManager()
		expect(manager).toBeDefined()
	})

	it('should store and retrieve context', () => {
		const manager = new HierarchicalContextManager()
		manager.setContext({ key: 'value' })

		const context = manager.getContext()
		expect(context).toHaveProperty('key', 'value')
	})

	it('should append context', () => {
		const manager = new HierarchicalContextManager()
		manager.setContext({ first: 'value1' })
		manager.appendContext({ second: 'value2' })

		const context = manager.getContext()
		expect(context).toHaveProperty('first', 'value1')
		expect(context).toHaveProperty('second', 'value2')
	})

	it('should clone context manager', () => {
		const manager = new HierarchicalContextManager()
		manager.setContext({ original: 'value' })

		const clone = manager.clone()
		expect(clone).toBeDefined()
		expect(clone.getContext()).toHaveProperty('original', 'value')

		// Verify they are independent
		clone.appendContext({ cloned: 'added' })
		expect(clone.getContext()).toHaveProperty('cloned', 'added')
		expect(manager.getContext()).not.toHaveProperty('cloned')
	})

	it('should handle parent names on child logger creation', () => {
		const parent = createLogger({ logToConsole: false, name: 'parent' })
		const child = getChildLogger(parent, 'child')

		const childContext = child.getContext()
		expect(childContext).toHaveProperty('name', 'child')
		expect(childContext).toHaveProperty('parentNames')
		expect(Array.isArray(childContext.parentNames)).toBe(true)
		expect(childContext.parentNames).toContain('parent')
	})

	it('should maintain hierarchy through multiple generations', () => {
		const grandparent = createLogger({ logToConsole: false, name: 'grandparent' })
		const parent = getChildLogger(grandparent, 'parent')
		const child = getChildLogger(parent, 'child')

		const childContext = child.getContext()
		expect(childContext).toHaveProperty('name', 'child')
		expect(childContext.parentNames).toContain('grandparent')
		expect(childContext.parentNames).toContain('parent')
		expect(Array.isArray(childContext.parentNames)).toBe(true)
		if (Array.isArray(childContext.parentNames)) {
			expect(childContext.parentNames.length).toBe(2)
		}
	})

	it('should handle parent without explicit name', () => {
		const parent = createLogger({ logToConsole: false })
		const child = getChildLogger(parent, 'child')

		const childContext = child.getContext()
		expect(childContext).toHaveProperty('name', 'child')
		expect(childContext).toHaveProperty('parentNames')
		// Parent may have auto-detected name like 'lognow' from package.json
		expect(Array.isArray(childContext.parentNames)).toBe(true)
	})

	it('should handle child without name', () => {
		const parent = createLogger({ logToConsole: false, name: 'parent' })
		const child = getChildLogger(parent)

		const childContext = child.getContext()
		expect(childContext).toHaveProperty('parentNames')
		expect(childContext.parentNames).toContain('parent')
	})

	it('should preserve parent context in child', () => {
		const parent = createLogger({ logToConsole: false, name: 'parent' })
		const parentWithContext = parent.withContext({ parentData: 'important' })
		const child = getChildLogger(parentWithContext, 'child')

		const childContext = child.getContext()
		expect(childContext).toHaveProperty('parentData', 'important')
		expect(childContext).toHaveProperty('name', 'child')
	})

	it('should allow child to add its own context', () => {
		const parent = createLogger({ logToConsole: false, name: 'parent' })
		const child = getChildLogger(parent, 'child')
		const childWithContext = child.withContext({ childData: 'specific' })

		const context = childWithContext.getContext()
		expect(context).toHaveProperty('childData', 'specific')
		expect(context).toHaveProperty('name', 'child')
		expect(context.parentNames).toContain('parent')
	})

	it('should create independent child contexts', () => {
		const parent = createLogger({ logToConsole: false, name: 'parent' })
		const child1 = getChildLogger(parent, 'child1')
		const child2 = getChildLogger(parent, 'child2')

		const child1WithContext = child1.withContext({ id: 1 })
		const child2WithContext = child2.withContext({ id: 2 })

		expect(child1WithContext.getContext()).toHaveProperty('id', 1)
		expect(child2WithContext.getContext()).toHaveProperty('id', 2)
		expect(child1WithContext.getContext().id).not.toBe(child2WithContext.getContext().id)
	})
})

describe('Context hierarchy in logging', () => {
	it('should include parent names in log output', () => {
		const parent = createLogger({ logToConsole: false, name: 'api' })
		const child = getChildLogger(parent, 'users')

		// The context should have the hierarchy
		const context = child.getContext()
		expect(context.name).toBe('users')
		expect(context.parentNames).toEqual(['api'])
	})

	it('should build deep hierarchies', () => {
		const root = createLogger({ logToConsole: false, name: 'app' })
		const level1 = getChildLogger(root, 'module')
		const level2 = getChildLogger(level1, 'service')
		const level3 = getChildLogger(level2, 'handler')

		const context = level3.getContext()
		expect(context.name).toBe('handler')
		expect(context.parentNames).toEqual(['app', 'module', 'service'])
	})

	it('should handle mixed named and unnamed loggers', () => {
		const root = createLogger({ logToConsole: false })
		const named = getChildLogger(root, 'named')
		const unnamed = getChildLogger(named)
		const named2 = getChildLogger(unnamed, 'named2')

		const context = named2.getContext()
		expect(context.name).toBe('named2')
		expect(context.parentNames).toContain('named')
		// Check that hierarchy is maintained
		expect(Array.isArray(context.parentNames)).toBe(true)
		if (Array.isArray(context.parentNames)) {
			expect(context.parentNames.length).toBeGreaterThan(0)
		}
	})
})

describe('Context manager edge cases', () => {
	it('should handle empty context', () => {
		const manager = new HierarchicalContextManager()
		const context = manager.getContext()
		expect(context).toBeDefined()
	})

	it('should handle overwriting context', () => {
		const manager = new HierarchicalContextManager()
		manager.setContext({ first: 'value' })
		manager.setContext({ second: 'value' })

		const context = manager.getContext()
		expect(context).toHaveProperty('second', 'value')
		// SetContext replaces, not merges
		expect(context).not.toHaveProperty('first')
	})

	it('should handle complex context values', () => {
		const manager = new HierarchicalContextManager()
		const complexContext = {
			array: [1, 2, 3],
			date: new Date(),
			nested: {
				deep: {
					value: 'test',
				},
			},
		}

		manager.setContext(complexContext)
		const retrieved = manager.getContext()
		expect(retrieved).toHaveProperty('nested')
		expect(retrieved.nested).toHaveProperty('deep')
	})

	it('should preserve context through child creation', () => {
		const parent = createLogger({
			logToConsole: false,
			name: 'parent',
		})

		const parentWithContext = parent.withContext({
			sessionId: 'abc123',
			userId: 'user456',
		})

		const child = getChildLogger(parentWithContext, 'child')
		const childContext = child.getContext()

		expect(childContext).toHaveProperty('sessionId', 'abc123')
		expect(childContext).toHaveProperty('userId', 'user456')
		expect(childContext).toHaveProperty('name', 'child')
		expect(childContext.parentNames).toContain('parent')
	})
})

describe('Context manager with metadata', () => {
	it('should keep context and metadata separate', () => {
		const logger = createLogger({ logToConsole: false, name: 'test' })
		const withContext = logger.withContext({ contextKey: 'contextValue' })

		// Context should persist
		expect(withContext.getContext()).toHaveProperty('contextKey', 'contextValue')

		// Metadata is only for one log call
		withContext.withMetadata({ metaKey: 'metaValue' }).info('test')

		// Context should still be there, metadata should not
		expect(withContext.getContext()).toHaveProperty('contextKey', 'contextValue')
		expect(withContext.getContext()).not.toHaveProperty('metaKey')
	})

	it('should allow both context and metadata in logs', () => {
		const logger = createLogger({ logToConsole: false, name: 'test' })
		const withContext = logger.withContext({ requestId: '123' })

		expect(() => {
			withContext.withMetadata({ action: 'create' }).info('Created resource')
		}).not.toThrow()
	})
})
