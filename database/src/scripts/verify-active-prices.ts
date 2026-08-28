import { pool } from '../db.js';

async function main() {
  const res = await pool.query(
    'select package_id, count(*) total, count(*) filter (where effective_to is null) active from package_prices group by package_id order by package_id;'
  );
  console.log('\nPackage Prices Active Verification:');
  console.table(res.rows);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
