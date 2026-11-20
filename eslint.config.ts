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
			},
		},
		type: 'lib',
	},
	{
		files: ['readme.md/*.ts'],
		rules: {
			// Readme examples import CDN URLs and hypothetical packages
			'import/no-unresolved': 'off',
		},
	},
)
