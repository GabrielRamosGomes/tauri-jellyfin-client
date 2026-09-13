import { defineConfig } from 'oxfmt';

export default defineConfig({
	printWidth: 100,
	tabWidth: 2,
	useTabs: true,
	semi: true,
	singleQuote: true,
	jsxSingleQuote: false,
	trailingComma: 'all',
	bracketSpacing: true,
	bracketSameLine: true,
	arrowParens: 'always',
	endOfLine: 'lf',
	quoteProps: 'as-needed',
	singleAttributePerLine: true,
	vueIndentScriptAndStyle: true,
	htmlWhitespaceSensitivity: 'css',
	sortImports: {
		groups: [
			'type',
			'builtin',
			'external',
			['internal', 'subpath'],
			['parent', 'sibling', 'index'],
			'style',
			'unknown',
		],
		newlinesBetween: true,
		internalPattern: ['@/*', '~/*'],
	},
	sortPackageJson: true,
	ignorePatterns: ['dist', 'dist-ssr', 'src-tauri/target', 'src-tauri/gen', 'node_modules'],
});
