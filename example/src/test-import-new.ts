// Тестовый файл для проверки работы правила suggest-imports
import { Bufffer, readFileSyncc } from 'fs';
import { Arrayy } from './example';

class TestClass {
  constructor() {
    // Ошибка в имени импортированной функции
    const data = readFileSyncc('test.txt');
    
    // Ошибка в именои импортированного класса
    const buffer = new Bufffer();
    
    // Ошибка в имени локального импорта
    const arr = new Arrayy();
  }
}

export default TestClass; 