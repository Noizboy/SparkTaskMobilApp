import { pool } from './db';

/**
 * Seed script — creates realistic SparkTask data matching the mobile app's mock jobs.
 * Same clients, order numbers, and structures appear in both the app and dashboard.
 *
 * Run: npm run seed
 */

type TodoRow = [string, boolean];
type SectionData = {
  name: string;
  icon: string;
  time: number; // minutes
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
  // Update order duration based on sum of section times
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

// ─── Timestamps ────────────────────────────────────────────────────────────────

const ts = (dateStr: string) => new Date(dateStr).getTime();

// ─── Main seed ─────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Wipe everything in dependency order (cascades handled manually)
    await client.query('DELETE FROM assigned_employees');
    await client.query('DELETE FROM photos');
    await client.query('DELETE FROM todos');
    await client.query('DELETE FROM sections');
    await client.query('DELETE FROM add_ons');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM users WHERE email != $1', ['admin@sparktask.com']);

    // ── Seed admin user (dashboard login) ────────────────────────────────────
    await client.query(
      `INSERT INTO users (email, password, name, company, role) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@sparktask.com', 'admin123', 'Sarah Admin', 'SparkTask Cleaning', 'admin']
    );
    await client.query(
      `INSERT INTO users (email, password, name, company, role) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (email) DO NOTHING`,
      ['demo@demo.com', 'demo', 'Demo User', 'SparkTask Cleaning', 'cleaner']
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // UPCOMING / SCHEDULED ORDERS (mobile shows as 'upcoming', DB stores 'scheduled')
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Order #2847 — Emma Richardson — Deep clean ────────────────────────────
    const o1 = await insertOrder(client, {
      orderNumber: '2847', clientName: 'Emma Richardson', clientEmail: 'emma.richardson@email.com',
      address: '456 Maple Drive, Apt 3B', phone: '+1 (555) 234-8471',
      status: 'scheduled', date: '2026-04-07', time: '09:00 AM',
      serviceType: 'Deep clean',
      specialInstructions: 'Focus on the stove and shower. Pet in the apartment (friendly dog).',
      accessInfo: 'Door code: 4582 · Guard at reception',
      goal: 'Deliver move-out level clean',
    });
    await insertSections(client, o1, [
      { name: 'Kitchen', icon: 'ChefHat', time: 45, todos: [
        'Wipe down countertops and backsplash', 'Clean stovetop and exterior of appliances',
        'Clean sink and faucet', 'Sweep and mop floor', 'Empty trash and replace liner',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 30, todos: [
        'Clean and sanitize toilet', 'Clean shower/tub and tiles', 'Clean sink and mirror', 'Sweep and mop floor',
      ]},
      { name: 'Master Bedroom', icon: 'Bed', time: 30, todos: [
        'Change bed linens', 'Dust all surfaces', 'Vacuum floor', 'Empty trash',
      ]},
      { name: 'Living Room', icon: 'Sofa', time: 25, todos: [
        'Dust all surfaces and shelves', 'Vacuum sofa and cushions', 'Vacuum floor', 'Clean windows and mirrors',
      ]},
    ]);
    await insertAddOns(client, o1, [
      { name: 'Inside Oven', icon: 'Flame', price: 25, selected: false },
      { name: 'Inside Fridge', icon: 'Snowflake', price: 20, selected: false },
      { name: 'Laundry', icon: 'Shirt', price: 30, selected: false },
    ]);
    await insertEmployees(client, o1, ['Ana Lopez', 'Maria Garcia']);

    // ── Order #2851 — Marcus Johnson — Standard clean ─────────────────────────
    const o2 = await insertOrder(client, {
      orderNumber: '2851', clientName: 'Marcus Johnson', clientEmail: 'marcus.j@email.com',
      address: '89 Oak Street, Suite 5A', phone: '+1 (555) 891-3024',
      status: 'scheduled', date: '2026-04-07', time: '02:00 PM',
      serviceType: 'Standard clean',
      specialInstructions: 'Please use eco-friendly products only.',
      accessInfo: 'Key under doormat',
      goal: 'Leave the place spotless',
    });
    await insertSections(client, o2, [
      { name: 'Kitchen', icon: 'ChefHat', time: 30, todos: [
        'Wipe countertops', 'Clean sink', 'Mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: [
        'Sanitize toilet', 'Clean shower', 'Mop floor',
      ]},
    ]);
    await insertAddOns(client, o2, [
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: false },
    ]);
    await insertEmployees(client, o2, ['Carlos Ruiz']);

    // ── Order #2855 — Sophia Martinez — Move-out clean ────────────────────────
    const o3 = await insertOrder(client, {
      orderNumber: '2855', clientName: 'Sophia Martinez', clientEmail: 'sophia.m@email.com',
      address: '12 Sunset Blvd, Unit 8', phone: '+1 (555) 672-1935',
      status: 'scheduled', date: '2026-04-10', time: '10:00 AM',
      serviceType: 'Move-out clean',
      specialInstructions: 'Tenant moving out. Full deep clean needed.',
      accessInfo: 'Contact property manager: (555) 987-6543',
      goal: 'Restore to original condition for new tenants',
    });
    await insertSections(client, o3, [
      { name: 'Kitchen', icon: 'ChefHat', time: 60, todos: [
        'Deep clean all appliances', 'Clean inside cabinets', 'Scrub countertops',
        'Clean sink and faucet', 'Mop floor thoroughly',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 45, todos: [
        'Deep clean toilet inside and out', 'Remove soap scum from shower',
        'Clean all tiles and grout', 'Polish mirrors',
      ]},
      { name: 'Bedroom', icon: 'Bed', time: 30, todos: [
        'Clean inside closets', 'Dust all surfaces', 'Vacuum carpet thoroughly',
      ]},
    ]);
    await insertAddOns(client, o3, [
      { name: 'Inside Oven', icon: 'Flame', price: 25, selected: false },
      { name: 'Inside Fridge', icon: 'Snowflake', price: 20, selected: false },
      { name: 'Carpet Shampoo', icon: 'Sparkles', price: 50, selected: false },
    ]);
    await insertEmployees(client, o3, ['Ana Lopez', 'Emma Wilson', 'James Rodriguez']);

    // ── Order #2860 — James Whitfield — Standard clean ───────────────────────
    const o4 = await insertOrder(client, {
      orderNumber: '2860', clientName: 'James Whitfield', clientEmail: 'james.w@email.com',
      address: '14 Birchwood Lane, Apt 4D', phone: '+1 (555) 418-7260',
      status: 'scheduled', date: '2026-04-08', time: '08:30 AM',
      serviceType: 'Standard clean',
      specialInstructions: 'Focus on kitchen and bathrooms.',
      accessInfo: 'Doorbell code: 1234',
      goal: 'Weekly maintenance clean',
    });
    await insertSections(client, o4, [
      { name: 'Kitchen', icon: 'ChefHat', time: 35, todos: [
        'Wipe countertops and backsplash', 'Clean stovetop', 'Clean sink and faucet', 'Mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 25, todos: [
        'Sanitize toilet', 'Clean shower and tiles', 'Wipe sink and mirror', 'Mop floor',
      ]},
    ]);
    await insertAddOns(client, o4, [
      { name: 'Inside Oven', icon: 'Flame', price: 25, selected: false },
    ]);
    await insertEmployees(client, o4, ['Maria Garcia']);

    // ── Order #2863 — Priya Nair — Deep clean ────────────────────────────────
    const o5 = await insertOrder(client, {
      orderNumber: '2863', clientName: 'Priya Nair', clientEmail: 'priya.n@email.com',
      address: '501 Elmwood Ave, Unit 2', phone: '+1 (555) 539-4187',
      status: 'scheduled', date: '2026-04-09', time: '10:00 AM',
      serviceType: 'Deep clean',
      specialInstructions: 'New client — extra attention to detail.',
      accessInfo: 'Key in lockbox: #9182',
      goal: 'First-time deep clean',
    });
    await insertSections(client, o5, [
      { name: 'Kitchen', icon: 'ChefHat', time: 50, todos: [
        'Deep clean appliances exterior', 'Scrub countertops', 'Clean sink and faucet',
        'Sweep and mop floor', 'Empty trash',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 40, todos: [
        'Scrub toilet inside and out', 'Clean shower and glass door',
        'Remove soap scum from tiles', 'Clean sink and mirror', 'Mop floor',
      ]},
      { name: 'Bedroom', icon: 'Bed', time: 30, todos: [
        'Change bed linens', 'Dust all surfaces', 'Vacuum floor',
      ]},
      { name: 'Living Room', icon: 'Sofa', time: 25, todos: [
        'Dust surfaces and shelves', 'Vacuum sofa', 'Vacuum floor',
      ]},
    ]);
    await insertAddOns(client, o5, [
      { name: 'Inside Fridge', icon: 'Snowflake', price: 20, selected: false },
      { name: 'Laundry', icon: 'Shirt', price: 30, selected: false },
    ]);
    await insertEmployees(client, o5, ['Carlos Ruiz', 'Ana Lopez']);

    // ── Order #2867 — Carlos Reyes — Standard clean ──────────────────────────
    const o6 = await insertOrder(client, {
      orderNumber: '2867', clientName: 'Carlos Reyes', clientEmail: 'carlos.r@email.com',
      address: '88 Maplewood Court, Suite 1', phone: '+1 (555) 762-0394',
      status: 'scheduled', date: '2026-04-12', time: '01:00 PM',
      serviceType: 'Standard clean',
      accessInfo: 'Open door — client works from home',
      goal: 'Bi-weekly routine clean',
    });
    await insertSections(client, o6, [
      { name: 'Kitchen', icon: 'ChefHat', time: 30, todos: ['Wipe countertops', 'Clean sink', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Sanitize toilet', 'Clean shower', 'Mop floor'] },
      { name: 'Living Room', icon: 'Sofa', time: 20, todos: ['Dust surfaces', 'Vacuum floor'] },
    ]);
    await insertEmployees(client, o6, ['James Rodriguez']);

    // ── Order #2871 — Natalie Brooks — Move-in clean ─────────────────────────
    const o7 = await insertOrder(client, {
      orderNumber: '2871', clientName: 'Natalie Brooks', clientEmail: 'natalie.b@email.com',
      address: '220 Cedar Street, Apt 7F', phone: '+1 (555) 183-6742',
      status: 'scheduled', date: '2026-04-14', time: '09:00 AM',
      serviceType: 'Move-in clean',
      specialInstructions: 'New tenant moving in. Property was vacant for 2 months.',
      accessInfo: 'Key at front desk, ask for Luis',
      goal: 'Sanitize and freshen entire unit',
    });
    await insertSections(client, o7, [
      { name: 'Kitchen', icon: 'ChefHat', time: 55, todos: [
        'Deep clean all appliances', 'Wipe inside cabinets', 'Scrub countertops',
        'Clean sink and faucet', 'Mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 40, todos: [
        'Disinfect toilet', 'Scrub shower and tub', 'Clean tiles',
        'Clean sink and mirror', 'Mop floor',
      ]},
      { name: 'Bedroom', icon: 'Bed', time: 30, todos: [
        'Wipe inside closets', 'Dust all surfaces', 'Vacuum floor',
      ]},
    ]);
    await insertAddOns(client, o7, [
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: false },
      { name: 'Inside Oven', icon: 'Flame', price: 25, selected: false },
    ]);
    await insertEmployees(client, o7, ['Emma Wilson', 'Maria Garcia']);

    // ═══════════════════════════════════════════════════════════════════════════
    // IN-PROGRESS ORDERS
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Order #2839 — David Chen — Standard clean (in progress) ──────────────
    const o8 = await insertOrder(client, {
      orderNumber: '2839', clientName: 'David Chen', clientEmail: 'david.c@email.com',
      address: '303 Pine Avenue, Apt 2C', phone: '+1 (555) 294-8103',
      status: 'in-progress', date: '2026-04-07', time: '11:00 AM',
      serviceType: 'Standard clean',
      specialInstructions: 'Be quiet — baby sleeping in second bedroom.',
      accessInfo: 'Smart lock code: 7291',
      goal: 'Fresh and tidy for family',
      startedAt: ts('2026-04-07T11:00:00'),
    });
    await insertSections(client, o8, [
      { name: 'Kitchen', icon: 'ChefHat', time: 30, completed: false, todos: [
        ['Wipe down countertops', true] as TodoRow,
        ['Clean stovetop', true] as TodoRow,
        ['Clean sink and faucet', false] as TodoRow,
        ['Sweep and mop floor', false] as TodoRow,
      ]},
      { name: 'Main Bathroom', icon: 'Bath', time: 25, completed: false, todos: [
        'Sanitize toilet', 'Clean shower', 'Wipe sink and mirror', 'Mop floor',
      ]},
      { name: 'Living Room', icon: 'Sofa', time: 20, completed: false, todos: [
        'Dust surfaces', 'Vacuum floor and sofa', 'Clean windows',
      ]},
    ]);
    await insertAddOns(client, o8, [
      { name: 'Laundry', icon: 'Shirt', price: 30, selected: true },
    ]);
    await insertEmployees(client, o8, ['Ana Lopez']);

    // ── Order #2843 — Robert Kim — Deep clean (in progress, further along) ───
    const o9 = await insertOrder(client, {
      orderNumber: '2843', clientName: 'Robert Kim', clientEmail: 'robert.kim@email.com',
      address: '730 Westside Ave, Unit 12', phone: '+1 (555) 310-8824',
      status: 'in-progress', date: '2026-04-07', time: '09:00 AM',
      serviceType: 'Deep clean',
      specialInstructions: 'Focus on master bathroom — heavy buildup.',
      accessInfo: 'Garage code: 5523',
      goal: 'Thorough deep clean, especially wet areas',
      startedAt: ts('2026-04-07T09:00:00'),
    });
    await insertSections(client, o9, [
      { name: 'Kitchen', icon: 'ChefHat', time: 50, completed: true, todos: [
        ['Deep clean stovetop and oven exterior', true] as TodoRow,
        ['Scrub countertops', true] as TodoRow,
        ['Clean sink and faucet', true] as TodoRow,
        ['Mop floor', true] as TodoRow,
        ['Empty trash', true] as TodoRow,
      ]},
      { name: 'Master Bathroom', icon: 'Bath', time: 45, completed: false, todos: [
        ['Scrub toilet inside and out', true] as TodoRow,
        ['Remove soap scum from shower', false] as TodoRow,
        ['Clean all tiles and grout', false] as TodoRow,
        ['Polish mirror and vanity', false] as TodoRow,
        ['Mop floor', false] as TodoRow,
      ]},
      { name: 'Guest Bathroom', icon: 'Bath', time: 25, completed: false, todos: [
        'Sanitize toilet', 'Clean sink and mirror', 'Mop floor',
      ]},
      { name: 'Bedrooms', icon: 'Bed', time: 30, completed: false, todos: [
        'Change all bed linens', 'Dust all surfaces', 'Vacuum floors',
      ]},
    ]);
    await insertAddOns(client, o9, [
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: true },
      { name: 'Inside Fridge', icon: 'Snowflake', price: 20, selected: false },
    ]);
    await insertEmployees(client, o9, ['Carlos Ruiz', 'Emma Wilson']);

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPLETED ORDERS
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Order #2831 — Olivia Thompson — Deep clean (completed) ───────────────
    const o10 = await insertOrder(client, {
      orderNumber: '2831', clientName: 'Olivia Thompson', clientEmail: 'olivia.t@email.com',
      address: '77 River Road, Apt 1A', phone: '+1 (555) 847-2016',
      status: 'completed', date: '2026-04-04', time: '09:00 AM',
      serviceType: 'Deep clean',
      goal: 'Thorough cleaning after renovation',
      startedAt: ts('2026-04-04T09:00:00'),
      completedAt: ts('2026-04-04T10:27:00'),
    });
    await insertSections(client, o10, [
      { name: 'Kitchen', icon: 'ChefHat', time: 45, completed: true, todos: [
        'Wipe down countertops', 'Clean stovetop', 'Clean sink', 'Mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 30, completed: true, todos: [
        'Sanitize toilet', 'Clean shower', 'Mop floor',
      ]},
    ]);
    await insertAddOns(client, o10, [
      { name: 'Window Cleaning', icon: 'Sparkles', price: 35, selected: true },
    ]);
    await insertEmployees(client, o10, ['Ana Lopez']);

    // ── Order #2825 — Lucas Rivera — Quick clean (completed) ─────────────────
    const o11 = await insertOrder(client, {
      orderNumber: '2825', clientName: 'Lucas Rivera', clientEmail: 'lucas.r@email.com',
      address: '33 Oak Street, Unit 5', phone: '+1 (555) 630-5928',
      status: 'completed', date: '2026-04-03', time: '02:00 PM',
      serviceType: 'Quick clean',
      startedAt: ts('2026-04-03T14:00:00'),
      completedAt: ts('2026-04-03T14:32:00'),
    });
    await insertSections(client, o11, [
      { name: 'Kitchen', icon: 'ChefHat', time: 15, completed: true, todos: [
        'Wipe countertops', 'Clean sink', 'Sweep floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 15, completed: true, todos: [
        'Clean toilet', 'Wipe mirror',
      ]},
    ]);
    await insertEmployees(client, o11, ['James Rodriguez']);

    // ── Order #2819 — Sophia Martinez — Standard clean (completed) ───────────
    const o12 = await insertOrder(client, {
      orderNumber: '2819', clientName: 'Sophia Martinez', clientEmail: 'sophia.m2@email.com',
      address: '120 Elm Avenue, Apt 8C', phone: '+1 (555) 672-1935',
      status: 'completed', date: '2026-04-02', time: '10:00 AM',
      serviceType: 'Standard clean',
      startedAt: ts('2026-04-02T10:00:00'),
      completedAt: ts('2026-04-02T11:02:00'),
    });
    await insertSections(client, o12, [
      { name: 'Kitchen', icon: 'ChefHat', time: 20, completed: true, todos: [
        'Wipe countertops and backsplash', 'Clean stovetop', 'Clean sink and faucet', 'Mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 20, completed: true, todos: [
        'Sanitize toilet', 'Clean shower', 'Clean sink and mirror', 'Mop floor',
      ]},
      { name: 'Bedroom', icon: 'Bed', time: 15, completed: true, todos: [
        'Change bed linens', 'Dust furniture', 'Vacuum floor',
      ]},
    ]);
    await insertEmployees(client, o12, ['Maria Garcia']);

    // ── Order #2812 — James Wilson — Move-out clean (completed) ──────────────
    const o13 = await insertOrder(client, {
      orderNumber: '2812', clientName: 'James Wilson', clientEmail: 'james.wilson@email.com',
      address: '88 Pine Court, Suite 2B', phone: '+1 (555) 415-3087',
      status: 'completed', date: '2026-04-01', time: '01:00 PM',
      serviceType: 'Move-out clean',
      specialInstructions: 'Empty apartment, clean all surfaces thoroughly.',
      startedAt: ts('2026-04-01T13:00:00'),
      completedAt: ts('2026-04-01T14:28:00'),
    });
    await insertSections(client, o13, [
      { name: 'Kitchen', icon: 'ChefHat', time: 30, completed: true, todos: [
        'Deep clean oven interior', 'Clean inside cabinets', 'Scrub countertops',
        'Clean sink and faucet', 'Mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 25, completed: true, todos: [
        'Deep clean toilet', 'Scrub shower tiles', 'Clean vanity and mirror', 'Mop floor',
      ]},
      { name: 'Living Room', icon: 'Sofa', time: 20, completed: true, todos: [
        'Dust all surfaces', 'Clean windows interior', 'Vacuum and mop floor',
      ]},
    ]);
    await insertAddOns(client, o13, [
      { name: 'Wall spot cleaning', icon: 'Paintbrush', price: 25, selected: true },
    ]);
    await insertEmployees(client, o13, ['Emma Wilson', 'Carlos Ruiz']);

    // ── Order #2803 — Angela Foster — Deep clean (completed, older) ──────────
    const o14 = await insertOrder(client, {
      orderNumber: '2803', clientName: 'Angela Foster', clientEmail: 'angela.f@email.com',
      address: '14 Hillside Drive, Unit 3', phone: '+1 (555) 720-3341',
      status: 'completed', date: '2026-03-31', time: '11:00 AM',
      serviceType: 'Deep clean',
      goal: 'Post-party deep clean',
      startedAt: ts('2026-03-31T11:00:00'),
      completedAt: ts('2026-03-31T13:05:00'),
    });
    await insertSections(client, o14, [
      { name: 'Kitchen', icon: 'ChefHat', time: 45, completed: true, todos: [
        'Clean all surfaces', 'Clean appliances', 'Mop floor', 'Empty trash',
      ]},
      { name: 'Living Room', icon: 'Sofa', time: 35, completed: true, todos: [
        'Vacuum all furniture and floors', 'Dust shelves', 'Clean windows',
      ]},
      { name: 'Bathrooms', icon: 'Bath', time: 30, completed: true, todos: [
        'Deep clean all fixtures', 'Sanitize thoroughly', 'Mop floors',
      ]},
    ]);
    await insertEmployees(client, o14, ['Ana Lopez', 'Maria Garcia']);

    // ── Order #2795 — Michael Torres — Standard clean (completed, older) ─────
    const o15 = await insertOrder(client, {
      orderNumber: '2795', clientName: 'Michael Torres', clientEmail: 'michael.t@email.com',
      address: '567 Lakewood Ave, Apt 5C', phone: '+1 (555) 884-9123',
      status: 'completed', date: '2026-03-29', time: '10:00 AM',
      serviceType: 'Standard clean',
      startedAt: ts('2026-03-29T10:00:00'),
      completedAt: ts('2026-03-29T11:15:00'),
    });
    await insertSections(client, o15, [
      { name: 'Kitchen', icon: 'ChefHat', time: 20, completed: true, todos: [
        'Wipe countertops', 'Clean sink', 'Mop floor',
      ]},
      { name: 'Bathroom', icon: 'Bath', time: 20, completed: true, todos: [
        'Sanitize toilet', 'Clean shower', 'Clean sink', 'Mop floor',
      ]},
      { name: 'Bedroom', icon: 'Bed', time: 15, completed: true, todos: [
        'Dust surfaces', 'Vacuum floor',
      ]},
    ]);
    await insertEmployees(client, o15, ['James Rodriguez']);

    // ═══════════════════════════════════════════════════════════════════════════
    // CANCELED ORDER
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Order #2878 — Diana Prince — Standard clean (canceled) ───────────────
    const o16 = await insertOrder(client, {
      orderNumber: '2878', clientName: 'Diana Prince', clientEmail: 'diana.p@email.com',
      address: '999 Highland Park, Suite 8', phone: '+1 (555) 601-2234',
      status: 'canceled', date: '2026-04-06', time: '03:00 PM',
      serviceType: 'Standard clean',
      specialInstructions: 'Client canceled — schedule conflict.',
    });
    await insertSections(client, o16, [
      { name: 'Kitchen', icon: 'ChefHat', time: 30, todos: ['Wipe countertops', 'Clean sink', 'Mop floor'] },
      { name: 'Bathroom', icon: 'Bath', time: 20, todos: ['Sanitize toilet', 'Clean shower'] },
    ]);
    await insertEmployees(client, o16, ['Ana Lopez']);

    await client.query('COMMIT');

    console.log('✓ Seed complete — 16 orders, 2 users inserted');
    console.log('  Scheduled: 7  |  In-progress: 2  |  Completed: 6  |  Canceled: 1');
    console.log('\nDashboard login: admin@sparktask.com / admin123');
    console.log('Mobile demo login: demo@demo.com / demo');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
