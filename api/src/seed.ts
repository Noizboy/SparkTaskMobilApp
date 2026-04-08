import bcrypt from 'bcrypt';
import { pool } from './db';

/**
 * Seed script - wipes the entire database and recreates with demo data.
 *
 * 1 Admin:    admin@sparktask.com / demo
 * 4 Cleaners: maria@demo.com, carlos@demo.com, sofia@demo.com, diego@demo.com (all pw: demo)
 * 10 Orders with mixed statuses
 *
 * Run: npm run seed
 */

type TodoRow = [string, boolean];
type SectionData = {
  name: string;
  icon: string;
  time: number;
  completed?: boolean;
  skipReason?: string;
  todos: Array<string | TodoRow>;
};

async function insertOrder(
  client: any,
  order: {
    orderNumber: string;
    clientName: string;
    clientEmail: string;
    address: string;
    phone: string;
    status: string;
    date: string;
    time: string;
    serviceType: string;
    specialInstructions?: string;
    accessInfo?: string;
    goal?: string;
    startedAt?: number;
    completedAt?: number;
  }
) {
  const res = await client.query(
    `INSERT INTO orders (order_number, client_name, client_email, address, phone, status, date, time,
      service_type, special_instructions, access_info, goal, started_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id`,
    [
      order.orderNumber, order.clientName, order.clientEmail, order.address, order.phone,
      order.status, order.date, order.time, order.serviceType,
      order.specialInstructions ?? null, order.accessInfo ?? null, order.goal ?? null,
      order.startedAt ?? null, order.completedAt ?? null,
    ]
  );
  return res.rows[0].id as string;
}

async function insertSections(client: any, orderId: string, sections: SectionData[]) {
  let totalMinutes = 0;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    totalMinutes += s.time;
    const sec = await client.query(
      `INSERT INTO sections (order_id, name, icon, completed, skip_reason, estimated_time, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [orderId, s.name, s.icon, s.completed ?? false, s.skipReason ?? null, s.time, i]
    );
    const secId: string = sec.rows[0].id;
    for (let j = 0; j < s.todos.length; j++) {
      const todo = s.todos[j];
      const [text, done] = Array.isArray(todo) ? todo : [todo, s.completed ?? false];
      await client.query(
        `INSERT INTO todos (section_id, text, completed, sort_order) VALUES ($1,$2,$3,$4)`,
        [secId, text, done, j]
      );
    }
  }
  const h = Math.floor(totalMinutes / 60), m = totalMinutes % 60;
  const duration = totalMinutes <= 0 ? '' : h > 0 && m > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'} ${m} min` : h > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'}` : `${m} min`;
  await client.query(`UPDATE orders SET duration = $1 WHERE id = $2`, [duration, orderId]);
}

async function insertAddOns(client: any, orderId: string, addons: Array<{ name: string; icon: string; price?: number; selected: boolean }>) {
  for (const a of addons) {
    await client.query(
      `INSERT INTO add_ons (order_id, name, icon, price, selected) VALUES ($1,$2,$3,$4,$5)`,
      [orderId, a.name, a.icon, a.price ?? null, a.selected]
    );
  }
}

async function insertEmployees(client: any, orderId: string, employees: string[]) {
  for (const emp of employees) {
    await client.query(
      `INSERT INTO assigned_employees (order_id, employee_name) VALUES ($1,$2)`,
      [orderId, emp]
    );
  }
}

const ts = (dateStr: string) => new Date(dateStr).getTime();

// â”€â”€â”€ Main seed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Wipe everything in dependency order
    await client.query('DELETE FROM assigned_employees');
    await client.query('DELETE FROM photos');
    await client.query('DELETE FROM todos');
    await client.query('DELETE FROM sections');
    await client.query('DELETE FROM add_ons');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM area_checklist_items');
    await client.query('DELETE FROM areas');
    await client.query('DELETE FROM services');
    await client.query('DELETE FROM pending_invites');
    await client.query('DELETE FROM users');

    const SALT_ROUNDS = 12;
    const demoHash = await bcrypt.hash('demo', SALT_ROUNDS);

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // USERS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    // â”€â”€ Admin (business owner) - business_id is NULL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const adminRes = await client.query(
      `INSERT INTO users (email, password, name, company, role, phone)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      ['admin@sparktask.com', demoHash, 'Admin SparkTask', 'SparkTask', 'admin', '+1 (555) 100-0001']
    );
    const adminId: string = adminRes.rows[0].id;

    // â”€â”€ 4 Cleaners linked to admin's business_id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const cleaners = [
      { email: 'maria@demo.com', name: 'Maria Garcia', phone: '+1 (555) 200-1001' },
      { email: 'carlos@demo.com', name: 'Carlos Lopez', phone: '+1 (555) 200-1002' },
      { email: 'sofia@demo.com', name: 'Alejandro Gomez', phone: '+1 (555) 200-1003' },
      { email: 'diego@demo.com', name: 'Diego Hernandez', phone: '+1 (555) 200-1004' },
    ];

    for (const c of cleaners) {
      await client.query(
        `INSERT INTO users (email, password, name, company, role, business_id, phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [c.email, demoHash, c.name, 'SparkTask', 'cleaner', adminId, c.phone]
      );
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // SERVICES - linked to admin's business account
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    const servicesList = [
      { name: 'Regular Cleaning', description: 'Standard recurring cleaning service for homes and offices' },
      { name: 'Deep Cleaning', description: 'Thorough and intensive cleaning for all areas including hard-to-reach spots' },
      { name: 'Move-in Cleaning', description: 'Full sanitization and deep clean for new tenants moving in' },
      { name: 'Move-out Cleaning', description: 'Complete cleaning service for properties after tenants move out' },
      { name: 'Quick Cleaning', description: 'Fast surface-level tidy-up for small spaces or touch-ups' },
      { name: 'Office Cleaning', description: 'Professional cleaning for office and commercial spaces' },
      { name: 'Post-Construction Cleaning', description: 'Specialized deep cleaning after construction or renovation work' },
    ];

    for (const svc of servicesList) {
      await client.query(
        `INSERT INTO services (business_id, name, description) VALUES ($1, $2, $3)`,
        [adminId, svc.name, svc.description]
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AREAS — cleaning areas with checklist items linked to admin's business
    // ═══════════════════════════════════════════════════════════════════════════

    const areasList = [
      { name: 'Kitchen', duration: 40, items: [
        'Clean counters and surfaces', 'Clean sink', 'Clean stove and hood',
        'Clean appliances exteriors', 'Sweep and mop floor', 'Empty trash',
      ]},
      { name: 'Bathroom', duration: 25, items: [
        'Clean and disinfect toilet', 'Clean sink and faucet', 'Clean shower/bathtub',
        'Clean mirrors', 'Sweep and mop floor', 'Refill supplies',
      ]},
      { name: 'Bedroom', duration: 20, items: [
        'Make the bed', 'Dust surfaces', 'Clean mirrors', 'Organize items', 'Vacuum',
      ]},
      { name: 'Living Room', duration: 25, items: [
        'Dust all surfaces', 'Vacuum carpet/floor', 'Clean windows', 'Organize items', 'Empty trash',
      ]},
      { name: 'Dining Room', duration: 15, items: [
        'Clean table and chairs', 'Dust surfaces', 'Vacuum/mop floor', 'Clean windows',
      ]},
      { name: 'Master Bedroom', duration: 30, items: [
        'Make the bed', 'Dust all surfaces', 'Clean mirrors', 'Organize closet', 'Vacuum thoroughly',
      ]},
      { name: 'Laundry', duration: 12, items: [
        'Clean washer and dryer', 'Wipe down surfaces', 'Sweep and mop floor', 'Organize supplies',
      ]},
    ];

    for (const area of areasList) {
      const areaRes = await client.query(
        `INSERT INTO areas (business_id, name, estimated_duration) VALUES ($1, $2, $3) RETURNING id`,
        [adminId, area.name, area.duration]
      );
      const areaId = areaRes.rows[0].id;
      for (let i = 0; i < area.items.length; i++) {
        await client.query(
          `INSERT INTO area_checklist_items (area_id, text, sort_order) VALUES ($1, $2, $3)`,
          [areaId, area.items[i], i]
        );
      }
    }

    // ─── Load area templates for building order sections ───────────────────
    const areasResult = await client.query(`
      SELECT a.name, a.estimated_duration,
             json_agg(json_build_object('text', aci.text) ORDER BY aci.sort_order) as items
      FROM areas a
      JOIN area_checklist_items aci ON aci.area_id = a.id
      WHERE a.business_id = $1
      GROUP BY a.id, a.name, a.estimated_duration
    `, [adminId]);

    const areaIconMap: Record<string, string> = {
      'Kitchen': 'ChefHat', 'Bathroom': 'Bath', 'Bedroom': 'Bed',
      'Living Room': 'Sofa', 'Dining Room': 'UtensilsCrossed',
      'Master Bedroom': 'Bed', 'Laundry': 'Shirt',
    };

    const areaTemplates = new Map<string, { duration: number; icon: string; items: string[] }>();
    for (const row of areasResult.rows) {
      areaTemplates.set(row.name, {
        duration: row.estimated_duration,
        icon: areaIconMap[row.name] || 'Sparkles',
        items: row.items.map((i: any) => i.text),
      });
    }

    /** Build SectionData[] from area templates */
    function sectionsFromAreas(
      areaNames: string[],
      opts?: { completed?: boolean; partial?: Array<{ area: string; doneTodos: number }> }
    ): SectionData[] {
      return areaNames.map(name => {
        const tpl = areaTemplates.get(name)!;
        const partialInfo = opts?.partial?.find(p => p.area === name);

        if (opts?.completed) {
          return {
            name, icon: tpl.icon, time: tpl.duration, completed: true,
            todos: tpl.items.map(t => [t, true] as TodoRow),
          };
        }

        if (partialInfo) {
          return {
            name, icon: tpl.icon, time: tpl.duration,
            completed: partialInfo.doneTodos >= tpl.items.length,
            todos: tpl.items.map((t, i) => [t, i < partialInfo.doneTodos] as TodoRow),
          };
        }

        return { name, icon: tpl.icon, time: tpl.duration, todos: [...tpl.items] };
      });
    }


    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // ORDERS - 10 orders with mixed statuses
    // assigned_employees.employee_name must match user.name exactly for the
    // team-page completed-orders count to work.
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // SCHEDULED (pending/upcoming) - 3 orders
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // â”€â”€ Order #3001 - Deep clean â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o1 = await insertOrder(client, {
      orderNumber: '3001', clientName: 'Emily Watson', clientEmail: 'emily.watson@email.com',
      address: '742 Evergreen Terrace, Apt 4B', phone: '+1 (555) 301-4821',
      status: 'scheduled', date: '2026-04-10', time: '09:00 AM',
      serviceType: 'Deep Cleaning',
      specialInstructions: 'Allergic to bleach - use natural products only. Two cats in the house.',
      accessInfo: 'Door code: 7734, Ring doorbell twice',
      goal: 'Spring deep clean before guests arrive',
    });
    await insertSections(client, o1, sectionsFromAreas(['Kitchen', 'Bathroom', 'Master Bedroom', 'Living Room']));
    await insertAddOns(client, o1, [
      { name: 'Inside Oven', icon: 'Flame', price: 25, selected: false },
      { name: 'Inside Fridge', icon: 'Snowflake', price: 20, selected: false },
      { name: 'Laundry', icon: 'Shirt', price: 30, selected: false },
    ]);
    await insertEmployees(client, o1, ['Maria Garcia', 'Alejandro Gomez']);

    // â”€â”€ Order #3002 - Standard clean â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o2 = await insertOrder(client, {
      orderNumber: '3002', clientName: 'Robert Chen', clientEmail: 'robert.chen@email.com',
      address: '88 Oakwood Boulevard, Suite 12A', phone: '+1 (555) 482-9317',
      status: 'scheduled', date: '2026-04-11', time: '02:00 PM',
      serviceType: 'Regular Cleaning',
      specialInstructions: 'Please use eco-friendly products. Small dog (friendly).',
      accessInfo: 'Key in lockbox #4291 beside front door',
      goal: 'Bi-weekly maintenance clean',
    });
    await insertSections(client, o2, sectionsFromAreas(['Kitchen', 'Bathroom', 'Living Room']));
    await insertAddOns(client, o2, [
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: false },
    ]);
    await insertEmployees(client, o2, ['Carlos Lopez']);

    // â”€â”€ Order #3003 - Move-in clean â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o3 = await insertOrder(client, {
      orderNumber: '3003', clientName: 'Jessica Thompson', clientEmail: 'jessica.t@email.com',
      address: '220 Cedar Lane, Unit 7F', phone: '+1 (555) 671-2839',
      status: 'scheduled', date: '2026-04-14', time: '10:00 AM',
      serviceType: 'Move-in Cleaning',
      specialInstructions: 'New tenant moving in. Apartment vacant 3 months - very dusty.',
      accessInfo: 'Key at front desk, ask for Miguel',
      goal: 'Full sanitization before move-in',
    });
    await insertSections(client, o3, sectionsFromAreas(['Kitchen', 'Bathroom', 'Bedroom']));
    await insertAddOns(client, o3, [
      { name: 'Inside Oven', icon: 'Flame', price: 25, selected: false },
      { name: 'Inside Fridge', icon: 'Snowflake', price: 20, selected: false },
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: false },
    ]);
    await insertEmployees(client, o3, ['Maria Garcia', 'Diego Hernandez']);

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // IN-PROGRESS - 2 orders
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // â”€â”€ Order #3004 - Standard clean (partially done) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o4 = await insertOrder(client, {
      orderNumber: '3004', clientName: 'Andrew Park', clientEmail: 'andrew.park@email.com',
      address: '505 Maple Drive, Apt 2C', phone: '+1 (555) 390-7142',
      status: 'in-progress', date: '2026-04-08', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
      specialInstructions: 'Baby sleeping in nursery - please be quiet near back rooms.',
      accessInfo: 'Smart lock code: 8461',
      goal: 'Quick weekly tidy-up',
      startedAt: ts('2026-04-08T09:05:00'),
    });
    await insertSections(client, o4, sectionsFromAreas(['Kitchen', 'Bathroom', 'Living Room'], { partial: [{ area: 'Kitchen', doneTodos: 2 }] }));
    await insertAddOns(client, o4, [
      { name: 'Laundry', icon: 'Shirt', price: 30, selected: true },
    ]);
    await insertEmployees(client, o4, ['Alejandro Gomez']);

    // â”€â”€ Order #3005 - Deep clean (kitchen done, bathroom in progress) â”€â”€â”€â”€â”€â”€â”€
    const o5 = await insertOrder(client, {
      orderNumber: '3005', clientName: 'Michelle Rivera', clientEmail: 'michelle.r@email.com',
      address: '730 Westside Ave, Unit 12', phone: '+1 (555) 814-3390',
      status: 'in-progress', date: '2026-04-08', time: '08:00 AM',
      serviceType: 'Deep Cleaning',
      specialInstructions: 'Focus on master bathroom - heavy calcium buildup on shower.',
      accessInfo: 'Garage code: 5523, Side door unlocked',
      goal: 'Monthly deep clean, especially wet areas',
      startedAt: ts('2026-04-08T08:10:00'),
    });
    await insertSections(client, o5, sectionsFromAreas(['Kitchen', 'Bathroom', 'Master Bedroom', 'Bedroom'], { partial: [{ area: 'Kitchen', doneTodos: 6 }, { area: 'Bathroom', doneTodos: 1 }] }));
    await insertAddOns(client, o5, [
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: true },
      { name: 'Inside Fridge', icon: 'Snowflake', price: 20, selected: false },
    ]);
    await insertEmployees(client, o5, ['Carlos Lopez', 'Diego Hernandez']);

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // COMPLETED - 4 orders (spread across cleaners for team stats)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // â”€â”€ Order #3006 - Deep clean (completed) - MarÃ­a + Carlos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o6 = await insertOrder(client, {
      orderNumber: '3006', clientName: 'Sarah Mitchell', clientEmail: 'sarah.m@email.com',
      address: '77 River Road, Apt 1A', phone: '+1 (555) 847-2016',
      status: 'completed', date: '2026-04-04', time: '09:00 AM',
      serviceType: 'Deep Cleaning',
      goal: 'Post-renovation thorough cleaning',
      startedAt: ts('2026-04-04T09:05:00'),
      completedAt: ts('2026-04-04T11:32:00'),
    });
    await insertSections(client, o6, sectionsFromAreas(['Kitchen', 'Bathroom', 'Living Room'], { completed: true }));
    await insertAddOns(client, o6, [
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: true },
    ]);
    await insertEmployees(client, o6, ['Maria Garcia', 'Carlos Lopez']);

    // â”€â”€ Order #3007 - Standard clean (completed) - Diego â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o7 = await insertOrder(client, {
      orderNumber: '3007', clientName: 'David Nguyen', clientEmail: 'david.n@email.com',
      address: '33 Oak Street, Unit 5', phone: '+1 (555) 630-5928',
      status: 'completed', date: '2026-04-03', time: '02:00 PM',
      serviceType: 'Regular Cleaning',
      startedAt: ts('2026-04-03T14:00:00'),
      completedAt: ts('2026-04-03T15:15:00'),
    });
    await insertSections(client, o7, sectionsFromAreas(['Kitchen', 'Bathroom'], { completed: true }));
    await insertEmployees(client, o7, ['Diego Hernandez']);

    // â”€â”€ Order #3008 - Move-out clean (completed) - SofÃ­a + Carlos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o8 = await insertOrder(client, {
      orderNumber: '3008', clientName: 'Laura Fernandez', clientEmail: 'laura.f@email.com',
      address: '88 Pine Court, Suite 2B', phone: '+1 (555) 415-3087',
      status: 'completed', date: '2026-04-01', time: '01:00 PM',
      serviceType: 'Move-out Cleaning',
      specialInstructions: 'Empty apartment - clean every surface for deposit return.',
      startedAt: ts('2026-04-01T13:00:00'),
      completedAt: ts('2026-04-01T15:20:00'),
    });
    await insertSections(client, o8, sectionsFromAreas(['Kitchen', 'Bathroom', 'Living Room'], { completed: true }));
    await insertAddOns(client, o8, [
      { name: 'Inside Oven', icon: 'Flame', price: 25, selected: true },
      { name: 'Carpet Shampoo', icon: 'Sparkles', price: 50, selected: true },
    ]);
    await insertEmployees(client, o8, ['Alejandro Gomez', 'Carlos Lopez']);

    // â”€â”€ Order #3009 - Quick clean (completed) - MarÃ­a + Diego â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o9 = await insertOrder(client, {
      orderNumber: '3009', clientName: 'Michael Torres', clientEmail: 'michael.t@email.com',
      address: '567 Lakewood Ave, Apt 5C', phone: '+1 (555) 884-9123',
      status: 'completed', date: '2026-03-28', time: '10:00 AM',
      serviceType: 'Quick Cleaning',
      startedAt: ts('2026-03-28T10:00:00'),
      completedAt: ts('2026-03-28T10:45:00'),
    });
    await insertSections(client, o9, sectionsFromAreas(['Kitchen', 'Bathroom'], { completed: true }));
    await insertEmployees(client, o9, ['Maria Garcia', 'Diego Hernandez']);

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // CANCELLED - 1 order
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // â”€â”€ Order #3010 - Standard clean (canceled) - SofÃ­a â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o10 = await insertOrder(client, {
      orderNumber: '3010', clientName: 'Patricia Holmes', clientEmail: 'patricia.h@email.com',
      address: '999 Highland Park, Suite 8', phone: '+1 (555) 601-2234',
      status: 'canceled', date: '2026-04-06', time: '03:00 PM',
      serviceType: 'Regular Cleaning',
      specialInstructions: 'Client canceled - family emergency.',
    });
    await insertSections(client, o10, sectionsFromAreas(['Kitchen', 'Bathroom']));
    await insertEmployees(client, o10, ['Alejandro Gomez']);

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // ADDITIONAL ORDERS - Fill April 2026 (orders #3011â€“#3038)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    // Helper for quick order+sections+employees
    async function quickOrder(
      num: string, client_: any, data: Parameters<typeof insertOrder>[1],
      sections: SectionData[], employees: string[], addons?: Parameters<typeof insertAddOns>[2]
    ) {
      const oid = await insertOrder(client_, data);
      await insertSections(client_, oid, sections);
      if (addons) await insertAddOns(client_, oid, addons);
      await insertEmployees(client_, oid, employees);
    }

    // â”€â”€â”€ PAST: Apr 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3011', client, {
      orderNumber: '3011', clientName: 'Angela Brooks', clientEmail: 'angela.b@email.com',
      address: '15 Sunflower Lane, Apt 3', phone: '+1 (555) 220-4410',
      status: 'completed', date: '2026-04-01', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
      startedAt: ts('2026-04-01T09:05:00'), completedAt: ts('2026-04-01T10:30:00'),
    }, sectionsFromAreas(["Kitchen","Bathroom","Living Room"], { completed: true }), ['Maria Garcia']);

    // â”€â”€â”€ PAST: Apr 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3012', client, {
      orderNumber: '3012', clientName: 'Thomas Wright', clientEmail: 'thomas.w@email.com',
      address: '450 Birch Street, Suite 9', phone: '+1 (555) 339-8715',
      status: 'completed', date: '2026-04-02', time: '10:00 AM',
      serviceType: 'Deep Cleaning',
      specialInstructions: 'Two large dogs - please close doors behind you.',
      startedAt: ts('2026-04-02T10:10:00'), completedAt: ts('2026-04-02T12:45:00'),
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom"], { completed: true }), ['Carlos Lopez', 'Diego Hernandez']);

    await quickOrder('3013', client, {
      orderNumber: '3013', clientName: 'Rebecca Stone', clientEmail: 'rebecca.s@email.com',
      address: '89 Willow Way, Unit 4A', phone: '+1 (555) 507-2193',
      status: 'completed', date: '2026-04-02', time: '03:00 PM',
      serviceType: 'Office Cleaning',
      startedAt: ts('2026-04-02T15:00:00'), completedAt: ts('2026-04-02T16:40:00'),
    }, sectionsFromAreas(["Kitchen","Dining Room","Bathroom"], { completed: true }), ['Alejandro Gomez']);

    // â”€â”€â”€ PAST: Apr 3 (3007 already exists) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3014', client, {
      orderNumber: '3014', clientName: 'Kevin Patel', clientEmail: 'kevin.p@email.com',
      address: '310 Redwood Circle', phone: '+1 (555) 443-6621',
      status: 'completed', date: '2026-04-03', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
      startedAt: ts('2026-04-03T09:00:00'), completedAt: ts('2026-04-03T10:20:00'),
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom"], { completed: true }), ['Maria Garcia']);

    // â”€â”€â”€ PAST: Apr 4 (3006 already exists) - cancelled â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3015', client, {
      orderNumber: '3015', clientName: 'Donna Reeves', clientEmail: 'donna.r@email.com',
      address: '201 Elmwood Ave, Unit 6', phone: '+1 (555) 810-3345',
      status: 'canceled', date: '2026-04-04', time: '11:00 AM',
      serviceType: 'Deep Cleaning',
      specialInstructions: 'Cancelled due to water damage - rescheduling later.',
    }, sectionsFromAreas(["Kitchen","Bathroom"]), ['Diego Hernandez']);

    // â”€â”€â”€ PAST: Apr 5 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3016', client, {
      orderNumber: '3016', clientName: 'James Kim', clientEmail: 'james.k@email.com',
      address: '678 Magnolia Blvd, Apt 11B', phone: '+1 (555) 772-0094',
      status: 'completed', date: '2026-04-05', time: '08:00 AM',
      serviceType: 'Move-out Cleaning',
      specialInstructions: 'Empty unit. Need deposit-return level clean.',
      startedAt: ts('2026-04-05T08:05:00'), completedAt: ts('2026-04-05T10:50:00'),
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom"], { completed: true }), ['Alejandro Gomez', 'Carlos Lopez']);

    await quickOrder('3017', client, {
      orderNumber: '3017', clientName: 'Natalie Cooper', clientEmail: 'natalie.c@email.com',
      address: '42 Cherry Blossom St', phone: '+1 (555) 661-5578',
      status: 'completed', date: '2026-04-05', time: '01:00 PM',
      serviceType: 'Regular Cleaning',
      startedAt: ts('2026-04-05T13:00:00'), completedAt: ts('2026-04-05T14:10:00'),
    }, sectionsFromAreas(["Kitchen","Bathroom"], { completed: true }), ['Maria Garcia']);

    // â”€â”€â”€ PAST: Apr 6 (3010 cancelled exists) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3018', client, {
      orderNumber: '3018', clientName: 'Brian Morales', clientEmail: 'brian.m@email.com',
      address: '155 Spruce Lane, Apt 8D', phone: '+1 (555) 934-2207',
      status: 'completed', date: '2026-04-06', time: '10:00 AM',
      serviceType: 'Deep Cleaning',
      startedAt: ts('2026-04-06T10:00:00'), completedAt: ts('2026-04-06T12:15:00'),
    }, sectionsFromAreas(["Kitchen","Bathroom","Living Room"], { completed: true }), ['Diego Hernandez', 'Carlos Lopez']);

    // â”€â”€â”€ PAST: Apr 7 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3019', client, {
      orderNumber: '3019', clientName: 'Lisa Chang', clientEmail: 'lisa.c@email.com',
      address: '900 Sycamore Ave, Suite 3C', phone: '+1 (555) 412-8839',
      status: 'completed', date: '2026-04-07', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
      startedAt: ts('2026-04-07T09:05:00'), completedAt: ts('2026-04-07T10:25:00'),
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom"], { completed: true }), ['Maria Garcia', 'Alejandro Gomez']);

    await quickOrder('3020', client, {
      orderNumber: '3020', clientName: 'Victor Salazar', clientEmail: 'victor.s@email.com',
      address: '64 Aspen Court, Unit 2', phone: '+1 (555) 288-4456',
      status: 'canceled', date: '2026-04-07', time: '02:00 PM',
      serviceType: 'Office Cleaning',
      specialInstructions: 'Cancelled - office closed for renovation.',
    }, sectionsFromAreas(["Kitchen","Bathroom"]), ['Diego Hernandez']);

    // â”€â”€â”€ TODAY: Apr 8 (3004 in-progress, 3005 in-progress exist) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3021', client, {
      orderNumber: '3021', clientName: 'Pamela Green', clientEmail: 'pamela.g@email.com',
      address: '322 Laurel Drive, Apt 7A', phone: '+1 (555) 177-3302',
      status: 'scheduled', date: '2026-04-08', time: '02:00 PM',
      serviceType: 'Regular Cleaning',
      specialInstructions: 'Please ring buzzer for 7A.',
      accessInfo: 'Buzzer code: 7A then #',
    }, sectionsFromAreas(["Kitchen","Bathroom","Living Room"]), ['Maria Garcia']);

    await quickOrder('3022', client, {
      orderNumber: '3022', clientName: 'Frank Delgado', clientEmail: 'frank.d@email.com',
      address: '810 Chestnut Place, Unit 5B', phone: '+1 (555) 992-1187',
      status: 'scheduled', date: '2026-04-08', time: '04:00 PM',
      serviceType: 'Deep Cleaning',
      accessInfo: 'Key under welcome mat',
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom"]), ['Diego Hernandez', 'Carlos Lopez']);

    // â”€â”€â”€ FUTURE: Apr 9 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3023', client, {
      orderNumber: '3023', clientName: 'Sandra Owens', clientEmail: 'sandra.o@email.com',
      address: '275 Poplar Road, Apt 1C', phone: '+1 (555) 543-6672',
      status: 'scheduled', date: '2026-04-09', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
      goal: 'Weekly maintenance clean',
    }, sectionsFromAreas(["Kitchen","Bathroom"]), ['Alejandro Gomez']);

    await quickOrder('3024', client, {
      orderNumber: '3024', clientName: 'Raymond Hart', clientEmail: 'raymond.h@email.com',
      address: '130 Walnut Street, Suite 10', phone: '+1 (555) 873-4419',
      status: 'scheduled', date: '2026-04-09', time: '01:00 PM',
      serviceType: 'Office Cleaning',
      specialInstructions: 'Conference room needs special attention before board meeting.',
    }, sectionsFromAreas(["Kitchen","Dining Room","Bathroom"]), ['Maria Garcia', 'Carlos Lopez']);

    // â”€â”€â”€ FUTURE: Apr 10 (3001 exists) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3025', client, {
      orderNumber: '3025', clientName: 'Heather Flynn', clientEmail: 'heather.f@email.com',
      address: '55 Ivy Lane, Unit 3F', phone: '+1 (555) 319-7780',
      status: 'scheduled', date: '2026-04-10', time: '02:00 PM',
      serviceType: 'Regular Cleaning',
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom"]), ['Diego Hernandez']);

    // â”€â”€â”€ FUTURE: Apr 12 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3026', client, {
      orderNumber: '3026', clientName: 'Catherine Bell', clientEmail: 'catherine.b@email.com',
      address: '408 Hazel Terrace, Apt 9E', phone: '+1 (555) 451-3328',
      status: 'scheduled', date: '2026-04-12', time: '10:00 AM',
      serviceType: 'Deep Cleaning',
      specialInstructions: 'Three cats - keep exterior doors closed.',
      goal: 'Spring deep clean',
    }, sectionsFromAreas(["Kitchen","Bathroom","Living Room","Bedroom"]), ['Alejandro Gomez', 'Maria Garcia']);

    // â”€â”€â”€ FUTURE: Apr 13 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3027', client, {
      orderNumber: '3027', clientName: 'Edward Sullivan', clientEmail: 'edward.s@email.com',
      address: '92 Dogwood Drive', phone: '+1 (555) 608-9934',
      status: 'scheduled', date: '2026-04-13', time: '11:00 AM',
      serviceType: 'Regular Cleaning',
    }, sectionsFromAreas(["Kitchen","Bathroom"]), ['Carlos Lopez']);

    // â”€â”€â”€ FUTURE: Apr 14 (3003 exists) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3028', client, {
      orderNumber: '3028', clientName: 'Amanda Perry', clientEmail: 'amanda.p@email.com',
      address: '330 Juniper Court, Unit 2A', phone: '+1 (555) 744-1156',
      status: 'scheduled', date: '2026-04-14', time: '03:00 PM',
      serviceType: 'Regular Cleaning',
      accessInfo: 'Lockbox code: 5891',
    }, sectionsFromAreas(["Kitchen","Bathroom","Living Room"]), ['Alejandro Gomez']);

    // â”€â”€â”€ FUTURE: Apr 15 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3029', client, {
      orderNumber: '3029', clientName: 'George Ramirez', clientEmail: 'george.r@email.com',
      address: '517 Alder Boulevard, Apt 6D', phone: '+1 (555) 205-8843',
      status: 'scheduled', date: '2026-04-15', time: '08:00 AM',
      serviceType: 'Move-in Cleaning',
      specialInstructions: 'New tenants arriving afternoon - must finish by noon.',
      goal: 'Full sanitization before move-in',
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom"]), ['Maria Garcia', 'Diego Hernandez']);

    // â”€â”€â”€ FUTURE: Apr 16 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3030', client, {
      orderNumber: '3030', clientName: 'Nicole Foster', clientEmail: 'nicole.f@email.com',
      address: '103 Cypress Row, Suite 14', phone: '+1 (555) 366-7729',
      status: 'scheduled', date: '2026-04-16', time: '10:00 AM',
      serviceType: 'Office Cleaning',
    }, sectionsFromAreas(["Kitchen","Dining Room","Bathroom"]), ['Carlos Lopez', 'Alejandro Gomez']);

    // â”€â”€â”€ FUTURE: Apr 17 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3031', client, {
      orderNumber: '3031', clientName: 'Daniel Murphy', clientEmail: 'daniel.m@email.com',
      address: '740 Ash Street, Apt 4G', phone: '+1 (555) 821-5504',
      status: 'scheduled', date: '2026-04-17', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
    }, sectionsFromAreas(["Kitchen","Bathroom","Living Room"]), ['Diego Hernandez']);

    // â”€â”€â”€ FUTURE: Apr 18 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3032', client, {
      orderNumber: '3032', clientName: 'Stephanie Cruz', clientEmail: 'stephanie.c@email.com',
      address: '260 Beechwood Lane, Unit 10C', phone: '+1 (555) 493-2218',
      status: 'scheduled', date: '2026-04-18', time: '11:00 AM',
      serviceType: 'Deep Cleaning',
      goal: 'Pre-party deep clean',
    }, sectionsFromAreas(["Kitchen","Bathroom","Dining Room","Living Room"]), ['Maria Garcia', 'Carlos Lopez']);

    // â”€â”€â”€ FUTURE: Apr 20 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3033', client, {
      orderNumber: '3033', clientName: 'Martin O\'Brien', clientEmail: 'martin.o@email.com',
      address: '185 Sequoia Park, Apt 2F', phone: '+1 (555) 714-3360',
      status: 'scheduled', date: '2026-04-20', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
    }, sectionsFromAreas(["Kitchen","Bathroom"]), ['Alejandro Gomez']);

    // â”€â”€â”€ FUTURE: Apr 21 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3034', client, {
      orderNumber: '3034', clientName: 'Claire Jenkins', clientEmail: 'claire.j@email.com',
      address: '621 Hickory Place, Suite 8A', phone: '+1 (555) 540-9982',
      status: 'scheduled', date: '2026-04-21', time: '10:00 AM',
      serviceType: 'Move-out Cleaning',
      specialInstructions: 'Entire unit empty. Need deep clean for landlord inspection.',
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom","Living Room"]), ['Diego Hernandez', 'Maria Garcia']);

    // â”€â”€â”€ FUTURE: Apr 22 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3035', client, {
      orderNumber: '3035', clientName: 'Oscar Gutierrez', clientEmail: 'oscar.g@email.com',
      address: '490 Cottonwood Trail', phone: '+1 (555) 399-1147',
      status: 'scheduled', date: '2026-04-22', time: '02:00 PM',
      serviceType: 'Regular Cleaning',
      accessInfo: 'Key under the flower pot on the porch',
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom"]), ['Carlos Lopez']);

    // â”€â”€â”€ FUTURE: Apr 23 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3036', client, {
      orderNumber: '3036', clientName: 'Diana Warren', clientEmail: 'diana.w@email.com',
      address: '77 Palmetto Drive, Apt 5A', phone: '+1 (555) 625-8801',
      status: 'scheduled', date: '2026-04-23', time: '09:00 AM',
      serviceType: 'Deep Cleaning',
      goal: 'Allergy season deep clean - focus on dusting',
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom","Living Room"]), ['Alejandro Gomez', 'Diego Hernandez']);

    // â”€â”€â”€ FUTURE: Apr 25 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3037', client, {
      orderNumber: '3037', clientName: 'Aaron Woods', clientEmail: 'aaron.w@email.com',
      address: '830 Catalpa Court, Unit 1B', phone: '+1 (555) 280-4493',
      status: 'scheduled', date: '2026-04-25', time: '10:00 AM',
      serviceType: 'Regular Cleaning',
    }, sectionsFromAreas(["Kitchen","Bathroom"]), ['Maria Garcia']);

    // â”€â”€â”€ FUTURE: Apr 27 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3038', client, {
      orderNumber: '3038', clientName: 'Julia Simmons', clientEmail: 'julia.s@email.com',
      address: '360 Creekview Drive, Suite 6', phone: '+1 (555) 711-5526',
      status: 'scheduled', date: '2026-04-27', time: '01:00 PM',
      serviceType: 'Office Cleaning',
      specialInstructions: 'Server room off-limits. Clean all common areas.',
    }, sectionsFromAreas(["Kitchen","Dining Room","Bathroom"]), ['Carlos Lopez', 'Alejandro Gomez']);

    // â”€â”€â”€ FUTURE: Apr 28 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3039', client, {
      orderNumber: '3039', clientName: 'Philip West', clientEmail: 'philip.w@email.com',
      address: '54 Maplewood Heights, Apt 12A', phone: '+1 (555) 832-6614',
      status: 'scheduled', date: '2026-04-28', time: '09:00 AM',
      serviceType: 'Deep Cleaning',
      goal: 'End-of-month deep clean',
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom"]), ['Diego Hernandez', 'Maria Garcia']);

    // â”€â”€â”€ FUTURE: Apr 29 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3040', client, {
      orderNumber: '3040', clientName: 'Irene Castillo', clientEmail: 'irene.c@email.com',
      address: '115 Linden Avenue, Unit 4D', phone: '+1 (555) 467-3398',
      status: 'scheduled', date: '2026-04-29', time: '11:00 AM',
      serviceType: 'Regular Cleaning',
    }, sectionsFromAreas(["Kitchen","Bathroom","Living Room"]), ['Carlos Lopez']);

    // â”€â”€â”€ FUTURE: Apr 30 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3041', client, {
      orderNumber: '3041', clientName: 'Teresa Hoffman', clientEmail: 'teresa.h@email.com',
      address: '705 Bayview Terrace, Apt 8B', phone: '+1 (555) 590-2274',
      status: 'scheduled', date: '2026-04-30', time: '09:00 AM',
      serviceType: 'Move-in Cleaning',
      specialInstructions: 'New tenant arriving May 1st - full sanitization needed.',
      accessInfo: 'Property manager will let you in - call (555) 100-2000',
    }, sectionsFromAreas(["Kitchen","Bathroom","Bedroom"]), ['Alejandro Gomez', 'Diego Hernandez']);

    await client.query('COMMIT');

    console.log('');
    console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.log('  âœ“ Seed complete - 5 users, 41 orders');
    console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.log('');
    console.log('  Original orders (#3001â€“#3010):');
    console.log('    Scheduled:   3  (#3001, #3002, #3003)');
    console.log('    In-progress: 2  (#3004, #3005)');
    console.log('    Completed:   4  (#3006, #3007, #3008, #3009)');
    console.log('    Canceled:    1  (#3010)');
    console.log('');
    console.log('  New orders (#3011â€“#3041):');
    console.log('    Completed:  11  (Apr 1-7)');
    console.log('    Canceled:    3  (Apr 4, Apr 7)');
    console.log('    Scheduled:  17  (Apr 8-30)');
    console.log('');
    console.log('  TOTALS:');
    console.log('    Scheduled:  20 | In-progress: 2 | Completed: 15 | Canceled: 4');
    console.log('');
    console.log('  Dashboard login:');
    console.log('    admin@sparktask.com / demo');
    console.log('');
    console.log('  Cleaner logins (all password: demo):');
    console.log('    maria@demo.com   - Maria Garcia');
    console.log('    carlos@demo.com  - Carlos Lopez');
    console.log('    sofia@demo.com   - Alejandro Gomez');
    console.log('    diego@demo.com   - Diego Hernandez');
    console.log('');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('âœ— Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
