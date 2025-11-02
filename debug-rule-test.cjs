// Debug test to check if our rule is working
const { ESLint } = require('eslint');

async function testRule() {
  console.log('=== TESTING SUGGEST-MEMBERS RULE ===');
  
  try {
    // Load debug rule
    const { debugSuggestMembersRule } = require('./debug-suggest-members.cjs');
    console.log('Debug rule loaded:', !!debugSuggestMembersRule);
    
    // Create ESLint instance
    const path = require('path');
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [{
        files: ['**/*.ts'],
        languageOptions: {
          parser: require('@typescript-eslint/parser'),
          parserOptions: {
            project: path.resolve('./test-project/tsconfig.json')
          }
        },
        plugins: {
          'debug': { rules: { 'suggest-members': debugSuggestMembersRule } }
        },
        rules: {
          'debug/suggest-members': 'error'
        }
      }],
      cwd: path.resolve('./test-project')
    });
    
    // Test existing file
    const fs = require('fs');
    const testFile = path.resolve('./test-project/src/debug-member-test.ts');
    console.log('Testing file:', testFile);
    console.log('File exists:', fs.existsSync(testFile));
    
    const results = await eslint.lintFiles([testFile]);
    console.log('Lint results:', JSON.stringify(results, null, 2));
    
    if (results[0] && results[0].messages.length > 0) {
      console.log('✅ Rule is working! Found errors:', results[0].messages.length);
    } else {
      console.log('❌ Rule is not working - no errors found');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testRule().catch(console.error);