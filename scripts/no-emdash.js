import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = join(process.cwd(), '..');
const SKIP = new Set(['node_modules', '.git', '.next', 'out', 'dist', '.wrangler', '__pycache__']);
const EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.md', '.py', '.html']);

let bad = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full);
    else if (EXT.has(extname(name))) {
      readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
        if (line.includes('\u2014')) { console.log(`EMDASH ${full}:${i + 1}`); bad++; }
      });
    }
  }
}
walk(ROOT);
if (bad > 0) { console.error(`FAIL: ${bad} em dash`); process.exit(1); }
console.log('No em dash - clean.');
