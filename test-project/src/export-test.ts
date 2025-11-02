// Test export errors
import { nonExistentExport } from 'fs'; // Should suggest real fs exports

console.log(nonExistentExport);