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
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
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
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : null;
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: parsed,
            });
          } catch (err) {
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: rawData,
            });
          }
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

async function runNotificationTests() {
  console.log('\n📬 ASTHIWAR Notification & Lead Alert Engine Test Suite — Phase 10\n');
  console.log('-----------------------------------------------------------------');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });

  let sessionCookie = '';
  let testEstimateId = '';
  let testEnquiryId = '';
  let testNotificationId = '';

  try {
    // -----------------------------------------------------------------
    // [Test 1] Admin Authentication
    // -----------------------------------------------------------------
    console.log('\n[Test 1] Admin Authentication');
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
    assert(!!sessionCookie, 'Session cookie captured');

    // -----------------------------------------------------------------
    // [Test 2] Seed Estimate & Enquiry
    // -----------------------------------------------------------------
    console.log('\n[Test 2] Seed Estimate & Enquiry for Dispatch');
    const estRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/calculator/estimate',
      body: {
        customerName: 'Senthil Nathan',
        customerPhone: '9443123456',
        customerEmail: 'senthil.nathan@example.com',
        plotLocation: 'Coimbatore',
        plotArea: 2400,
        plotAreaUnit: 'sqft',
        builtupAreaPerFloor: 1200,
        floorCount: 'G+1',
        carParkingAreaSqft: 200,
        carCount: 1,
        packageSlug: 'standard',
        customizations: [],
        addons: [],
      },
    });
    assert(estRes.status === 201, 'Public estimate created with 201 Created');
    testEstimateId = estRes.body.data.estimateId;

    const enqRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/enquiries',
      body: {
        fullName: 'Senthil Nathan',
        phone: '9443123456',
        email: 'senthil.nathan@example.com',
        plotLocation: 'Coimbatore',
        estimateNumber: estRes.body.data.estimateNumber,
        preferredContactTime: 'Morning 10 AM',
        requirementNotes: 'Need turnkey construction in Saravanampatti, Coimbatore',
      },
    });
    assert(enqRes.status === 201, 'Public enquiry created with 201 Created');
    testEnquiryId = enqRes.body.data.id;

    // -----------------------------------------------------------------
    // [Test 3] Dispatch Customer Estimate Quotation (Email + WhatsApp)
    // -----------------------------------------------------------------
    console.log('\n[Test 3] Dispatch Customer Estimate Quotation (Email + WhatsApp)');
    const sendEstRes = await makeRequest(server, {
      method: 'POST',
      path: `/api/v1/admin/estimates/${testEstimateId}/notify`,
      body: {
        channels: ['EMAIL', 'WHATSAPP'],
      },
      headers: { Cookie: sessionCookie },
    });
    assert(sendEstRes.status === 200, 'POST /admin/estimates/:id/notify returns 200 OK');
    assert(Array.isArray(sendEstRes.body.data), 'Returns notifications array');
    assert(sendEstRes.body.data.length === 2, 'Generated 2 notifications (Email & WhatsApp)');
    assert(sendEstRes.body.data[0].status === 'SENT', 'Email notification status is SENT');
    assert(sendEstRes.body.data[1].status === 'SENT', 'WhatsApp notification status is SENT');
    testNotificationId = sendEstRes.body.data[0].id;

    // -----------------------------------------------------------------
    // [Test 4] Dispatch Admin Instant Lead Alert
    // -----------------------------------------------------------------
    console.log('\n[Test 4] Dispatch Admin Instant Lead Alert');
    const sendLeadRes = await makeRequest(server, {
      method: 'POST',
      path: `/api/v1/admin/enquiries/${testEnquiryId}/notify`,
      headers: { Cookie: sessionCookie },
    });
    assert(sendLeadRes.status === 200, 'POST /admin/enquiries/:id/notify returns 200 OK');
    assert(sendLeadRes.body.data.template === 'NEW_LEAD_ALERT', 'Template is NEW_LEAD_ALERT');
    assert(sendLeadRes.body.data.status === 'SENT', 'Alert status is SENT');

    // -----------------------------------------------------------------
    // [Test 5] Notification Audit Logs & History
    // -----------------------------------------------------------------
    console.log('\n[Test 5] Notification Audit Logs & Pagination');
    const logsRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/notifications?page=1&limit=10',
      headers: { Cookie: sessionCookie },
    });
    assert(logsRes.status === 200, 'GET /admin/notifications returns 200 OK');
    assert(Array.isArray(logsRes.body.data), 'Returns log items array');
    assert(logsRes.body.pagination.total >= 3, 'Total logged notifications >= 3');

    // -----------------------------------------------------------------
    // [Test 6] Resend Notification
    // -----------------------------------------------------------------
    console.log('\n[Test 6] Resend Notification');
    const resendRes = await makeRequest(server, {
      method: 'POST',
      path: `/api/v1/admin/notifications/${testNotificationId}/resend`,
      headers: { Cookie: sessionCookie },
    });
    assert(resendRes.status === 200, 'POST /admin/notifications/:id/resend returns 200 OK');
    assert(resendRes.body.data.id === testNotificationId, 'Resent notification ID matches');
    assert(resendRes.body.data.status === 'SENT', 'Status confirmed SENT');

    console.log('\n-----------------------------------------------------------------');
    console.log('Results: All Phase 10 Notification Engine Tests Passed!');
  } finally {
    server.close();
    await pool.end();
  }
}

runNotificationTests().catch((err) => {
  console.error('\n❌ Notification Test Suite Failed:', err);
  process.exit(1);
});
