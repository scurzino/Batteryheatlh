import { execSync } from 'child_process';
import fs from 'fs';

let out = '';
try {
    execSync('node test_prisma.js', { stdio: 'pipe' });
} catch (e) {
    out += 'STDOUT:\n' + (e.stdout ? e.stdout.toString() : '') + '\n\n';
    out += 'STDERR:\n' + (e.stderr ? e.stderr.toString() : '') + '\n\n';
}

fs.writeFileSync('prisma_error_full.txt', out);
