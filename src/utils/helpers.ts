import * as ts from 'typescript';

/** ---------- String similarity core ---------- */

/** Jaro similarity in [0,1] */
export function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length, len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);
  let matches = 0, transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  transpositions /= 2;

  return (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3;
}

/** Jaro–Winkler similarity in [0,1] with p=0.1 (standard). */
export function jaroWinkler(s1: string, s2: string): number {
  const jw = jaro(s1, s2);
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return jw + prefix * 0.1 * (1 - jw);
}

/** Tokenization for identifiers: camelCase, underscores, spaces, digits. */
export function splitIdentifier(identifier: string): string[] {
  return identifier
    .split(/(?=[A-Z])|[_\s\d]/)
    .map(s => s.toLowerCase())
    .filter(Boolean);
}

/** Normalization: lowercasing and removing common separators and dots for paths. */
export function normalize(str: string): string {
  return str.toLowerCase().replace(/[_\s./-]/g, '');
}

function longestCommonPrefix(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
}

function jaccardTokens(a: string, b: string): number {
  const A = new Set(splitIdentifier(a));
  const B = new Set(splitIdentifier(b));
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Composite similarity score S ∈ [0,1] with provable bounds. */
export function compositeScore(unknown: string, candidate: string): number {
  const A = normalize(unknown);
  const B = normalize(candidate);
  const jw = jaroWinkler(A, B);
  const tok = jaccardTokens(unknown, candidate);
  const cont = A.length > 0 && B.length > 0 && (A.includes(B) || B.includes(A)) ? 1 : 0;
  const pref = Math.min(longestCommonPrefix(A, B), 4) / 4;
  const base = 0.5 * jw + 0.3 * tok + 0.1 * cont + 0.1 * pref;

  // Length penalty: at most 0.15, linear by excess length
  const lengthPenalty = Math.min(0.15, Math.max(0, candidate.length - unknown.length) * 0.01);

  const s = base - lengthPenalty;
  return s <= 0 ? 0 : s >= 1 ? 1 : s;
}

/** Backward compatibility alias (previous name used in repo). */
export function computeCompositeScore(unknown: string, candidate: string): number {
  return compositeScore(unknown, candidate);
}

/** ---------- TypeScript helpers ---------- */

/** Merge properties across union types using apparentType. */
function getAllProperties(objectType: ts.Type, checker: ts.TypeChecker): ts.Symbol[] {
  const seen = new Map<string, ts.Symbol>();

  const addProps = (t: ts.Type): void => {
    checker.getApparentType(t).getProperties().forEach(sym => {
      const name = sym.getName();
      if (!seen.has(name)) seen.set(name, sym);
    });
  };

  if ((objectType.flags & ts.TypeFlags.Union) !== 0) {
    for (const t of (objectType as ts.UnionType).types) addProps(t);
  } else {
    addProps(objectType);
  }
  return Array.from(seen.values());
}

/** Formatted member names with signatures/types, sorted by composite score. */
export function getFormattedMembersList(
  objectType: ts.Type,
  checker: ts.TypeChecker,
  tsNode: ts.Node,
  requestedName: string
): string[] {
  const MIN_SCORE = 0.3;
  const items: { display: string; name: string; score: number }[] = [];

  for (const property of getAllProperties(objectType, checker)) {
    try {
      let displayName = property.getName();
      const propertyType = checker.getTypeOfSymbolAtLocation(property, tsNode);

      if (propertyType.getCallSignatures().length > 0) {
        const sig = propertyType.getCallSignatures()[0];
        const params = sig.getParameters().map(p => {
          const pt = checker.getTypeOfSymbolAtLocation(p, property.valueDeclaration ?? tsNode);
          return `${p.getName()}: ${checker.typeToString(pt)}`;
        }).join(', ');
        const ret = checker.typeToString(sig.getReturnType());
        displayName = `${displayName}(${params})${ret !== 'void' ? `: ${ret}` : ''}`;
      } else {
        displayName = `${displayName}: ${checker.typeToString(propertyType)}`;
      }

      const score = compositeScore(requestedName, property.getName());
      if (score >= MIN_SCORE) items.push({ display: displayName, name: property.getName(), score });
    } catch {
      const name = property.getName();
      const score = compositeScore(requestedName, name);
      if (score >= MIN_SCORE) items.push({ display: name, name, score });
    }
  }

  items.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return items.slice(0, 5).map(i => i.display);
}

/** Possible exports ordered by composite score. */
export function findPossibleExports(
  checker: ts.TypeChecker,
  requestedName: string,
  moduleSymbol: ts.Symbol | undefined,
): { name: string; score: number }[] {
  if (!moduleSymbol) return [];
  try {
    const MIN_SCORE = 0.3;
    const exports = checker.getExportsOfModule(moduleSymbol) ?? [];
    const results = exports
      .map(exp => ({ name: exp.getName(), score: compositeScore(requestedName, exp.getName()) }))
      .filter(x => x.score >= MIN_SCORE);

    results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return results.slice(0, 5);
  } catch {
    return [];
  }
}

/** Similar local symbols by composite score. */
export function findSimilarLocalSymbols(
  checker: ts.TypeChecker,
  tsNode: ts.Node,
  name: string,
): { name: string; score: number }[] {
  const MIN_SCORE = 0.3;
  const push = (arr: { name: string; score: number }[], n: string): void => {
    const s = compositeScore(name, n);
    if (s >= MIN_SCORE) arr.push({ name: n, score: s });
  };

  const results: { name: string; score: number }[] = [];

  const locals = checker.getSymbolsInScope(
    tsNode,
    ts.SymbolFlags.Variable |
    ts.SymbolFlags.Function |
    ts.SymbolFlags.Class |
    ts.SymbolFlags.Enum |
    ts.SymbolFlags.TypeAlias |
    ts.SymbolFlags.Interface
  );
  locals.forEach(sym => push(results, sym.getName()));

  const sf = tsNode.getSourceFile();
  if (sf) {
    sf.forEachChild(node => {
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach(decl => {
          if (ts.isIdentifier(decl.name)) push(results, decl.name.text);
        });
      } else if (ts.isFunctionDeclaration(node) && node.name) {
        push(results, node.name.text);
      }
    });
  }

  const globals = checker.getSymbolsInScope(
    tsNode,
    ts.SymbolFlags.Variable | ts.SymbolFlags.Function | ts.SymbolFlags.Class | ts.SymbolFlags.Alias
  );
  globals.forEach(sym => {
    if (!sym.declarations || sym.declarations.length === 0) return;
    if (sym.declarations[0].getSourceFile() !== tsNode.getSourceFile()) push(results, sym.getName());
  });

  const uniq = new Map<string, number>();
  for (const r of results) {
    if (!uniq.has(r.name) || (uniq.get(r.name)! < r.score)) uniq.set(r.name, r.score);
  }
  return Array.from(uniq, ([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 5);
}

/** Minimal TS globals allow-list. */
export function isTypescriptGlobal(name: string): boolean {
  const globals = [
    'Object','Function','String','Boolean','Number','Array','Date','RegExp',
    'Error','EvalError','RangeError','ReferenceError','SyntaxError','TypeError',
    'URIError','JSON','Math','console','Promise','Map','Set','WeakMap','WeakSet',
    'Symbol','Proxy','Reflect','Intl','setTimeout','clearTimeout','setInterval',
    'clearInterval','setImmediate','clearImmediate','queueMicrotask','global',
    'process','require','module','exports','__dirname','__filename'
  ];
  return globals.includes(name);
}