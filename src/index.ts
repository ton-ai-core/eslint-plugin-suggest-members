import { ESLintUtils } from '@typescript-eslint/utils';
import path from 'path';
import suggestMembersRule from './rules/suggest-members';
import suggestImportsRule from './rules/suggest-imports';

/**
 * Правила плагина
 */
export const rules = {
  'suggest-members': suggestMembersRule,
  'suggest-imports': suggestImportsRule,
};

/**
 * Метаданные плагина
 */
export const meta = {
  name: 'eslint-plugin-suggest-members',
  version: '1.1.4',
};

/**
 * Рекомендуемые конфигурации
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

// Создаем плагин с полями rules, meta и configs
const plugin = {
  rules,
  meta,
  configs
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

// Экспортируем отдельно поля для возможности импорта { rules, meta, configs }
export default plugin;

// Добавляем поддержку module.exports = ... для CommonJS
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof module !== 'undefined' && (module as any).exports) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (module as any).exports = Object.assign((module as any).exports.default || {}, (module as any).exports, plugin);
} 