import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import * as ts from 'typescript';
import { 
  findPossibleExports, 
  findSimilarLocalSymbols, 
  isTypescriptGlobal,
  computeCompositeScore
} from '../utils/helpers';

// Включаем отладочный вывод
const DEBUG = true;
const debug = (...args: any[]) => {
  if (DEBUG) {
    console.log('[DEBUG:suggest-imports]', ...args);
  }
};

export default ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggests possible exports when referencing non-existent imports',
    },
    hasSuggestions: true,
    messages: {
      importNotFound: 'Import "{{name}}" is not defined in module "{{module}}".',
      importWithSuggestions: 'Import "{{name}}" is not defined in module "{{module}}". Did you mean:\n{{suggestions}}',
      suggestImport: 'Replace with "{{memberName}}"',
      undefinedVar: 'Variable "{{name}}" is not defined.',
      undefinedVarWithSuggestions: 'Variable "{{name}}" is not defined. Did you mean:\n{{suggestions}}',
      suggestLocalVar: 'Replace with "{{varName}}"'
    },
    schema: [],
  },

  defaultOptions: [],

  create(context) {
    debug('Initializing suggest-imports rule');
    // Get TypeScript services
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    /**
     * Handles named imports that don't exist
     */
    function handleInvalidNamedImport(node: TSESTree.ImportSpecifier, sourceValue: string) {
      const importName = node.imported.type === 'Identifier' ? node.imported.name : '';
      debug(`Handling invalid import: ${importName} from ${sourceValue}`);
      
      // Try to find similar exports
      try {
        // Get the module symbol directly
        const sourceNode = node.parent?.parent as TSESTree.ImportDeclaration;
        if (!sourceNode || !sourceNode.source) {
          debug('Source node or source not found');
          return;
        }
        
        debug(`Trying to get symbol for module: ${sourceValue}`);
        const moduleNode = parserServices.esTreeNodeToTSNodeMap.get(sourceNode.source);
        const moduleSymbol = checker.getSymbolAtLocation(moduleNode);
        
        if (!moduleSymbol) {
          debug('Module symbol not found');
          return;
        }
        
        debug(`Found module symbol: ${moduleSymbol.getName()}`);
        
        // Find possible exports from the module matching the import
        debug(`Looking for possible exports similar to: ${importName}`);
        const possibleExports = findPossibleExports(checker, importName, moduleSymbol);
        debug(`Found ${possibleExports.length} possible exports:`, possibleExports);
        
        // Report with suggestions if any found
        if (possibleExports.length > 0) {
          const suggestionsText = possibleExports.map(suggestion => 
            `  - ${suggestion.name}`).join('\n');
          
          debug(`Reporting with suggestions: ${suggestionsText}`);  
          context.report({
            node,
            messageId: 'importWithSuggestions',
            data: {
              name: importName,
              module: sourceValue,
              suggestions: suggestionsText
            },
            suggest: possibleExports.map(suggestion => ({
              messageId: 'suggestImport',
              data: { memberName: suggestion.name },
              fix: (fixer) => fixer.replaceText(node.imported, suggestion.name),
            })),
          });
        } else {
          // Report without suggestions
          debug(`No suggestions found, reporting without suggestions`);
          context.report({
            node,
            messageId: 'importNotFound',
            data: {
              name: importName,
              module: sourceValue,
            },
          });
        }
      } catch (error) {
        // If module resolution fails, report without suggestions
        debug(`Error handling import: ${error}`);
        context.report({
          node,
          messageId: 'importNotFound',
          data: {
            name: importName,
            module: sourceValue,
          },
        });
      }
    }

    /**
     * Handles identifiers that aren't defined
     */
    function handleUndefinedIdentifier(node: TSESTree.Identifier) {
      const variableName = node.name;
      debug(`Handling undefined identifier: ${variableName}`);
      
      // Convert to TS node
      const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
      
      // Find similar local symbols
      debug(`Looking for similar local symbols for: ${variableName}`);
      const similarSymbols = findSimilarLocalSymbols(checker, tsNode, variableName);
      debug(`Found ${similarSymbols.length} similar symbols:`, similarSymbols);
      
      // Report with suggestions if any found
      if (similarSymbols.length > 0) {
        const suggestionsText = similarSymbols.map(symbol => 
          `  - ${symbol.name}`).join('\n');
          
        debug(`Reporting with suggestions: ${suggestionsText}`);
        context.report({
          node,
          messageId: 'undefinedVarWithSuggestions',
          data: { 
            name: variableName,
            suggestions: suggestionsText
          },
          suggest: similarSymbols.map(symbol => ({
            messageId: 'suggestLocalVar',
            data: { varName: symbol.name },
            fix: (fixer) => fixer.replaceText(node, symbol.name),
          })),
        });
      } else {
        // Report without suggestions
        debug(`No similar symbols found, reporting without suggestions`);
        context.report({
          node,
          messageId: 'undefinedVar',
          data: { name: variableName },
        });
      }
    }

    return {
      // Check import specifiers
      'ImportSpecifier'(node: TSESTree.ImportSpecifier) {
        debug('Checking ImportSpecifier', node.imported);
        
        try {
          // Находим родительский ImportDeclaration
          let current: TSESTree.Node | undefined = node;
          let importDeclaration: TSESTree.ImportDeclaration | null = null;
          
          // Поднимаемся по дереву, пока не найдем ImportDeclaration
          while (current && !importDeclaration) {
            if (current.type === 'ImportDeclaration') {
              importDeclaration = current as TSESTree.ImportDeclaration;
              break;
            }
            current = current.parent;
          }
          
          if (!importDeclaration) {
            debug('ImportDeclaration not found in parent chain');
            return;
          }
          
          debug('Import source:', importDeclaration.source?.value);
          
          const sourceValue = typeof importDeclaration.source?.value === 'string' 
            ? importDeclaration.source.value
            : '';
          
          if (!sourceValue) {
            debug('Source value is empty');
            return;
          }
          
          debug(`Processing import from: ${sourceValue}`);
          
          // Универсальная обработка импортов через TypeScript Compiler API
          if (node.imported.type === 'Identifier') {
            const importName = node.imported.name;
            debug(`Checking import: ${importName} from ${sourceValue}`);
            
            try {
              // Получаем модуль и его экспорты через TypeScript
              const moduleNode = parserServices.esTreeNodeToTSNodeMap.get(importDeclaration.source);
              const moduleSymbol = checker.getSymbolAtLocation(moduleNode);
              
              if (moduleSymbol) {
                debug(`Found module symbol: ${moduleSymbol.getName()}`);
                const exports = checker.getExportsOfModule(moduleSymbol);
                debug(`Module has ${exports.length} exports`);
                
                const exportExists = exports.some(exp => exp.getName() === importName);
                debug(`Export ${importName} exists: ${exportExists}`);
                
                if (!exportExists) {
                  debug(`Export ${importName} not found, handling invalid import`);
                  
                  // Используем функцию findPossibleExports для поиска похожих экспортов
                  const possibleExports = findPossibleExports(checker, importName, moduleSymbol);
                  
                  if (possibleExports.length > 0) {
                    const suggestionsText = possibleExports
                      .map(p => `  - ${p.name} (score: ${p.score.toFixed(2)})`)
                      .join('\n');
                    
                    debug(`Reporting with suggestions: ${suggestionsText}`);
                    
                    context.report({
                      node,
                      messageId: 'importWithSuggestions',
                      data: {
                        name: importName,
                        module: sourceValue,
                        suggestions: suggestionsText
                      },
                      suggest: possibleExports.map(suggestion => ({
                        messageId: 'suggestImport',
                        data: { memberName: suggestion.name },
                        fix: (fixer) => fixer.replaceText(node.imported, suggestion.name),
                      })),
                    });
                  } else {
                    // Если похожих экспортов не найдено, выводим сообщение без предложений
                    debug('No suggestions found for import');
                    context.report({
                      node,
                      messageId: 'importNotFound',
                      data: {
                        name: importName,
                        module: sourceValue,
                      },
                    });
                  }
                }
              } else {
                debug(`Module symbol not found for ${sourceValue}, trying fallback approach`);
                // Пробуем запасной подход через handleInvalidNamedImport
                handleInvalidNamedImport(node, sourceValue);
              }
            } catch (error) {
              debug(`Error processing import with TypeScript API: ${error}, trying fallback`);
              // В случае ошибки используем запасной подход
              handleInvalidNamedImport(node, sourceValue);
            }
          }
        } catch (error) {
          // If we can't find the import declaration, proceed silently
          debug(`Error checking import: ${error}`);
        }
      },
      
      // Check identifiers
      'Identifier'(node: TSESTree.Identifier) {
        // Skip identifiers in certain positions
        if (
          node.parent &&
          (node.parent.type === 'ImportSpecifier' || 
           node.parent.type === 'ImportDefaultSpecifier' ||
           node.parent.type === 'ImportNamespaceSpecifier' ||
           node.parent.type === 'Property' && (node.parent as TSESTree.Property).key === node ||
           node.parent.type === 'MemberExpression' && (node.parent as TSESTree.MemberExpression).property === node ||
           node.parent.type === 'MethodDefinition' ||
           node.parent.type === 'ClassDeclaration' ||
           node.parent.type === 'FunctionDeclaration' ||
           node.parent.type === 'TSDeclareFunction' ||
           node.parent.type === 'VariableDeclarator' && (node.parent as TSESTree.VariableDeclarator).id === node)
        ) {
          return;
        }
        
        // Проверка на наличие getScope в context
        if (typeof context.getScope === 'function') {
          // Используем ESLint API для получения области видимости
          const scope = context.getScope();
          const variable = scope.variables.find(v => v.name === node.name);
          
          if (!variable) {
            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const symbol = checker.getSymbolAtLocation(tsNode);
            
            // If no symbol found and not a global, it's undefined
            if (!symbol && !isTypescriptGlobal(node.name)) {
              handleUndefinedIdentifier(node);
            }
          }
        } else {
          // Если getScope недоступен, используем только TypeScript для проверки
          const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
          const symbol = checker.getSymbolAtLocation(tsNode);
          
          if (!symbol && !isTypescriptGlobal(node.name)) {
            handleUndefinedIdentifier(node);
          }
        }
      }
    };
  },
}); 