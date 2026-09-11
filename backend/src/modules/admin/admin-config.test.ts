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
    // Both name and slug are unique columns. This used a fixed name with a unique
    // slug, so the first run leaked a 'Salem Test City' row into the customer-facing
    // location dropdown and every later run collided with it.
    const testLocationStamp = Date.now();
    const testLocationSlug = `salem_test_${testLocationStamp}`;
    const testLocationName = `Salem Test City ${testLocationStamp}`;
    const createLocRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/admin/config/locations',
      body: {
        name: testLocationName,
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

    // Remove it again. Locations created here are offered to real customers in the
    // calculator until someone deletes them by hand.
    const deleteLocRes = await makeRequest(server, {
      method: 'DELETE',
      path: `/api/v1/admin/config/locations/${newLocationId}`,
      headers: { Cookie: sessionCookie },
    });
    assert(
      deleteLocRes.status === 200 || deleteLocRes.status === 204,
      `DELETE /admin/config/locations/:id removes the test location (got ${deleteLocRes.status})`
    );

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
    assert(addonsRes.body.data.length >= 15, `Returns at least the 15 seeded add-ons (got ${addonsRes.body.data.length})`);

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

    // Test creating, renaming via PATCH, repricing, and deleting an add-on variant
    const tempVariantStamp = Date.now();
    const tempVariantSlug = `test_var_${tempVariantStamp}`;
    const createVarRes = await makeRequest(server, {
      method: 'POST',
      path: `/api/v1/admin/config/addons/${sumpAddon.id}/variants`,
      body: {
        variantName: 'Temporary Test Variant',
        variantSlug: tempVariantSlug,
        price: 35,
        packageTiers: ['basic', 'standard'],
      },
      headers: { Cookie: sessionCookie },
    });
    assert(createVarRes.status === 201, 'POST /admin/config/addons/:id/variants returns 201 Created');
    const createdVarId = createVarRes.body.data.id;

    // 1. Rename variant in-place without price change
    const renameVarRes = await makeRequest(server, {
      method: 'PATCH',
      path: `/api/v1/admin/config/addons/${sumpAddon.id}/variants/${createdVarId}`,
      body: {
        variantName: 'Renamed Test Variant',
        packageTiers: ['premium'],
      },
      headers: { Cookie: sessionCookie },
    });
    assert(renameVarRes.status === 200, 'PATCH /admin/config/addons/:id/variants/:variantId renames variant');
    assert(renameVarRes.body.data.variantName === 'Renamed Test Variant', 'Variant name successfully renamed without recreation');

    // 2. Update price with versioning
    const priceVarRes = await makeRequest(server, {
      method: 'PATCH',
      path: `/api/v1/admin/config/addons/${sumpAddon.id}/variants/${createdVarId}`,
      body: {
        price: 45,
      },
      headers: { Cookie: sessionCookie },
    });
    assert(priceVarRes.status === 200, 'PATCH /admin/config/addons/:id/variants/:variantId versions price');
    assert(priceVarRes.body.data.price === '45.00', 'Variant price updated to 45.00');

    // Clean up temporary variant rows
    const finalVarId = priceVarRes.body.data.id;
    await makeRequest(server, {
      method: 'DELETE',
      path: `/api/v1/admin/config/addons/${sumpAddon.id}/variants/${finalVarId}`,
      headers: { Cookie: sessionCookie },
    });
    if (finalVarId !== createdVarId) {
      await makeRequest(server, {
        method: 'DELETE',
        path: `/api/v1/admin/config/addons/${sumpAddon.id}/variants/${createdVarId}`,
        headers: { Cookie: sessionCookie },
      });
    }

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
    assert(specsRes.body.data.length >= 9, 'Returns at least the 9 seeded specification categories');

    // -----------------------------------------------------------------
    // [Test 7] per_sqft add-ons are charged per unit, not as a flat fee
    // -----------------------------------------------------------------
    console.log('\n[Test 7] per_sqft Add-On Pricing');
    // 'per_sqft' is offered by the admin console (ADDON_PRICING_UNITS) but no seed
    // row uses it, so nothing exercised it: the engine's switch listed the other
    // measured units and everything else fell through to a flat price. A
    // Rs.120/sq.ft false ceiling billed as Rs.120 total. Created here rather than
    // seeded so the gap between "offerable" and "priceable" stays covered.
    const perSqftSlug = `false_ceiling_test_${Date.now()}`;
    const createPerSqftRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/admin/config/addons',
      body: {
        name: `False Ceiling Test ${Date.now()}`,
        slug: perSqftSlug,
        description: 'Temporary per_sqft add-on used to verify unit pricing.',
        pricingUnit: 'per_sqft',
        defaultQuantity: 500,
        minQuantity: 100,
        maxQuantity: 5000,
        sortOrder: 99,
        variants: [
          {
            variantName: 'Gypsum',
            variantSlug: 'gypsum',
            price: 120,
            packageTiers: ['basic', 'standard', 'premium', 'luxury'],
          },
        ],
      },
      headers: { Cookie: sessionCookie },
    });
    assert(createPerSqftRes.status === 201, `Created a per_sqft add-on (got ${createPerSqftRes.status})`);
    const perSqftAddonId = createPerSqftRes.body.data?.id;
    assert(Boolean(perSqftAddonId), 'per_sqft add-on has an id');

    try {
      const priced = await makeRequest(server, {
        method: 'POST',
        path: '/api/v1/calculator/preview',
        body: {
          customerName: 'Per Sqft Probe',
          customerPhone: '9876543210',
          plotLocation: 'Coimbatore',
          plotArea: 2400,
          builtupAreaPerFloor: 1200,
          floorCount: 1,
          packageSlug: 'basic',
          addons: [{ addonSlug: perSqftSlug, variantSlug: 'gypsum', quantity: 800 }],
        },
      });
      assert(priced.status === 200, `per_sqft add-on prices successfully (got ${priced.status})`);
      const line = priced.body.data?.addons?.find((a: any) => a.addonSlug === perSqftSlug);
      assert(Boolean(line), 'per_sqft add-on appears on the estimate');
      assert(line?.quantity === 800, `Quantity is carried through (got ${line?.quantity})`);
      assert(
        line?.totalPrice === 96000,
        `800 sq.ft @ Rs.120 is Rs.96,000, not a flat Rs.120 (got ${line?.totalPrice})`
      );

      // Omitting the quantity must fall back to the catalogue default, and the
      // amount reported on the line must be the amount charged — the flat branch
      // used to report defaultQuantity while charging 1.
      const defaulted = await makeRequest(server, {
        method: 'POST',
        path: '/api/v1/calculator/preview',
        body: {
          customerName: 'Per Sqft Probe',
          customerPhone: '9876543210',
          plotLocation: 'Coimbatore',
          plotArea: 2400,
          builtupAreaPerFloor: 1200,
          floorCount: 1,
          packageSlug: 'basic',
          addons: [{ addonSlug: perSqftSlug, variantSlug: 'gypsum' }],
        },
      });
      const defaultedLine = defaulted.body.data?.addons?.find((a: any) => a.addonSlug === perSqftSlug);
      assert(defaultedLine?.quantity === 500, `Falls back to defaultQuantity (got ${defaultedLine?.quantity})`);
      assert(
        defaultedLine?.totalPrice === 60000,
        `Charges the quantity it reports: 500 @ Rs.120 = Rs.60,000 (got ${defaultedLine?.totalPrice})`
      );
    } finally {
      const deletePerSqftRes = await makeRequest(server, {
        method: 'DELETE',
        path: `/api/v1/admin/config/addons/${perSqftAddonId}`,
        headers: { Cookie: sessionCookie },
      });
      assert(
        deletePerSqftRes.status === 200 || deletePerSqftRes.status === 204,
        `Temporary per_sqft add-on removed (got ${deletePerSqftRes.status})`
      );
    }

    // -----------------------------------------------------------------
    // [Test 8] Audit trail is readable
    // -----------------------------------------------------------------
    console.log('\n[Test 8] Audit Log Read Path');
    // Three call sites have written to audit_logs since the table was created —
    // the error handler, this config controller and the calculator controller —
    // and nothing could read any of it back. A compliance table nobody can query
    // is storage, not a compliance measure.
    const auditUnauth = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/audit-logs',
    });
    assert(auditUnauth.status === 401, `Audit logs require auth (got ${auditUnauth.status})`);

    const auditRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/audit-logs?limit=5',
      headers: { Cookie: sessionCookie },
    });
    assert(auditRes.status === 200, `GET /admin/audit-logs returns 200 OK (got ${auditRes.status})`);
    assert(Array.isArray(auditRes.body.data), 'Returns an array of audit entries');
    assert(Boolean(auditRes.body.pagination), 'Returns pagination metadata');
    assert(auditRes.body.data.length <= 5, 'Respects the limit');

    // The admin mutations earlier in this suite are themselves audited, so there
    // is something to find.
    assert(auditRes.body.pagination.total > 0, `Audit trail is not empty (${auditRes.body.pagination.total} entries)`);

    // Stack traces are excluded from the list payload; a single entry carries them.
    const firstLog = auditRes.body.data[0];
    assert(!('errorStack' in firstLog), 'List omits errorStack');
    const oneLogRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/v1/admin/audit-logs/${firstLog.id}`,
      headers: { Cookie: sessionCookie },
    });
    assert(oneLogRes.status === 200, `GET /admin/audit-logs/:id returns 200 OK (got ${oneLogRes.status})`);
    assert(oneLogRes.body.data.id === firstLog.id, 'Fetches the requested entry');

    const missingLogRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/audit-logs/99999999',
      headers: { Cookie: sessionCookie },
    });
    assert(missingLogRes.status === 404, `Unknown audit log id returns 404 (got ${missingLogRes.status})`);

    // Filtering narrows rather than silently ignoring the parameter.
    const filteredRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/audit-logs?severity=NO_SUCH_SEVERITY',
      headers: { Cookie: sessionCookie },
    });
    assert(filteredRes.status === 200, 'Filtered query returns 200 OK');
    assert(filteredRes.body.pagination.total === 0, 'An unmatched filter returns nothing rather than everything');

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
