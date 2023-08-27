import type { TSESTree } from '@typescript-eslint/utils'

export interface ImportsMeta {
	maxLength: number
	hasTypeImport: boolean
	imports: TSESTree.ImportDeclaration[]
	hydratedImports: Record<
		number,
		{
			decl: TSESTree.ImportDeclaration
			isSideEffect: boolean
			specifiers: { value: string, isType: boolean }[]
		}
	>
}

const SPACED_FROM = 'from'.length
const SPACED_TYPE = 'type'.length
const SPACED_SPECIFIER = ' '.length

export function extractSpecifiers(decl: TSESTree.ImportDeclaration) {
	const rootIsType = decl.importKind === 'type'

	return decl.specifiers.map((specifier) => {
		const isType = rootIsType || specifier['importKind'] === 'type'

		if (specifier.type === 'ImportSpecifier') {
			const imported = specifier.imported.name
			const alias = specifier.local.name

			const identical = imported === alias

			if (identical) {
				return { isType, value: `{ ${imported} }` }
			}

			return { isType, value: `{ ${imported} as ${alias} }` }
		}

		if (specifier.type === 'ImportNamespaceSpecifier') {
			return { isType, value: `* as ${specifier.local.name}` }
		}

		return { isType, value: specifier.local.name }
	})
}

export function isTypeImport({ importKind, specifiers }: TSESTree.ImportDeclaration) {
	const someOfSpecifiers = specifiers.some((specifier) => specifier['importKind'] === 'type')
	const rootKind = importKind === 'type'

	return rootKind || someOfSpecifiers
}

export function getImportsMeta(ast: any): ImportsMeta {
	const imports = ast.body.filter(({ type }) => type === 'ImportDeclaration') as TSESTree.ImportDeclaration[]

	if (imports.length === 0) {
		return { imports: [], hydratedImports: [], maxLength: 0, hasTypeImport: false }
	}

	const specifiers = imports.map(extractSpecifiers)
	const lengths = specifiers.flatMap((spec) => spec.map(({ value }) => value.length))

	const maxLength = Math.max(...lengths)
	const hasTypeImport = imports.some(isTypeImport)

	const hydratedImports = Object.fromEntries(
		imports.map((decl, idx) => [
			decl.range[0],
			{
				decl,
				isSideEffect: decl.specifiers.length === 0,
				specifiers: specifiers[idx]!,
			},
		]),
	)

	return { imports, hydratedImports, maxLength, hasTypeImport }
}

export function printImportStackFromDecl(meta: ImportsMeta, decl: any) {
	if (meta.imports.length === 0) {
		return []
	}

	const { hydratedImports, maxLength, hasTypeImport } = meta

	const key = decl.range[0]

	const { isSideEffect, specifiers } = hydratedImports[key]

	const importStack = isSideEffect
		? [
				`import ${' '.repeat(maxLength + SPACED_FROM + SPACED_SPECIFIER + (hasTypeImport ? SPACED_TYPE : 0))} ${
					decl.source.raw
				}`,
		  ]
		: specifiers.map(
				({ value, isType }) =>
					`import ${hasTypeImport ? (isType ? 'type ' : '     ') : ''}${value}${' '.repeat(
						maxLength - value.length,
					)} from ${decl.source.raw}`,
		  )

	return importStack
}

export function printFullImportStack(ast: any) {
	const meta = getImportsMeta(ast)

	return meta.imports.flatMap((imprt) => printImportStackFromDecl(meta, imprt))
}
