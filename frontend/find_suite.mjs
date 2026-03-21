import fs from 'fs';
const raw = fs.readFileSync('full_fail.json', 'utf8');
const json = JSON.parse(raw.substring(raw.indexOf('{"numFailedTestSuites"')));
let out = '';
json.testResults.filter(tr => tr.status === 'failed').forEach(tr => {
    out += "FAILED SUITE: " + tr.name + "\n";
    out += tr.message + "\n";
});
fs.writeFileSync('suite_err.txt', out);
