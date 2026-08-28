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

async function runAdminConfigTests() {
  console.log('\n⚙️ ASTHIWAR Admin Calculator Configuration & Pricing Test Suite — Phase 8\n');
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

  try {
    // -----------------------------------------------------------------
    // [Test 1] Security Guard: Unauthorized Access Blocking (401)
    // -----------------------------------------------------------------
    console.log('\n[Test 1] Security Guard: Unauthorized Access Blocking (401)');
    const unauthPackages = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/config/packages',
    });
    assert(unauthPackages.status === 401, 'GET /admin/config/packages without auth returns 401');
    assert(unauthPackages.body.error.code === 'UNAUTHORIZED', 'Returns UNAUTHORIZED code');

    // -----------------------------------------------------------------
    // [Test 2] Admin Login & Session Acquisition
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
    bearerToken = loginRes.body.data.token;
    const setCookie = loginRes.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      sessionCookie = setCookie[0].split(';')[0];
    }
    assert(!!sessionCookie, 'Session cookie captured');

    // -----------------------------------------------------------------
    // [Test 3] Packages Config & Price Versioning
    // -----------------------------------------------------------------
    console.log('\n[Test 3] Packages Config & Versioned Pricing Mutation');
    const pkgsRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/config/packages',
      headers: { Cookie: sessionCookie },
    });
    assert(pkgsRes.status === 200, 'GET /admin/config/packages returns 200 OK');
    assert(pkgsRes.body.data.length === 4, 'Returns 4 packages');
    const standardPkg = pkgsRes.body.data.find((p: any) => p.slug === 'standard');
    assert(!!standardPkg, 'Standard package exists');
    const initialPriceId = standardPkg.activePrice.id;

    // Update Standard package prices
    const updatePriceRes = await makeRequest(server, {
      method: 'PUT',
      path: `/api/v1/admin/config/packages/${standardPkg.id}/price`,
      body: {
        pricePerSqft: 2499,
        volumePricePerSqft: 2380,
        volumeDiscountThresholdSqft: 3500,
      },
      headers: { Cookie: sessionCookie },
    });
    assert(updatePriceRes.status === 200, 'PUT /admin/config/packages/:id/price returns 200 OK');
    assert(updatePriceRes.body.data.pricePerSqft === '2499.00', 'New standard price is ₹2,499.00');
    assert(updatePriceRes.body.data.id !== initialPriceId, 'New versioned price ID created (old price kept for history)');

    // Restore Standard package price to original seed for dev consistency
    await makeRequest(server, {
      method: 'PUT',
      path: `/api/v1/admin/config/packages/${standardPkg.id}/price`,
      body: {
        pricePerSqft: 2468,
        volumePricePerSqft: 2357,
        volumeDiscountThresholdSqft: 3500,
      },
      headers: { Cookie: sessionCookie },
    });

    // Update package metadata
    const updateMetaRes = await makeRequest(server, {
      method: 'PATCH',
      path: `/api/v1/admin/config/packages/${standardPkg.id}`,
      body: {
        tagline: 'Family Favorite & Most Popular',
      },
      headers: { Cookie: sessionCookie },
    });
    assert(updateMetaRes.status === 200, 'PATCH /admin/config/packages/:id returns 200 OK');
    assert(updateMetaRes.body.data.tagline === 'Family Favorite & Most Popular', 'Package tagline updated');

    // -----------------------------------------------------------------
    // [Test 4] Locations Config: List, Create, Update
    // -----------------------------------------------------------------
    console.log('\n[Test 4] Locations Config: List, Create & Multiplier Update');
    const locsRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/config/locations',
      headers: { Cookie: sessionCookie },
    });
    assert(locsRes.status === 200, 'GET /admin/config/locations returns 200 OK');
    assert(locsRes.body.data.length >= 6, 'Returns 6+ locations');

    // Create a new city location (e.g. Salem)
    const testLocationSlug = `salem_test_${Date.now()}`;
    const createLocRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/admin/config/locations',
      body: {
        name: 'Salem Test City',
        slug: testLocationSlug,
        priceMultiplier: 0.97,
        sortOrder: 7,
        isActive: true,
      },
      headers: { Cookie: sessionCookie },
    });
    assert(createLocRes.status === 201, 'POST /admin/config/locations returns 201 Created');
    const newLocationId = createLocRes.body.data.id;
    assert(createLocRes.body.data.priceMultiplier === '0.9700', 'Multiplier is 0.9700');

    // Update Location
    const updateLocRes = await makeRequest(server, {
      method: 'PATCH',
      path: `/api/v1/admin/config/locations/${newLocationId}`,
      body: {
        priceMultiplier: 0.99,
      },
      headers: { Cookie: sessionCookie },
    });
    assert(updateLocRes.status === 200, 'PATCH /admin/config/locations/:id returns 200 OK');
    assert(updateLocRes.body.data.priceMultiplier === '0.9900', 'Location multiplier updated to 0.9900');

    // -----------------------------------------------------------------
    // [Test 5] Add-Ons Config & Versioned Pricing
    // -----------------------------------------------------------------
    console.log('\n[Test 5] Add-Ons Config & Variant Pricing History');
    const addonsRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/config/addons',
      headers: { Cookie: sessionCookie },
    });
    assert(addonsRes.status === 200, 'GET /admin/config/addons returns 200 OK');
    assert(addonsRes.body.data.length === 15, 'Returns 15 add-ons');

    const sumpAddon = addonsRes.body.data.find((a: any) => a.slug === 'underground_sump');
    assert(!!sumpAddon, 'Underground Sump add-on found');

    // Update Sump Flyash unit price from ₹26 to ₹28 per litre
    const updateAddonRes = await makeRequest(server, {
      method: 'PUT',
      path: `/api/v1/admin/config/addons/${sumpAddon.id}/price`,
      body: {
        variantSlug: 'flyash',
        price: 28,
      },
      headers: { Cookie: sessionCookie },
    });
    assert(updateAddonRes.status === 200, 'PUT /admin/config/addons/:id/price returns 200 OK');
    assert(updateAddonRes.body.data.price === '28.00', 'Addon price updated to ₹28.00/L');

    // Restore Sump Flyash unit price to ₹26
    await makeRequest(server, {
      method: 'PUT',
      path: `/api/v1/admin/config/addons/${sumpAddon.id}/price`,
      body: {
        variantSlug: 'flyash',
        price: 26,
      },
      headers: { Cookie: sessionCookie },
    });

    // -----------------------------------------------------------------
    // [Test 6] Specifications & Matrix Config
    // -----------------------------------------------------------------
    console.log('\n[Test 6] Specifications & Package Inclusion Matrix');
    const specsRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/config/specifications',
      headers: { Cookie: sessionCookie },
    });
    assert(specsRes.status === 200, 'GET /admin/config/specifications returns 200 OK');
    assert(specsRes.body.data.length === 10, 'Returns 10 specification categories');

    console.log('\n-----------------------------------------------------------------');
    console.log('Results: All Phase 8 Admin Configuration & Pricing Tests Passed!');
  } finally {
    server.close();
    await pool.end();
  }
}

runAdminConfigTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
