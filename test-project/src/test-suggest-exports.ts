// Test suggest-exports rule - typos in local module exports

import { formatStrin } from "./utils/helper"; // Typo: formatStrin -> formatString
import { calculat } from "./utils/helper"; // Typo: calculat -> calculate
import { formatDat } from "./utils/formatter"; // Typo: formatDat -> formatDate

console.log(formatStrin, calculat, formatDat);
