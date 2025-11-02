/**
 * Known methods for JavaScript built-in types
 * CHANGE: Extract type methods to separate module
 * WHY: Reduce function complexity and improve maintainability
 * PURITY: CORE - pure functions only
 */

/**
 * Gets known methods and properties for common JavaScript types
 * @param objectType - Type name to look up
 * @returns Array of known method/property names
 * @complexity O(1) - constant lookup
 * @purity PURE - no side effects
 */
export const getKnownMethodsForType = (objectType: string): string[] => {
	// CHANGE: Normalize type name for lookup
	// WHY: Handle different type representations
	const normalizedType = objectType.toLowerCase().replace(/\[\]$/, "");
	return getKnownMethodsMap()[normalizedType] ?? [];
};

/**
 * Returns the map of known methods for JavaScript types
 * @returns Record mapping type names to method arrays
 * @purity PURE - no side effects
 */
const getKnownMethodsMap = (): Record<string, string[]> => ({
	string: getStringMethods(),
	array: getArrayMethods(),
	object: getObjectMethods(),
	number: getNumberMethods(),
	boolean: getBooleanMethods(),
	date: getDateMethods(),
	regexp: getRegExpMethods(),
	function: getFunctionMethods(),
	promise: getPromiseMethods(),
	map: getMapMethods(),
	set: getSetMethods(),
});

const getStringMethods = (): string[] => [
	"charAt",
	"charCodeAt",
	"codePointAt",
	"concat",
	"indexOf",
	"lastIndexOf",
	"localeCompare",
	"match",
	"replace",
	"search",
	"slice",
	"split",
	"substring",
	"substr",
	"toLowerCase",
	"toUpperCase",
	"trim",
	"trimStart",
	"trimEnd",
	"padStart",
	"padEnd",
	"repeat",
	"startsWith",
	"endsWith",
	"includes",
	"normalize",
	"toString",
	"valueOf",
	"length",
];

const getArrayMethods = (): string[] => [
	"push",
	"pop",
	"shift",
	"unshift",
	"slice",
	"splice",
	"concat",
	"join",
	"reverse",
	"sort",
	"indexOf",
	"lastIndexOf",
	"includes",
	"find",
	"findIndex",
	"filter",
	"map",
	"reduce",
	"reduceRight",
	"forEach",
	"some",
	"every",
	"fill",
	"copyWithin",
	"entries",
	"keys",
	"values",
	"flat",
	"flatMap",
	"toString",
	"valueOf",
	"length",
];

const getObjectMethods = (): string[] => [
	"hasOwnProperty",
	"isPrototypeOf",
	"propertyIsEnumerable",
	"toString",
	"valueOf",
	"constructor",
];

const getNumberMethods = (): string[] => [
	"toFixed",
	"toExponential",
	"toPrecision",
	"toString",
	"valueOf",
];

const getBooleanMethods = (): string[] => ["toString", "valueOf"];

const getDateMethods = (): string[] => [
	"getTime",
	"getFullYear",
	"getMonth",
	"getDate",
	"getDay",
	"getHours",
	"getMinutes",
	"getSeconds",
	"getMilliseconds",
	"getTimezoneOffset",
	"getUTCFullYear",
	"getUTCMonth",
	"getUTCDate",
	"getUTCDay",
	"getUTCHours",
	"getUTCMinutes",
	"getUTCSeconds",
	"getUTCMilliseconds",
	"setTime",
	"setFullYear",
	"setMonth",
	"setDate",
	"setHours",
	"setMinutes",
	"setSeconds",
	"setMilliseconds",
	"setUTCFullYear",
	"setUTCMonth",
	"setUTCDate",
	"setUTCHours",
	"setUTCMinutes",
	"setUTCSeconds",
	"setUTCMilliseconds",
	"toDateString",
	"toTimeString",
	"toISOString",
	"toJSON",
	"toString",
	"valueOf",
];

const getRegExpMethods = (): string[] => [
	"exec",
	"test",
	"toString",
	"valueOf",
	"source",
	"global",
	"ignoreCase",
	"multiline",
	"flags",
];

const getFunctionMethods = (): string[] => [
	"call",
	"apply",
	"bind",
	"toString",
	"valueOf",
	"length",
	"name",
];

const getPromiseMethods = (): string[] => ["then", "catch", "finally"];

const getMapMethods = (): string[] => [
	"set",
	"get",
	"has",
	"delete",
	"clear",
	"keys",
	"values",
	"entries",
	"forEach",
	"size",
];

const getSetMethods = (): string[] => [
	"add",
	"has",
	"delete",
	"clear",
	"keys",
	"values",
	"entries",
	"forEach",
	"size",
];
