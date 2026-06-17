/**
 * @fileoverview Master test runner for EcoTrace.
 * Run with: node tests/run-all.js
 */

const { execSync } = require('child_process');
const path = require('path');

const tests = [
  'test-co2.js',
  'test-storage.js',
  'test-tips.js'
];

let allPassed = true;

console.log('=== Running EcoTrace Test Suite ===');

tests.forEach(testFile => {
  const fullPath = path.join(__dirname, testFile);
  console.log(`\n▶ Running ${testFile}...`);
  try {
    execSync(`node "${fullPath}"`, { stdio: 'inherit' });
  } catch (err) {
    allPassed = false;
    console.error(`\n❌ ${testFile} failed.`);
  }
});

console.log('\n===================================');
if (allPassed) {
  console.log('✅ All test suites passed!');
  process.exit(0);
} else {
  console.error('❌ Some test suites failed.');
  process.exit(1);
}
