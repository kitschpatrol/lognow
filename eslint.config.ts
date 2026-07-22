import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig(
	{
		ignores: ['./test/assets/nightmare-object.ts'],
		ts: {
			overrides: {
				'depend/ban-dependencies': [
					'error',
					{
						allowed: ['read-package-up'],
					},
				],
				// Disabled due to bug in @typescript-eslint/eslint-plugin where it
				// fails on certain type constructs
				// Error: "typeParameters.params is not iterable"
				'ts/unified-signatures': 'off',
			},
		},
		type: 'lib',
	},
	{
		files: ['readme.md/*.ts'],
		rules: {
			// TODO remove after KSC > 8.4.0
			'import/no-unresolved': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-returns': 'off',
		},
	},
)
