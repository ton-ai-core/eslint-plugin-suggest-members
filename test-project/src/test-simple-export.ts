// CHANGE: Простой тест для suggest-exports
// WHY: Проверим работает ли правило с очевидными опечатками в экспортах
// PURITY: SHELL - тестовый файл

// helper.ts экспортирует: formatString, calculate
import { formatString } from "./utils/helper"; // Правильно
import { formatStrin } from "./utils/helper"; // Опечатка: отсутствует 'g'

console.log(formatString, formatStrin);