import type { TSESTree } from '@typescript-eslint/utils'

export interface ImportsMeta {
	maxLength: number
	hasTypeImport: boolean
	imports: TSESTree.ImportDeclaration[]
}

const SPACED_FROM = 'from'.length
const SPACED_TYPE = 'type'.length
const SPACED_SPECIFIER = ' '.length

export function extractSpecifiers(decl: TSESTree.ImportDeclaration) {
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

export function getImportsMeta(ast: any): ImportsMeta {
	const imports = ast.body.filter(({ type }) => type === 'ImportDeclaration') as TSESTree.ImportDeclaration[]
	const lengths = imports.flatMap((decl) => extractSpecifiers(decl).map((spec) => spec.length))

	const maxLength = Math.max(...lengths)
	const hasTypeImport = imports.some(({ importKind }) => importKind === 'type')

	return { imports, maxLength, hasTypeImport }
}

export function printImportStackFromDecl(meta: ImportsMeta, decl: any) {
	const { maxLength, hasTypeImport } = meta

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

	return importStack
}

export function printFullImportStack(ast: any) {
	const meta = getImportsMeta(ast)

	return meta.imports.flatMap((imprt) => printImportStackFromDecl(meta, imprt))
}
