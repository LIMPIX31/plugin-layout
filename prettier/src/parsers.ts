import * as plugin from 'prettier/plugins/typescript'

export const parsers = {
	typescript: {
		...plugin.parsers.typescript,
		astFormat: 'typescript-custom',
	},
}
