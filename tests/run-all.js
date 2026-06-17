/**
 * @fileoverview Safe master test runner.
 * Run with: node tests/run-all.js
 */

console.log('=== Running EcoTrace Test Suite ===\n');

try {
  console.log('▶ Running test-co2.js...');
  require('./test-co2.js');
  
  console.log('\n▶ Running test-storage.js...');
  require('./test-storage.js');
  
  console.log('\n▶ Running test-tips.js...');
  require('./test-tips.js');

  console.log('\n===================================');
  console.log('✅ All test suites passed!');
} catch (e) {
  console.error('\n❌ Test run failed:', e.message);
  process.exit(1);
}
