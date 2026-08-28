import http from 'http';
import { createApp } from '../../app.js';
import { pool } from '@asthiwar/database';

function makeRequest(
  server: http.Server,
  options: {
    method: string;
    path: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const address = server.address();
    if (!address || typeof address === 'string') {
      return reject(new Error('Server address not available'));
    }

    const payload = options.body ? JSON.stringify(options.body) : null;
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path: options.path,
        method: options.method,
        headers: reqHeaders,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runPdfTests() {
  console.log('\n📄 ASTHIWAR Estimate PDF Generator Test Suite — Phase 9\n');
  console.log('-----------------------------------------------------------------');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });

  let testEstimateId = '';
  let testEstimateNumber = '';
  let sessionCookie = '';

  try {
    // -----------------------------------------------------------------
    // [Test 1] Create Comprehensive Estimate for PDF Generation
    // -----------------------------------------------------------------
    console.log('\n[Test 1] Create Test Estimate Snapshot with Customizations & Add-Ons');
    const estRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/calculator/estimate',
      body: {
        customerName: 'Kavitha Ramachandran',
        customerPhone: '9840123456',
        customerEmail: 'kavitha.r@example.com',
        plotLocation: 'Chennai',
        plotArea: 3200,
        plotAreaUnit: 'sqft',
        builtupAreaPerFloor: 1600,
        floorCount: 'G+1',
        carParkingAreaSqft: 250,
        carCount: 1,
        packageSlug: 'premium',
        customizations: [
          { itemSlug: 'masonry_work', optionSlug: 'red_brick' },
        ],
        addons: [
          { addonSlug: 'underground_sump', variantSlug: 'flyash', quantity: 6000 },
          { addonSlug: 'rooftop_solar', variantSlug: '3kw' },
          { addonSlug: 'home_lift', variantSlug: '4_passengers' },
        ],
      },
    });

    const parsedJson = JSON.parse(estRes.body.toString('utf-8'));
    assert(estRes.status === 201, 'Public estimate created with 201 Created');
    testEstimateId = parsedJson.data.estimateId;
    testEstimateNumber = parsedJson.data.estimateNumber;
    assert(!!testEstimateNumber, `Created estimate: ${testEstimateNumber}`);

    // -----------------------------------------------------------------
    // [Test 2] Public PDF Download (GET /api/v1/calculator/estimate/:number/pdf)
    // -----------------------------------------------------------------
    console.log('\n[Test 2] Public PDF Quotation Generation & Binary Validation');
    const pdfRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/v1/calculator/estimate/${testEstimateNumber}/pdf`,
    });

    assert(pdfRes.status === 200, 'GET estimate PDF returns 200 OK');
    assert(pdfRes.headers['content-type'] === 'application/pdf', 'Content-Type is application/pdf');
    assert(
      (pdfRes.headers['content-disposition'] as string).includes(`ASTHIWAR-${testEstimateNumber}.pdf`),
      'Content-Disposition contains correct filename'
    );
    assert(pdfRes.body.length > 5000, `PDF size is valid (${Math.round(pdfRes.body.length / 1024)} KB)`);

    // Verify PDF Magic Bytes (%PDF-1.)
    const magicHeader = pdfRes.body.subarray(0, 5).toString('utf-8');
    assert(magicHeader === '%PDF-', 'Buffer starts with valid %PDF- magic header');

    // -----------------------------------------------------------------
    // [Test 3] Admin Authentication & Admin PDF Generation
    // -----------------------------------------------------------------
    console.log('\n[Test 3] Admin PDF Download via Protected Route');
    const loginRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/admin/auth/login',
      body: {
        email: 'admin@asthiwar.com',
        password: 'ChangeMe@2026!',
      },
    });
    assert(loginRes.status === 200, 'Admin login returns 200 OK');
    const setCookie = loginRes.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      sessionCookie = setCookie[0].split(';')[0];
    }

    const adminPdfRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/v1/admin/estimates/${testEstimateId}/pdf?download=true`,
      headers: { Cookie: sessionCookie },
    });

    assert(adminPdfRes.status === 200, 'GET /admin/estimates/:id/pdf returns 200 OK');
    assert(adminPdfRes.headers['content-type'] === 'application/pdf', 'Admin response is application/pdf');
    assert(
      (adminPdfRes.headers['content-disposition'] as string).startsWith('attachment;'),
      'Content-Disposition is attachment when ?download=true is passed'
    );

    // -----------------------------------------------------------------
    // [Test 4] 404 Handling for Non-Existent Estimate PDF
    // -----------------------------------------------------------------
    console.log('\n[Test 4] Non-existent Estimate PDF 404 Error Handling');
    const notFoundRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/calculator/estimate/EST-2026-999999/pdf',
    });
    assert(notFoundRes.status === 404, 'Non-existent estimate returns 404');
    const notFoundJson = JSON.parse(notFoundRes.body.toString('utf-8'));
    assert(notFoundJson.error.code === 'ESTIMATE_NOT_FOUND', 'Returns ESTIMATE_NOT_FOUND code');

    console.log('\n-----------------------------------------------------------------');
    console.log('Results: All Phase 9 PDF Generation Tests Passed!');
  } finally {
    server.close();
    await pool.end();
  }
}

runPdfTests().catch((err) => {
  console.error('\n❌ PDF Test Suite Failed:', err);
  process.exit(1);
});
