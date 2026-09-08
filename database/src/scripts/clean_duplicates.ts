import { db, schema, sql } from '../index.js';

async function checkDuplicates() {
  const duplicates = await db.execute(sql`
    SELECT option_id, package_id, COUNT(*) as count 
    FROM option_prices 
    GROUP BY option_id, package_id 
    HAVING COUNT(*) > 1;
  `);

  console.log("Duplicate (option_id, package_id) pairs:", duplicates.rows);

  if (duplicates.rows.length > 0) {
    console.log("Cleaning duplicates by keeping the latest id...");
    for (const dup of duplicates.rows as any[]) {
      const rows = await db.execute(sql`
        SELECT id FROM option_prices 
        WHERE option_id = ${dup.option_id} AND (package_id = ${dup.package_id} OR (package_id IS NULL AND ${dup.package_id} IS NULL))
        ORDER BY id DESC;
      `);
      const [latest, ...rest] = rows.rows as any[];
      for (const old of rest) {
        await db.execute(sql`DELETE FROM option_prices WHERE id = ${old.id};`);
      }
    }
  }

  const finalCount = await db.select().from(schema.optionPrices);
  console.log(`Final option_prices count: ${finalCount.length}`);
}

checkDuplicates().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
