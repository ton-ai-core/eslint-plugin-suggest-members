class RequestedExample {
  ping() {
    return 'pong';
  }
  foo = 123;
  processData(data: string) {
    return data.toUpperCase();
  }
  getFullName() {
    return 'Test';
  }
}

const example = new RequestedExample();
example.getFullNam(); // Опечатка: getFullNam вместо getFullName 