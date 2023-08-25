import { AstPath }                  from 'prettier'
import * as plugin                  from 'prettier/plugins/estree'

import { getImportsMeta }           from 'import-layout'
import { printImportStackFromDecl } from 'import-layout'

const estree = plugin as any

function print(program: AstPath, options, prnt) {
	const node = program.getNode()

	const result = estree.printers.estree.print(program, options, prnt)

	if (node.type === 'ImportDeclaration') {
		const [ast] = program.stack

		const importStack = printImportStackFromDecl(getImportsMeta(ast), node)

		return importStack.join('\n')
	}

	return result
}

export const printers = {
	'typescript-custom': {
		...estree.printers.estree,
		print,
	},
}
