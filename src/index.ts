import { ESLintUtils } from '@typescript-eslint/utils';
import path from 'path';
import suggestMembersRule from './rules/suggest-members';
import suggestImportsRule from './rules/suggest-imports';
import suggestModulePathsRule from './rules/suggest-module-paths';

/**
 * Plugin rules
 */
export const rules = {
  'suggest-members': suggestMembersRule,
  'suggest-imports': suggestImportsRule,
  'suggest-module-paths': suggestModulePathsRule,
};

/**
 * Plugin metadata
 */
export const meta = {
  name: 'eslint-plugin-suggest-members',
  version: '1.6.0',
};

/**
 * Recommended configurations
 */
export const configs: Record<string, unknown> = {
  // Legacy-style config (for eslintrc or flat via plugin reference)
  recommended: {
    plugins: ['@ton-ai-core/suggest-members'],
    rules: {
      '@ton-ai-core/suggest-members/suggest-members': 'error',
      '@ton-ai-core/suggest-members/suggest-imports': 'error',
      '@ton-ai-core/suggest-members/suggest-module-paths': 'error',
    },
  },
  // Flat config convenience export
  'flat/recommended': [
    {
      plugins: {},
      rules: {
        '@ton-ai-core/suggest-members/suggest-members': 'error',
        '@ton-ai-core/suggest-members/suggest-imports': 'error',
        '@ton-ai-core/suggest-members/suggest-module-paths': 'error',
      },
    },
  ],
};

// Create plugin with rules, meta and configs
const plugin = {
  rules,
  meta,
  configs
};

// Patch flat config to reference this plugin instance
if (Array.isArray(configs['flat/recommended'])) {
  const flat = configs['flat/recommended'] as Array<{ plugins: Record<string, unknown> }>;
  flat[0].plugins['@ton-ai-core/suggest-members'] = plugin as unknown as Record<string, unknown>;
}

// Try to register the formatter if we're not in a test environment
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const formatters = (ESLintUtils as unknown as { formatters?: Record<string, unknown> }).formatters;
    
    if (formatters) {
      const formatterPath = path.resolve(__dirname, '../formatters/full-format-style.js');
      
      // Using dynamic import for ESM compatibility
      // This will be handled asynchronously
      import(formatterPath)
        .then((formatter: { default?: unknown }) => {
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