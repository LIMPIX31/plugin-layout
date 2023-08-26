import configs from '@lmpx-config/eslint'
import * as plugin from 'eslint-plugin-layout'

const [config] = configs

config.plugins['layout'] = plugin
config.rules['layout/import'] = ['error']
config.rules['simple-import-sort/imports'] = ['off']
config.rules['prettier/prettier'] = [
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
]

export default [config]
