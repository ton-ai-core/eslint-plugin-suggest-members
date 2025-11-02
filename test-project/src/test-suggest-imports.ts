// Test suggest-imports rule - typos in node module imports

import { readFileSynk } from "fs"; // Typo: readFileSynk -> readFileSync
import { readdirSynk } from "fs"; // Typo: readdirSynk -> readdirSync
import { existsSynk } from "fs"; // Typo: existsSynk -> existsSync
