import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = join(process.cwd(), '..');
const SKIP = new Set(['node_modules', '.git', '.next', 'out', 'dist', '.wrangler', '__pycache__']);
const EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.md', '.py', '.html']);
const RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

let bad = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full);
    else if (EXT.has(extname(name)) && RE.test(readFileSync(full, 'utf8'))) bad.push(full);
  }
}
walk(ROOT);
if (bad.length) { console.error('EMOJIS FOUND:\n' + bad.join('\n')); process.exit(1); }
console.log('No emojis - clean.');
