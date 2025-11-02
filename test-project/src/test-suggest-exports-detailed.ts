// CHANGE: Правильный тест для suggest-exports rule
// WHY: Тестируем опечатки в именах экспортов из локальных модулей
// PURITY: SHELL - тестовый файл с импортами
// REF: Понимание что export это то что модуль экспортирует наружу

// Проверим что экспортирует helper.ts
import { formatString } from "./utils/helper"; // Правильный экспорт
import { formatStrin } from "./utils/helper"; // Опечатка: formatStrin -> formatString
import { calculate } from "./utils/helper"; // Правильный экспорт  
import { calculat } from "./utils/helper"; // Опечатка: calculat -> calculate
import { nonExistent } from "./utils/helper"; // Несуществующий экспорт

// Проверим что экспортирует formatter.ts
import { formatDate } from "./utils/formatter"; // Правильный экспорт
import { formatDat } from "./utils/formatter"; // Опечатка: formatDat -> formatDate

console.log(formatString, formatStrin, calculate, calculat, nonExistent, formatDate, formatDat);