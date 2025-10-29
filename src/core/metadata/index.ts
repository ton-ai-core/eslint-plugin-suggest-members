// CHANGE: Metadata utilities exports
// WHY: Single entry point for package metadata operations
// PURITY: CORE

export { PLUGIN_METADATA, PLUGIN_NAME, PLUGIN_VERSION } from "./generated.js";
export {
	createPluginMeta,
	extractPackageMetadata,
	type PackageMetadata,
	type PluginMeta,
} from "./package-info.js";
