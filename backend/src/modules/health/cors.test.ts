import http from 'http';
import { createApp } from '../../app.js';
import { pool } from '@asthiwar/database';

let testsPassed = 0;
let testsFailed = 0;
let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    testsFailed++;
  }
}

async function runCorsTests() {
  console.log('\n🔒 ASTHIWAR CORS Allowlist Test Suite\n');
  console.log('----------------------------------------------------');

  const app = createApp();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        baseUrl = `http://localhost:${address.port}`;
      }
      resolve();
    });
  });

  try {
    // -----------------------------------------------------------------------
    // Test 1: Allowed Origin (http://localhost:3000)
    // -----------------------------------------------------------------------
    console.log('\n[Test 1] Allowed Origin receives Access-Control-Allow-Origin');
    const allowedRes = await fetch(`${baseUrl}/api/v1/health`, {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });
    const allowOriginHeader = allowedRes.headers.get('access-control-allow-origin');
    assert(
      allowOriginHeader === 'http://localhost:3000',
      'Allowed origin http://localhost:3000 receives matching Access-Control-Allow-Origin header',
      `Got: ${allowOriginHeader}`
    );

    // -----------------------------------------------------------------------
    // Test 2: Disallowed Origin (http://evil.example.com)
    // -----------------------------------------------------------------------
    console.log('\n[Test 2] Disallowed Origin does not receive Access-Control-Allow-Origin');
    const disallowedRes = await fetch(`${baseUrl}/api/v1/health`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });
    const disallowedOriginHeader = disallowedRes.headers.get('access-control-allow-origin');
    assert(
      disallowedOriginHeader === null,
      'Disallowed origin http://evil.example.com has NO Access-Control-Allow-Origin header',
      `Got: ${disallowedOriginHeader}`
    );

    // -----------------------------------------------------------------------
    // Test 3: No Origin Header (curl / server-to-server)
    // -----------------------------------------------------------------------
    console.log('\n[Test 3] Request without Origin header is allowed');
    const noOriginRes = await fetch(`${baseUrl}/api/v1/health`);
    assert(
      noOriginRes.status === 200 || noOriginRes.status === 503,
      'Request with no Origin header executes normally without CORS restriction',
      `Got status: ${noOriginRes.status}`
    );
    const noOriginHeader = noOriginRes.headers.get('access-control-allow-origin');
    assert(
      noOriginHeader === null,
      'Request with no Origin header does not have Access-Control-Allow-Origin header',
      `Got: ${noOriginHeader}`
    );

    console.log('\n----------------------------------------------------');
    console.log(`Results: ${testsPassed} Passed, ${testsFailed} Failed\n`);

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ CORS Test Suite crashed:', error);
    process.exit(1);
  } finally {
    server.close();
    await pool.end().catch(() => {});
  }
}

runCorsTests();
