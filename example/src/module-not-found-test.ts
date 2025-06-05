// Examples of non-existent modules for testing suggest-module-paths

// Typo in relative path - should be './example'
import { something } from './exampl';

// Typo in filename - should be './testfile'
import test from './testfil';

// Typo in node_modules package - should be 'fs'
import { readFile } from 'f';

// Typo in scoped package - should be '@typescript-eslint/utils'
import { ESLintUtils } from '@typescript-eslint/util';

// Typo in directory path
import { helper } from '../sr/utils/helpers';

// Using require with typo
const path = require('pat');

// Non-existent relative module
const data = require('./non-existent-modul');

export default {}; 