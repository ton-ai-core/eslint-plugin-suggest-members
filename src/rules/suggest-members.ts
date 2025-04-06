import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import * as ts from 'typescript';
import { getFormattedMembersList } from '../utils/helpers';

export default ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description: 'Suggests possible members on object property access',
    },
    messages: {
      suggestMembers: 'Property "{{name}}" does not exist on type "{{type}}". Did you mean:\n{{suggestions}}',
      suggestMemberFix: 'Replace with "{{memberName}}"',
    },
    schema: [],
  },

  defaultOptions: [],

  create(context) {
    // Get TypeScript services
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      MemberExpression(node: TSESTree.MemberExpression) {
        // Skip computed properties like obj[foo]
        if (node.computed) return;
        // Skip nested property access
        if (node.parent && 
            node.parent.type === 'MemberExpression' && 
            node.parent.object === node) return;
        // Skip left side of assignment 
        if (node.parent && 
            node.parent.type === 'AssignmentExpression' && 
            node.parent.left === node) return;

        const propertyName = node.property.type === 'Identifier' 
            ? node.property.name 
            : '';
        
        if (!propertyName) return;
        
        // Convert to TS node
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.object);
        const objectType = checker.getTypeAtLocation(tsNode);
        
        // Check if property exists on object
        const symbol = objectType.getProperty(propertyName);
        
        if (!symbol) {
          try {
            // Get type display name
            const typeName = checker.typeToString(objectType);
            
            // Get formatted members list
            const membersList = getFormattedMembersList(
              objectType, 
              checker, 
              tsNode, 
              propertyName
            );
            
            if (membersList.length > 0) {
              // Подготовка подсказок с полными сигнатурами
              context.report({
                node,
                messageId: 'suggestMembers',
                data: {
                  name: propertyName,
                  type: typeName,
                  suggestions: membersList.map(member => `  - ${member}`).join('\n')
                },
                suggest: membersList.map(memberName => {
                  // Extract the property name from the formatted member string
                  const actualName = memberName.split('(')[0].split(':')[0].trim();
                  
                  return {
                    messageId: 'suggestMemberFix',
                    data: { memberName: actualName },
                    fix: fixer => fixer.replaceText(node.property, actualName),
                  };
                }),
              });
            }
          } catch (error) {
            // Continue silently if getting suggestions fails
          }
        }
      }
    };
  },
}); 