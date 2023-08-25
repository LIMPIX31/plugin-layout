import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'

export interface ImportsMeta {
	maxLength: number
	hasTypeImport: boolean
}

const SPACED_FROM = 'from'.length
const SPACED_TYPE = 'type'.length
const SPACED_SPECIFIER = ' '.length

function extractSpecifiers(decl: TSESTree.ImportDeclaration) {
	return decl.specifiers.map((specifier) => {
		if (specifier.type === 'ImportSpecifier') {
			const imported = specifier.imported.name
			const alias = specifier.local.name

			const identical = imported === alias

			if (identical) {
				return `{ ${imported} }`
			}

			return `{ ${imported} as ${alias} }`
		}

		if (specifier.type === 'ImportNamespaceSpecifier') {
			return `* as ${specifier.local.name}`
		}

		return specifier.local.name
	})
}

function getImportsMeta(sourceCode: TSESLint.SourceCode): ImportsMeta {
	const imports = sourceCode.ast.body.filter(({ type }) => type === 'ImportDeclaration') as TSESTree.ImportDeclaration[]
	const lengths = imports.flatMap((decl) => extractSpecifiers(decl).map((spec) => spec.length))

	const maxLength = Math.max(...lengths)
	const hasTypeImport = imports.some(({ importKind }) => importKind === 'type')

	return { maxLength, hasTypeImport }
}

export const importRule: TSESLint.RuleModule<'layout'> = {
	defaultOptions: [],
	meta: {
		type: 'layout',
		fixable: 'code',
		messages: {
			layout: 'Invalid import layout',
		},
		schema: [],
	},
	create(context) {
		const { sourceCode } = context

		return {
			ImportDeclaration(decl) {
				const { maxLength, hasTypeImport } = getImportsMeta(sourceCode)

				const includeImport = decl.specifiers.length === 0
				const isTypeImport = decl.importKind === 'type'

				const specifiers = extractSpecifiers(decl)

				const importStack = includeImport
					? [
							`import ${' '.repeat(maxLength + SPACED_FROM + SPACED_SPECIFIER + (hasTypeImport ? SPACED_TYPE : 0))} ${
								decl.source.raw
							}`,
					  ]
					: specifiers.map(
							(spec) =>
								`import ${hasTypeImport ? (isTypeImport ? 'type ' : '     ') : ''}${spec}${' '.repeat(
									maxLength - spec.length,
								)} from ${decl.source.raw}`,
					  )

				if (decl.specifiers.length <= 1 && sourceCode.getText(decl) === importStack[0]) {
					return
				}

				context.report({
					node: decl,
					messageId: 'layout',
					loc: {
						start: sourceCode.getLocFromIndex(decl.range[0]),
						end: sourceCode.getLocFromIndex(decl.range[1]),
					},
					fix(fixer) {
						return fixer.replaceTextRange(decl.range!, importStack.join('\n'))
					},
				})
			},
		}
	},
}
