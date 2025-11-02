import * as tsParser from "@typescript-eslint/parser";
import { ESLint, type Linter } from "eslint";
import plugin from "../../src/index.js";

type RuleConfig = Linter.RulesRecord;

const BASE_RULES: RuleConfig = {
	"suggest-members/suggest-members": "error",
	"suggest-members/suggest-imports": "error",
	"suggest-members/suggest-module-paths": "error",
	"suggest-members/suggest-exports": "error",
};

interface CreateESLintOptions {
	readonly rules?: RuleConfig;
}

export const createPluginTestESLint = (
	options: CreateESLintOptions = {},
): ESLint =>
	new ESLint({
		baseConfig: {
			languageOptions: {
				parser: tsParser as never,
				parserOptions: {
					ecmaVersion: 2020,
					sourceType: "module",
				},
			},
			plugins: {
				"suggest-members": plugin as never,
			},
			rules: {
				...BASE_RULES,
				...(options.rules ?? {}),
			} satisfies RuleConfig,
		},
		overrideConfigFile: true,
	});

interface LintTextOptions {
	readonly filePath: string;
	readonly eslintInstance?: ESLint;
}

export const lintTextWithPlugin = async (
	code: string,
	{ filePath, eslintInstance }: LintTextOptions,
): Promise<ESLint.LintResult[]> => {
	const eslint = eslintInstance ?? createPluginTestESLint();
	return eslint.lintText(code, { filePath });
};

export const suggestMembersPlugin = plugin;
