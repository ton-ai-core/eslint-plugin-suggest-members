// Тестовый файл с неправильным импортом
import { readFileSnc } from "fs";

// Использование неправильного импорта
function testFunction() {
  const data = readFileSnc("test.txt");
  return data;
} 