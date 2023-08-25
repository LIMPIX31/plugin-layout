const plugin = await import('./prettier/dist/index.js')

export default {
  tabWidth: 2,
  semi: false,
  arrowParens: 'always',
  singleQuote: true,
  trailingComma: 'all',
  endOfLine: 'lf',
  printWidth: 120,
  jsxSingleQuote: true,
  plugins: [plugin]
}
