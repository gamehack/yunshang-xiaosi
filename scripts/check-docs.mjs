import { execFileSync } from 'node:child_process';

const base = process.env.GITHUB_BASE_REF;
if (!base) {
  console.log('Documentation gate: no PR base branch, skipping diff check.');
  process.exit(0);
}
const changed = execFileSync('git', ['diff','--name-only',`origin/${base}...HEAD`], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
const sourceChanged = changed.some(path => path.startsWith('src/') || path === 'package.json' || path === 'vite.config.ts');
const docsChanged = changed.some(path => path === 'README.md' || path.startsWith('docs/'));
if (sourceChanged && !docsChanged) {
  console.error('Documentation gate failed: source changed without README/docs update.');
  process.exit(1);
}
console.log(`Documentation gate passed: ${changed.length} changed files.`);
