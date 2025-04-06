import { ESLintUtils } from '@typescript-eslint/utils';
import path from 'path';
import suggestMembersRule from './rules/suggest-members';
import suggestImportsRule from './rules/suggest-imports';

const plugin = {
  rules: {
    'suggest-members': suggestMembersRule,
    'suggest-imports': suggestImportsRule,
  },
  meta: {
    name: 'eslint-plugin-suggest-members',
    version: '1.1.4',
  },
  configs: {
    recommended: {
      plugins: ['suggest-members'],
      rules: {
        'suggest-members/suggest-members': 'warn',
        'suggest-members/suggest-imports': 'warn',
      },
    },
  }
};

// Register the full-format-style formatter for direct use with ESLint
try {
  // Only attempt to register if we're not in test mode
  if (process.env.NODE_ENV !== 'test') {
    const formatters = (ESLintUtils as any).formatters as Record<string, any> | undefined;
    
    if (formatters) {
      const formatterPath = path.resolve(__dirname, '../formatters/full-format-style.js');
      
      try {
        // Using require() to load the formatter dynamically
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const formatter = require(formatterPath);
        
        // Add the formatter to the registry if it's not already there
        if (!formatters['full-format-style']) {
          formatters['full-format-style'] = formatter;
          console.log('Successfully registered full-format-style formatter.');
        }
      } catch (error) {
        console.error('Failed to load full-format-style formatter:', error);
      }
    }
  }
} catch (error) {
  // Silently ignore - formatter registration is optional
}

export default plugin; 