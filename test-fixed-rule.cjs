// Test the fixed suggest-members rule
const { ESLint } = require('eslint');

async function testFixedRule() {
  console.log('=== TESTING FIXED SUGGEST-MEMBERS RULE ===');
  
  try {
    // Load the fixed rule from dist
    const { suggestMembersRule } = require('./dist/rules/suggest-members/index.js');
    console.log('Fixed suggest-members rule loaded:', !!suggestMembersRule);
    
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
          'fixed': { rules: { 'suggest-members': suggestMembersRule } }
        },
        rules: {
          'fixed/suggest-members': 'error'
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
      console.log('✅ Fixed rule is working! Found errors:', results[0].messages.length);
      
      // Check if we have proper error messages
      const hasProperErrors = results[0].messages.some(msg => 
        msg.message.includes('Property') && msg.message.includes('does not exist')
      );
      
      if (hasProperErrors) {
        console.log('✅ Error messages are properly formatted!');
      } else {
        console.log('❌ Error messages are not properly formatted');
      }
    } else {
      console.log('❌ Fixed rule is not working - no errors found');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testFixedRule().catch(console.error);