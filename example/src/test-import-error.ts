// Тестовый файл с ошибкой импорта
import { Arraay, readFilee } from "fs";
import { Proomise, SetTimeoutt } from "node:timers";

function testFunction() {
  const data = readFilee("test.txt");
  const promise = new Proomise((resolve) => {
    SetTimeoutt(() => resolve("done"), 1000);
  });
  
  return promise;
} 