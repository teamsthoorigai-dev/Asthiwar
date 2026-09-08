import { db, schema, eq } from '../index.js';

async function backfillLeads() {
  console.log("Backfilling estimates into enquiries CRM table...");

  const allEstimates = await db.select().from(schema.estimates);
  console.log(`Found ${allEstimates.length} estimate(s) in database.`);

  let createdCount = 0;
  for (const est of allEstimates) {
    const existing = await db.query.enquiries.findFirst({
      where: eq(schema.enquiries.estimateId, est.id),
    });

    if (!existing) {
      await db.insert(schema.enquiries).values({
        estimateId: est.id,
        estimateNumber: est.estimateNumber,
        fullName: est.customerName,
        phone: est.customerPhone,
        email: est.customerEmail || '',
        plotLocation: est.plotLocation,
        preferredContactTime: 'Anytime',
        requirementNotes: `Generated estimate for ${est.packageSlug} package (${est.totalBuiltupAreaSqft} sq.ft) in ${est.plotLocation}. Total: ₹${Number(est.totalProjectCost).toLocaleString('en-IN')}`,
        status: 'NEW',
        createdAt: est.createdAt,
        updatedAt: est.createdAt,
      });
      createdCount++;
    }
  }

  console.log(`✅ Successfully backfilled ${createdCount} lead(s) into enquiries CRM table.`);
}

backfillLeads()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
