import fs from 'fs';
let out = '';
['staff-fail.json'].forEach(f => {
  try {
    const d = fs.readFileSync(f, 'utf8');
    const jsonStr = d.substring(d.indexOf('{"numFailedTestSuites"'));
    const json = JSON.parse(jsonStr);
    json.testResults.forEach(tr => {
      tr.assertionResults.forEach(a => {
        if (a.status === 'failed') {
          out += '\n--- ' + a.title + ' ---\n';
          a.failureMessages.forEach(m => out += m.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').substring(0, 500) + '\n');
        }
      });
    });
  } catch(e) {
    out += 'Error parsing ' + f + ': ' + e.message + '\n';
  }
});
fs.writeFileSync('report.txt', out);
