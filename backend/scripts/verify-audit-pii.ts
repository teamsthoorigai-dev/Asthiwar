import { db } from '@asthiwar/database';
import { auditLogs } from '@asthiwar/database';
import { desc } from 'drizzle-orm';

async function verifyAuditLogs() {
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(3);
  console.log('Recent Audit Log Metadata:');
  for (const r of rows) {
    console.log(`\nEvent: ${r.eventType} | Action: ${r.action} | Endpoint: ${r.endpoint}`);
    console.log('Metadata:', JSON.stringify(r.metadata, null, 2));
  }
  process.exit(0);
}

verifyAuditLogs().catch((err) => {
  console.error(err);
  process.exit(1);
});
