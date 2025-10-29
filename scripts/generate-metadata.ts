#!/usr/bin/env node
// CHANGE: Build-time metadata generation script
// WHY: Generate plugin metadata from package.json during build
// PURITY: SHELL (build-time IO)
// USAGE: npm run build:meta

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Generate TypeScript file with plugin metadata
 * 
 * @pure false - performs filesystem IO
 */
async function generateMetadataFile() {
	try {
		// CHANGE: Read package.json directly
		// WHY: Simple Node.js approach without Effect dependencies
		const packagePath = resolve("package.json");
		const packageContent = await readFile(packagePath, "utf-8");
		const packageJson = JSON.parse(packageContent);

		if (!packageJson.name || !packageJson.version) {
			throw new Error("package.json missing required name or version fields");
		}

		// CHANGE: Generate TypeScript content
		// WHY: Create compile-time constants from package.json
		const content = `// GENERATED FILE - DO NOT EDIT MANUALLY
// This file is auto-generated from package.json during build
// CHANGE: Auto-generated plugin metadata
// WHY: Avoid hardcoding metadata, sync with package.json
// PURITY: CORE (compile-time constants)

/**
 * Plugin metadata extracted from package.json
 * 
 * @generated true - auto-generated during build
 * @source package.json
 */
export const PLUGIN_METADATA = {
	name: "${packageJson.name}",
	version: "${packageJson.version}",
} as const;

/**
 * Plugin name constant
 * 
 * @generated true
 */
export const PLUGIN_NAME = "${packageJson.name}" as const;

/**
 * Plugin version constant
 * 
 * @generated true
 */
export const PLUGIN_VERSION = "${packageJson.version}" as const;
`;

		// CHANGE: Write generated file
		// WHY: Create importable metadata constants
		const outputPath = resolve("src/core/metadata/generated.ts");
		await writeFile(outputPath, content, "utf-8");

		console.log(`✅ Generated metadata file: ${outputPath}`);
		console.log(`   Name: ${packageJson.name}`);
		console.log(`   Version: ${packageJson.version}`);
	} catch (error) {
		console.error("❌ Failed to generate metadata:", error);
		process.exit(1);
	}
}

// CHANGE: Run the generation script
// WHY: Execute during build process
generateMetadataFile();