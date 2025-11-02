// Test if our rule exports correctly
const fs = require('fs');

console.log('=== TESTING RULE EXPORT ===');

// Check if file exists
const filePath = './src/rules/suggest-members/index.ts';
console.log('File exists:', fs.existsSync(filePath));

// Read file content
const content = fs.readFileSync(filePath, 'utf8');
console.log('File has export:', content.includes('export const suggestMembersRule'));
console.log('File has createRule:', content.includes('createRule'));

// Try to compile with tsc
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit --skipLibCheck src/rules/suggest-members/index.ts', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed:', error.stdout?.toString() || error.message);
}