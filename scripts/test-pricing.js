/**
 * Offline pricing arithmetic — no database, no server.
 *
 * This used to run src/lib/pricing/pricing.test.ts, which exercised a second
 * pricing engine that lived in the web app and that nothing imported. It priced
 * from hand-written constants that had already drifted from the catalogue (Basic
 * volume rate 2000 against the database's 1999), knew nothing about head room,
 * GST, square metres, per-package volume thresholds or builds above G+3, and
 * rounded every milestone so its instalments did not sum to the total. Eight
 * assertions, all green, covering none of the code that quotes a customer.
 *
 * It now runs backend/src/modules/calculator/pricing-math.test.ts, against the
 * arithmetic the live engine actually calls, and src/lib/rateMatrix.test.ts, the
 * arithmetic the admin console uses to keep a component's brand rates consistent
 * across package tiers.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = path.join(repoRoot, 'backend');
const SUITES = [
  { cwd: backendRoot, file: 'src/modules/calculator/pricing-math.test.ts' },
  { cwd: repoRoot, file: 'src/lib/rateMatrix.test.ts' },
];

// Resolved from node_modules rather than shelled through `npx`, which on Windows
// returned exit 0 with no output when it could not launch — a test command that
// reports success without running anything is worse than no test command.
const tsxBin = path.join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');

if (!fs.existsSync(tsxBin)) {
  console.error(`❌ Cannot find tsx at ${tsxBin}. Run \`npm install\` first.`);
  process.exit(1);
}

for (const suite of SUITES) {
  const suitePath = path.join(suite.cwd, suite.file);
  if (!fs.existsSync(suitePath)) {
    console.error(`❌ Suite not found: ${suitePath}`);
    process.exit(1);
  }

  const result = spawnSync(process.execPath, [tsxBin, '--test', suite.file], {
    cwd: suite.cwd,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`❌ Could not run ${suite.file}:`, result.error.message);
    process.exit(1);
  }

  // A null status means the child was killed by a signal rather than exiting.
  if (result.status !== 0) {
    console.error(`\n❌ ${suite.file} failed (exit ${result.status ?? 'signal'}).`);
    process.exit(result.status ?? 1);
  }
}

console.log('\n✅ Offline pricing arithmetic passed.');
