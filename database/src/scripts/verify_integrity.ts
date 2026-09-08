import { db, schema, sql } from '../index.js';

async function verifyDatabaseIntegrity() {
  console.log("=== ASTHIWAR DATABASE AUDIT & INTEGRITY CHECK ===");

  const locs = await db.select().from(schema.locations);
  const pkgs = await db.select().from(schema.packages);
  const cats = await db.select().from(schema.categories);
  const items = await db.select().from(schema.items);
  const opts = await db.select().from(schema.options);
  const pkgItems = await db.select().from(schema.packageItems);
  const optPrices = await db.select().from(schema.optionPrices);
  const addons = await db.select().from(schema.addons);
  const addonPrices = await db.select().from(schema.addonPrices);
  const milestones = await db.select().from(schema.milestoneStages);

  console.log(`\nTable Counts:`);
  console.log(`- Locations: ${locs.length} (Expected: 8)`);
  console.log(`- Packages: ${pkgs.length} (Expected: 4)`);
  console.log(`- Categories: ${cats.length} (Expected: 9)`);
  console.log(`- Items: ${items.length} (Expected: 24)`);
  console.log(`- Options: ${opts.length} (Expected: 96)`);
  console.log(`- Package Items: ${pkgItems.length} (Expected: 96)`);
  console.log(`- Option Prices: ${optPrices.length} (Expected: 256)`);
  console.log(`- Addons: ${addons.length} (Expected: 15)`);
  console.log(`- Addon Prices: ${addonPrices.length} (Expected: 34)`);
  console.log(`- Milestone Stages: ${milestones.length} (Expected: 10)`);

  // Check for duplicate slugs
  const itemSlugs = items.map(i => i.slug);
  const uniqueItemSlugs = new Set(itemSlugs);
  const optSlugs = opts.map(o => o.slug);
  const uniqueOptSlugs = new Set(optSlugs);

  console.log(`\nDuplicate Checks:`);
  console.log(`- Item Slugs: ${itemSlugs.length === uniqueItemSlugs.size ? '✅ 0 Duplicates (100% Unique)' : '❌ Duplicates Found'}`);
  console.log(`- Option Slugs: ${optSlugs.length === uniqueOptSlugs.size ? '✅ 0 Duplicates (100% Unique)' : '❌ Duplicates Found'}`);
}

verifyDatabaseIntegrity()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
