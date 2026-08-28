import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

// All known test suites and their DB requirements
const TEST_SUITES = [
  {
    name: 'CORS Allowlist',
    path: 'src/modules/health/cors.test.ts',
    needsDb: false,
  },
  {
    name: 'Engine Calculation Parity',
    path: 'src/modules/calculator/parity.test.ts',
    needsDb: false,
  },
  {
    name: 'Calculator Engine & DB Persistence',
    path: 'src/modules/calculator/calculator.test.ts',
    needsDb: true,
  },
  {
    name: 'Public REST API',
    path: 'src/modules/calculator/api.test.ts',
    needsDb: true,
  },
  {
    name: 'Admin Auth & Session Security',
    path: 'src/modules/auth/auth.test.ts',
    needsDb: true,
  },
  {
    name: 'Admin Management & Analytics',
    path: 'src/modules/admin/admin.test.ts',
    needsDb: true,
  },
  {
    name: 'Admin Calculator Config & Pricing',
    path: 'src/modules/admin/admin-config.test.ts',
    needsDb: true,
  },
  {
    name: 'Admin Price Versioning Invariant',
    path: 'src/modules/admin/price-versioning.test.ts',
    needsDb: true,
  },
  {
    name: 'Estimate PDF Generation',
    path: 'src/modules/pdf/pdf.test.ts',
    needsDb: true,
  },
  {
    name: 'Notification & Lead Alert Dispatch',
    path: 'src/modules/notifications/notifications.test.ts',
    needsDb: true,
  },
];

const args = process.argv.slice(2);
const noDbMode = args.includes('--no-db');

function runTest(suite) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const isWindows = process.platform === 'win32';
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';

    console.log(`\n======================================================`);
    console.log(`▶ Running Suite: ${suite.name} (${suite.path})`);
    console.log(`======================================================`);

    const child = spawn(npxCmd, ['tsx', suite.path], {
      cwd: backendDir,
      stdio: 'inherit',
      shell: isWindows,
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    child.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      resolve({
        suite,
        passed: code === 0,
        skipped: false,
        durationMs,
        exitCode: code,
      });
    });

    child.on('error', (err) => {
      const durationMs = Date.now() - startTime;
      console.error(`Execution error in ${suite.path}:`, err);
      resolve({
        suite,
        passed: false,
        skipped: false,
        durationMs,
        exitCode: 1,
      });
    });
  });
}

async function main() {
  console.log(`\n🧪 ASTHIWAR Test Runner`);
  console.log(`Mode: ${noDbMode ? 'Unit Only (--no-db)' : 'Full Suite (DB-backed)'}`);
  console.log(`Discovered: ${TEST_SUITES.length} test suites\n`);

  const results = [];

  for (const suite of TEST_SUITES) {
    if (noDbMode && suite.needsDb) {
      results.push({
        suite,
        passed: false,
        skipped: true,
        durationMs: 0,
        exitCode: 0,
      });
      continue;
    }

    const result = await runTest(suite);
    results.push(result);
  }

  // Summary Report
  console.log(`\n======================================================`);
  console.log(`📊 ASTHIWAR Test Execution Summary`);
  console.log(`======================================================\n`);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const r of results) {
    const statusLabel = r.skipped
      ? '⏭️  SKIPPED (needs DATABASE_URL)'
      : r.passed
      ? '✅ PASSED'
      : `❌ FAILED (exit code ${r.exitCode})`;

    const durationStr = r.skipped ? '-' : `${(r.durationMs / 1000).toFixed(2)}s`;
    console.log(`- ${r.suite.name.padEnd(38)} [${durationStr.padStart(6)}] : ${statusLabel}`);

    if (r.skipped) totalSkipped++;
    else if (r.passed) totalPassed++;
    else totalFailed++;
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`Total: ${results.length} | Passed: ${totalPassed} | Failed: ${totalFailed} | Skipped: ${totalSkipped}`);
  console.log(`------------------------------------------------------\n`);

  if (totalFailed > 0) {
    console.error(`💥 Test run failed: ${totalFailed} suite(s) failed.`);
    process.exit(1);
  } else {
    console.log(`✨ All executed suites passed successfully!`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
