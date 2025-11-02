// Simple test for suggest-module-paths
import { something } from "./nonexistent"; // Should suggest nothing since file doesn't exist
import { formatString } from "./utils/helpr"; // Should suggest: helper

console.log(formatString);