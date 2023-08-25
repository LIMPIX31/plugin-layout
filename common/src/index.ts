import type { TSESTree } from '@typescript-eslint/utils'

export interface ImportsMeta {
	maxLength: number
	hasTypeImport: boolean
	imports: TSESTree.ImportDeclaration[]
	hydratedImports: Record<
		number,
		{
			decl: TSESTree.ImportDeclaration
			isType: boolean
			isSideEffect: boolean
			specifiers: string[]
		}
	>
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

export function isTypeImport({ importKind, specifiers }: TSESTree.ImportDeclaration) {
	const someOfSpecifiers = specifiers.some((specifier) => specifier['importKind'] === 'type')
	const rootKind = importKind === 'type'

	return rootKind || someOfSpecifiers
}

export function getImportsMeta(ast: any): ImportsMeta {
	const imports = ast.body.filter(({ type }) => type === 'ImportDeclaration') as TSESTree.ImportDeclaration[]
	const specifiers = imports.map(extractSpecifiers)
	const lengths = specifiers.flatMap((spec) => spec.map((v) => v.length))

	const maxLength = Math.max(...lengths)
	const hasTypeImport = imports.some(isTypeImport)

	const hydratedImports = Object.fromEntries(
		imports.map((decl, idx) => [
			decl.range[0],
			{
				decl,
				isType: isTypeImport(decl),
				isSideEffect: decl.specifiers.length === 0,
				specifiers: specifiers[idx]!,
			},
		]),
	)

	return { imports, hydratedImports, maxLength, hasTypeImport }
}

export function printImportStackFromDecl(meta: ImportsMeta, decl: any) {
	const { hydratedImports, maxLength, hasTypeImport } = meta

	const key = decl.range[0]

	const { isType, isSideEffect, specifiers } = hydratedImports[key]

	const importStack = isSideEffect
		? [
				`import ${' '.repeat(maxLength + SPACED_FROM + SPACED_SPECIFIER + (hasTypeImport ? SPACED_TYPE : 0))} ${
					decl.source.raw
				}`,
		  ]
		: specifiers.map(
				(spec) =>
					`import ${hasTypeImport ? (isType ? 'type ' : '     ') : ''}${spec}${' '.repeat(
						maxLength - spec.length,
					)} from ${decl.source.raw}`,
		  )

	return importStack
}

export function printFullImportStack(ast: any) {
	const meta = getImportsMeta(ast)

	return meta.imports.flatMap((imprt) => printImportStackFromDecl(meta, imprt))
}
