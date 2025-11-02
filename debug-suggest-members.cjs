// Debug version of suggest-members rule
const { ESLintUtils } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/ton-ai-core/eslint-plugin-suggest-members#${name}`
);

const debugSuggestMembersRule = createRule({
  name: "debug-suggest-members",
  meta: {
    type: "problem",
    docs: {
      description: "Debug version of suggest-members rule",
    },
    messages: {
      debug: "DEBUG: {{message}}",
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    console.log('🔍 DEBUG: Rule create() called');
    
    // Check parser services
    let parserServices;
    try {
      parserServices = ESLintUtils.getParserServices(context, false);
      console.log('🔍 DEBUG: Parser services available:', !!parserServices);
    } catch (error) {
      console.log('🔍 DEBUG: Parser services error:', error.message);
      parserServices = null;
    }

    return {
      MemberExpression(node) {
        console.log('🔍 DEBUG: MemberExpression found!');
        console.log('🔍 DEBUG: Node:', {
          type: node.type,
          computed: node.computed,
          optional: node.optional,
          property: node.property?.name || 'unknown',
          object: node.object?.type || 'unknown'
        });
        
        // Test shouldSkipMemberExpression logic
        const shouldSkip = (
          node.computed === true ||
          node.object?.type === "MemberExpression" ||
          node.optional === true
        );
        
        console.log('🔍 DEBUG: Should skip?', shouldSkip);
        
        if (!shouldSkip) {
          // Always report for debugging
          context.report({
            node: node.property || node,
            messageId: "debug",
            data: { 
              message: `Should validate: ${node.property?.name || 'unknown'}` 
            },
          });
        } else {
          console.log('🔍 DEBUG: Skipped node:', node.property?.name);
        }
      }
    };
  },
});

module.exports = { debugSuggestMembersRule };