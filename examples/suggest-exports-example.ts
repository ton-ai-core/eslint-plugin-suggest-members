// CHANGE: Example demonstrating suggest-exports rule
// WHY: Show how the rule helps with export name typos
// PURITY: EXAMPLE

// ❌ These would trigger suggest-exports rule:

// Typo in React hook name
// import { useStae } from 'react';
// Rule would suggest: useState, useRef, useEffect, etc.

// Typo in Node.js fs module
// import { readFil } from 'fs';
// Rule would suggest: readFile, readdir, readSync, etc.

// Typo in Angular core
// import { Componet } from '@angular/core';
// Rule would suggest: Component, Injectable, Directive, etc.

// Multiple typos in same import
// import { useStae, useEfect } from 'react';
// Rule would suggest corrections for both

// ✅ These are correct and won't trigger the rule:

import { useState, useEffect, useRef } from 'react';
import { readFile, writeFile, existsSync } from 'fs';
import { Component, Injectable } from '@angular/core';

// Example usage
export function ExampleComponent() {
	const [count, setCount] = useState(0);
	
	useEffect(() => {
		console.log('Component mounted');
	}, []);
	
	return count;
}

// INVARIANT: ∀ import: exists(export) ∨ suggest(similar_exports)
// The rule ensures that either:
// 1. The imported name exists in the module (valid case)
// 2. Similar export names are suggested (typo case)