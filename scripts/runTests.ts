import { runAllEngineTests } from '../src/services/__tests__/engineTests.ts';

console.log('=== RUNNING WORKERHUB CALCULATION & ENGINE TESTS ===');
const { total, passed, failed, results } = runAllEngineTests();

results.forEach((r, idx) => {
  const symbol = r.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${idx + 1}. [${symbol}] ${r.name}`);
  if (!r.passed) {
    console.log(`   Expected: ${r.expected}`);
    console.log(`   Actual:   ${r.actual}`);
  }
});

console.log(`\nTEST SUMMARY: ${passed}/${total} passed (${failed} failed).`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL UNIT TESTS PASSED SUCCESSFULLY! 🚀');
  process.exit(0);
}
