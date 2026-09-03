/**
 * ASTHIWAR — Public REST API Endpoints Verification Suite (Phase 5)
 *
 * Tests:
 * 1. GET /api/v1/calculator/locations (HTTP 200, 6 active locations)
 * 2. GET /api/v1/calculator/packages (HTTP 200, 4 packages with two-tier pricing)
 * 3. GET /api/v1/calculator/config/:packageSlug (HTTP 200, grouped categories + 15 add-ons)
 * 4. GET /api/v1/calculator/config/invalid-pkg (HTTP 404, PACKAGE_NOT_FOUND)
 * 5. POST /api/v1/calculator/preview (HTTP 200, calculation without DB save)
 * 6. POST /api/v1/calculator/estimate (HTTP 201, authoritative calculation + Neon DB save)
 * 7. GET /api/v1/calculator/estimate/:estimateNumber (HTTP 200, snapshot fetch)
 * 8. POST /api/v1/enquiries (HTTP 201, consultation lead linked to estimate)
 * 9. Input Validation Error Handling (HTTP 400, structured Zod error details)
 */

import { createApp } from '../../app.js';
import { pool } from '@asthiwar/database';
import http from 'http';

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

async function request(path: string, options: RequestInit = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runApiTests() {
  console.log('\n🌐 ASTHIWAR Public REST API Test Suite — Phase 5\n');
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
    // Test 1: GET /api/v1/calculator/locations
    // -----------------------------------------------------------------------
    console.log('\n[Test 1] GET /api/v1/calculator/locations');
    const locRes = await request('/api/v1/calculator/locations');
    assert(locRes.status === 200, 'Status code is 200');
    assert(locRes.data.success === true, 'Response has success: true');
    assert(Array.isArray(locRes.data.data), 'Returns data array');
    assert(locRes.data.data.length === 6, 'Returns 6 active locations', `Got ${locRes.data.data.length}`);
    const chennai = locRes.data.data.find((l: any) => l.slug === 'chennai');
    assert(chennai?.priceMultiplier === 1.05, 'Chennai multiplier is 1.05');

    // -----------------------------------------------------------------------
    // Test 2: GET /api/v1/calculator/packages
    // -----------------------------------------------------------------------
    console.log('\n[Test 2] GET /api/v1/calculator/packages');
    const pkgRes = await request('/api/v1/calculator/packages');
    assert(pkgRes.status === 200, 'Status code is 200');
    assert(pkgRes.data.data.length === 4, 'Returns 4 packages');
    const basic = pkgRes.data.data.find((p: any) => p.slug === 'basic');
    assert(basic?.pricing.standardRatePerSqft === 2099, 'Basic standard rate is ₹2,099/sqft');
    assert(basic?.pricing.volumeRatePerSqft === 2000, 'Basic volume rate is ₹2,000/sqft');

    // -----------------------------------------------------------------------
    // Test 3: GET /api/v1/calculator/config/:packageSlug
    // -----------------------------------------------------------------------
    console.log('\n[Test 3] GET /api/v1/calculator/config/standard');
    const cfgRes = await request('/api/v1/calculator/config/standard');
    assert(cfgRes.status === 200, 'Status code is 200');
    assert(cfgRes.data.data.package.slug === 'standard', 'Package slug is standard');
    assert(Array.isArray(cfgRes.data.data.specifications), 'Returns specifications array');
    assert(cfgRes.data.data.specifications.length === 10, 'Contains 10 category groups');
    assert(Array.isArray(cfgRes.data.data.addons), 'Returns addons array');
    assert(cfgRes.data.data.addons.length === 15, 'Contains 15 add-ons catalog items');

    // -----------------------------------------------------------------------
    // Test 4: GET /api/v1/calculator/config/invalid-slug (404)
    // -----------------------------------------------------------------------
    console.log('\n[Test 4] GET /api/v1/calculator/config/non-existent-package (404)');
    const notFoundRes = await request('/api/v1/calculator/config/non-existent-package');
    assert(notFoundRes.status === 404, 'Status code is 404');
    assert(notFoundRes.data.error.code === 'PACKAGE_NOT_FOUND', 'Returns PACKAGE_NOT_FOUND error code');

    // -----------------------------------------------------------------------
    // Test 5: POST /api/v1/calculator/preview (No DB save)
    // -----------------------------------------------------------------------
    console.log('\n[Test 5] POST /api/v1/calculator/preview');
    const previewPayload = {
      customerName: 'Preview User',
      customerPhone: '9876543210',
      customerEmail: 'preview@example.com',
      plotLocation: 'Coimbatore',
      plotArea: 1500,
      builtupAreaPerFloor: 1000,
      floorCount: 1,
      packageSlug: 'standard',
    };
    const previewRes = await request('/api/v1/calculator/preview', {
      method: 'POST',
      body: JSON.stringify(previewPayload),
    });
    assert(previewRes.status === 200, 'Status code is 200');
    assert(previewRes.data.data.breakdown.totalProjectCost === 4936000, 'Calculated total cost is ₹49,36,000');
    assert(previewRes.data.data.estimateId === undefined, 'No estimateId generated (preview only, no DB save)');

    // -----------------------------------------------------------------------
    // Test 6: POST /api/v1/calculator/estimate (Authoritative + DB save)
    // -----------------------------------------------------------------------
    console.log('\n[Test 6] POST /api/v1/calculator/estimate (DB Persist)');
    const estimatePayload = {
      customerName: 'Aswin Kumar',
      customerPhone: '9876543210',
      customerEmail: 'aswin@example.com',
      plotLocation: 'Chennai',
      plotArea: 2400,
      builtupAreaPerFloor: 1200,
      floorCount: 1,
      carParkingAreaSqft: 200,
      packageSlug: 'premium',
      customizations: [
        { itemSlug: 'masonry_work', optionSlug: 'red_brick' },
      ],
      addons: [
        { addonSlug: 'underground_sump', variantSlug: 'flyash', quantity: 5000 },
        { addonSlug: 'rooftop_solar', variantSlug: '3kw' },
      ],
    };
    const estRes = await request('/api/v1/calculator/estimate', {
      method: 'POST',
      body: JSON.stringify(estimatePayload),
    });
    assert(estRes.status === 201, 'Status code is 201 (Created)');
    assert(Boolean(estRes.data.data.estimateId), `Estimate ID generated: ${estRes.data.data.estimateId}`);
    assert(Boolean(estRes.data.data.estimateNumber), `Estimate Number: ${estRes.data.data.estimateNumber}`);

    const createdEstimateNumber = estRes.data.data.estimateNumber;

    // -----------------------------------------------------------------------
    // Test 7: GET /api/v1/calculator/estimate/:estimateNumber
    // -----------------------------------------------------------------------
    console.log('\n[Test 7] GET /api/v1/calculator/estimate/:estimateNumber');
    const fetchEstRes = await request(`/api/v1/calculator/estimate/${createdEstimateNumber}`);
    assert(fetchEstRes.status === 200, 'Status code is 200');
    assert(fetchEstRes.data.data.estimateNumber === createdEstimateNumber, 'Fetched estimate number matches');
    assert(fetchEstRes.data.data.customer.name === 'Aswin Kumar', 'Customer name matches');
    assert(fetchEstRes.data.data.milestones.length === 10, 'Contains 10 milestone stages in snapshot');

    // -----------------------------------------------------------------------
    // Test 8: POST /api/v1/enquiries (Consultation Lead)
    // -----------------------------------------------------------------------
    console.log('\n[Test 8] POST /api/v1/enquiries');
    const enquiryPayload = {
      fullName: 'Aswin Kumar',
      phone: '9876543210',
      email: 'aswin@example.com',
      plotLocation: 'Chennai',
      estimateNumber: createdEstimateNumber,
      preferredContactTime: 'Evening (4 PM - 7 PM)',
      requirementNotes: 'Need site visit this weekend for plot assessment',
    };
    const enqRes = await request('/api/v1/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiryPayload),
    });
    assert(enqRes.status === 201, 'Status code is 201');
    assert(enqRes.data.data.status === 'NEW', 'Enquiry status is NEW');
    assert(enqRes.data.data.estimateNumber === createdEstimateNumber, 'Enquiry linked to estimate number');

    // -----------------------------------------------------------------------
    // Test 9: Input Validation Failure Handling (400 Bad Request)
    // -----------------------------------------------------------------------
    console.log('\n[Test 9] Validation Failure Handling (400 Bad Request)');
    const invalidPayload = {
      customerName: 'A', // Too short (min 2)
      customerPhone: '123', // Too short (min 10)
      customerEmail: 'not-an-email', // Invalid email
      plotLocation: '',
      plotArea: -500, // Negative area
      builtupAreaPerFloor: 0,
      floorCount: -1,
      packageSlug: 'ultra-luxury', // Invalid package
    };
    const invalidRes = await request('/api/v1/calculator/estimate', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
    });
    assert(invalidRes.status === 400, 'Status code is 400 (Bad Request)');
    assert(invalidRes.data.error.code === 'VALIDATION_ERROR', 'Returns VALIDATION_ERROR code');
    assert(Array.isArray(invalidRes.data.error.details), 'Returns array of validation details');
    assert(invalidRes.data.error.details.length >= 5, `Captured ${invalidRes.data.error.details.length} validation errors`);

    console.log('\n----------------------------------------------------');
    console.log(`Results: ${testsPassed} Passed, ${testsFailed} Failed\n`);

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ API Test Suite crashed:', error);
    process.exit(1);
  } finally {
    server.close();
    await pool.end();
  }
}

runApiTests();
