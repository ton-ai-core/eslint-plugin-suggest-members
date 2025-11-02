class MyClass {
  property = 123;
  getCounter() { return 0; }
}

const obj = new MyClass();
obj.propert; // Typo: propert -> property
obj.getCoun(); // Typo: getCoun -> getCounter
