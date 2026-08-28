import { updateAdminPackagePrice } from './admin-config.service.js';
import { db, schema, eq, pool } from '@asthiwar/database';

async function verifyPriceVersioning() {
  console.log('\n🔍 Testing Admin Price Versioning...');

  const pkg = await db.query.packages.findFirst({
    where: eq(schema.packages.slug, 'basic'),
  });

  if (!pkg) {
    console.error('Basic package not found');
    process.exit(1);
  }

  const beforeRows = await db
    .select()
    .from(schema.packagePrices)
    .where(eq(schema.packagePrices.packageId, pkg.id));
  console.log(`  Initial price rows for 'basic': ${beforeRows.length}`);

  // Perform an admin update
  const newRow = await updateAdminPackagePrice('basic', {
    pricePerSqft: 2099,
    volumePricePerSqft: 2000,
    volumeDiscountThresholdSqft: 3500,
  });

  const afterRows = await db
    .select()
    .from(schema.packagePrices)
    .where(eq(schema.packagePrices.packageId, pkg.id));
  console.log(`  Price rows for 'basic' after update: ${afterRows.length}`);

  if (afterRows.length > beforeRows.length) {
    console.log('  ✅ PASS: An admin price edit creates a second versioned row rather than overwriting.');
  } else {
    console.error('  ❌ FAIL: Expected new versioned row to be inserted.');
    process.exit(1);
  }

  await pool.end();
}

verifyPriceVersioning().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
