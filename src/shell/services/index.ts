// CHANGE: Services module exports
// WHY: Single entry point for all Effect-based services
// PURITY: SHELL

// Legacy services (to be deprecated)
export type { FilesystemService } from "./filesystem.js";
export { makeFilesystemService } from "./filesystem.js";
// Effect-based services (preferred)
export type { FilesystemService as FilesystemServiceEffect } from "./filesystem-effect.js";
export {
	FilesystemServiceTag,
	makeFilesystemService as makeFilesystemServiceEffect,
	makeFilesystemServiceLayer,
} from "./filesystem-effect.js";
// Package metadata services
export {
	createPluginMetaFromPackage,
	readPackageJson,
} from "./package-reader.js";
export type { TypeScriptCompilerService } from "./typescript-compiler.js";
export { makeTypeScriptCompilerService } from "./typescript-compiler.js";
export type { TypeScriptCompilerService as TypeScriptCompilerServiceEffect } from "./typescript-compiler-effect.js";
export {
	makeTypeScriptCompilerService as makeTypeScriptCompilerServiceEffect,
	makeTypeScriptCompilerServiceLayer,
	TypeScriptCompilerServiceTag,
} from "./typescript-compiler-effect.js";
