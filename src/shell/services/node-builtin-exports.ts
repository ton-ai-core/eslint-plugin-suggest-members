// CHANGE: Shared Node.js built-in exports definitions
// WHY: Avoid code duplication between typescript-compiler.ts and typescript-compiler-effect.ts
// PURITY: CORE
// REF: Node.js documentation - Built-in modules

/**
 * Built-in Node.js modules with their common exports
 *
 * @purity CORE
 * @invariant ∀ module ∈ NODE_BUILTIN_MODULES: exports(module) ⊆ KNOWN_EXPORTS[module]
 */
export const NODE_BUILTIN_EXPORTS: Record<string, readonly string[]> = {
	fs: [
		"readFile",
		"readFileSync",
		"writeFile",
		"writeFileSync",
		"appendFile",
		"appendFileSync",
		"access",
		"accessSync",
		"exists",
		"existsSync",
		"stat",
		"statSync",
		"lstat",
		"lstatSync",
		"mkdir",
		"mkdirSync",
		"rmdir",
		"rmdirSync",
		"readdir",
		"readdirSync",
		"unlink",
		"unlinkSync",
		"rename",
		"renameSync",
		"copyFile",
		"copyFileSync",
		"watch",
		"watchFile",
		"unwatchFile",
		"createReadStream",
		"createWriteStream",
		"promises",
	],
	path: [
		"resolve",
		"join",
		"dirname",
		"basename",
		"extname",
		"parse",
		"format",
		"normalize",
		"relative",
		"isAbsolute",
		"sep",
		"delimiter",
		"posix",
		"win32",
	],
	os: [
		"platform",
		"arch",
		"cpus",
		"freemem",
		"totalmem",
		"hostname",
		"type",
		"release",
		"uptime",
		"loadavg",
		"networkInterfaces",
		"homedir",
		"tmpdir",
		"userInfo",
		"EOL",
	],
	crypto: [
		"createHash",
		"createHmac",
		"createCipher",
		"createDecipher",
		"createSign",
		"createVerify",
		"randomBytes",
		"randomFillSync",
		"randomFill",
		"pbkdf2",
		"pbkdf2Sync",
		"scrypt",
		"scryptSync",
		"generateKeyPair",
		"generateKeyPairSync",
		"constants",
	],
	http: [
		"createServer",
		"request",
		"get",
		"Agent",
		"ClientRequest",
		"Server",
		"ServerResponse",
		"IncomingMessage",
		"METHODS",
		"STATUS_CODES",
		"globalAgent",
	],
	https: ["createServer", "request", "get", "Agent", "Server", "globalAgent"],
	url: [
		"parse",
		"format",
		"resolve",
		"URL",
		"URLSearchParams",
		"pathToFileURL",
		"fileURLToPath",
	],
	util: [
		"format",
		"inspect",
		"isArray",
		"isRegExp",
		"isDate",
		"isError",
		"inherits",
		"deprecate",
		"debuglog",
		"promisify",
		"callbackify",
		"types",
	],
	events: ["EventEmitter", "once", "listenerCount"],
	stream: [
		"Readable",
		"Writable",
		"Duplex",
		"Transform",
		"PassThrough",
		"pipeline",
		"finished",
	],
	buffer: ["Buffer", "constants"],
	process: [
		"argv",
		"env",
		"exit",
		"cwd",
		"chdir",
		"platform",
		"arch",
		"version",
		"versions",
		"pid",
		"ppid",
		"title",
		"stdout",
		"stderr",
		"stdin",
		"nextTick",
	],
} as const;

/**
 * Check if module is a Node.js built-in
 *
 * @purity CORE
 * @complexity O(1)
 * @invariant ∀ module: isNodeBuiltin(module) ↔ module ∈ NODE_BUILTIN_MODULES
 */
export const isNodeBuiltinModule = (modulePath: string): boolean => {
	// Remove 'node:' prefix if present
	const cleanPath = modulePath.startsWith("node:")
		? modulePath.slice(5)
		: modulePath;
	return cleanPath in NODE_BUILTIN_EXPORTS;
};

/**
 * Get exports for Node.js built-in module
 *
 * @purity CORE
 * @complexity O(1)
 * @invariant ∀ module: isNodeBuiltin(module) → getNodeBuiltinExports(module) ≠ undefined
 */
export const getNodeBuiltinExports = (
	modulePath: string,
): readonly string[] | undefined => {
	const cleanPath = modulePath.startsWith("node:")
		? modulePath.slice(5)
		: modulePath;
	return NODE_BUILTIN_EXPORTS[cleanPath];
};
