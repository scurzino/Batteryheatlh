const { execSync } = require('child_process');
const fs = require('fs');

let out = '';
try {
    out += 'Running Vite...\n';
    const viteOut = execSync('npx vite build', { stdio: 'pipe', maxBuffer: 1024 * 1024 * 10 });
    out += 'VITE OK: ' + viteOut.toString().substring(0, 500) + '\n';
} catch (e) {
    out += 'VITE STDERR: ' + e.stderr?.toString() + '\n';
}

try {
    out += 'Running TSX Server...\n';
    const tsxOut = execSync('node -e "require(\'tsx/cjs/api\').register(); require(\'./server/index.ts\')"', { stdio: 'pipe', timeout: 5000 });
    out += 'TSX OK: ' + tsxOut.toString() + '\n';
} catch (e) {
    if (e.code === 'ETIMEDOUT') {
        out += 'TSX runs fine (timed out waiting for exit)\n';
    } else {
        out += 'TSX ERROR CODE: ' + e.code + '\n';
        out += 'TSX STDERR: ' + e.stderr?.toString() + '\n';
        out += 'TSX STDOUT: ' + e.stdout?.toString() + '\n';
    }
}
fs.writeFileSync('result.txt', out);
