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

/** The parts of a component in the admin specifications payload that Test 9 reads. */
interface AdminSpecItem {
  id: number;
  slug: string;
  options: Array<{
    id: number;
    slug: string;
    prices: Array<{ packageId: number | null; priceDelta: string | number; effectiveTo: string | null }>;
  }>;
  packageMappings: Array<{ packageId: number; defaultOptionId: number | null }>;
}

/** The parts of a component in the public calculator config that Test 9 reads. */
interface QuotedSpecItem {
  slug: string;
  options: Array<{ slug: string; priceDelta: number; isPackageDefault: boolean }>;
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
    // The session is only issued as a cookie; its value doubles as a bearer token.
    const setCookie = loginRes.headers['set-cookie'] ?? [];
    sessionCookie = setCookie.find((c) => c.startsWith('asthiwar_session='))?.split(';')[0] ?? '';
    bearerToken = sessionCookie.slice('asthiwar_session='.length);
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

    // -----------------------------------------------------------------
    // [Test 9] A component's rate matrix saves as one change
    // -----------------------------------------------------------------
    console.log('\n[Test 9] Rate Matrix: Linked Rows, Columns & Included Brands');
    // Cement as seeded: every rate is the gap between two brands on one ladder
    // (ISI 0, JSW 5, Ramco/Dalmia 15, Ultratech/Chettinad 35), each tier
    // including a different brand. The console edits a row or a column and sends
    // everything that moves; this is the request it sends.
    const matrixSpecsRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/config/specifications',
      headers: { Cookie: sessionCookie },
    });
    const specItems = (matrixSpecsRes.body.data as Array<{ items: AdminSpecItem[] }>).flatMap(
      (category) => category.items
    );
    const cement = specItems.find((item) => item.slug === 'cement')!;
    assert(!!cement, 'Cement component is present');

    const allPkgs: Array<{ id: number; slug: string }> = pkgsRes.body.data;
    const pkgId = (slug: string) => allPkgs.find((p) => p.slug === slug)!.id;
    const optId = (slug: string) => cement.options.find((o) => o.slug === slug)!.id;
    const ISI = optId('any_isi_cement');
    const JSW = optId('jsw_cement');
    const RAMCO = optId('ramco_dalmia_cement');
    const ULTRATECH = optId('ultratech_chettinad_cement');

    const liveRate = (option: AdminSpecItem['options'][number], packageId: number): number => {
      const live = option.prices.filter((p) => p.effectiveTo === null);
      const row =
        live.find((p) => p.packageId === packageId) ?? live.find((p) => p.packageId === null);
      return row ? Number(row.priceDelta) : 0;
    };
    const originalRates = cement.options.flatMap((option) =>
      allPkgs.map((pkg) => ({ optionId: option.id, packageId: pkg.id, priceDelta: liveRate(option, pkg.id) }))
    );
    const originalPremiumDefault = cement.packageMappings.find(
      (m) => m.packageId === pkgId('premium')
    )!.defaultOptionId;
    assert(originalPremiumDefault === RAMCO, 'Premium includes Ramco/Dalmia cement as seeded');

    /** One brand's full row, in basic/standard/premium/luxury order. */
    const row = (optionId: number, rates: [number, number, number, number]) =>
      ['basic', 'standard', 'premium', 'luxury'].map((slug, index) => ({
        optionId,
        packageId: pkgId(slug),
        priceDelta: rates[index],
      }));

    const putMatrix = (body: unknown, cookie = sessionCookie) =>
      makeRequest(server, {
        method: 'PUT',
        path: `/api/v1/admin/config/items/${cement.id}/rate-matrix`,
        body,
        headers: cookie ? { Cookie: cookie } : {},
      });

    const configFor = async (packageSlug: string): Promise<QuotedSpecItem> => {
      const res = await makeRequest(server, { method: 'GET', path: `/api/v1/calculator/config/${packageSlug}` });
      return (res.body.data.specifications as Array<{ items: QuotedSpecItem[] }>)
        .flatMap((category) => category.items)
        .find((item) => item.slug === 'cement')!;
    };
    const quoted = (item: QuotedSpecItem, optionSlug: string) => item.options.find((o) => o.slug === optionSlug)!;

    try {
      const unauthMatrix = await putMatrix({ rates: row(ULTRATECH, [40, 35, 25, 0]) }, '');
      assert(unauthMatrix.status === 401, `Rate matrix write requires auth (got ${unauthMatrix.status})`);

      // A brand sent with some packages missing would leave those tiers unpriced,
      // and the engine charges an unpriced tier nothing.
      const partialRow = await putMatrix({
        rates: [{ optionId: ULTRATECH, packageId: pkgId('basic'), priceDelta: 40 }],
      });
      assert(
        partialRow.status === 400 && partialRow.body.error.code === 'INCOMPLETE_RATE_ROW',
        `A brand without a rate for every package is refused (got ${partialRow.status} ${partialRow.body.error?.code})`
      );

      // Option ids are global: another component's brand cannot be repriced
      // through this one.
      const steel = specItems.find((item) => item.slug === 'steel_rebar_binding_wires')!;
      const foreign = await putMatrix({ rates: row(steel.options[0].id, [0, 0, 0, 0]) });
      assert(
        foreign.status === 400 && foreign.body.error.code === 'OPTION_BELONGS_TO_ANOTHER_ITEM',
        `Another component's brand is refused (got ${foreign.status} ${foreign.body.error?.code})`
      );

      // Luxury includes Ultratech, so Ultratech cannot carry a charge there.
      const chargedIncluded = await putMatrix({ rates: row(ULTRATECH, [40, 35, 25, 5]) });
      assert(
        chargedIncluded.status === 400 && chargedIncluded.body.error.code === 'INCLUDED_OPTION_IS_NOT_FREE',
        `An included brand with a charge in its own package is refused (got ${chargedIncluded.status} ${chargedIncluded.body.error?.code})`
      );

      const duplicate = await putMatrix({
        rates: [...row(ULTRATECH, [40, 35, 25, 0]), { optionId: ULTRATECH, packageId: pkgId('basic'), priceDelta: 41 }],
      });
      assert(duplicate.status === 400, `The same cell twice is refused (got ${duplicate.status})`);

      // Ultratech moves up the ladder by 5: its own row follows, and so does the
      // Luxury column, which is measured from Ultratech.
      const moved = await putMatrix({
        rates: [
          ...row(ISI, [0, -5, -15, -40]),
          ...row(JSW, [5, 0, -10, -35]),
          ...row(RAMCO, [15, 10, 0, -25]),
          ...row(ULTRATECH, [40, 35, 25, 0]),
        ],
      });
      assert(moved.status === 200, `Linked row edit saves (got ${moved.status} ${moved.body?.error?.code ?? ''})`);
      assert(moved.body.data.changes.length === 6, `Six rates moved (got ${moved.body.data.changes?.length})`);

      const basicCement = await configFor('basic');
      const luxuryCement = await configFor('luxury');
      assert(quoted(basicCement, 'ultratech_chettinad_cement').priceDelta === 40, 'Basic customers are quoted +40 for Ultratech');
      assert(quoted(luxuryCement, 'any_isi_cement').priceDelta === -40, 'Luxury customers are credited −40 for ISI');
      assert(quoted(luxuryCement, 'ultratech_chettinad_cement').priceDelta === 0, 'Luxury still includes Ultratech free');

      const matrixAudit = await makeRequest(server, {
        method: 'GET',
        path: '/api/v1/admin/audit-logs?action=UPDATE_RATE_MATRIX',
        headers: { Cookie: sessionCookie },
      });
      assert(matrixAudit.body.pagination.total > 0, 'The rate matrix change is in the audit trail');

      // Pointing Premium at a brand that still carries a charge there is refused.
      const unpricedSwitch = await putMatrix({
        rates: [],
        defaults: [{ packageId: pkgId('premium'), defaultOptionId: JSW }],
      });
      assert(
        unpricedSwitch.status === 400 && unpricedSwitch.body.error.code === 'INCLUDED_OPTION_IS_NOT_FREE',
        `Including a brand that is charged there is refused (got ${unpricedSwitch.status} ${unpricedSwitch.body.error?.code})`
      );

      // Premium switches to Ultratech and its column is re-measured from it, in
      // one request — either half alone would be refused.
      const switched = await putMatrix({
        rates: [
          ...row(ISI, [0, -5, -40, -40]),
          ...row(JSW, [5, 0, -35, -35]),
          ...row(RAMCO, [15, 10, -25, -25]),
          ...row(ULTRATECH, [40, 35, 0, 0]),
        ],
        defaults: [{ packageId: pkgId('premium'), defaultOptionId: ULTRATECH }],
      });
      assert(switched.status === 200, `Included brand switch with its column saves (got ${switched.status} ${switched.body?.error?.code ?? ''})`);

      const premiumCement = await configFor('premium');
      assert(quoted(premiumCement, 'ultratech_chettinad_cement').isPackageDefault === true, 'Premium now includes Ultratech');
      assert(quoted(premiumCement, 'ultratech_chettinad_cement').priceDelta === 0, 'Ultratech is free in Premium');
      assert(quoted(premiumCement, 'ramco_dalmia_cement').priceDelta === -25, 'Ramco/Dalmia is now a −25 credit in Premium');
    } finally {
      const restored = await putMatrix({
        rates: originalRates,
        defaults: [{ packageId: pkgId('premium'), defaultOptionId: originalPremiumDefault }],
      });
      assert(restored.status === 200, `Seeded cement rates restored (got ${restored.status} ${restored.body?.error?.code ?? ''})`);
    }

    const restoredPremium = await configFor('premium');
    assert(quoted(restoredPremium, 'ramco_dalmia_cement').isPackageDefault === true, 'Premium includes Ramco/Dalmia again');
    assert(quoted(restoredPremium, 'any_isi_cement').priceDelta === -15, 'ISI is back to its seeded −15 credit in Premium');

    // -----------------------------------------------------------------
    // [Test 10] Price changes and sign-ins leave a record
    // -----------------------------------------------------------------
    console.log('\n[Test 10] Audit coverage for pricing and sign-in');
    // A city's multiplier, an add-on's price and a variant's deletion change what
    // customers are quoted; each ran earlier in this suite, and none used to be
    // recorded. Nor was any sign-in, successful or not.
    const failedSignIn = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/admin/auth/login',
      body: { email: 'audit-probe@asthiwar.test', password: 'not-the-password' },
    });
    assert(failedSignIn.status === 401, 'A wrong password is refused');

    // Audit writes are fire-and-forget, so give each a moment to land.
    const auditRows = async (action: string): Promise<Array<{ actorId: string | null }>> => {
      for (let attempt = 0; attempt < 20; attempt++) {
        const res = await makeRequest(server, {
          method: 'GET',
          path: `/api/v1/admin/audit-logs?action=${action}&limit=20`,
          headers: { Cookie: sessionCookie },
        });
        if (res.body.pagination.total > 0) return res.body.data;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return [];
    };

    for (const action of [
      'ADMIN_LOGIN',
      'CREATE_LOCATION',
      'UPDATE_LOCATION',
      'UPDATE_ADDON_PRICE',
      'CREATE_ADDON_VARIANT',
      'UPDATE_ADDON_VARIANT',
      'DELETE_ADDON_VARIANT',
    ]) {
      assert((await auditRows(action)).length > 0, `${action} is in the audit trail`);
    }

    const failedSignIns = await auditRows('ADMIN_LOGIN_FAILED');
    assert(
      failedSignIns.some((row) => row.actorId === 'au****@asthiwar.test'),
      'A failed sign-in is recorded against the (masked) account it targeted'
    );

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
