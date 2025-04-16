import { ESLintUtils, TSESTree, TSESLint } from '@typescript-eslint/utils';
import { 
  findPossibleExports, 
  findSimilarLocalSymbols, 
  isTypescriptGlobal,
} from '../utils/helpers';


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
    // Get TypeScript services
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    /**
     * Handles named imports that don't exist
     */
    function handleInvalidNamedImport(node: TSESTree.ImportSpecifier, sourceValue: string): void {
      const importName = node.imported.type === 'Identifier' ? node.imported.name : '';
      
      // Try to find similar exports
      try {
        // Get the module symbol directly
        const sourceNode = node.parent?.parent as TSESTree.ImportDeclaration;
        if (!sourceNode || !sourceNode.source) {
          return;
        }
        
        const moduleNode = parserServices.esTreeNodeToTSNodeMap.get(sourceNode.source);
        const moduleSymbol = checker.getSymbolAtLocation(moduleNode);
        
        if (!moduleSymbol) {
          return;
        }
        
        const possibleExports = findPossibleExports(checker, importName, moduleSymbol);
        
        // Report with suggestions if any found
        if (possibleExports.length > 0) {
          const suggestionsText = possibleExports.map(suggestion => 
            `  - ${suggestion.name}`).join('\n');
          
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
              fix: (fixer): TSESLint.RuleFix => fixer.replaceText(node.imported, suggestion.name),
            })),
          });
        } else {
          // Report without suggestions
          context.report({
            node,
            messageId: 'importNotFound',
            data: {
              name: importName,
              module: sourceValue,
            },
          });
        }
      } catch {
        // If module resolution fails, report without suggestions
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
    function handleUndefinedIdentifier(node: TSESTree.Identifier): void {
      const variableName = node.name;
      
      // Convert to TS node
      const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
      
      // Find similar local symbols
      const similarSymbols = findSimilarLocalSymbols(checker, tsNode, variableName);
      
      // Report with suggestions if any found
      if (similarSymbols.length > 0) {
        const suggestionsText = similarSymbols.map(symbol => 
          `  - ${symbol.name}`).join('\n');
          
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
            fix: (fixer): TSESLint.RuleFix => fixer.replaceText(node, symbol.name),
          })),
        });
      } else {
        // Report without suggestions
        context.report({
          node,
          messageId: 'undefinedVar',
          data: { name: variableName },
        });
      }
    }

    return {
      // Check import specifiers
      'ImportSpecifier'(node: TSESTree.ImportSpecifier): void {
        
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
            return;
          }
          
          
          const sourceValue = typeof importDeclaration.source?.value === 'string' 
            ? importDeclaration.source.value
            : '';
          
          if (!sourceValue) {
            return;
          }
          
          // Универсальная обработка импортов через TypeScript Compiler API
          if (node.imported.type === 'Identifier') {
            const importName = node.imported.name;
            
            try {
              // Получаем модуль и его экспорты через TypeScript
              const moduleNode = parserServices.esTreeNodeToTSNodeMap.get(importDeclaration.source);
              const moduleSymbol = checker.getSymbolAtLocation(moduleNode);
              
              if (moduleSymbol) {
                const exports = checker.getExportsOfModule(moduleSymbol);
                
                const exportExists = exports.some(exp => exp.getName() === importName);
                
                if (!exportExists) {
                  
                  // Используем функцию findPossibleExports для поиска похожих экспортов
                  const possibleExports = findPossibleExports(checker, importName, moduleSymbol);
                  
                  if (possibleExports.length > 0) {
                    const suggestionsText = possibleExports
                      .map(p => `  - ${p.name})`)
                      .join('\n');
                    
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
                        fix: (fixer): TSESLint.RuleFix => fixer.replaceText(node.imported, suggestion.name),
                      })),
                    });
                  } else {
                    // Если похожих экспортов не найдено, выводим сообщение без предложений
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
                // Пробуем запасной подход через handleInvalidNamedImport
                handleInvalidNamedImport(node, sourceValue);
              }
            } catch {
              // В случае ошибки используем запасной подход
              handleInvalidNamedImport(node, sourceValue);
            }
          }
        } catch {
          // If we can't find the import declaration, proceed silently
        }
      },
      
      // Check identifiers
      'Identifier'(node: TSESTree.Identifier): void {
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