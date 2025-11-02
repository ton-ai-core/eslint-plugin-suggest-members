// Test file with TYPOS in import paths
// These should trigger suggest-module-paths errors:

// ❌ Typo: 'helpr' instead of 'helper'
import { formatString } from "./utils/helpr";

// ❌ Typo: 'formater' instead of 'formatter'
import { formatDate } from "./utils/formater";

// ❌ Typo: 'calculater' instead of 'helper' (which has 'calculate')
import { calculate } from "./utils/calculater";

console.log(formatString("test"));
console.log(formatDate(new Date()));
console.log(calculate(1, 2));
