import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGlb } from './validate-glb.mjs';

const fromRepo = path => fileURLToPath(new URL(`../../${path}`, import.meta.url));
const blender = process.env.BLENDER_EXE
  || 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe';
const args = process.argv.slice(2);

try {
  if (args.length !== 0 && args.length !== 2) {
    throw new Error('Usage: node scripts/blender/export.mjs [<source.blend> <output.glb>]');
  }
  const source = args.length ? resolve(args[0]) : fromRepo('art/blender/smoke-test/pipeline-fixture.blend');
  const output = args.length ? resolve(args[1]) : fromRepo('dev/blender-smoke/generated/pipeline-fixture.glb');
  if (extname(source).toLowerCase() !== '.blend' || extname(output).toLowerCase() !== '.glb') {
    throw new Error('Expected a .blend source and a .glb destination.');
  }
  if (!statSync(source).isFile()) throw new Error(`Source must be a file: ${source}`);

  mkdirSync(dirname(output), { recursive: true });
  const staging = mkdtempSync(join(dirname(output), '.blender-export-'));
  try {
    const candidate = join(staging, 'asset.glb');
    const result = spawnSync(blender, [
      '--background', '--factory-startup', '--disable-autoexec', source,
      '--python-exit-code', '1', '--python', fromRepo('scripts/blender/export_glb.py'),
      '--', candidate,
    ], { stdio: 'inherit', windowsHide: true });
    if (result.error) throw new Error(`Cannot run Blender at "${blender}": ${result.error.message}`);
    if (result.status !== 0) throw new Error(`Blender failed (exit ${result.status}, signal ${result.signal}).`);

    const stats = validateGlb(readFileSync(candidate));
    renameSync(candidate, output);
    console.log(`GLB validation passed: ${output}`, stats);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
