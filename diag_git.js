const { execSync } = require('child_process');
const fs = require('fs');

let out = '';
try {
    out += '--- GIT STATUS ---\n';
    out += execSync('git status', { encoding: 'utf-8' }) + '\n';
} catch (e) { out += 'ERROR: ' + e + '\n'; }

try {
    out += '--- GIT LOG ---\n';
    out += execSync('git log -n 3', { encoding: 'utf-8' }) + '\n';
} catch (e) { out += 'ERROR: ' + e + '\n'; }

try {
    out += '--- GIT PUSH ---\n';
    out += execSync('git push -u origin main', { encoding: 'utf-8' }) + '\n';
} catch (e) {
    out += 'ERROR PUSHING:\n';
    out += e.stdout?.toString() + '\n';
    out += e.stderr?.toString() + '\n';
}

fs.writeFileSync('git_diag.txt', out);
