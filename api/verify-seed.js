const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', database: 'sparktask', host: 'localhost', port: 5432 });

(async () => {
  const r = await pool.query(`
    SELECT s.name, s.estimated_time, count(distinct o.id)::int as num_orders, 
           count(t.id)::int / count(distinct s.id)::int as todos_per_section 
    FROM orders o JOIN sections s ON s.order_id=o.id 
    LEFT JOIN todos t ON t.section_id=s.id 
    GROUP BY s.name, s.estimated_time ORDER BY s.name
  `);
  console.log('Sections in orders:');
  console.table(r.rows);

  const r2 = await pool.query(`
    SELECT a.name, a.estimated_duration, count(c.id)::int as items 
    FROM areas a LEFT JOIN area_checklist_items c ON c.area_id=a.id 
    GROUP BY a.id ORDER BY a.name
  `);
  console.log('\nArea templates:');
  console.table(r2.rows);

  // Check for any sections that DON'T match an area
  const r3 = await pool.query(`
    SELECT DISTINCT s.name FROM sections s 
    WHERE s.name NOT IN (SELECT name FROM areas)
  `);
  if (r3.rows.length > 0) {
    console.log('\n⚠ Sections NOT matching any area:');
    console.table(r3.rows);
  } else {
    console.log('\n✓ All sections match area templates!');
  }

  await pool.end();
})();
