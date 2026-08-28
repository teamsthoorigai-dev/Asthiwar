import { db, schema, isNull, eq, and, sql, pool, desc } from '../index.js';

export async function cleanupDuplicateActivePrices() {
  console.log('\n🧹 Cleaning up duplicate active price rows...');

  // 1. Package Prices Cleanup
  const pkgRows = await db
    .select()
    .from(schema.packagePrices)
    .where(isNull(schema.packagePrices.effectiveTo))
    .orderBy(schema.packagePrices.packageId, desc(schema.packagePrices.effectiveFrom), desc(schema.packagePrices.id));

  const seenPackages = new Set<number>();
  let pkgRetired = 0;

  for (const row of pkgRows) {
    if (seenPackages.has(row.packageId)) {
      // Duplicate active row -> retire it
      await db
        .update(schema.packagePrices)
        .set({ effectiveTo: new Date() })
        .where(eq(schema.packagePrices.id, row.id));
      pkgRetired++;
    } else {
      seenPackages.add(row.packageId);
    }
  }
  console.log(`  Package prices: retired ${pkgRetired} duplicate active row(s).`);

  // 2. Option Prices Cleanup
  const optRows = await db
    .select()
    .from(schema.optionPrices)
    .where(isNull(schema.optionPrices.effectiveTo))
    .orderBy(schema.optionPrices.optionId, desc(schema.optionPrices.effectiveFrom), desc(schema.optionPrices.id));

  const seenOptions = new Set<string>();
  let optRetired = 0;

  for (const row of optRows) {
    const key = `${row.optionId}:${row.packageId ?? 'null'}`;
    if (seenOptions.has(key)) {
      await db
        .update(schema.optionPrices)
        .set({ effectiveTo: new Date() })
        .where(eq(schema.optionPrices.id, row.id));
      optRetired++;
    } else {
      seenOptions.add(key);
    }
  }
  console.log(`  Option prices: retired ${optRetired} duplicate active row(s).`);

  // 3. Addon Prices Cleanup
  const addRows = await db
    .select()
    .from(schema.addonPrices)
    .where(isNull(schema.addonPrices.effectiveTo))
    .orderBy(schema.addonPrices.addonId, desc(schema.addonPrices.effectiveFrom), desc(schema.addonPrices.id));

  const seenAddons = new Set<string>();
  let addRetired = 0;

  for (const row of addRows) {
    const key = `${row.addonId}:${row.variantSlug}`;
    if (seenAddons.has(key)) {
      await db
        .update(schema.addonPrices)
        .set({ effectiveTo: new Date() })
        .where(eq(schema.addonPrices.id, row.id));
      addRetired++;
    } else {
      seenAddons.add(key);
    }
  }
  console.log(`  Addon prices: retired ${addRetired} duplicate active row(s).`);

  // Verify exactly 1 active price per package
  const finalSummary = await db
    .select({
      packageId: schema.packagePrices.packageId,
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${schema.packagePrices.effectiveTo} is null)`,
    })
    .from(schema.packagePrices)
    .groupBy(schema.packagePrices.packageId)
    .orderBy(schema.packagePrices.packageId);

  console.log('\nPackage Prices Summary:');
  console.table(finalSummary);
}

if (process.argv[1]?.includes('cleanup-duplicates')) {
  cleanupDuplicateActivePrices()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Error during cleanup:', err);
      process.exit(1);
    });
}
