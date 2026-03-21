import fs from 'fs';
const raw = fs.readFileSync('test_result.json', 'utf8');
const data = JSON.parse(raw.substring(raw.indexOf('{')));
let out = '';
data.testResults.forEach(r => {
  if (r.status === 'failed') {
    r.assertionResults.forEach(a => {
      if (a.status === 'failed') {
        // Strip ANSI codes and limit length
        const msg = a.failureMessages[0].replace(/\u001b\[\d+m/g, '').substring(0, 500);
        out += `\n======\nFile: ${r.name.split(/[\\\\/]/).pop()}\nTest: ${a.title}\nMessage:\n${msg}\n`;
      }
    });
  }
});
fs.writeFileSync('clean_fails.txt', out);
