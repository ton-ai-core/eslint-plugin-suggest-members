// Test file with CORRECT import paths - should have NO errors

// ✅ All these imports should be valid
import { formatString, calculate } from "./utils/helper";
import { formatDate } from "./utils/formatter";

console.log(formatString("test"));
console.log(formatDate(new Date()));
console.log(calculate(1, 2));
