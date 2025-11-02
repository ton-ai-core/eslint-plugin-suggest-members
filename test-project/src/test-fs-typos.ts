// Test fs module import typos
// CHANGE: Test obvious typos in fs module imports
// WHY: Verify suggest-imports rule can detect common fs function typos
// PURITY: SHELL - test file with imports

import { readFile } from "fs"; // Correct import
import { readFil } from "fs"; // Typo: readFil -> readFile
import { writeFile } from "fs"; // Correct import  
import { writeFil } from "fs"; // Typo: writeFil -> writeFile
import { readdir } from "fs"; // Correct import
import { readdi } from "fs"; // Typo: readdi -> readdir

console.log(readFile, readFil, writeFile, writeFil, readdir, readdi);