import { ESLintUtils, TSESTree, TSESLint } from '@typescript-eslint/utils';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { computeCompositeScore } from '../utils/helpers';

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
    // Get TypeScript services
    const parserServices = ESLintUtils.getParserServices(context);
    const program = parserServices.program;

    /**
     * Finds similar module paths in the file system
     */
    function findSimilarModulePaths(
      requestedPath: string,
      currentFilePath: string
    ): { path: string; score: number }[] {
      // Adaptive threshold: lower for longer paths to catch complex names
      const baseFileName = path.basename(requestedPath);
      const MIN_SCORE = baseFileName.length > 20 ? 0.2 : 0.3;
      const results: { path: string; score: number }[] = [];
      
      try {
        const currentDir = path.dirname(currentFilePath);
        const isRelativeImport = requestedPath.startsWith('./') || requestedPath.startsWith('../');
        
        if (isRelativeImport) {
          // Handle relative imports
          const targetDir = path.resolve(currentDir, path.dirname(requestedPath));
          const requestedFilename = path.basename(requestedPath);
          
          if (fs.existsSync(targetDir)) {
            const files = fs.readdirSync(targetDir);
            
            files.forEach(file => {
              const fileBasename = path.basename(file, path.extname(file));
              const score = computeCompositeScore(requestedFilename, fileBasename);
              
              if (score >= MIN_SCORE) {
                const relativePath = path.relative(currentDir, path.join(targetDir, fileBasename));
                const normalizedPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
                
                results.push({
                  path: normalizedPath.replace(/\\/g, '/'),
                  score
                });
              }
            });
          }
          
          // Also search in parent and sibling directories
          const searchDirs = [
            path.resolve(currentDir, '..'),
            path.resolve(currentDir, '../..'),
            currentDir
          ];
          
          searchDirs.forEach(searchDir => {
            if (fs.existsSync(searchDir)) {
              try {
                const items = fs.readdirSync(searchDir);
                items.forEach(item => {
                  const itemPath = path.join(searchDir, item);
                  if (fs.statSync(itemPath).isDirectory()) {
                    const score = computeCompositeScore(requestedPath, item);
                    if (score >= MIN_SCORE) {
                      const relativePath = path.relative(currentDir, itemPath);
                      const normalizedPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
                      
                      results.push({
                        path: normalizedPath.replace(/\\/g, '/'),
                        score
                      });
                    }
                  }
                });
              } catch {
                // Ignore errors when reading directories
              }
            }
          });
        } else {
          // Handle node_modules imports
          const nodeModulesPath = findNodeModules(currentDir);
          if (nodeModulesPath && fs.existsSync(nodeModulesPath)) {
            try {
              const packages = fs.readdirSync(nodeModulesPath);
              
              packages.forEach(packageName => {
                if (packageName.startsWith('.')) return;
                
                const score = computeCompositeScore(requestedPath, packageName);
                if (score >= MIN_SCORE) {
                  results.push({
                    path: packageName,
                    score
                  });
                }
                
                // Handle scoped packages
                if (packageName.startsWith('@')) {
                  const scopedPath = path.join(nodeModulesPath, packageName);
                  if (fs.existsSync(scopedPath) && fs.statSync(scopedPath).isDirectory()) {
                    try {
                      const scopedPackages = fs.readdirSync(scopedPath);
                      scopedPackages.forEach(scopedPkg => {
                        const fullName = `${packageName}/${scopedPkg}`;
                        const score = computeCompositeScore(requestedPath, fullName);
                        if (score >= MIN_SCORE) {
                          results.push({
                            path: fullName,
                            score
                          });
                        }
                      });
                    } catch {
                      // Ignore errors
                    }
                  }
                }
              });
            } catch {
              // Ignore errors when reading node_modules
            }
          }
        }
      } catch {
        // Ignore all errors in file system operations
      }
      
      // Sort by score and return top suggestions
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    }

    /**
     * Finds the nearest node_modules directory
     */
    function findNodeModules(startDir: string): string | null {
      let currentDir = startDir;
      
      while (currentDir !== path.dirname(currentDir)) {
        const nodeModulesPath = path.join(currentDir, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          return nodeModulesPath;
        }
        currentDir = path.dirname(currentDir);
      }
      
      return null;
    }

            /**
     * Checks if a module is a Node.js built-in module
     */
    function isBuiltinModule(moduleName: string): boolean {
      // Use Node.js built-in modules list dynamically
      // This avoids hardcoding and stays up-to-date
      try {
        // Dynamic import of Node.js built-in modules list
        // We use eval to avoid bundlers treating this as a static import
        const Module = eval('require')('module');
        if (Module && Module.builtinModules) {
          return Module.builtinModules.includes(moduleName);
        }
      } catch {
        // If Module.builtinModules is not available, fallback to manual check
      }
      
      // Fallback: Check using TypeScript's resolution for common built-ins only
      // This is a minimal set that covers the most common cases
      const coreModules = ['fs', 'path', 'http', 'https', 'url', 'os', 'crypto', 'util', 'events', 'stream'];
      return coreModules.includes(moduleName);
    }

    /**
     * Checks if a module path cannot be resolved
     */
    function isModuleNotFound(modulePath: string, currentFilePath: string): boolean {
      // Skip Node.js built-in modules
      if (isBuiltinModule(modulePath)) {
        return false;
      }
      
      // Skip node: prefixed modules
      if (modulePath.startsWith('node:')) {
        const bareModule = modulePath.slice(5);
        return !isBuiltinModule(bareModule);
      }
      
      try {
        // Use TypeScript's module resolution
        const resolved = ts.resolveModuleName(
          modulePath,
          currentFilePath,
          program.getCompilerOptions(),
          ts.sys
        );
        
        return !resolved.resolvedModule;
      } catch {
        return true;
      }
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