import * as ts from 'typescript';

/**
 * Computes the Jaro similarity between two strings.
 */
export function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length,
    len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);
  let matches = 0,
    transpositions = 0;

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

  return (
    (matches / len1 +
      matches / len2 +
      (matches - transpositions) / matches) /
    3
  );
}

/**
 * Computes the Jaro-Winkler similarity between two strings.
 */
export function jaroWinkler(s1: string, s2: string): number {
  const jaroSim = jaro(s1, s2);
  let prefix = 0;
  const maxPrefix = 4;
  for (let i = 0; i < Math.min(maxPrefix, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  const scalingFactor = 0.1;
  return jaroSim + prefix * scalingFactor * (1 - jaroSim);
}

/**
 * Splits an identifier into lower-cased tokens using camelCase, underscores, spaces, or digits as separators.
 */
export function splitIdentifier(identifier: string): string[] {
  return identifier
    .split(/(?=[A-Z])|[_\s\d]/)
    .map((s) => s.toLowerCase())
    .filter((s) => s.length > 0);
}

/**
 * Normalizes a string for similarity comparison.
 * Lowercases and removes underscores and spaces.
 */
export function normalize(str: string): string {
  return str.toLowerCase().replace(/[_\s]/g, "");
}

/**
 * Computes a composite similarity score between the unknown query and a candidate.
 */
export function computeCompositeScore(unknown: string, candidate: string): number {
  const normQuery = normalize(unknown);
  const normCandidate = normalize(candidate);

  // Base similarity from Jaro-Winkler
  const baseSimilarity = jaroWinkler(normQuery, normCandidate); // between 0 and 1

  // Exact match bonus
  const exactBonus = normQuery === normCandidate ? 0.3 : 0;

  // Containment bonus
  const contains =
    normCandidate.includes(normQuery) || normQuery.includes(normCandidate);
  const containmentBonus = contains ? 0.2 : 0;

  // Token bonus
  const tokensQuery = new Set(splitIdentifier(unknown));
  const tokensCandidate = new Set(splitIdentifier(candidate));
  let tokenBonus = 0;
  let tokensMatched = 0;

  tokensQuery.forEach((tq) => {
    tokensCandidate.forEach((tc) => {
      if (tq === tc) {
        tokenBonus += 0.2;
        tokensMatched++;
      } else if (tq.startsWith(tc) || tc.startsWith(tq)) {
        tokenBonus += 0.1;
        tokensMatched++;
      }
    });
  });

  // Extra bonus if at least 2 distinct tokens match
  if (tokensMatched >= 2) {
    tokenBonus += 0.2;
  }

  // Length penalty: subtract 0.01 per extra character in candidate
  const lengthPenalty = Math.max(0, candidate.length - unknown.length) * 0.01;

  return baseSimilarity + exactBonus + containmentBonus + tokenBonus - lengthPenalty;
}

/**
 * Gets a formatted list of members with their signatures and types
 */
export function getFormattedMembersList(
  objectType: ts.Type,
  checker: ts.TypeChecker,
  tsNode: ts.Node,
  requestedName: string
): string[] {
  // Minimum similarity score threshold
  const MIN_SCORE = 0.3;
  const result: { 
    name: string; 
    displayName: string; 
    score: number; 
  }[] = [];

  // Process all properties of the object type
  objectType.getProperties().forEach(property => {
    try {
      let displayName = property.name;
      
      // Check property type through declarations
      if (property.valueDeclaration) {
        const propertyType = checker.getTypeOfSymbolAtLocation(property, tsNode);
        
        // Check if it's a method or property
        const isMethod = propertyType.getCallSignatures().length > 0;
        
        // If it's a method, add its signature
        if (isMethod) {
          const signatures = propertyType.getCallSignatures();
          if (signatures.length > 0) {
            const signature = signatures[0];
            const params = signature.getParameters().map(param => {
              const paramName = param.getName();
              const paramType = checker.getTypeOfSymbolAtLocation(param, property.valueDeclaration || tsNode);
              return `${paramName}: ${checker.typeToString(paramType)}`;
            }).join(', ');
            
            const returnType = signature.getReturnType();
            const returnTypeString = checker.typeToString(returnType);
            
            displayName = `${property.name}(${params})${returnTypeString !== 'void' ? `: ${returnTypeString}` : ''}`;
          } else {
            displayName = `${property.name}()`;
          }
        } else {
          // If it's a property, add its type
          displayName = `${property.name}: ${checker.typeToString(propertyType)}`;
        }
      } else {
        // If no declaration, just use the name
        displayName = property.name;
      }
      
      // Calculate similarity with requested name
      const score = computeCompositeScore(requestedName, property.name);
      
      result.push({
        name: property.name,
        displayName,
        score
      });
    } catch (error) {
      // In case of error, add just the property name
      result.push({
        name: property.name,
        displayName: property.name,
        score: computeCompositeScore(requestedName, property.name)
      });
    }
  });
  
  // Sort by similarity and take only the top 5 items
  result.sort((a, b) => b.score - a.score);
  
  // Get the sorted list of members by relevance and limit it
  return result
    .filter(item => item.score >= MIN_SCORE)
    .slice(0, 5)
    .map(item => item.displayName);
}

/**
 * Finds possible exports from a module that match the requested import
 */
export function findPossibleExports(
  checker: ts.TypeChecker,
  requestedName: string,
  moduleSymbol: ts.Symbol | undefined,
): { name: string; score: number }[] {
  // Включаем отладочный вывод
  const DEBUG = true;
  const debug = (...args: any[]) => {
    if (DEBUG) {
      console.log('[DEBUG:findPossibleExports]', ...args);
    }
  };

  debug(`Finding exports similar to '${requestedName}'`);
  
  if (!moduleSymbol) {
    debug('Module symbol is undefined');
    return [];
  }

  try {
    const moduleName = moduleSymbol.getName();
    debug(`Module name: ${moduleName}`);
    
    const exports = checker.getExportsOfModule(moduleSymbol) || [];
    debug(`Found ${exports.length} exports in the module`);
    
    // Логируем все доступные экспорты для анализа
    if (exports.length > 0) {
      debug(`Available exports:`, exports.map(e => e.getName()));
    }
    
    const results: { name: string; score: number }[] = [];
    const MIN_SCORE = 0.3;

    // Собираем все экспорты и вычисляем их оценки похожести
    exports.forEach(exportSymbol => {
      const exportName = exportSymbol.getName();
      const score = computeCompositeScore(requestedName, exportName);
      
      debug(`Export: ${exportName}, Score: ${score}`);
      
      if (score > MIN_SCORE) {
        results.push({ name: exportName, score });
      }
    });

    // Сортируем результаты по оценке
    const sortedResults = results.sort((a, b) => b.score - a.score);
    
    // Берем только 5 лучших результатов
    const limitedResults = sortedResults.slice(0, 5);
    
    debug(`Final results (${limitedResults.length}):`, limitedResults);
    
    return limitedResults;
  } catch (error) {
    debug(`Error finding exports: ${error}`);
    return [];
  }
}

/**
 * Gets locally available symbols that match an identifier
 */
export function findSimilarLocalSymbols(
  checker: ts.TypeChecker,
  tsNode: ts.Node,
  name: string,
): { name: string; score: number }[] {
  const results: { name: string; score: number }[] = [];
  const MIN_SCORE = 0.3;

  // Find symbols in local scope with various symbol flags
  const locals = checker.getSymbolsInScope(
    tsNode, 
    ts.SymbolFlags.Variable | 
    ts.SymbolFlags.Function | 
    ts.SymbolFlags.Class | 
    ts.SymbolFlags.Enum | 
    ts.SymbolFlags.TypeAlias | 
    ts.SymbolFlags.Interface
  );

  // Add found local symbols
  locals.forEach(symbol => {
    const symbolName = symbol.getName();
    const score = computeCompositeScore(name, symbolName);
    
    if (score >= MIN_SCORE) {
      results.push({ name: symbolName, score });
    }
  });

  // Also search for variables in the current scope through the source file
  const sourceFile = tsNode.getSourceFile();
  if (sourceFile) {
    // Check all variable declarations in the file
    const variableNames = new Set<string>();
    sourceFile.forEachChild(node => {
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach(decl => {
          if (ts.isIdentifier(decl.name)) {
            const declName = decl.name.text;
            variableNames.add(declName);
            
            const score = computeCompositeScore(name, declName);
            if (score >= MIN_SCORE) {
              results.push({ name: declName, score });
            }
          }
        });
      }
      else if (ts.isFunctionDeclaration(node) && node.name) {
        const funcName = node.name.text;
        variableNames.add(funcName);
        
        const score = computeCompositeScore(name, funcName);
        if (score >= MIN_SCORE) {
          results.push({ name: funcName, score });
        }
      }
    });
  }

  // Additionally search in global space
  const globalSymbols = checker.getSymbolsInScope(
    tsNode, 
    ts.SymbolFlags.Variable | 
    ts.SymbolFlags.Function | 
    ts.SymbolFlags.Class | 
    ts.SymbolFlags.Alias
  );
  
  globalSymbols.forEach(symbol => {
    if (!symbol.declarations || symbol.declarations.length === 0) return;
    
    // Check only global symbols
    if (symbol.declarations[0].getSourceFile() !== tsNode.getSourceFile()) {
      const symbolName = symbol.getName();
      const score = computeCompositeScore(name, symbolName);
      
      if (score >= MIN_SCORE) {
        results.push({ name: symbolName, score });
      }
    }
  });

  // Remove duplicates and sort by score
  const uniqueResults = results.filter((item, index, self) => 
    index === self.findIndex(t => t.name === item.name)
  );
  
  // Sort by score and limit
  return uniqueResults.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Checks if the name is a TypeScript global name
 */
export function isTypescriptGlobal(name: string): boolean {
  const globals = [
    'Object', 'Function', 'String', 'Boolean', 'Number', 'Array', 'Date', 'RegExp',
    'Error', 'EvalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError',
    'URIError', 'JSON', 'Math', 'console', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
    'Symbol', 'Proxy', 'Reflect', 'Intl', 'setTimeout', 'clearTimeout', 'setInterval',
    'clearInterval', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'global',
    'process', 'require', 'module', 'exports', '__dirname', '__filename'
  ];
  
  return globals.includes(name);
} 