import { db, schema, sql, isNull, lt } from '../index.js';

async function sanitizeOptionPrices() {
  console.log("Sanitizing option_prices on Neon PostgreSQL...");

  // 1. Delete null package_id rows
  const deletedNull = await db.delete(schema.optionPrices).where(isNull(schema.optionPrices.packageId)).returning();
  console.log(`Deleted ${deletedNull.length} universal/null package_id row(s).`);

  // 2. Floor all negative deltas to 0.00 (Included)
  const updatedNegative = await db
    .update(schema.optionPrices)
    .set({ priceDelta: '0.00' })
    .where(lt(schema.optionPrices.priceDelta, '0'))
    .returning();
  console.log(`Updated ${updatedNegative.length} negative downgrade row(s) to 0.00 (Included).`);

  // 3. Count total active option prices
  const total = await db.select().from(schema.optionPrices);
  console.log(`Total valid option prices in DB: ${total.length}`);
}

sanitizeOptionPrices()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Sanitization error:", err);
    process.exit(1);
  });
