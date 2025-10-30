// CHANGE: ESLint plugin entry point
// WHY: Export plugin configuration for ESLint
// PURITY: SHELL (plugin registration)
// REF: CLAUDE.md - no any/unknown types

import { PLUGIN_METADATA } from "./core/metadata/index.js";
import {
	suggestExportsRule,
	suggestImportsRule,
	suggestMembersRule,
	suggestModulePathsRule,
} from "./rules/index.js";

/**
 * Plugin rules collection
 *
 * @purity SHELL
 */
const rules = {
	"suggest-exports": suggestExportsRule,
	"suggest-imports": suggestImportsRule,
	"suggest-members": suggestMembersRule,
	"suggest-module-paths": suggestModulePathsRule,
};

/**
 * ESLint plugin export
 *
 * @purity SHELL
 * @metadata Generated from package.json during build
 */
const plugin = {
	meta: PLUGIN_METADATA,
	rules,
};

// CHANGE: Export plugin as default and named export
// WHY: Support both import styles
export default plugin;

// CHANGE: Also export individual pieces for flexibility
// WHY: Allow users to compose their own configs
export { rules };
