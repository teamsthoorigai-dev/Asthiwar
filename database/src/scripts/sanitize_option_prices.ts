/**
 * Report on the shape of `option_prices`. Reports only — it no longer writes.
 *
 * Both of the things this script used to do were destructive to live pricing,
 * and one of them was the reason no downgrade credit survived in any database:
 *
 *  1. It deleted every row with a null `package_id`. Those are the universal
 *     rates — the admin console's own "bare delta" path in
 *     `updateAdminOptionPrice` writes exactly that row when an option is not
 *     priced per tier, and deleting it leaves the option priced at nothing.
 *
 *  2. It floored every negative `price_delta` to 0.00, described as
 *     "(Included)". A negative delta is not an error to be tidied away, it is a
 *     downgrade credit: the money owed back when a customer picks a plainer
 *     brand than their tier includes. `seed.ts` authors 128 of them, the engine
 *     allows `upgradesCost` to go below zero, and the admin console lets you
 *     type a minus sign. This step quietly undid all of that, and would have
 *     undone it again the next time anyone ran `npm run db:sanitize`.
 *
 * If a genuinely bad row needs correcting, do it through the admin console so it
 * is audited and versioned, or write a one-off migration with the specific rows
 * named. A blanket UPDATE across a live rate card is not a sanitizer.
 */
import { db, schema, isNull, lt, sql } from '../index.js';

async function reportOptionPrices() {
  console.log('option_prices report (read-only)\n');

  const universal = await db
    .select()
    .from(schema.optionPrices)
    .where(isNull(schema.optionPrices.packageId));
  console.log(`  universal rows (package_id IS NULL) : ${universal.length}`);

  const credits = await db
    .select()
    .from(schema.optionPrices)
    .where(lt(schema.optionPrices.priceDelta, '0'));
  console.log(`  downgrade credits (delta < 0)       : ${credits.length}`);

  const live = await db
    .select()
    .from(schema.optionPrices)
    .where(isNull(schema.optionPrices.effectiveTo));
  console.log(`  rows in force (effective_to IS NULL): ${live.length}`);

  const total = await db.select().from(schema.optionPrices);
  console.log(`  rows total (incl. retired)          : ${total.length}`);

  const dupes = await db.execute(sql`
    SELECT option_id, package_id, COUNT(*) AS count
    FROM option_prices
    WHERE effective_to IS NULL
    GROUP BY option_id, package_id
    HAVING COUNT(*) > 1
  `);
  console.log(`  duplicate live (option, package)    : ${dupes.rows.length}`);
  if (dupes.rows.length > 0) {
    console.log('\n  Duplicates found — see scripts/clean_duplicates.ts.');
  }

  if (credits.length === 0) {
    console.log(
      '\n  No downgrade credits are present. seed.ts authors 128 of them, so a\n' +
        '  catalogue showing zero has had them stripped — re-run `npm run db:seed`.'
    );
  }
}

reportOptionPrices()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Report error:', err);
    process.exit(1);
  });
