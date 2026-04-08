import bcrypt from 'bcrypt';
import { pool } from './db';

/**
 * Seed script â€” wipes the entire database and recreates with demo data.
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
    await client.query('DELETE FROM services');
    await client.query('DELETE FROM pending_invites');
    await client.query('DELETE FROM users');

    const SALT_ROUNDS = 12;
    const demoHash = await bcrypt.hash('demo', SALT_ROUNDS);

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // USERS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    // â”€â”€ Admin (business owner) â€” business_id is NULL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const adminRes = await client.query(
      `INSERT INTO users (email, password, name, company, role, phone)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      ['admin@sparktask.com', demoHash, 'Admin SparkTask', 'SparkTask', 'admin', '+1 (555) 100-0001']
    );
    const adminId: string = adminRes.rows[0].id;

    // â”€â”€ 4 Cleaners linked to admin's business_id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const cleaners = [
      { email: 'maria@demo.com', name: 'MarÃ­a GarcÃ­a', phone: '+1 (555) 200-1001' },
      { email: 'carlos@demo.com', name: 'Carlos LÃ³pez', phone: '+1 (555) 200-1002' },
      { email: 'sofia@demo.com', name: 'SofÃ­a MartÃ­nez', phone: '+1 (555) 200-1003' },
      { email: 'diego@demo.com', name: 'Diego HernÃ¡ndez', phone: '+1 (555) 200-1004' },
    ];

    for (const c of cleaners) {
      await client.query(
        `INSERT INTO users (email, password, name, company, role, business_id, phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [c.email, demoHash, c.name, 'SparkTask', 'cleaner', adminId, c.phone]
      );
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // SERVICES â€” linked to admin's business account
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // ORDERS â€” 10 orders with mixed statuses
    // assigned_employees.employee_name must match user.name exactly for the
    // team-page completed-orders count to work.
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // SCHEDULED (pending/upcoming) â€” 3 orders
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // â”€â”€ Order #3001 â€” Deep clean â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o1 = await insertOrder(client, {
      orderNumber: '3001', clientName: 'Emily Watson', clientEmail: 'emily.watson@email.com',
      address: '742 Evergreen Terrace, Apt 4B', phone: '+1 (555) 301-4821',
      status: 'scheduled', date: '2026-04-10', time: '09:00 AM',
      serviceType: 'Deep Cleaning',
      specialInstructions: 'Allergic to bleach â€” use natural products only. Two cats in the house.',
      accessInfo: 'Door code: 7734 Â· Ring doorbell twice',
      goal: 'Spring deep clean before guests arrive',
    });
    await insertSections(client, o1, [
      { name: 'Kitchen', icon: 'ChefHat', time: 50, todos: [
        'Deep clean all countertops and backsplash', 'Scrub stovetop and oven exterior',
        'Clean inside microwave', 'Sanitize sink and faucet', 'Sweep and mop floor', 'Empty trash and replace liner',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 40, todos: [
        'Sanitize toilet inside and out', 'Scrub shower tiles and glass door',
        'Remove soap scum from bathtub', 'Clean sink and vanity', 'Polish mirror', 'Mop floor',
      ]},
      { name: 'Master Bedroom', icon: 'Bed', time: 30, todos: [
        'Change bed linens', 'Dust all surfaces and nightstands', 'Vacuum carpet thoroughly', 'Empty trash',
      ]},
      { name: 'Living Room', icon: 'Sofa', time: 25, todos: [
        'Dust all surfaces and shelves', 'Vacuum sofa and cushions', 'Vacuum floor', 'Clean windows',
      ]},
    ]);
    await insertAddOns(client, o1, [
      { name: 'Inside Oven', icon: 'Flame', price: 25, selected: false },
      { name: 'Inside Fridge', icon: 'Snowflake', price: 20, selected: false },
      { name: 'Laundry', icon: 'Shirt', price: 30, selected: false },
    ]);
    await insertEmployees(client, o1, ['MarÃ­a GarcÃ­a', 'SofÃ­a MartÃ­nez']);

    // â”€â”€ Order #3002 â€” Standard clean â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o2 = await insertOrder(client, {
      orderNumber: '3002', clientName: 'Robert Chen', clientEmail: 'robert.chen@email.com',
      address: '88 Oakwood Boulevard, Suite 12A', phone: '+1 (555) 482-9317',
      status: 'scheduled', date: '2026-04-11', time: '02:00 PM',
      serviceType: 'Regular Cleaning',
      specialInstructions: 'Please use eco-friendly products. Small dog (friendly).',
      accessInfo: 'Key in lockbox #4291 beside front door',
      goal: 'Bi-weekly maintenance clean',
    });
    await insertSections(client, o2, [
      { name: 'Kitchen', icon: 'ChefHat', time: 30, todos: [
        'Wipe countertops and backsplash', 'Clean stovetop', 'Clean sink and faucet', 'Mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 25, todos: [
        'Sanitize toilet', 'Clean shower and tiles', 'Wipe sink and mirror', 'Mop floor',
      ]},
      { name: 'Living Room', icon: 'Sofa', time: 20, todos: [
        'Dust all surfaces', 'Vacuum floor and rugs', 'Wipe down coffee table',
      ]},
    ]);
    await insertAddOns(client, o2, [
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: false },
    ]);
    await insertEmployees(client, o2, ['Carlos LÃ³pez']);

    // â”€â”€ Order #3003 â€” Move-in clean â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o3 = await insertOrder(client, {
      orderNumber: '3003', clientName: 'Jessica Thompson', clientEmail: 'jessica.t@email.com',
      address: '220 Cedar Lane, Unit 7F', phone: '+1 (555) 671-2839',
      status: 'scheduled', date: '2026-04-14', time: '10:00 AM',
      serviceType: 'Move-in Cleaning',
      specialInstructions: 'New tenant moving in. Apartment vacant 3 months â€” very dusty.',
      accessInfo: 'Key at front desk, ask for Miguel',
      goal: 'Full sanitization before move-in',
    });
    await insertSections(client, o3, [
      { name: 'Kitchen', icon: 'ChefHat', time: 55, todos: [
        'Deep clean all appliances', 'Wipe inside all cabinets and drawers',
        'Scrub countertops', 'Clean sink and faucet', 'Mop floor thoroughly',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 40, todos: [
        'Disinfect toilet inside and out', 'Scrub shower and bathtub',
        'Clean all tiles and grout', 'Clean sink and mirror', 'Mop floor',
      ]},
      { name: 'Bedrooms', icon: 'Bed', time: 35, todos: [
        'Wipe inside all closets', 'Dust all surfaces, baseboards, and vents',
        'Vacuum entire floor', 'Clean windows interior',
      ]},
    ]);
    await insertAddOns(client, o3, [
      { name: 'Inside Oven', icon: 'Flame', price: 25, selected: false },
      { name: 'Inside Fridge', icon: 'Snowflake', price: 20, selected: false },
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: false },
    ]);
    await insertEmployees(client, o3, ['MarÃ­a GarcÃ­a', 'Diego HernÃ¡ndez']);

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // IN-PROGRESS â€” 2 orders
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // â”€â”€ Order #3004 â€” Standard clean (partially done) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o4 = await insertOrder(client, {
      orderNumber: '3004', clientName: 'Andrew Park', clientEmail: 'andrew.park@email.com',
      address: '505 Maple Drive, Apt 2C', phone: '+1 (555) 390-7142',
      status: 'in-progress', date: '2026-04-08', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
      specialInstructions: 'Baby sleeping in nursery â€” please be quiet near back rooms.',
      accessInfo: 'Smart lock code: 8461',
      goal: 'Quick weekly tidy-up',
      startedAt: ts('2026-04-08T09:05:00'),
    });
    await insertSections(client, o4, [
      { name: 'Kitchen', icon: 'ChefHat', time: 30, completed: false, todos: [
        ['Wipe down countertops', true] as TodoRow,
        ['Clean stovetop', true] as TodoRow,
        ['Clean sink and faucet', false] as TodoRow,
        ['Sweep and mop floor', false] as TodoRow,
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 25, todos: [
        'Sanitize toilet', 'Clean shower', 'Wipe sink and mirror', 'Mop floor',
      ]},
      { name: 'Living Room', icon: 'Sofa', time: 20, todos: [
        'Dust all surfaces', 'Vacuum floor and sofa', 'Clean windows',
      ]},
    ]);
    await insertAddOns(client, o4, [
      { name: 'Laundry', icon: 'Shirt', price: 30, selected: true },
    ]);
    await insertEmployees(client, o4, ['SofÃ­a MartÃ­nez']);

    // â”€â”€ Order #3005 â€” Deep clean (kitchen done, bathroom in progress) â”€â”€â”€â”€â”€â”€â”€
    const o5 = await insertOrder(client, {
      orderNumber: '3005', clientName: 'Michelle Rivera', clientEmail: 'michelle.r@email.com',
      address: '730 Westside Ave, Unit 12', phone: '+1 (555) 814-3390',
      status: 'in-progress', date: '2026-04-08', time: '08:00 AM',
      serviceType: 'Deep Cleaning',
      specialInstructions: 'Focus on master bathroom â€” heavy calcium buildup on shower.',
      accessInfo: 'Garage code: 5523 Â· Side door unlocked',
      goal: 'Monthly deep clean, especially wet areas',
      startedAt: ts('2026-04-08T08:10:00'),
    });
    await insertSections(client, o5, [
      { name: 'Kitchen', icon: 'ChefHat', time: 50, completed: true, todos: [
        ['Deep clean stovetop and oven exterior', true] as TodoRow,
        ['Scrub all countertops', true] as TodoRow,
        ['Clean sink and faucet', true] as TodoRow,
        ['Mop floor', true] as TodoRow,
        ['Empty trash', true] as TodoRow,
      ]},
      { name: 'Master Bathroom', icon: 'Bath', time: 45, completed: false, todos: [
        ['Scrub toilet inside and out', true] as TodoRow,
        ['Remove calcium buildup from shower', false] as TodoRow,
        ['Clean all tiles and grout', false] as TodoRow,
        ['Polish mirror and vanity', false] as TodoRow,
        ['Mop floor', false] as TodoRow,
      ]},
      { name: 'Guest Bathroom', icon: 'Bath', time: 25, todos: [
        'Sanitize toilet', 'Clean sink and mirror', 'Mop floor',
      ]},
      { name: 'Bedrooms', icon: 'Bed', time: 30, todos: [
        'Change all bed linens', 'Dust all surfaces', 'Vacuum floors',
      ]},
    ]);
    await insertAddOns(client, o5, [
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: true },
      { name: 'Inside Fridge', icon: 'Snowflake', price: 20, selected: false },
    ]);
    await insertEmployees(client, o5, ['Carlos LÃ³pez', 'Diego HernÃ¡ndez']);

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // COMPLETED â€” 4 orders (spread across cleaners for team stats)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // â”€â”€ Order #3006 â€” Deep clean (completed) â€” MarÃ­a + Carlos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o6 = await insertOrder(client, {
      orderNumber: '3006', clientName: 'Sarah Mitchell', clientEmail: 'sarah.m@email.com',
      address: '77 River Road, Apt 1A', phone: '+1 (555) 847-2016',
      status: 'completed', date: '2026-04-04', time: '09:00 AM',
      serviceType: 'Deep Cleaning',
      goal: 'Post-renovation thorough cleaning',
      startedAt: ts('2026-04-04T09:05:00'),
      completedAt: ts('2026-04-04T11:32:00'),
    });
    await insertSections(client, o6, [
      { name: 'Kitchen', icon: 'ChefHat', time: 45, completed: true, todos: [
        'Wipe down all countertops', 'Clean stovetop and oven exterior',
        'Clean sink and faucet', 'Sweep and mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 35, completed: true, todos: [
        'Sanitize toilet', 'Deep clean shower tiles', 'Clean sink and mirror', 'Mop floor',
      ]},
      { name: 'Living Room', icon: 'Sofa', time: 25, completed: true, todos: [
        'Dust all surfaces', 'Vacuum floor', 'Clean windows interior',
      ]},
    ]);
    await insertAddOns(client, o6, [
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: true },
    ]);
    await insertEmployees(client, o6, ['MarÃ­a GarcÃ­a', 'Carlos LÃ³pez']);

    // â”€â”€ Order #3007 â€” Standard clean (completed) â€” Diego â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o7 = await insertOrder(client, {
      orderNumber: '3007', clientName: 'David Nguyen', clientEmail: 'david.n@email.com',
      address: '33 Oak Street, Unit 5', phone: '+1 (555) 630-5928',
      status: 'completed', date: '2026-04-03', time: '02:00 PM',
      serviceType: 'Regular Cleaning',
      startedAt: ts('2026-04-03T14:00:00'),
      completedAt: ts('2026-04-03T15:15:00'),
    });
    await insertSections(client, o7, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, completed: true, todos: [
        'Wipe countertops', 'Clean sink', 'Sweep and mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 20, completed: true, todos: [
        'Clean toilet', 'Wipe mirror and sink', 'Mop floor',
      ]},
    ]);
    await insertEmployees(client, o7, ['Diego HernÃ¡ndez']);

    // â”€â”€ Order #3008 â€” Move-out clean (completed) â€” SofÃ­a + Carlos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o8 = await insertOrder(client, {
      orderNumber: '3008', clientName: 'Laura FernÃ¡ndez', clientEmail: 'laura.f@email.com',
      address: '88 Pine Court, Suite 2B', phone: '+1 (555) 415-3087',
      status: 'completed', date: '2026-04-01', time: '01:00 PM',
      serviceType: 'Move-out Cleaning',
      specialInstructions: 'Empty apartment â€” clean every surface for deposit return.',
      startedAt: ts('2026-04-01T13:00:00'),
      completedAt: ts('2026-04-01T15:20:00'),
    });
    await insertSections(client, o8, [
      { name: 'Kitchen', icon: 'ChefHat', time: 40, completed: true, todos: [
        'Deep clean oven interior', 'Clean inside all cabinets', 'Scrub countertops',
        'Clean sink and faucet', 'Mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 30, completed: true, todos: [
        'Deep clean toilet', 'Scrub shower tiles and grout', 'Clean vanity and mirror', 'Mop floor',
      ]},
      { name: 'Living Room', icon: 'Sofa', time: 25, completed: true, todos: [
        'Dust all surfaces', 'Clean windows interior', 'Vacuum and mop floor',
      ]},
    ]);
    await insertAddOns(client, o8, [
      { name: 'Inside Oven', icon: 'Flame', price: 25, selected: true },
      { name: 'Carpet Shampoo', icon: 'Sparkles', price: 50, selected: true },
    ]);
    await insertEmployees(client, o8, ['SofÃ­a MartÃ­nez', 'Carlos LÃ³pez']);

    // â”€â”€ Order #3009 â€” Quick clean (completed) â€” MarÃ­a + Diego â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o9 = await insertOrder(client, {
      orderNumber: '3009', clientName: 'Michael Torres', clientEmail: 'michael.t@email.com',
      address: '567 Lakewood Ave, Apt 5C', phone: '+1 (555) 884-9123',
      status: 'completed', date: '2026-03-28', time: '10:00 AM',
      serviceType: 'Quick Cleaning',
      startedAt: ts('2026-03-28T10:00:00'),
      completedAt: ts('2026-03-28T10:45:00'),
    });
    await insertSections(client, o9, [
      { name: 'Kitchen', icon: 'ChefHat', time: 15, completed: true, todos: [
        'Wipe countertops', 'Clean sink', 'Sweep floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 15, completed: true, todos: [
        'Sanitize toilet', 'Wipe mirror',
      ]},
    ]);
    await insertEmployees(client, o9, ['MarÃ­a GarcÃ­a', 'Diego HernÃ¡ndez']);

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // CANCELLED â€” 1 order
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // â”€â”€ Order #3010 â€” Standard clean (canceled) â€” SofÃ­a â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const o10 = await insertOrder(client, {
      orderNumber: '3010', clientName: 'Patricia Holmes', clientEmail: 'patricia.h@email.com',
      address: '999 Highland Park, Suite 8', phone: '+1 (555) 601-2234',
      status: 'canceled', date: '2026-04-06', time: '03:00 PM',
      serviceType: 'Regular Cleaning',
      specialInstructions: 'Client canceled â€” family emergency.',
    });
    await insertSections(client, o10, [
      { name: 'Kitchen', icon: 'ChefHat', time: 30, todos: ['Wipe countertops', 'Clean sink', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Sanitize toilet', 'Clean shower'] },
    ]);
    await insertEmployees(client, o10, ['SofÃ­a MartÃ­nez']);

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // ADDITIONAL ORDERS â€” Fill April 2026 (orders #3011â€“#3038)
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
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, completed: true, todos: ['Wipe countertops', 'Clean sink', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, completed: true, todos: ['Clean toilet', 'Wipe mirror', 'Mop floor'] },
      { name: 'Living Room', icon: 'Sofa', time: 20, completed: true, todos: ['Dust surfaces', 'Vacuum floor'] },
    ], ['MarÃ­a GarcÃ­a']);

    // â”€â”€â”€ PAST: Apr 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3012', client, {
      orderNumber: '3012', clientName: 'Thomas Wright', clientEmail: 'thomas.w@email.com',
      address: '450 Birch Street, Suite 9', phone: '+1 (555) 339-8715',
      status: 'completed', date: '2026-04-02', time: '10:00 AM',
      serviceType: 'Deep Cleaning',
      specialInstructions: 'Two large dogs â€” please close doors behind you.',
      startedAt: ts('2026-04-02T10:10:00'), completedAt: ts('2026-04-02T12:45:00'),
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 45, completed: true, todos: ['Deep clean countertops', 'Scrub stovetop', 'Clean inside microwave', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 35, completed: true, todos: ['Sanitize toilet', 'Scrub shower tiles', 'Clean vanity', 'Mop floor'] },
      { name: 'Bedrooms', icon: 'Bed', time: 30, completed: true, todos: ['Dust all surfaces', 'Vacuum carpet', 'Change linens'] },
    ], ['Carlos LÃ³pez', 'Diego HernÃ¡ndez']);

    await quickOrder('3013', client, {
      orderNumber: '3013', clientName: 'Rebecca Stone', clientEmail: 'rebecca.s@email.com',
      address: '89 Willow Way, Unit 4A', phone: '+1 (555) 507-2193',
      status: 'completed', date: '2026-04-02', time: '03:00 PM',
      serviceType: 'Office Cleaning',
      startedAt: ts('2026-04-02T15:00:00'), completedAt: ts('2026-04-02T16:40:00'),
    }, [
      { name: 'Main Office', icon: 'Sofa', time: 35, completed: true, todos: ['Wipe desks and monitors', 'Vacuum floor', 'Empty trash bins'] },
      { name: 'Kitchen Area', icon: 'ChefHat', time: 20, completed: true, todos: ['Clean countertop', 'Wash dishes', 'Wipe microwave'] },
      { name: 'Restroom', icon: 'Bath', time: 20, completed: true, todos: ['Sanitize toilet', 'Refill soap', 'Mop floor'] },
    ], ['SofÃ­a MartÃ­nez']);

    // â”€â”€â”€ PAST: Apr 3 (3007 already exists) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3014', client, {
      orderNumber: '3014', clientName: 'Kevin Patel', clientEmail: 'kevin.p@email.com',
      address: '310 Redwood Circle', phone: '+1 (555) 443-6621',
      status: 'completed', date: '2026-04-03', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
      startedAt: ts('2026-04-03T09:00:00'), completedAt: ts('2026-04-03T10:20:00'),
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, completed: true, todos: ['Wipe countertops', 'Clean stovetop', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, completed: true, todos: ['Clean toilet', 'Wipe mirror and sink', 'Mop floor'] },
      { name: 'Bedroom', icon: 'Bed', time: 15, completed: true, todos: ['Dust surfaces', 'Vacuum floor'] },
    ], ['MarÃ­a GarcÃ­a']);

    // â”€â”€â”€ PAST: Apr 4 (3006 already exists) â€” cancelled â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3015', client, {
      orderNumber: '3015', clientName: 'Donna Reeves', clientEmail: 'donna.r@email.com',
      address: '201 Elmwood Ave, Unit 6', phone: '+1 (555) 810-3345',
      status: 'canceled', date: '2026-04-04', time: '11:00 AM',
      serviceType: 'Deep Cleaning',
      specialInstructions: 'Cancelled due to water damage â€” rescheduling later.',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 40, todos: ['Deep clean countertops', 'Scrub oven', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 30, todos: ['Scrub shower', 'Clean toilet', 'Mop floor'] },
    ], ['Diego HernÃ¡ndez']);

    // â”€â”€â”€ PAST: Apr 5 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3016', client, {
      orderNumber: '3016', clientName: 'James Kim', clientEmail: 'james.k@email.com',
      address: '678 Magnolia Blvd, Apt 11B', phone: '+1 (555) 772-0094',
      status: 'completed', date: '2026-04-05', time: '08:00 AM',
      serviceType: 'Move-out Cleaning',
      specialInstructions: 'Empty unit. Need deposit-return level clean.',
      startedAt: ts('2026-04-05T08:05:00'), completedAt: ts('2026-04-05T10:50:00'),
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 45, completed: true, todos: ['Clean inside cabinets', 'Scrub countertops', 'Deep clean oven', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 35, completed: true, todos: ['Scrub shower and tub', 'Clean toilet', 'Wipe vanity', 'Mop floor'] },
      { name: 'Bedrooms', icon: 'Bed', time: 30, completed: true, todos: ['Wipe closet interiors', 'Dust baseboards', 'Vacuum floor'] },
    ], ['SofÃ­a MartÃ­nez', 'Carlos LÃ³pez']);

    await quickOrder('3017', client, {
      orderNumber: '3017', clientName: 'Natalie Cooper', clientEmail: 'natalie.c@email.com',
      address: '42 Cherry Blossom St', phone: '+1 (555) 661-5578',
      status: 'completed', date: '2026-04-05', time: '01:00 PM',
      serviceType: 'Regular Cleaning',
      startedAt: ts('2026-04-05T13:00:00'), completedAt: ts('2026-04-05T14:10:00'),
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 20, completed: true, todos: ['Wipe counters', 'Clean sink', 'Sweep floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, completed: true, todos: ['Clean toilet', 'Wipe mirror', 'Mop floor'] },
    ], ['MarÃ­a GarcÃ­a']);

    // â”€â”€â”€ PAST: Apr 6 (3010 cancelled exists) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3018', client, {
      orderNumber: '3018', clientName: 'Brian Morales', clientEmail: 'brian.m@email.com',
      address: '155 Spruce Lane, Apt 8D', phone: '+1 (555) 934-2207',
      status: 'completed', date: '2026-04-06', time: '10:00 AM',
      serviceType: 'Deep Cleaning',
      startedAt: ts('2026-04-06T10:00:00'), completedAt: ts('2026-04-06T12:15:00'),
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 40, completed: true, todos: ['Deep clean stovetop', 'Scrub countertops', 'Clean microwave', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 35, completed: true, todos: ['Scrub shower tiles', 'Clean toilet', 'Polish mirror', 'Mop floor'] },
      { name: 'Living Room', icon: 'Sofa', time: 25, completed: true, todos: ['Dust surfaces', 'Vacuum floor', 'Clean windows'] },
    ], ['Diego HernÃ¡ndez', 'Carlos LÃ³pez']);

    // â”€â”€â”€ PAST: Apr 7 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3019', client, {
      orderNumber: '3019', clientName: 'Lisa Chang', clientEmail: 'lisa.c@email.com',
      address: '900 Sycamore Ave, Suite 3C', phone: '+1 (555) 412-8839',
      status: 'completed', date: '2026-04-07', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
      startedAt: ts('2026-04-07T09:05:00'), completedAt: ts('2026-04-07T10:25:00'),
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, completed: true, todos: ['Wipe countertops', 'Clean sink', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, completed: true, todos: ['Clean toilet', 'Wipe sink and mirror', 'Mop floor'] },
      { name: 'Bedroom', icon: 'Bed', time: 20, completed: true, todos: ['Dust surfaces', 'Vacuum floor', 'Make bed'] },
    ], ['MarÃ­a GarcÃ­a', 'SofÃ­a MartÃ­nez']);

    await quickOrder('3020', client, {
      orderNumber: '3020', clientName: 'Victor Salazar', clientEmail: 'victor.s@email.com',
      address: '64 Aspen Court, Unit 2', phone: '+1 (555) 288-4456',
      status: 'canceled', date: '2026-04-07', time: '02:00 PM',
      serviceType: 'Office Cleaning',
      specialInstructions: 'Cancelled â€” office closed for renovation.',
    }, [
      { name: 'Main Office', icon: 'Sofa', time: 30, todos: ['Wipe desks', 'Vacuum floor', 'Empty trash'] },
      { name: 'Restroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Refill soap', 'Mop floor'] },
    ], ['Diego HernÃ¡ndez']);

    // â”€â”€â”€ TODAY: Apr 8 (3004 in-progress, 3005 in-progress exist) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3021', client, {
      orderNumber: '3021', clientName: 'Pamela Green', clientEmail: 'pamela.g@email.com',
      address: '322 Laurel Drive, Apt 7A', phone: '+1 (555) 177-3302',
      status: 'scheduled', date: '2026-04-08', time: '02:00 PM',
      serviceType: 'Regular Cleaning',
      specialInstructions: 'Please ring buzzer for 7A.',
      accessInfo: 'Buzzer code: 7A then #',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, todos: ['Wipe countertops', 'Clean stovetop', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Wipe mirror', 'Mop floor'] },
      { name: 'Living Room', icon: 'Sofa', time: 20, todos: ['Dust surfaces', 'Vacuum floor'] },
    ], ['MarÃ­a GarcÃ­a']);

    await quickOrder('3022', client, {
      orderNumber: '3022', clientName: 'Frank Delgado', clientEmail: 'frank.d@email.com',
      address: '810 Chestnut Place, Unit 5B', phone: '+1 (555) 992-1187',
      status: 'scheduled', date: '2026-04-08', time: '04:00 PM',
      serviceType: 'Deep Cleaning',
      accessInfo: 'Key under welcome mat',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 40, todos: ['Deep clean countertops', 'Scrub stovetop', 'Clean microwave', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 35, todos: ['Scrub shower', 'Clean toilet', 'Polish mirror', 'Mop floor'] },
      { name: 'Bedrooms', icon: 'Bed', time: 25, todos: ['Dust surfaces', 'Vacuum carpet', 'Change linens'] },
    ], ['Diego HernÃ¡ndez', 'Carlos LÃ³pez']);

    // â”€â”€â”€ FUTURE: Apr 9 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3023', client, {
      orderNumber: '3023', clientName: 'Sandra Owens', clientEmail: 'sandra.o@email.com',
      address: '275 Poplar Road, Apt 1C', phone: '+1 (555) 543-6672',
      status: 'scheduled', date: '2026-04-09', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
      goal: 'Weekly maintenance clean',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, todos: ['Wipe countertops', 'Clean sink', 'Sweep and mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Wipe mirror', 'Mop floor'] },
    ], ['SofÃ­a MartÃ­nez']);

    await quickOrder('3024', client, {
      orderNumber: '3024', clientName: 'Raymond Hart', clientEmail: 'raymond.h@email.com',
      address: '130 Walnut Street, Suite 10', phone: '+1 (555) 873-4419',
      status: 'scheduled', date: '2026-04-09', time: '01:00 PM',
      serviceType: 'Office Cleaning',
      specialInstructions: 'Conference room needs special attention before board meeting.',
    }, [
      { name: 'Conference Room', icon: 'Sofa', time: 30, todos: ['Wipe table and chairs', 'Clean whiteboard', 'Vacuum floor'] },
      { name: 'Main Office', icon: 'Sofa', time: 25, todos: ['Wipe desks', 'Empty trash', 'Vacuum floor'] },
      { name: 'Restroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Refill supplies', 'Mop floor'] },
    ], ['MarÃ­a GarcÃ­a', 'Carlos LÃ³pez']);

    // â”€â”€â”€ FUTURE: Apr 10 (3001 exists) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3025', client, {
      orderNumber: '3025', clientName: 'Heather Flynn', clientEmail: 'heather.f@email.com',
      address: '55 Ivy Lane, Unit 3F', phone: '+1 (555) 319-7780',
      status: 'scheduled', date: '2026-04-10', time: '02:00 PM',
      serviceType: 'Regular Cleaning',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, todos: ['Wipe countertops', 'Clean sink', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Wipe mirror', 'Mop floor'] },
      { name: 'Bedroom', icon: 'Bed', time: 15, todos: ['Dust surfaces', 'Vacuum floor'] },
    ], ['Diego HernÃ¡ndez']);

    // â”€â”€â”€ FUTURE: Apr 12 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3026', client, {
      orderNumber: '3026', clientName: 'Catherine Bell', clientEmail: 'catherine.b@email.com',
      address: '408 Hazel Terrace, Apt 9E', phone: '+1 (555) 451-3328',
      status: 'scheduled', date: '2026-04-12', time: '10:00 AM',
      serviceType: 'Deep Cleaning',
      specialInstructions: 'Three cats â€” keep exterior doors closed.',
      goal: 'Spring deep clean',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 45, todos: ['Deep clean countertops', 'Scrub stovetop and oven', 'Clean sink', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 35, todos: ['Scrub shower tiles', 'Clean toilet', 'Polish fixtures', 'Mop floor'] },
      { name: 'Living Room', icon: 'Sofa', time: 25, todos: ['Dust shelves and surfaces', 'Vacuum sofa', 'Vacuum floor'] },
      { name: 'Bedroom', icon: 'Bed', time: 20, todos: ['Dust surfaces', 'Vacuum carpet', 'Change linens'] },
    ], ['SofÃ­a MartÃ­nez', 'MarÃ­a GarcÃ­a']);

    // â”€â”€â”€ FUTURE: Apr 13 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3027', client, {
      orderNumber: '3027', clientName: 'Edward Sullivan', clientEmail: 'edward.s@email.com',
      address: '92 Dogwood Drive', phone: '+1 (555) 608-9934',
      status: 'scheduled', date: '2026-04-13', time: '11:00 AM',
      serviceType: 'Regular Cleaning',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, todos: ['Wipe countertops', 'Clean stovetop', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Wipe sink and mirror', 'Mop floor'] },
    ], ['Carlos LÃ³pez']);

    // â”€â”€â”€ FUTURE: Apr 14 (3003 exists) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3028', client, {
      orderNumber: '3028', clientName: 'Amanda Perry', clientEmail: 'amanda.p@email.com',
      address: '330 Juniper Court, Unit 2A', phone: '+1 (555) 744-1156',
      status: 'scheduled', date: '2026-04-14', time: '03:00 PM',
      serviceType: 'Regular Cleaning',
      accessInfo: 'Lockbox code: 5891',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, todos: ['Wipe countertops', 'Clean sink', 'Sweep and mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Sanitize toilet', 'Wipe mirror', 'Mop floor'] },
      { name: 'Living Room', icon: 'Sofa', time: 20, todos: ['Dust surfaces', 'Vacuum floor', 'Wipe coffee table'] },
    ], ['SofÃ­a MartÃ­nez']);

    // â”€â”€â”€ FUTURE: Apr 15 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3029', client, {
      orderNumber: '3029', clientName: 'George Ramirez', clientEmail: 'george.r@email.com',
      address: '517 Alder Boulevard, Apt 6D', phone: '+1 (555) 205-8843',
      status: 'scheduled', date: '2026-04-15', time: '08:00 AM',
      serviceType: 'Move-in Cleaning',
      specialInstructions: 'New tenants arriving afternoon â€” must finish by noon.',
      goal: 'Full sanitization before move-in',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 50, todos: ['Clean inside all cabinets', 'Scrub countertops', 'Deep clean oven', 'Clean sink', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 40, todos: ['Disinfect toilet', 'Scrub shower and tub', 'Clean grout', 'Wipe vanity', 'Mop floor'] },
      { name: 'Bedrooms', icon: 'Bed', time: 30, todos: ['Clean closet interiors', 'Dust baseboards', 'Vacuum floor'] },
    ], ['MarÃ­a GarcÃ­a', 'Diego HernÃ¡ndez']);

    // â”€â”€â”€ FUTURE: Apr 16 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3030', client, {
      orderNumber: '3030', clientName: 'Nicole Foster', clientEmail: 'nicole.f@email.com',
      address: '103 Cypress Row, Suite 14', phone: '+1 (555) 366-7729',
      status: 'scheduled', date: '2026-04-16', time: '10:00 AM',
      serviceType: 'Office Cleaning',
    }, [
      { name: 'Main Office', icon: 'Sofa', time: 35, todos: ['Wipe all desks', 'Vacuum carpets', 'Empty trash bins', 'Dust shelves'] },
      { name: 'Break Room', icon: 'ChefHat', time: 20, todos: ['Clean countertop and sink', 'Wipe fridge exterior', 'Mop floor'] },
      { name: 'Restrooms', icon: 'Bath', time: 25, todos: ['Sanitize toilets', 'Refill soap dispensers', 'Mop floors'] },
    ], ['Carlos LÃ³pez', 'SofÃ­a MartÃ­nez']);

    // â”€â”€â”€ FUTURE: Apr 17 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3031', client, {
      orderNumber: '3031', clientName: 'Daniel Murphy', clientEmail: 'daniel.m@email.com',
      address: '740 Ash Street, Apt 4G', phone: '+1 (555) 821-5504',
      status: 'scheduled', date: '2026-04-17', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, todos: ['Clean countertops', 'Wipe stovetop', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Wipe mirror', 'Mop floor'] },
      { name: 'Living Room', icon: 'Sofa', time: 15, todos: ['Dust surfaces', 'Vacuum floor'] },
    ], ['Diego HernÃ¡ndez']);

    // â”€â”€â”€ FUTURE: Apr 18 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3032', client, {
      orderNumber: '3032', clientName: 'Stephanie Cruz', clientEmail: 'stephanie.c@email.com',
      address: '260 Beechwood Lane, Unit 10C', phone: '+1 (555) 493-2218',
      status: 'scheduled', date: '2026-04-18', time: '11:00 AM',
      serviceType: 'Deep Cleaning',
      goal: 'Pre-party deep clean',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 45, todos: ['Deep clean all surfaces', 'Scrub oven', 'Clean fridge exterior', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 35, todos: ['Scrub shower enclosure', 'Clean toilet', 'Polish fixtures', 'Mop floor'] },
      { name: 'Dining Room', icon: 'Sofa', time: 20, todos: ['Dust table and chairs', 'Wipe sideboard', 'Vacuum floor'] },
      { name: 'Living Room', icon: 'Sofa', time: 25, todos: ['Dust all surfaces', 'Vacuum sofa', 'Clean windows'] },
    ], ['MarÃ­a GarcÃ­a', 'Carlos LÃ³pez']);

    // â”€â”€â”€ FUTURE: Apr 20 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3033', client, {
      orderNumber: '3033', clientName: 'Martin O\'Brien', clientEmail: 'martin.o@email.com',
      address: '185 Sequoia Park, Apt 2F', phone: '+1 (555) 714-3360',
      status: 'scheduled', date: '2026-04-20', time: '09:00 AM',
      serviceType: 'Regular Cleaning',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, todos: ['Wipe countertops', 'Clean sink', 'Sweep and mop'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Wipe mirror', 'Mop floor'] },
    ], ['SofÃ­a MartÃ­nez']);

    // â”€â”€â”€ FUTURE: Apr 21 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3034', client, {
      orderNumber: '3034', clientName: 'Claire Jenkins', clientEmail: 'claire.j@email.com',
      address: '621 Hickory Place, Suite 8A', phone: '+1 (555) 540-9982',
      status: 'scheduled', date: '2026-04-21', time: '10:00 AM',
      serviceType: 'Move-out Cleaning',
      specialInstructions: 'Entire unit empty. Need deep clean for landlord inspection.',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 50, todos: ['Clean inside cabinets', 'Scrub countertops', 'Deep clean oven and fridge', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 40, todos: ['Scrub shower and tub', 'Clean grout', 'Sanitize toilet', 'Mop floor'] },
      { name: 'Bedrooms', icon: 'Bed', time: 30, todos: ['Wipe closet interiors', 'Dust baseboards and vents', 'Vacuum floor'] },
      { name: 'Living Room', icon: 'Sofa', time: 20, todos: ['Dust all surfaces', 'Clean windows interior', 'Vacuum and mop'] },
    ], ['Diego HernÃ¡ndez', 'MarÃ­a GarcÃ­a']);

    // â”€â”€â”€ FUTURE: Apr 22 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3035', client, {
      orderNumber: '3035', clientName: 'Oscar Gutierrez', clientEmail: 'oscar.g@email.com',
      address: '490 Cottonwood Trail', phone: '+1 (555) 399-1147',
      status: 'scheduled', date: '2026-04-22', time: '02:00 PM',
      serviceType: 'Regular Cleaning',
      accessInfo: 'Key under the flower pot on the porch',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, todos: ['Wipe countertops', 'Clean stovetop', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Wipe sink and mirror', 'Mop floor'] },
      { name: 'Bedroom', icon: 'Bed', time: 15, todos: ['Dust surfaces', 'Vacuum floor'] },
    ], ['Carlos LÃ³pez']);

    // â”€â”€â”€ FUTURE: Apr 23 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3036', client, {
      orderNumber: '3036', clientName: 'Diana Warren', clientEmail: 'diana.w@email.com',
      address: '77 Palmetto Drive, Apt 5A', phone: '+1 (555) 625-8801',
      status: 'scheduled', date: '2026-04-23', time: '09:00 AM',
      serviceType: 'Deep Cleaning',
      goal: 'Allergy season deep clean â€” focus on dusting',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 40, todos: ['Deep clean all surfaces', 'Clean inside microwave', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 30, todos: ['Scrub shower', 'Clean toilet', 'Mop floor'] },
      { name: 'Bedrooms', icon: 'Bed', time: 30, todos: ['Dust all surfaces thoroughly', 'Vacuum carpet', 'Wipe baseboards'] },
      { name: 'Living Room', icon: 'Sofa', time: 25, todos: ['Dust shelves and blinds', 'Vacuum sofa', 'Vacuum floor'] },
    ], ['SofÃ­a MartÃ­nez', 'Diego HernÃ¡ndez']);

    // â”€â”€â”€ FUTURE: Apr 25 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3037', client, {
      orderNumber: '3037', clientName: 'Aaron Woods', clientEmail: 'aaron.w@email.com',
      address: '830 Catalpa Court, Unit 1B', phone: '+1 (555) 280-4493',
      status: 'scheduled', date: '2026-04-25', time: '10:00 AM',
      serviceType: 'Regular Cleaning',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, todos: ['Wipe countertops', 'Clean sink', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Wipe mirror', 'Mop floor'] },
    ], ['MarÃ­a GarcÃ­a']);

    // â”€â”€â”€ FUTURE: Apr 27 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3038', client, {
      orderNumber: '3038', clientName: 'Julia Simmons', clientEmail: 'julia.s@email.com',
      address: '360 Creekview Drive, Suite 6', phone: '+1 (555) 711-5526',
      status: 'scheduled', date: '2026-04-27', time: '01:00 PM',
      serviceType: 'Office Cleaning',
      specialInstructions: 'Server room off-limits. Clean all common areas.',
    }, [
      { name: 'Main Office', icon: 'Sofa', time: 35, todos: ['Wipe desks and monitors', 'Vacuum floor', 'Empty trash bins'] },
      { name: 'Break Room', icon: 'ChefHat', time: 20, todos: ['Clean countertop', 'Wash dishes', 'Mop floor'] },
      { name: 'Restrooms', icon: 'Bath', time: 25, todos: ['Sanitize toilets', 'Refill supplies', 'Mop floors'] },
    ], ['Carlos LÃ³pez', 'SofÃ­a MartÃ­nez']);

    // â”€â”€â”€ FUTURE: Apr 28 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3039', client, {
      orderNumber: '3039', clientName: 'Philip West', clientEmail: 'philip.w@email.com',
      address: '54 Maplewood Heights, Apt 12A', phone: '+1 (555) 832-6614',
      status: 'scheduled', date: '2026-04-28', time: '09:00 AM',
      serviceType: 'Deep Cleaning',
      goal: 'End-of-month deep clean',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 45, todos: ['Deep clean countertops', 'Scrub stovetop', 'Clean inside microwave', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 35, todos: ['Scrub shower tiles', 'Clean toilet', 'Polish mirror', 'Mop floor'] },
      { name: 'Bedrooms', icon: 'Bed', time: 25, todos: ['Dust all surfaces', 'Vacuum carpet', 'Change bed linens'] },
    ], ['Diego HernÃ¡ndez', 'MarÃ­a GarcÃ­a']);

    // â”€â”€â”€ FUTURE: Apr 29 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3040', client, {
      orderNumber: '3040', clientName: 'Irene Castillo', clientEmail: 'irene.c@email.com',
      address: '115 Linden Avenue, Unit 4D', phone: '+1 (555) 467-3398',
      status: 'scheduled', date: '2026-04-29', time: '11:00 AM',
      serviceType: 'Regular Cleaning',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 25, todos: ['Wipe countertops', 'Clean sink', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Clean toilet', 'Wipe mirror', 'Mop floor'] },
      { name: 'Living Room', icon: 'Sofa', time: 15, todos: ['Dust surfaces', 'Vacuum floor'] },
    ], ['Carlos LÃ³pez']);

    // â”€â”€â”€ FUTURE: Apr 30 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await quickOrder('3041', client, {
      orderNumber: '3041', clientName: 'Teresa Hoffman', clientEmail: 'teresa.h@email.com',
      address: '705 Bayview Terrace, Apt 8B', phone: '+1 (555) 590-2274',
      status: 'scheduled', date: '2026-04-30', time: '09:00 AM',
      serviceType: 'Move-in Cleaning',
      specialInstructions: 'New tenant arriving May 1st â€” full sanitization needed.',
      accessInfo: 'Property manager will let you in â€” call (555) 100-2000',
    }, [
      { name: 'Kitchen', icon: 'ChefHat', time: 50, todos: ['Clean inside all cabinets', 'Scrub countertops', 'Deep clean oven', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 40, todos: ['Disinfect toilet', 'Scrub shower', 'Clean grout', 'Mop floor'] },
      { name: 'Bedrooms', icon: 'Bed', time: 30, todos: ['Clean closet interiors', 'Dust baseboards', 'Vacuum floor'] },
    ], ['SofÃ­a MartÃ­nez', 'Diego HernÃ¡ndez']);

    await client.query('COMMIT');

    console.log('');
    console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.log('  âœ“ Seed complete â€” 5 users, 41 orders');
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
    console.log('    maria@demo.com   â€” MarÃ­a GarcÃ­a');
    console.log('    carlos@demo.com  â€” Carlos LÃ³pez');
    console.log('    sofia@demo.com   â€” SofÃ­a MartÃ­nez');
    console.log('    diego@demo.com   â€” Diego HernÃ¡ndez');
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
