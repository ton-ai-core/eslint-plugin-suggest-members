class MyClass {
  ping() {
    return 'pong';
  }
  foo = 123;
  foo1 = 123;
  processData(data: string) {
    return data.toUpperCase();
  }
  getFullName() {
    return 'Test';
  }
}

// Correct usage
const obj = new MyClass();
obj.ping();
console.log(obj.foo);
obj.processData('hello');
obj.getFullName();

// Ошибки, которые должен найти плагин с помощью алгоритма Jaro-Winkler
console.log(obj.fooo); // Опечатка: fooo вместо foo
obj.procesData('world'); // Опечатка: procesData вместо processData
obj.getFullNam(); // Опечатка: getFullNam вместо getFullName 