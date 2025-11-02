// CHANGE: Тест для suggest-members с методами объектов
// WHY: suggest-members должен работать с методами и свойствами объектов
// PURITY: SHELL - тестовый файл с побочными эффектами

const str = "hello world";
str.toUpperCase(); // Правильно
str.toUpperCas(); // Опечатка: отсутствует 'e'

const arr = [1, 2, 3];
arr.push(4); // Правильно
arr.pusj(5); // Опечатка: 'j' вместо 'h'

const obj = { name: "test", value: 42 };
obj.hasOwnProperty("name"); // Правильно
obj.hasOwnPropert("name"); // Опечатка: отсутствует 'y'

console.log("Test completed");