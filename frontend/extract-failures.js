import fs from 'fs';
try {
  const data = JSON.parse(fs.readFileSync('vitest-report.json', 'utf8'));
  const failed = [];
  data.testResults.forEach(suite => {
    suite.assertionResults.forEach(test => {
      if (test.status === 'failed') {
        failed.push(`\n- File: ${suite.name}\n  Test: ${test.title}\n  Error: ${test.failureMessages[0]?.split('\n').slice(0, 3).join('\n  ')}`);
      }
    });
  });
  console.log(`Failed tests: ${failed.length}`);
  console.log(failed.join('\n'));
} catch(e) { console.error('Error parsing JSON:', e.message); }
