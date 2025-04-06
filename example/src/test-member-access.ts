// Тестовый файл для проверки доступа к свойствам
// Этот файл позволяет протестировать отображение нескольких вариантов в сообщениях об ошибках

class Person {
  name: string;
  age: number;
  address: string;
  phone: string;
  email: string;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
  
  getFullName(): string {
    return this.name;
  }
  
  getAge(): number {
    return this.age;
  }
  
  setAddress(address: string): void {
    this.address = address;
  }
  
  setPhone(phone: string): void {
    this.phone = phone;
  }
  
  setEmail(email: string): void {
    this.email = email;
  }
  
  processData(data: string): { processed: boolean, result: any } {
    return { processed: true, result: data };
  }
}

function testAccess() {
  const person = new Person("John", 30);
  
  // Ошибка доступа к несуществующему свойству - должно предложить 5 вариантов со схожими именами
  // включая полные сигнатуры методов
  console.log(person.fooo);
  
  // Ошибка доступа к несуществующему методу - должно показать доступные методы
  person.processDta("test");
}

export default testAccess; 