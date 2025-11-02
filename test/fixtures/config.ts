// CHANGE: Test fixture - configuration module
// WHY: Provide a valid module for import path testing
// PURITY: CORE - immutable configuration

export const config = {
	appName: "Test App",
	version: "1.0.0",
	debug: false,
} as const;

export default config;
