import { ESLintUtils, TSESTree, TSESLint } from '@typescript-eslint/utils';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { builtinModules } from 'module';
import { compositeScore } from '../utils/helpers';

export default ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggests similar module paths when module cannot be found',
    },
    hasSuggestions: true,
    messages: {
      moduleNotFound: 'Cannot find module "{{modulePath}}".',
      moduleNotFoundWithSuggestions: 'Cannot find module "{{modulePath}}". Did you mean:\n{{suggestions}}',
      suggestModulePath: 'Replace with "{{modulePath}}"',
    },
    schema: [],
  },

  defaultOptions: [],

  create(context) {
    const { program } = ESLintUtils.getParserServices(context);

    /**
     * Finds similar module paths in the file system
     */
    function findSimilarModulePaths(
      requestedPath: string,
      currentFilePath: string
    ): { path: string; score: number }[] {
      const results: { path: string; score: number }[] = [];
      const seen = new Set<string>();
      const currentDir = path.dirname(currentFilePath);

      const reqBase = baseWithoutExt(requestedPath);
      const reqDir = path.resolve(currentDir, path.dirname(requestedPath));
      const normBase = reqBase.replace(/[_\s./-]/g, '').toLowerCase();

      const MIN_SCORE = normBase.length >= 10 ? 0.33 : 0.35;

      // 1) Same directory candidates and neighbors
      if (requestedPath.startsWith('./') || requestedPath.startsWith('../')) {
        try {
          if (fs.existsSync(reqDir)) {
            const entries = fs.readdirSync(reqDir);
            for (const e of entries) {
              const full = path.join(reqDir, e);
              const stat = fs.statSync(full);
              const candidateBase = stat.isDirectory() ? e : baseWithoutExt(e);

              const score = scoreOf(reqBase, candidateBase);
              if (score >= MIN_SCORE) {
                // For files, suggest full filename with extension; for directories, suggest the directory path
                const suggestionPath = stat.isDirectory()
                  ? normalizeRel(currentDir, full)
                  : normalizeRel(currentDir, path.join(reqDir, e));
                uniqPush(results, { path: suggestionPath, score }, seen);
              }
            }
          }
        } catch { /* ignore fs errors */ }

        const searchDirs = [
          currentDir,
          path.resolve(currentDir, '..'),
          path.resolve(currentDir, '../..')
        ];
        for (const dir of searchDirs) {
          try {
            if (!fs.existsSync(dir)) continue;
            for (const item of fs.readdirSync(dir)) {
              const full = path.join(dir, item);
              const stat = fs.statSync(full);
              const candidateBase = stat.isDirectory() ? item : baseWithoutExt(item);
              const score = scoreOf(requestedPath, candidateBase);
              if (score >= MIN_SCORE) {
                uniqPush(results, { path: normalizeRel(currentDir, stat.isDirectory() ? full : path.join(dir, candidateBase)), score }, seen);
              }
            }
          } catch { /* ignore */ }
        }
      } else {
        // 2) node_modules
        const nm = findNodeModules(currentDir);
        if (nm && fs.existsSync(nm)) {
          try {
            for (const pkg of fs.readdirSync(nm)) {
              if (pkg.startsWith('.')) continue;
              const scoreTop = scoreOf(requestedPath, pkg);
              if (scoreTop >= MIN_SCORE) uniqPush(results, { path: pkg, score: scoreTop }, seen);

              if (pkg.startsWith('@')) {
                const scopedPath = path.join(nm, pkg);
                if (fs.existsSync(scopedPath) && fs.statSync(scopedPath).isDirectory()) {
                  for (const sub of fs.readdirSync(scopedPath)) {
                    const full = `${pkg}/${sub}`;
                    const score = scoreOf(requestedPath, full);
                    if (score >= MIN_SCORE) uniqPush(results, { path: full, score }, seen);
                  }
                }
              }
            }
          } catch { /* ignore */ }
        }
      }

      // 3) If requested has an extension, also score full filenames in the same dir
      if ((requestedPath.startsWith('./') || requestedPath.startsWith('../')) && path.extname(reqBase) !== '') {
        try {
          if (fs.existsSync(reqDir)) {
            for (const e of fs.readdirSync(reqDir)) {
              const full = path.join(reqDir, e);
              if (!fs.statSync(full).isDirectory()) {
                const score = scoreOf(path.basename(requestedPath), e);
                if (score >= MIN_SCORE) uniqPush(results, { path: normalizeRel(currentDir, full), score }, seen);
              }
            }
          }
        } catch { /* ignore */ }
      }

      results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
      return results.slice(0, 5);
    }

    /**
     * Finds the nearest node_modules directory
     */
    function findNodeModules(startDir: string): string | null {
      let cur = startDir;
      while (cur !== path.dirname(cur)) {
        const nm = path.join(cur, 'node_modules');
        if (fs.existsSync(nm)) return nm;
        cur = path.dirname(cur);
      }
      return null;
    }

    /** Check path existence allowing any file extension and index files in directories */
    function existsWithAnyExtension(absPath: string): boolean {
      try {
        if (fs.existsSync(absPath)) return true;
        const dir = path.dirname(absPath);
        const base = path.basename(absPath);
        if (!fs.existsSync(dir)) return false;
        for (const entry of fs.readdirSync(dir)) {
          if (entry === base) return true;
          if (entry.startsWith(base + '.')) return true;
          const entryPath = path.join(dir, entry);
          if (entry === base && fs.statSync(entryPath).isDirectory()) {
            // directory with same base
            try {
              for (const f of fs.readdirSync(entryPath)) {
                if (f.startsWith('index.')) return true;
              }
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }
      return false;
    }

    /** Heuristic project root: look for package.json or tsconfig.json upwards */
    function findProjectRoot(startDir: string): string | null {
      let cur = startDir;
      while (cur !== path.dirname(cur)) {
        if (fs.existsSync(path.join(cur, 'package.json')) || fs.existsSync(path.join(cur, 'tsconfig.json'))) {
          return cur;
        }
        cur = path.dirname(cur);
      }
      return null;
    }

    /** Try resolve via tsconfig paths mapping (basic support) */
    function tryResolveViaTsPaths(specifier: string): string | null {
      try {
        const configPath = ts.findConfigFile(context.getCwd?.() ?? process.cwd(), ts.sys.fileExists, 'tsconfig.json');
        if (!configPath) return null;
        const cfgJson = ts.readConfigFile(configPath, ts.sys.readFile);
        if (!cfgJson.config) return null;
        const { options } = ts.parseJsonConfigFileContent(cfgJson.config, ts.sys, path.dirname(configPath));
        const baseUrl = options.baseUrl ? path.resolve(path.dirname(configPath), options.baseUrl) : undefined;
        const paths = options.paths as Record<string, string[]> | undefined;
        if (!baseUrl || !paths) return null;

        for (const [pattern, targets] of Object.entries(paths)) {
          const starIdx = pattern.indexOf('*');
          if (starIdx === -1) {
            if (pattern === specifier) {
              for (const t of targets) {
                const abs = path.resolve(baseUrl, t);
                if (fs.existsSync(abs)) return abs;
              }
            }
          } else {
            const [prefix, suffix] = [pattern.slice(0, starIdx), pattern.slice(starIdx + 1)];
            if (specifier.startsWith(prefix) && specifier.endsWith(suffix)) {
              const middle = specifier.slice(prefix.length, specifier.length - suffix.length);
              for (const t of targets) {
                const replaced = t.replace('*', middle);
                const abs = path.resolve(baseUrl, replaced);
                if (fs.existsSync(abs)) return abs;
              }
            }
          }
        }
      } catch { /* ignore */ }
      return null;
    }

            /**
     * Checks if a module is a Node.js built-in module
     */
    function isBuiltinModule(moduleName: string): boolean {
      return builtinModules.includes(moduleName) || builtinModules.includes(`node:${moduleName}`);
    }

    /**
     * Checks if a module path cannot be resolved
     */
    function isModuleNotFound(modulePath: string, currentFilePath: string): boolean {
      if (isBuiltinModule(modulePath)) return false;
      if (modulePath.startsWith('node:')) return !isBuiltinModule(modulePath.slice(5));
      // Quick FS short-circuit for relative imports and assets
      try {
        if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
          const currentDir = path.dirname(currentFilePath);
          const abs = path.resolve(currentDir, modulePath);
          if (existsWithAnyExtension(abs)) return false;
        } else {
          // Bare specifier: check in nearest node_modules for the exact subpath (handles CSS/assets)
          const nm = findNodeModules(path.dirname(currentFilePath));
          if (nm) {
            const abs = path.join(nm, modulePath);
            if (existsWithAnyExtension(abs)) return false;
          }
          // Try resolve via tsconfig paths mapping
          const mapped = tryResolveViaTsPaths(modulePath);
          if (mapped && existsWithAnyExtension(mapped)) return false;
          // Common alias '@/' -> <projectRoot>/src or <projectRoot>
          if (modulePath.startsWith('@/')) {
            const projectRoot = findProjectRoot(path.dirname(currentFilePath));
            if (projectRoot) {
              const rel = modulePath.slice(2);
              const abs1 = path.resolve(projectRoot, 'src', rel);
              const abs2 = path.resolve(projectRoot, rel);
              if (existsWithAnyExtension(abs1) || existsWithAnyExtension(abs2)) return false;
            }
          }
        }
      } catch { /* ignore */ }
      try {
        const res = ts.resolveModuleName(
          modulePath,
          currentFilePath,
          program.getCompilerOptions(),
          ts.sys
        );
        return !res?.resolvedModule;
      } catch {
        return true;
      }
    }

    function normalizeRel(fromDir: string, p: string): string {
      const rel = path.relative(fromDir, p).replace(/\\/g, '/');
      return rel.startsWith('.') ? rel : `./${rel}`;
    }

    function baseWithoutExt(p: string): string {
      const base = path.basename(p);
      const ext = path.extname(base);
      return ext ? base.slice(0, -ext.length) : base;
    }

    function uniqPush(arr: { path: string; score: number }[], item: { path: string; score: number }, seen: Set<string>): void {
      if (!seen.has(item.path)) { seen.add(item.path); arr.push(item); }
    }

    function scoreOf(requested: string, candidate: string): number {
      return compositeScore(requested, candidate);
    }

    return {
      'ImportDeclaration'(node: TSESTree.ImportDeclaration): void {
        if (!node.source || node.source.type !== 'Literal' || typeof node.source.value !== 'string') {
          return;
        }

        const modulePath = node.source.value;
        const currentFilePath = context.getFilename();
        
        // Check if module cannot be found
        if (isModuleNotFound(modulePath, currentFilePath)) {
          const similarPaths = findSimilarModulePaths(modulePath, currentFilePath);
          
          if (similarPaths.length > 0) {
            const suggestionsText = similarPaths.map(suggestion => 
              `  - ${suggestion.path}`).join('\n');
            
            context.report({
              node: node.source,
              messageId: 'moduleNotFoundWithSuggestions',
              data: {
                modulePath,
                suggestions: suggestionsText
              },
              suggest: similarPaths.map(suggestion => ({
                messageId: 'suggestModulePath',
                data: { modulePath: suggestion.path },
                fix: (fixer): TSESLint.RuleFix => fixer.replaceText(
                  node.source!,
                  `"${suggestion.path}"`
                ),
              })),
            });
          } else {
            context.report({
              node: node.source,
              messageId: 'moduleNotFound',
              data: { modulePath },
            });
          }
        }
      },

      'CallExpression'(node: TSESTree.CallExpression): void {
        // Handle require() calls
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'string'
        ) {
          const modulePath = node.arguments[0].value;
          const currentFilePath = context.getFilename();
          
          if (isModuleNotFound(modulePath, currentFilePath)) {
            const similarPaths = findSimilarModulePaths(modulePath, currentFilePath);
            
            if (similarPaths.length > 0) {
              const suggestionsText = similarPaths.map(suggestion => 
                `  - ${suggestion.path}`).join('\n');
              
              context.report({
                node: node.arguments[0],
                messageId: 'moduleNotFoundWithSuggestions',
                data: {
                  modulePath,
                  suggestions: suggestionsText
                },
                suggest: similarPaths.map(suggestion => ({
                  messageId: 'suggestModulePath',
                  data: { modulePath: suggestion.path },
                  fix: (fixer): TSESLint.RuleFix => fixer.replaceText(
                    node.arguments[0] as TSESTree.Literal,
                    `"${suggestion.path}"`
                  ),
                })),
              });
            } else {
              context.report({
                node: node.arguments[0],
                messageId: 'moduleNotFound',
                data: { modulePath },
              });
            }
          }
        }
      },

      'ExportAllDeclaration'(node: TSESTree.ExportAllDeclaration): void {
        if (!node.source || node.source.type !== 'Literal' || typeof node.source.value !== 'string') {
          return;
        }

        const modulePath = node.source.value;
        const currentFilePath = context.getFilename();
        
        // Check if module cannot be found
        if (isModuleNotFound(modulePath, currentFilePath)) {
          const similarPaths = findSimilarModulePaths(modulePath, currentFilePath);
          
          if (similarPaths.length > 0) {
            const suggestionsText = similarPaths.map(suggestion => 
              `  - ${suggestion.path}`).join('\n');
            
            context.report({
              node: node.source,
              messageId: 'moduleNotFoundWithSuggestions',
              data: {
                modulePath,
                suggestions: suggestionsText
              },
              suggest: similarPaths.map(suggestion => ({
                messageId: 'suggestModulePath',
                data: { modulePath: suggestion.path },
                fix: (fixer): TSESLint.RuleFix => fixer.replaceText(
                  node.source!,
                  `"${suggestion.path}"`
                ),
              })),
            });
          } else {
            context.report({
              node: node.source,
              messageId: 'moduleNotFound',
              data: { modulePath },
            });
          }
        }
      },

      'ExportNamedDeclaration'(node: TSESTree.ExportNamedDeclaration): void {
        if (!node.source || node.source.type !== 'Literal' || typeof node.source.value !== 'string') {
          return;
        }

        const modulePath = node.source.value;
        const currentFilePath = context.getFilename();
        
        // Check if module cannot be found
        if (isModuleNotFound(modulePath, currentFilePath)) {
          const similarPaths = findSimilarModulePaths(modulePath, currentFilePath);
          
          if (similarPaths.length > 0) {
            const suggestionsText = similarPaths.map(suggestion => 
              `  - ${suggestion.path}`).join('\n');
            
            context.report({
              node: node.source,
              messageId: 'moduleNotFoundWithSuggestions',
              data: {
                modulePath,
                suggestions: suggestionsText
              },
              suggest: similarPaths.map(suggestion => ({
                messageId: 'suggestModulePath',
                data: { modulePath: suggestion.path },
                fix: (fixer): TSESLint.RuleFix => fixer.replaceText(
                  node.source!,
                  `"${suggestion.path}"`
                ),
              })),
            });
          } else {
            context.report({
              node: node.source,
              messageId: 'moduleNotFound',
              data: { modulePath },
            });
          }
        }
      },
    };
  },
}); 