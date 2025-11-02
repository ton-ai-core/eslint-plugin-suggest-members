// CHANGE: Тест для suggest-imports с npm модулями
// WHY: suggest-imports должен работать с экспортами из node_modules
// PURITY: SHELL - тестовый файл

// fs модуль экспортирует: readFileSync, writeFileSync, etc.
import { readFileSync } from "fs"; // Правильно
import { readFileSyn } from "fs"; // Опечатка: отсутствует 'c'
import { writeFileSync } from "fs"; // Правильно  
import { writeFileSyn } from "fs"; // Опечатка: отсутствует 'c'

console.log(readFileSync, readFileSyn, writeFileSync, writeFileSyn);