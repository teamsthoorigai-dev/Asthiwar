import http from 'http';
import { createApp } from '../../app.js';
import { pool } from '@asthiwar/database';

// Helper to make HTTP requests against local Express test instance
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

async function runAdminTests() {
  console.log('\n👑 ASTHIWAR Admin Management & Analytics Test Suite — Phase 7\n');
  console.log('-----------------------------------------------------------------');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });

  let sessionCookie = '';
  let bearerToken = '';
  let testEnquiryId = '';
  let testEstimateId = '';
  let testEstimateNumber = '';

  try {
    // -----------------------------------------------------------------
    // [Test 1] Security Guard: Unauthorized Access Blocking
    // -----------------------------------------------------------------
    console.log('\n[Test 1] Security Guard: Unauthorized Access Blocking (401)');
    const unauthEnquiries = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/enquiries',
    });
    assert(unauthEnquiries.status === 401, 'GET /admin/enquiries without auth returns 401');
    assert(unauthEnquiries.body.error.code === 'UNAUTHORIZED', 'Returns UNAUTHORIZED code');

    const unauthEstimates = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/estimates',
    });
    assert(unauthEstimates.status === 401, 'GET /admin/estimates without auth returns 401');

    const unauthAnalytics = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/analytics/dashboard',
    });
    assert(unauthAnalytics.status === 401, 'GET /admin/analytics/dashboard without auth returns 401');

    // -----------------------------------------------------------------
    // [Test 2] Admin Login & Session Token Acquisition
    // -----------------------------------------------------------------
    console.log('\n[Test 2] Admin Login & Session Acquisition');
    const loginRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/admin/auth/login',
      body: {
        email: 'admin@asthiwar.com',
        password: 'ChangeMe@2026!',
      },
    });
    assert(loginRes.status === 200, 'Admin login returns 200 OK');
    assert(loginRes.body.success === true, 'Admin login success is true');
    bearerToken = loginRes.body.data.token;
    assert(!!bearerToken, 'Bearer token successfully obtained');

    const setCookie = loginRes.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      sessionCookie = setCookie[0].split(';')[0];
    }
    assert(!!sessionCookie, 'Session cookie successfully captured');

    // -----------------------------------------------------------------
    // [Test 3] Create Test Data via Public Endpoints
    // -----------------------------------------------------------------
    console.log('\n[Test 3] Seed Sample Estimate & Enquiry via Public API');
    const createEstimateRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/calculator/estimate',
      body: {
        customerName: 'Admin Test User',
        customerPhone: '9876543210',
        customerEmail: 'admintest@asthiwar.com',
        plotLocation: 'Chennai',
        plotArea: 2400,
        plotAreaUnit: 'sqft',
        builtupAreaPerFloor: 1500,
        floorCount: 'G+1',
        carParkingAreaSqft: 200,
        carCount: 1,
        packageSlug: 'premium',
        customizations: [
          { itemSlug: 'masonry_work', optionSlug: 'red_brick' },
        ],
        addons: [
          { addonSlug: 'underground_sump', variantSlug: 'flyash', quantity: 5000 },
        ],
      },
    });
    assert(createEstimateRes.status === 201, 'Public estimate created with 201 Created');
    testEstimateId = createEstimateRes.body.data.estimateId;
    testEstimateNumber = createEstimateRes.body.data.estimateNumber;
    assert(!!testEstimateId, `Created test estimate ID: ${testEstimateId}`);

    const createEnquiryRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/enquiries',
      body: {
        fullName: 'Admin Test Lead',
        phone: '9876543210',
        email: 'lead@asthiwar.com',
        plotLocation: 'coimbatore',
        estimateNumber: testEstimateNumber,
        preferredContactTime: 'Evening 5 PM',
        requirementNotes: 'Need turnkey construction within 8 months',
      },
    });
    assert(createEnquiryRes.status === 201, 'Public enquiry created with 201 Created');
    testEnquiryId = createEnquiryRes.body.data.id;
    assert(!!testEnquiryId, `Created test enquiry ID: ${testEnquiryId}`);

    // -----------------------------------------------------------------
    // [Test 4] Admin Enquiries: List, Filter, Search, Pagination
    // -----------------------------------------------------------------
    console.log('\n[Test 4] Admin Enquiries: List, Filter & Pagination');
    const enquiriesRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/enquiries?page=1&limit=10',
      headers: { Cookie: sessionCookie },
    });
    assert(enquiriesRes.status === 200, 'GET /admin/enquiries returns 200 OK');
    assert(Array.isArray(enquiriesRes.body.data), 'Returns data array');
    assert(enquiriesRes.body.pagination.total >= 1, 'Total enquiries >= 1');
    assert(enquiriesRes.body.pagination.page === 1, 'Current page is 1');

    // Search filter
    const searchRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/v1/admin/enquiries?search=${encodeURIComponent('Admin Test Lead')}`,
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    assert(searchRes.status === 200, 'Search enquiries by name returns 200 OK');
    assert(searchRes.body.data.length >= 1, 'Found matching enquiry');
    assert(searchRes.body.data[0].fullName === 'Admin Test Lead', 'Full name matches search query');

    // -----------------------------------------------------------------
    // [Test 5] Admin Enquiries: Detail Lookup & Status Update
    // -----------------------------------------------------------------
    console.log('\n[Test 5] Admin Enquiries: Detail Lookup & Workflow Mutation');
    const enquiryDetailRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/v1/admin/enquiries/${testEnquiryId}`,
      headers: { Cookie: sessionCookie },
    });
    assert(enquiryDetailRes.status === 200, 'GET /admin/enquiries/:id returns 200 OK');
    assert(enquiryDetailRes.body.data.id === testEnquiryId, 'Fetched enquiry ID matches');
    assert(!!enquiryDetailRes.body.data.estimate, 'Includes linked estimate details');
    assert(enquiryDetailRes.body.data.estimate.estimateNumber === testEstimateNumber, 'Linked estimate number matches');

    // Update Status & Admin Notes
    const updateEnquiryRes = await makeRequest(server, {
      method: 'PATCH',
      path: `/api/v1/admin/enquiries/${testEnquiryId}`,
      body: {
        status: 'CONTACTED',
        adminNotes: 'Called client on 18th Aug. Scheduled architectural site visit for Saturday.',
      },
      headers: { Cookie: sessionCookie },
    });
    assert(updateEnquiryRes.status === 200, 'PATCH /admin/enquiries/:id returns 200 OK');
    assert(updateEnquiryRes.body.data.status === 'CONTACTED', 'Enquiry status transitioned to CONTACTED');
    assert(updateEnquiryRes.body.data.adminNotes.includes('Called client'), 'Admin notes successfully updated');

    // -----------------------------------------------------------------
    // [Test 6] Admin Estimates: List, Filter, Lookup & Details
    // -----------------------------------------------------------------
    console.log('\n[Test 6] Admin Estimates: List, Filter & Deep Relation Lookup');
    const estimatesListRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/estimates?page=1&limit=10',
      headers: { Cookie: sessionCookie },
    });
    assert(estimatesListRes.status === 200, 'GET /admin/estimates returns 200 OK');
    assert(Array.isArray(estimatesListRes.body.data), 'Returns estimates array');
    assert(estimatesListRes.body.pagination.total >= 1, 'Total estimates >= 1');

    // Lookup with relations (items, addons, milestones)
    const estimateDetailRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/v1/admin/estimates/${testEstimateId}`,
      headers: { Cookie: sessionCookie },
    });
    assert(estimateDetailRes.status === 200, 'GET /admin/estimates/:id returns 200 OK');
    assert(estimateDetailRes.body.data.estimateNumber === testEstimateNumber, 'Estimate number matches');
    assert(Array.isArray(estimateDetailRes.body.data.addons), 'Returns addons array');
    assert(estimateDetailRes.body.data.addons.length >= 1, 'Includes saved addon items');

    // Lookup by Estimate Number
    const estimateByNumRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/v1/admin/estimates/${testEstimateNumber}`,
      headers: { Cookie: sessionCookie },
    });
    assert(estimateByNumRes.status === 200, 'GET /admin/estimates/:estimateNumber returns 200 OK');
    assert(estimateByNumRes.body.data.id === testEstimateId, 'Estimate lookup by human number returns correct ID');

    // Update Estimate Status & PDF URL
    const updateEstimateRes = await makeRequest(server, {
      method: 'PATCH',
      path: `/api/v1/admin/estimates/${testEstimateId}`,
      body: {
        status: 'GENERATED',
        pdfUrl: 'https://storage.asthiwar.com/estimates/EST-2026-TEST.pdf',
      },
      headers: { Cookie: sessionCookie },
    });
    assert(updateEstimateRes.status === 200, 'PATCH /admin/estimates/:id returns 200 OK');
    assert(updateEstimateRes.body.data.status === 'GENERATED', 'Estimate status updated to GENERATED');
    assert(updateEstimateRes.body.data.pdfUrl.includes('EST-2026-TEST.pdf'), 'PDF URL attached');

    // -----------------------------------------------------------------
    // [Test 7] Admin Analytics Dashboard & Pipeline KPIs
    // -----------------------------------------------------------------
    console.log('\n[Test 7] Admin Analytics Dashboard & Pipeline Valuation');
    const analyticsRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/analytics/dashboard',
      headers: { Cookie: sessionCookie },
    });
    assert(analyticsRes.status === 200, 'GET /admin/analytics/dashboard returns 200 OK');
    assert(analyticsRes.body.success === true, 'Analytics response is successful');
    assert(analyticsRes.body.data.kpis.totalEstimates >= 1, 'KPI: totalEstimates >= 1');
    assert(analyticsRes.body.data.kpis.totalPipelineValue > 0, 'KPI: totalPipelineValue > 0');
    assert(analyticsRes.body.data.kpis.totalEnquiries >= 1, 'KPI: totalEnquiries >= 1');
    assert(Array.isArray(analyticsRes.body.data.estimatesByPackage), 'Returns estimatesByPackage distribution');
    assert(Array.isArray(analyticsRes.body.data.estimatesByLocation), 'Returns estimatesByLocation distribution');
    assert(Array.isArray(analyticsRes.body.data.recentEstimates), 'Returns recentEstimates list');
    assert(Array.isArray(analyticsRes.body.data.recentEnquiries), 'Returns recentEnquiries list');

    console.log('\n-----------------------------------------------------------------');
    console.log('Results: All Phase 7 Admin Management & Analytics Tests Passed!');
  } finally {
    server.close();
    await pool.end();
  }
}

runAdminTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
