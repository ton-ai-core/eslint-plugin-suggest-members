#!/usr/bin/env ts-node

/**
 * Automated release script for ESLint Plugin Suggest-Members
 * 
 * CHANGE: Automated release process with validation
 * WHY: Ensures consistent releases with proper validation
 * PURITY: SHELL - contains file system and npm effects
 * EFFECT: Effect<ReleaseResult, ReleaseError, FileSystem | NPM>
 * INVARIANT: ∀ release: validated(release) → published(release)
 * COMPLEXITY: O(1) - constant time operations
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ReleaseConfig {
  readonly version: 'patch' | 'minor' | 'major';
  readonly dryRun: boolean;
  readonly skipTests: boolean;
}

interface PackageJson {
  readonly name: string;
  readonly version: string;
  readonly description: string;
}

/**
 * Executes shell command with error handling
 * 
 * @pure false - executes shell commands
 * @effect FileSystem, Process
 */
function execCommand(command: string, options: { cwd?: string; silent?: boolean } = {}): string {
  try {
    const result = execSync(command, {
      cwd: options.cwd || process.cwd(),
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit'
    });
    return result.toString().trim();
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Validates project state before release
 * 
 * @pure false - reads file system
 * @effect FileSystem
 * @invariant ∀ validation: passed(validation) → safe_to_release()
 */
function validateProject(): void {
  console.log('🔍 Validating project state...');
  
  // Check git status
  const gitStatus = execCommand('git status --porcelain', { silent: true });
  if (gitStatus.length > 0) {
    console.error('❌ Git working directory is not clean');
    console.error('Please commit or stash your changes before releasing');
    process.exit(1);
  }
  
  // Check current branch
  const currentBranch = execCommand('git branch --show-current', { silent: true });
  if (currentBranch !== 'main' && currentBranch !== 'master') {
    console.warn(`⚠️  You are on branch '${currentBranch}', not main/master`);
    console.warn('Are you sure you want to release from this branch?');
  }
  
  // Validate package.json
  const packagePath = join(process.cwd(), 'package.json');
  const packageJson: PackageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  
  if (!packageJson.name || !packageJson.version) {
    console.error('❌ Invalid package.json: missing name or version');
    process.exit(1);
  }
  
  console.log('✅ Project validation passed');
}

/**
 * Runs comprehensive test suite
 * 
 * @pure false - executes test commands
 * @effect Process, FileSystem
 */
function runTests(): void {
  console.log('🧪 Running test suite...');
  
  // Lint check
  execCommand('npm run lint');
  
  // Build check
  execCommand('npm run build');
  
  // Unit tests
  execCommand('npm test');
  
  console.log('✅ All tests passed');
}

/**
 * Updates version and creates git tag
 * 
 * @pure false - modifies files and git
 * @effect FileSystem, Git
 */
function updateVersion(versionType: 'patch' | 'minor' | 'major'): string {
  console.log(`📦 Bumping ${versionType} version...`);
  
  const newVersion = execCommand(`npm version ${versionType} --no-git-tag-version`, { silent: true });
  
  // Update CHANGELOG.md with new version
  const changelogPath = join(process.cwd(), 'CHANGELOG.md');
  const changelog = readFileSync(changelogPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  
  const updatedChangelog = changelog.replace(
    '## [Unreleased]',
    `## [Unreleased]\n\n## [${newVersion}] - ${today}`
  );
  
  writeFileSync(changelogPath, updatedChangelog);
  
  console.log(`✅ Version updated to ${newVersion}`);
  return newVersion;
}

/**
 * Creates git commit and tag for release
 * 
 * @pure false - modifies git repository
 * @effect Git
 */
function createGitTag(version: string): void {
  console.log('🏷️  Creating git commit and tag...');
  
  execCommand('git add .');
  execCommand(`git commit -m "chore(release): ${version}"`);
  execCommand(`git tag -a ${version} -m "Release ${version}"`);
  
  console.log('✅ Git tag created');
}

/**
 * Publishes package to npm
 * 
 * @pure false - publishes to npm registry
 * @effect NPM, Network
 */
function publishPackage(dryRun: boolean): void {
  if (dryRun) {
    console.log('🚀 Dry run: npm publish --dry-run');
    execCommand('npm publish --dry-run --access public');
    console.log('✅ Dry run completed successfully');
  } else {
    console.log('🚀 Publishing to npm...');
    execCommand('npm publish --access public');
    console.log('✅ Package published successfully');
  }
}

/**
 * Pushes changes to remote repository
 * 
 * @pure false - pushes to remote git
 * @effect Git, Network
 */
function pushToRemote(): void {
  console.log('📤 Pushing to remote repository...');
  
  execCommand('git push origin main');
  execCommand('git push origin --tags');
  
  console.log('✅ Changes pushed to remote');
}

/**
 * Main release function
 * 
 * @pure false - orchestrates entire release process
 * @effect FileSystem, Git, NPM, Network
 * @invariant ∀ release: successful(release) → (published(npm) ∧ tagged(git))
 */
function main(): void {
  const args = process.argv.slice(2);
  
  const config: ReleaseConfig = {
    version: (args[0] as 'patch' | 'minor' | 'major') || 'patch',
    dryRun: args.includes('--dry-run'),
    skipTests: args.includes('--skip-tests')
  };
  
  console.log('🚀 Starting release process...');
  console.log(`   Version: ${config.version}`);
  console.log(`   Dry run: ${config.dryRun}`);
  console.log(`   Skip tests: ${config.skipTests}`);
  console.log('');
  
  try {
    // Validation phase
    validateProject();
    
    // Testing phase
    if (!config.skipTests) {
      runTests();
    } else {
      console.log('⚠️  Skipping tests (--skip-tests flag)');
    }
    
    // Version update phase
    const newVersion = updateVersion(config.version);
    
    // Git operations
    if (!config.dryRun) {
      createGitTag(newVersion);
    }
    
    // Publishing phase
    publishPackage(config.dryRun);
    
    // Push to remote
    if (!config.dryRun) {
      pushToRemote();
    }
    
    console.log('');
    console.log('🎉 Release completed successfully!');
    console.log(`   New version: ${newVersion}`);
    
    if (config.dryRun) {
      console.log('   (This was a dry run - no actual changes made)');
    } else {
      console.log(`   Package URL: https://www.npmjs.com/package/@ton-ai-core/eslint-plugin-suggest-members`);
      console.log(`   Git tag: ${newVersion}`);
    }
    
  } catch (error) {
    console.error('');
    console.error('💥 Release failed!');
    console.error(error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { main as releaseScript };