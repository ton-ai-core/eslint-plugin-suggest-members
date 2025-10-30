import tsParser from '@typescript-eslint/parser';
import suggestMembersPlugin from './dist/index.js';

export default [
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				projectService: true,
			},
		},
		plugins: {
			'@ton-ai-core/suggest-members': suggestMembersPlugin,
		},
		rules: {
			'@ton-ai-core/suggest-members/suggest-exports': 'error',
		},
	},
];