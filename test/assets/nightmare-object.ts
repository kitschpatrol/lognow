// Test object with all JavaScript object types
const testObject = {
	// Primitives
	stringValue: 'hello',
	numberValue: 42,
	booleanValue: true,
	nullValue: null,
	undefinedValue: undefined,
	symbolValue: Symbol('test'),
	bigintValue: BigInt('9007199254740991'),

	// Objects
	plainObject: {
		nested: 'value',
		count: 123,
	},

	// Arrays
	array: [1, 2, 3, 'mixed', true],
	nestedArray: [
		[1, 2],
		[3, 4],
	],

	// Functions
	method(): void {
		console.log('Method called')
	},
	arrowFunction: (): string => 'Arrow function',

	// Built-in Objects
	date: new Date(),
	regex: /pattern/gi,
	map: new Map([
		['key1', 'value1'],
		['key2', 'value2'],
	]),
	set: new Set([1, 2, 3, 2, 1]), // duplicates ignored
	weakMap: new WeakMap(),
	weakSet: new WeakSet(),

	// Error Objects
	error: new Error('Test error'),
	loadedError: new Error('Test error', {
		cause: BigInt('9007199254740991'),
	}),
	typeError: new TypeError('Type mismatch'),

	// Typed Arrays
	uint8Array: new Uint8Array([1, 2, 3]),
	int32Array: new Int32Array([100, 200, 300]),

	// Class Instance
	classInstance: class TestClass {
		value = 42
	},

	// Generator
	*generator() {
		yield 1
		yield 2
	},

	// Async Function
	asyncMethod: async () => {
		return 'async result'
	},

	// JSON
	jsonString: JSON.stringify({ name: 'test' }),

	// Promise (be careful with this - it's async)
	promise: Promise.resolve('resolved value'),
}

// Add circular reference (after object creation to avoid infinite loop during initialization)
// @ts-expect-error - It's a nightmare object...
testObject.circularSelfReference = testObject

// Create a circular linked list structure
const node1: any = { value: 1, next: null }
const node2: any = { value: 2, next: null }
const node3: any = { value: 3, next: null }

node1.next = node2
node2.next = node3
node3.next = node1 // Creates cycle: 1 -> 2 -> 3 -> 1

// @ts-expect-error - It's a nightmare object...
testObject.circularLinkedList = node1

// Create a nested circular structure
const parentObj: any = { name: 'parent', children: [] }
const childObj: any = { name: 'child', parent: null }

parentObj.children.push(childObj)
childObj.parent = parentObj // Creates cycle: parent -> child -> parent

// @ts-expect-error - It's a nightmare object...
testObject.circularNested = parentObj

// Type inference
// @ts-expect-error - It's a nightmare object...
type TestObjectType = typeof testObject

// Export for testing
export default testObject
