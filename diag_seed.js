const { execSync } = require('child_process');
const fs = require('fs');

let out = '';
try {
    out += '--- TSX SEED ---\n';
    out += execSync('npx tsx prisma/seed.ts', { encoding: 'utf-8' }) + '\n';
} catch (e) {
    out += 'ERROR PUSHING:\n';
    out += e.stdout?.toString() + '\n';
    out += e.stderr?.toString() + '\n';
}

fs.writeFileSync('seed_diag.txt', out);
