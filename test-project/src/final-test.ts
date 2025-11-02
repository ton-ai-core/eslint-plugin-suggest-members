// Тестируем все 4 правила

// 1. suggest-module-paths
import { helper } from "./utils/helpr"; // Опечатка в пути

// 2. suggest-imports
import { readFileSynk } from "fs"; // Опечатка в импорте

// 3. suggest-exports
import { formatStrin } from "./utils/helper"; // Опечатка в экспорте

// 4. suggest-members
class User {
  name: string = "John";
  age: number = 30;
  getName() { return this.name; }
}

const user = new User();
console.log(user.nam); // Опечатка: nam -> name
console.log(user.ag); // Опечатка: ag -> age
user.getNam(); // Опечатка: getNam -> getName

const arr = [1, 2, 3];
arr.pusj(4); // Опечатка: pusj -> push
