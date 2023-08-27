import type { TSESLint }    from '@typescript-eslint/utils'
import type { TSESTree }    from '@typescript-eslint/utils'
import      { ESLintUtils } from '@typescript-eslint/utils'
import      deepmerge       from 'deepmerge'

export type FlatMatchers = Array<[string, (source: string) => boolean]>

export interface Options {
	matchers: Record<string, (source: string) => boolean>
	order: string[]
	typeImportsFirst: 'ignore' | true | false
}

const nodeMatcher = /^(child_process|crypto|events|fs|http|https|os|path|module|util|url|stream|events|buffer)(\/.*)?$/
const privilegedMatcher = /^(react|vite|next|vue)(\/.*)?$/

const collator = new Intl.Collator('en', {
	sensitivity: 'base',
	numeric: true,
})

function compare(a, b) {
	return collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0)
}

const defaultOptions: Options = {
	matchers: {
		relative: (s) => s.startsWith('.'),
		node: (s) => s.startsWith('node:') || nodeMatcher.test(s),
		privileged: (s) => privilegedMatcher.test(s),
	},
	order: ['privileged', 'node', 'unqualified', 'relative'],
	typeImportsFirst: true,
}

function groupBy(chunk: TSESTree.ImportDeclaration[], predicate: (node: TSESTree.ImportDeclaration) => string) {
	return chunk.reduce(
		(a, c) => {
			const group = predicate(c)
			a[group] ??= []
			a[group].push(c)
			return a
		},
		{} as Record<string, TSESTree.ImportDeclaration[]>,
	)
}

function group(source: string, groups: FlatMatchers): string {
	for (const [key, matcher] of groups) {
		if (matcher(source)) {
			return key
		}
	}

	return 'unqualified'
}

function sortSpecifiers(
	{ specifiers: [a] }: TSESTree.ImportDeclaration,
	{ specifiers: [b] }: TSESTree.ImportDeclaration,
) {
	if (!a || !b) {
		return 0
	}

	return compare(a.local.name, b.local.name)
}

function sortChunk([...chunk]: TSESTree.ImportDeclaration[], typeImportsFirst: 'ignore' | true | false) {
	chunk.sort(({ source: { value: a } }, { source: { value: b } }) => compare(a, b))
	const sourceGroups: TSESTree.ImportDeclaration[][] = []
	let current: string | undefined
	let idx = 0
	chunk.forEach((decl) => {
		sourceGroups[idx] ??= []
		const source = decl.source.value
		current ??= decl.source.value

		if (source === current) {
			sourceGroups[idx].push(decl)
		} else {
			sourceGroups[(idx += 1)] = [decl]
		}
	})

	return sourceGroups.flatMap((group) => {
		if (typeImportsFirst === 'ignore') {
			return group.sort(sortSpecifiers)
		}

		const value: TSESTree.ImportDeclaration[] = []
		const type: TSESTree.ImportDeclaration[] = []

		group.forEach((decl) => (decl.importKind === 'type' ? type.push(decl) : value.push(decl)))

		value.sort(sortSpecifiers)
		type.sort(sortSpecifiers)

		return typeImportsFirst ? [...type, ...value] : [...value, ...type]
	})
}

function hasNewline(sourceCode: TSESLint.SourceCode, node) {
	const nextToken = sourceCode.getTokenAfter(node, {
		includeComments: true,
		filter: (token) => token.type === 'Line' || token.type === 'Block' || token.value === 'import',
	})

	if (!nextToken) {
		return { has: false, cut: null }
	}

	const importCause = nextToken.value === 'import' && nextToken.loc.start.line - node.loc.start.line > 1
	const commentCause = nextToken.type === 'Line' || nextToken.type === 'Block'

	const has = importCause || commentCause

	return { has, cut: nextToken.value === 'import' ? nextToken.range[0] : null, comment: commentCause }
}

export const importRule = ESLintUtils.RuleCreator.withoutDocs<[Options], 'layout'>({
	defaultOptions: [defaultOptions],
	meta: {
		fixable: 'code',
		type: 'layout',
		docs: {
			description: 'Imports should have valid order and layout',
		},
		schema: [
			{
				type: 'object',
				properties: {
					matchers: {
						type: 'any',
					},
					order: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
					typeImportsFirst: {
						type: 'any',
					},
					comparator: {
						type: 'any',
					},
				},
			},
		],
		messages: {
			layout: 'Relayout imports',
		},
	},
	create(context) {
		const { sourceCode } = context

		const { order, typeImportsFirst, matchers } = deepmerge(defaultOptions, context.options[0] ?? {})

		const flatMatchers = Object.entries(matchers)

		return {
			'Program:exit': function (program) {
				const imports = program.body.filter(({ type }) => type === 'ImportDeclaration') as TSESTree.ImportDeclaration[]

				if (imports.length === 0) {
					return
				}

				const groups = groupBy(imports, ({ source }) => group(source.value, flatMatchers))

				const flatGroups = Object.entries(groups)
				flatGroups.sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))

				const sortedChunks = flatGroups.map(
					([group, chunk]) => [group, sortChunk(chunk, typeImportsFirst)] as [string, TSESTree.ImportDeclaration[]],
				)

				const sorted = sortedChunks.flatMap(([, group]) =>
					group.map((node, idx) => ({ insertNewLine: idx === group.length - 1, node })))

				const printed = sorted.map(({ node, ...rest }) => ({
					at: `${node.range[0]}-${node.range[1]}`,
					code: sourceCode.getText(node),
					...rest,
				}))

				imports.forEach((node, idx) => {
					const last = idx === imports.length - 1

					const { at, code, insertNewLine } = printed[idx]

					const { has, cut, comment } = hasNewline(sourceCode, node)

					if (at === `${node.range[0]}-${node.range[1]}` && (insertNewLine && !last ? has : comment ? true : !has)) {
						return
					}

					context.report({
						node,
						messageId: 'layout',
						loc: node.loc,
						fix(fixer) {
							return fixer.replaceTextRange([node.range[0], cut ?? node.range[1]], `${code}${!cut ? insertNewLine ? '\n\n' : '\n' : '\n'}`)
						},
					})
				})
			},
		}
	},
})
