import fs from 'fs';
const raw = fs.readFileSync('./test_result.json', 'utf8');
const jsonStr = raw.substring(raw.indexOf('{'));
const data = JSON.parse(jsonStr);
const failed = [];
data.testResults.forEach(r => {
  if (r.status === 'failed') {
    r.assertionResults.forEach(a => {
      if (a.status === 'failed') {
        failed.push({ file: r.name.split(/[\\/]/).pop(), test: a.title, error: a.failureMessages[0].split('\n')[0] });
      }
    });
  }
});
console.log(`Failed tests: ${failed.length}`);
failed.forEach(f => console.log(`- ${f.file}: ${f.test} \n  -> ${f.error.substring(0, 150)}`));
