#!/usr/bin/env npx ts-node

/**
 * Упрощенный скрипт валидации правил ESLint
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
	const distRulesDir = path.resolve(__dirname, "../dist/rules");
	
	if (!fs.existsSync(distRulesDir)) {
		console.log("❌ dist/rules directory not found. Run 'npm run build' first.");
		process.exit(1);
	}
	
	console.log("🔍 Validating ESLint Rules");
	console.log("=" .repeat(30));
	
	const entries = fs.readdirSync(distRulesDir, { withFileTypes: true });
	let validCount = 0;
	let totalCount = 0;
	
	for (const entry of entries) {
		if (entry.isDirectory()) {
			totalCount++;
			const rulePath = path.join(distRulesDir, entry.name, "index.js");
			
			if (fs.existsSync(rulePath)) {
				try {
					const ruleModule = await import(path.resolve(rulePath));
					
					// Find the rule export
					const exports = Object.keys(ruleModule);
					const ruleExport = exports.find(key => 
						ruleModule[key] && 
						typeof ruleModule[key] === 'object' && 
						ruleModule[key].meta && 
						ruleModule[key].create
					);
					
					if (ruleExport) {
						const rule = ruleModule[ruleExport];
						
						// Basic validation
						const hasType = rule.meta.type && ["problem", "suggestion", "layout"].includes(rule.meta.type);
						const hasMessages = rule.meta.messages && Object.keys(rule.meta.messages).length > 0;
						const hasCreate = typeof rule.create === "function";
						
						if (hasType && hasMessages && hasCreate) {
							console.log(`✅ ${entry.name} - Valid (export: ${ruleExport})`);
							validCount++;
						} else {
							console.log(`❌ ${entry.name} - Invalid metadata`);
							if (!hasType) console.log(`   Missing or invalid type`);
							if (!hasMessages) console.log(`   Missing messages`);
							if (!hasCreate) console.log(`   Missing create function`);
						}
					} else {
						console.log(`❌ ${entry.name} - No rule export found. Available: ${exports.join(', ')}`);
					}
				} catch (error) {
					console.log(`❌ ${entry.name} - Failed to load: ${error}`);
				}
			} else {
				console.log(`❌ ${entry.name} - index.js not found`);
			}
		}
	}
	
	console.log("\n📊 Summary:");
	console.log(`   Valid: ${validCount}/${totalCount}`);
	console.log(`   Success rate: ${(validCount / totalCount * 100).toFixed(1)}%`);
	
	if (validCount === totalCount) {
		console.log("\n🎉 All rules are valid!");
		process.exit(0);
	} else {
		console.log("\n💥 Some rules need attention.");
		process.exit(1);
	}
}

main().catch(error => {
	console.error("Script failed:", error);
	process.exit(1);
});