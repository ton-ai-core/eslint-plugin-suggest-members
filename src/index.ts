// CHANGE: Перенести конфигурацию плагина к функциональной конструкции
// WHY: Требуется строгая типизация Flat Config при экспорте
// QUOTE(ТЗ): "Argument of type '{ plugins: string[]; rules: { \"suggest-members/suggest-exports\": string; \"suggest-members/suggest-imports\": string; \"suggest-members/suggest-members\": string; \"suggest-members/suggest-module-paths\": string; }; }' is not assignable to parameter of type 'InfiniteArray<ConfigWithExtends>'."
// REF: user message 2345
// SOURCE: https://eslint.org/docs/latest/use/configure/configuration-files — "plugins - An object containing a name-value mapping of plugin names to plugin objects."
// FORMAT THEOREM: ∀cfg ∈ FlatConfig: plugin_registered(cfg) → ∀rule ∈ cfg.rules: rule ∈ plugin.rules
// PURITY: SHELL
// EFFECT: Effect<never, never, never>
// INVARIANT: ∀name ∈ {"suggest-exports","suggest-imports","suggest-members","suggest-module-paths"} → rules[name] ≠ undefined
// COMPLEXITY: O(1)/O(1)

import type {
	AnyRuleModule,
	FlatConfig,
} from "@typescript-eslint/utils/ts-eslint";
import { PLUGIN_METADATA } from "./core/metadata/index.js";
import {
	suggestExportsRule,
	suggestImportsRule,
	suggestMembersRule,
	suggestModulePathsRule,
} from "./rules/index.js";

type RuleName =
	| "suggest-exports"
	| "suggest-imports"
	| "suggest-members"
	| "suggest-module-paths";

type RuleMap = Readonly<Record<RuleName, AnyRuleModule>>;

/**
 * Plugin rules collection
 *
 * @purity SHELL
 */
const rules: RuleMap = Object.freeze({
	"suggest-exports": suggestExportsRule,
	"suggest-imports": suggestImportsRule,
	"suggest-members": suggestMembersRule,
	"suggest-module-paths": suggestModulePathsRule,
});

const recommendedRules = Object.freeze({
	"suggest-members/suggest-exports": "error",
	"suggest-members/suggest-imports": "error",
	"suggest-members/suggest-members": "error",
	"suggest-members/suggest-module-paths": "error",
} satisfies Readonly<Record<`suggest-members/${RuleName}`, "error">>);

/**
 * ESLint plugin configurations
 *
 * @purity SHELL
 */
type PluginCore = Readonly<{
	meta: typeof PLUGIN_METADATA;
	rules: typeof rules;
}>;

type PluginWithConfigs = PluginCore & {
	readonly configs: Readonly<Record<string, FlatConfig.Config>>;
};

const basePlugin: PluginCore = {
	meta: PLUGIN_METADATA,
	rules,
};

const recommendedConfig: Readonly<FlatConfig.Config> = Object.freeze({
	plugins: Object.freeze({
		"suggest-members": basePlugin,
	}),
	rules: recommendedRules,
});

const configs: PluginWithConfigs["configs"] = {
	recommended: recommendedConfig,
};

/**
 * ESLint plugin export
 *
 * @purity SHELL
 * @metadata Generated from package.json during build
 */
const plugin: PluginWithConfigs = {
	...basePlugin,
	configs,
};

// CHANGE: Export plugin as default and named export
// WHY: Support both import styles
export default plugin;

// CHANGE: Also export individual pieces for flexibility
// WHY: Allow users to compose their own configs
export { rules, configs };
