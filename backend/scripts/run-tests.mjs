/**
 * Runs the backend suites.
 *
 * These files existed for months without a `test` script to invoke them, so
 * nothing ran them and their expectations silently drifted from the seed data —
 * one of them was asserting a retired add-on price and passing. Each file is a
 * standalone script that opens its own pool and exits non-zero on failure, so
 * they run as separate processes, in sequence.
 *
 * They are integration tests: they need DATABASE_URL and SESSION_SECRET set, and
 * they write to that database.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SUITES = [
  'src/modules/calculator/calculator.test.ts',
  'src/modules/calculator/api.test.ts',
  'src/modules/auth/auth.test.ts',
  'src/modules/admin/admin.test.ts',
  'src/modules/admin/admin-config.test.ts',
  'src/modules/notifications/notifications.test.ts',
  'src/modules/pdf/pdf.test.ts',
  'src/modules/security.test.ts',
];

const only = process.argv[2];
const suites = only ? SUITES.filter((s) => s.includes(only)) : SUITES;

if (suites.length === 0) {
  console.error(`No suite matches "${only}". Known suites:\n  ${SUITES.join('\n  ')}`);
  process.exit(1);
}

function run(suite) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', suite], {
      cwd: backendRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, NODE_ENV: 'test' },
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

const failed = [];
for (const suite of suites) {
  console.log(`\n${'='.repeat(70)}\n▶ ${suite}\n${'='.repeat(70)}`);
  const code = await run(suite);
  if (code !== 0) failed.push(suite);
}

console.log(`\n${'='.repeat(70)}`);
if (failed.length > 0) {
  console.log(`✗ ${failed.length} of ${suites.length} suite(s) failed:`);
  for (const s of failed) console.log(`    ${s}`);
  process.exit(1);
}
console.log(`✓ all ${suites.length} suite(s) passed`);
