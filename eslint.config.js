import configs from '@ltos/config-eslint'

export default [
	...configs,
	{
		rules: {
			'prettier/prettier': [
				'error',
				{
					tabWidth: 2,
					semi: false,
					arrowParens: 'always',
					singleQuote: true,
					trailingComma: 'all',
					endOfLine: 'lf',
					printWidth: 120,
					jsxSingleQuote: true,
					plugins: ['/home/limpix/workspaces/plugin-layout/prettier/dist/index.js'],
				},
			],
		},
	},
]
