import { RuleTester } from 'eslint'
import { importRule } from './rule.js'

const ruleTester = new RuleTester({
	parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
	parser: '/home/limpix/workspaces/plugin-layout/.yarn/__virtual__/@typescript-eslint-parser-virtual-7c8bfadc2e/3/.yarn/berry/cache/@typescript-eslint-parser-npm-6.4.1-ef0b2084c0-10c0.zip/node_modules/@typescript-eslint/parser/dist/index.js',
})

ruleTester.run('layout', importRule as any, {
	valid: [{
		code: `
// Commend
import React from 'react'
import { useState } from 'react'
import { useCallback } from 'react'
import { uses } from 'react-dev'
import { writeFile } from 'node:fs'
import { join } from 'node:path'
import { typeProps } from './button.interface'
		`
	}],
	invalid: [],
})
