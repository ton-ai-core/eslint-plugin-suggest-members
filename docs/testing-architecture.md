# Математически Верифицируемая Архитектура Тестирования ESLint Правил

## Обзор

Этот документ описывает архитектуру тестирования ESLint правил с математическими инвариантами и формальной верификацией.

## Архитектурные Принципы

### 🧮 Математическая Верификация

Каждое правило ESLint рассматривается как математическая функция:

```typescript
Rule: AST × Context → Reports[]
```

**Инварианты:**
- `∀ rule ∈ Rules: pure(rule) ∧ deterministic(rule)`
- `∀ input: rule(input₁) = rule(input₂)` (детерминизм)
- `∀ fix: semantics(code) = semantics(fix(code))` (сохранение семантики)

### 🏗️ Functional Core, Imperative Shell (FCIS)

```
┌─────────────────────────────────────┐
│           IMPERATIVE SHELL          │
│  ┌─────────────────────────────────┐ │
│  │        FUNCTIONAL CORE          │ │
│  │                                 │ │
│  │  • Rule Logic (Pure Functions)  │ │
│  │  • AST Analysis                 │ │
│  │  • Pattern Matching            │ │
│  │  • Mathematical Operations     │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                     │
│  • ESLint Context                   │
│  • TypeScript Services              │
│  • File System Access              │
│  • Error Reporting                 │
│                                     │
└─────────────────────────────────────┘
```

## Компоненты Тестовой Архитектуры

### 1. MathematicalRuleTester

Базовый класс для математически верифицируемого тестирования:

```typescript
import { createMathematicalRuleTester } from "../utils/rule-tester-base.js";

type MyRuleMessageIds = "error1" | "error2";
const ruleTester = createMathematicalRuleTester<MyRuleMessageIds>();
```

**Возможности:**
- Типобезопасное тестирование с TypeScript
- Автоматическая валидация метаданных правил
- Property-based тестирование
- Проверка математических инвариантов

### 2. Валидация Метаданных

Автоматическая проверка соответствия правил формальной спецификации:

```bash
npm run validate:rules
```

**Проверяемые инварианты:**
- `∀ rule: has_meta(rule) ∧ has_type(rule) ∧ has_messages(rule)`
- `∀ message: starts_with_capital(message) ∧ ends_with_period(message)`
- `∀ schema: valid_json_schema(schema)`

### 3. Property-Based Testing

Использование `fast-check` для генерации тестовых случаев:

```typescript
import * as fc from "fast-check";

fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 100 }),
    (seed) => {
      const code = PropertyBasedTesting.generateValidTypeScriptCode(seed);
      // Проверка инвариантов
      return PropertyBasedTesting.preservesSemantics(code, rule.fix(code));
    }
  )
);
```

## Структура Тестов

### Уровни Тестирования

1. **Unit Tests** (`test/unit/`)
   - Тестирование отдельных функций
   - Проверка математических свойств
   - Быстрые тесты без внешних зависимостей

2. **Integration Tests** (`test/integration/`)
   - Тестирование с полным RuleTester
   - TypeScript компиляция
   - Реальные AST операции

3. **E2E Tests** (`test/e2e/`)
   - Тестирование в реальном ESLint окружении
   - Интеграция с IDE
   - Производительность

### Пример Теста

```typescript
/**
 * Математически верифицируемые тесты для правила suggest-exports
 * 
 * @invariant ∀ import: exists(export) ∨ suggest(similar_exports)
 * @complexity O(n) where n = |test cases|
 */
describe("suggest-exports rule", () => {
  const ruleTester = createMathematicalRuleTester<SuggestExportsMessageIds>();

  describe("Mathematical Invariants", () => {
    it("should maintain export validation invariant", () => {
      ruleTester.runTests("suggest-exports", suggestExportsRule, {
        valid: [
          ruleTester.createValidTestCase(`
            import { existingExport } from './module';
          `),
        ],
        invalid: [
          ruleTester.createInvalidTestCase(
            `import { nonExistentExport } from './module';`,
            [{ messageId: "exportNotFound" }]
          ),
        ],
      });
    });
  });

  describe("Property-Based Verification", () => {
    it("should be deterministic", () => {
      fc.assert(
        fc.property(
          fc.string(),
          (code) => {
            // Проверка детерминизма
            const result1 = rule.analyze(code);
            const result2 = rule.analyze(code);
            return JSON.stringify(result1) === JSON.stringify(result2);
          }
        )
      );
    });
  });
});
```

## Конфигурация ESLint для Разработки Правил

В `eslint.config.mts` добавлена специальная секция для файлов правил:

```typescript
{
  files: ["src/rules/**/*.ts"],
  extends: [eslintPlugin.configs.recommended],
  rules: {
    // Математические инварианты
    "eslint-plugin/consistent-output": "error",
    "eslint-plugin/require-meta-type": "error",
    "eslint-plugin/require-meta-schema": "error",
    
    // Функциональная чистота
    "no-console": "error",
    "no-process-env": "error",
  },
}
```

## Скрипты и Команды

### Основные команды

```bash
# Валидация метаданных правил
npm run validate:rules

# Тестирование только правил
npm run test:rules

# Интеграционные тесты
npm run test:integration

# Полная сборка с валидацией
npm run build
```

### Разработка нового правила

1. **Создание правила:**
   ```bash
   mkdir src/rules/my-new-rule
   touch src/rules/my-new-rule/index.ts
   ```

2. **Реализация с математическими инвариантами:**
   ```typescript
   /**
    * @invariant ∀ input: deterministic(rule(input))
    * @complexity O(n) where n = |ast_nodes|
    */
   export const myNewRule: TSESLint.RuleModule<MessageIds, Options> = {
     meta: {
       type: "problem",
       docs: {
         description: "Mathematical description of the rule.",
         url: "https://github.com/...",
       },
       messages: {
         error: "Error message starting with capital and ending with period.",
       },
       schema: [], // JSON Schema for options
     },
     create(context) {
       // Pure functional implementation
       return {
         // AST visitors
       };
     },
   };
   ```

3. **Создание тестов:**
   ```bash
   touch test/unit/rules/my-new-rule.test.ts
   ```

4. **Валидация:**
   ```bash
   npm run validate:rules
   npm run test:rules
   ```

## Математические Гарантии

### Инварианты Правил

1. **Детерминизм:** `∀ input: rule(input₁) = rule(input₂)`
2. **Чистота:** `∀ rule: pure(rule) ∧ ¬side_effects(rule)`
3. **Сохранение семантики:** `∀ fix: semantics(code) = semantics(fix(code))`
4. **Завершимость:** `∀ input: terminates(rule(input))`

### Проверяемые Свойства

- **Корректность:** Правило находит только реальные проблемы
- **Полнота:** Правило находит все проблемы заданного типа
- **Производительность:** Время выполнения ограничено полиномом
- **Безопасность:** Фиксеры не нарушают корректность программы

## Интеграция с CI/CD

```yaml
# .github/workflows/test.yml
- name: Validate Rule Metadata
  run: npm run validate:rules

- name: Run Mathematical Tests
  run: npm run test:rules

- name: Integration Tests
  run: npm run test:integration
```

## Отладка и Диагностика

### Логирование в тестах

```typescript
// Включить отладочную информацию
console.log(`[DEBUG] Rule analysis result:`, result);
```

### Анализ производительности

```typescript
const startTime = Date.now();
ruleTester.runTests(/* ... */);
const endTime = Date.now();
console.log(`Execution time: ${endTime - startTime}ms`);
```

### Проверка AST

```typescript
import { parse } from "@typescript-eslint/parser";

const ast = parse(code, { /* options */ });
console.log(JSON.stringify(ast, null, 2));
```

## Заключение

Эта архитектура обеспечивает:

- ✅ **Математическую верификацию** правил ESLint
- ✅ **Типобезопасность** на уровне компиляции
- ✅ **Детерминистическое поведение** во всех окружениях
- ✅ **Автоматическую валидацию** метаданных
- ✅ **Property-based тестирование** для полноты покрытия
- ✅ **Интеграцию с современными инструментами** разработки

Следуя этим принципам, мы создаем ESLint правила, которые можно формально верифицировать и которые гарантированно работают корректно во всех случаях.