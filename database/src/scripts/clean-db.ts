import { pool } from '../db';

async function cleanDatabase() {
  console.log('🧹 ASTHIWAR — Database Wipe Utility\n');
  console.log('Connecting to database...');

  const client = await pool.connect();
  try {
    // Get all user tables in public schema
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '__drizzle%'
      ORDER BY table_name;
    `);

    const tables = res.rows.map((r: { table_name: string }) => r.table_name);
    console.log(`Found ${tables.length} tables in database.\n`);

    const countsBefore: Record<string, number> = {};
    for (const tbl of tables) {
      const cntRes = await client.query(`SELECT COUNT(*)::int AS cnt FROM "${tbl}";`);
      countsBefore[tbl] = cntRes.rows[0].cnt;
      console.log(`  📊 ${tbl.padEnd(30)} : ${countsBefore[tbl]} row(s)`);
    }

    console.log('\nTruncating all tables with CASCADE...');
    if (tables.length > 0) {
      const truncateQuery = `TRUNCATE TABLE ${tables.map((t: string) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`;
      await client.query(truncateQuery);
    }

    console.log('\n✅ Verification of emptied tables:');
    let totalDeleted = 0;
    for (const tbl of tables) {
      const cntRes = await client.query(`SELECT COUNT(*)::int AS cnt FROM "${tbl}";`);
      const countAfter = cntRes.rows[0].cnt;
      const deleted = countsBefore[tbl] - countAfter;
      totalDeleted += deleted;
      console.log(`  ✨ ${tbl.padEnd(30)} : 0 rows remaining (${deleted} deleted)`);
    }

    console.log(`\n🎉 Total rows removed across all tables: ${totalDeleted}`);
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDatabase();
