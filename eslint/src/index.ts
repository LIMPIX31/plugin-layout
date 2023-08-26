import type { TSESLint } from '@typescript-eslint/utils'
import { importRule } from './rule.js'

export const rules = {
	import: importRule,
} satisfies Record<string, TSESLint.RuleModule<string, Array<unknown>>>
