import { ESLintUtils } from '@typescript-eslint/utils';
import path from 'path';
import suggestMembersRule from './rules/suggest-members';
import suggestImportsRule from './rules/suggest-imports';

/**
 * Plugin rules
 */
export const rules = {
  'suggest-members': suggestMembersRule,
  'suggest-imports': suggestImportsRule,
};

/**
 * Plugin metadata
 */
export const meta = {
  name: 'eslint-plugin-suggest-members',
  version: '1.5.2',
};

/**
 * Recommended configurations
 */
export const configs = {
  recommended: {
    plugins: ['suggest-members'],
    rules: {
      'suggest-members/suggest-members': 'warn',
      'suggest-members/suggest-imports': 'warn',
    },
  },
};

// Create plugin with rules, meta and configs
const plugin = {
  rules,
  meta,
  configs
};

// Try to register the formatter if we're not in a test environment
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const formatters = (ESLintUtils as any).formatters as Record<string, any> | undefined;
    
    if (formatters) {
      const formatterPath = path.resolve(__dirname, '../formatters/full-format-style.js');
      
      // Using dynamic import for ESM compatibility
      // This will be handled asynchronously
      import(formatterPath)
        .then(formatter => {
          if (!formatters['full-format-style']) {
            formatters['full-format-style'] = formatter.default || formatter;
            console.log('Successfully registered full-format-style formatter.');
          }
        })
        .catch(() => {
          // Silently fail - formatter registration is optional
        });
    }
  } catch {
    // Silently ignore - formatter registration is optional
  }
}

// Export plugin as default
export default plugin; 