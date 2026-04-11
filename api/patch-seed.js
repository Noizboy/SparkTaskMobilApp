const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'src', 'seed.ts');
let content = fs.readFileSync(seedPath, 'utf8');

// ─── 1. Insert the area-loading helper after the areas loop ───────────────

const helperCode = `
    // ─── Load area templates for building order sections ───────────────────
    const areasResult = await client.query(\`
      SELECT a.name, a.estimated_duration,
             json_agg(json_build_object('text', aci.text) ORDER BY aci.sort_order) as items
      FROM areas a
      JOIN area_checklist_items aci ON aci.area_id = a.id
      WHERE a.business_id = $1
      GROUP BY a.id, a.name, a.estimated_duration
    \`, [adminId]);

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
`;

// Find the end of the areas loop — look for the closing of the for loop that inserts area_checklist_items
// The pattern is: the line with `[areaId, area.items[i], i]` followed by closing braces
const areasLoopEndPattern = /(\[areaId, area\.items\[i\], i\]\s*\);\s*\}\s*\})/;
const match = content.match(areasLoopEndPattern);
if (!match) {
  console.error('Could not find areas loop end');
  process.exit(1);
}
const insertPos = match.index + match[0].length;
content = content.slice(0, insertPos) + '\n' + helperCode + content.slice(insertPos);
console.log('✓ Inserted helper code after areas loop');

// ─── 2. Replace all insertSections calls for original orders (o1-o10) ─────

// Order #3001 — scheduled, 4 areas
content = content.replace(
  /await insertSections\(client, o1, \[[\s\S]*?\]\);\s*\n(\s*await insertAddOns\(client, o1)/,
  `await insertSections(client, o1, sectionsFromAreas(['Kitchen', 'Bathroom', 'Master Bedroom', 'Living Room']));\n$1`
);
console.log('✓ Updated order #3001');

// Order #3002 — scheduled, 3 areas
content = content.replace(
  /await insertSections\(client, o2, \[[\s\S]*?\]\);\s*\n(\s*await insertAddOns\(client, o2)/,
  `await insertSections(client, o2, sectionsFromAreas(['Kitchen', 'Bathroom', 'Living Room']));\n$1`
);
console.log('✓ Updated order #3002');

// Order #3003 — scheduled, 3 areas
content = content.replace(
  /await insertSections\(client, o3, \[[\s\S]*?\]\);\s*\n(\s*await insertAddOns\(client, o3)/,
  `await insertSections(client, o3, sectionsFromAreas(['Kitchen', 'Bathroom', 'Bedroom']));\n$1`
);
console.log('✓ Updated order #3003');

// Order #3004 — in-progress, partial: Kitchen 2/6 done
content = content.replace(
  /await insertSections\(client, o4, \[[\s\S]*?\]\);\s*\n(\s*await insertAddOns\(client, o4)/,
  `await insertSections(client, o4, sectionsFromAreas(['Kitchen', 'Bathroom', 'Living Room'], { partial: [{ area: 'Kitchen', doneTodos: 2 }] }));\n$1`
);
console.log('✓ Updated order #3004');

// Order #3005 — in-progress: Kitchen all done (6/6), Bathroom partial (1/6)
content = content.replace(
  /await insertSections\(client, o5, \[[\s\S]*?\]\);\s*\n(\s*await insertAddOns\(client, o5)/,
  `await insertSections(client, o5, sectionsFromAreas(['Kitchen', 'Bathroom', 'Master Bedroom', 'Bedroom'], { partial: [{ area: 'Kitchen', doneTodos: 6 }, { area: 'Bathroom', doneTodos: 1 }] }));\n$1`
);
console.log('✓ Updated order #3005');

// Order #3006 — completed
content = content.replace(
  /await insertSections\(client, o6, \[[\s\S]*?\]\);\s*\n(\s*await insertAddOns\(client, o6)/,
  `await insertSections(client, o6, sectionsFromAreas(['Kitchen', 'Bathroom', 'Living Room'], { completed: true }));\n$1`
);
console.log('✓ Updated order #3006');

// Order #3007 — completed
content = content.replace(
  /await insertSections\(client, o7, \[[\s\S]*?\]\);\s*\n(\s*await insertEmployees\(client, o7)/,
  `await insertSections(client, o7, sectionsFromAreas(['Kitchen', 'Bathroom'], { completed: true }));\n$1`
);
console.log('✓ Updated order #3007');

// Order #3008 — completed
content = content.replace(
  /await insertSections\(client, o8, \[[\s\S]*?\]\);\s*\n(\s*await insertAddOns\(client, o8)/,
  `await insertSections(client, o8, sectionsFromAreas(['Kitchen', 'Bathroom', 'Living Room'], { completed: true }));\n$1`
);
console.log('✓ Updated order #3008');

// Order #3009 — completed
content = content.replace(
  /await insertSections\(client, o9, \[[\s\S]*?\]\);\s*\n(\s*await insertEmployees\(client, o9)/,
  `await insertSections(client, o9, sectionsFromAreas(['Kitchen', 'Bathroom'], { completed: true }));\n$1`
);
console.log('✓ Updated order #3009');

// Order #3010 — canceled
content = content.replace(
  /await insertSections\(client, o10, \[[\s\S]*?\]\);\s*\n(\s*await insertEmployees\(client, o10)/,
  `await insertSections(client, o10, sectionsFromAreas(['Kitchen', 'Bathroom']));\n$1`
);
console.log('✓ Updated order #3010');

// ─── 3. Replace quickOrder sections for orders #3011-#3041 ─────────────────
// Each quickOrder has this pattern: quickOrder('30XX', client, { ... }, [ ...sections... ], ['employees']);
// We need to replace the sections array with sectionsFromAreas(...)

// Define area assignments for each additional order
const quickOrderAreas = {
  '3011': { areas: ['Kitchen', 'Bathroom', 'Living Room'], completed: true },
  '3012': { areas: ['Kitchen', 'Bathroom', 'Bedroom'], completed: true },
  '3013': { areas: ['Kitchen', 'Dining Room', 'Bathroom'], completed: true },
  '3014': { areas: ['Kitchen', 'Bathroom', 'Bedroom'], completed: true },
  '3015': { areas: ['Kitchen', 'Bathroom'], completed: false },
  '3016': { areas: ['Kitchen', 'Bathroom', 'Bedroom'], completed: true },
  '3017': { areas: ['Kitchen', 'Bathroom'], completed: true },
  '3018': { areas: ['Kitchen', 'Bathroom', 'Living Room'], completed: true },
  '3019': { areas: ['Kitchen', 'Bathroom', 'Bedroom'], completed: true },
  '3020': { areas: ['Kitchen', 'Bathroom'], completed: false },
  '3021': { areas: ['Kitchen', 'Bathroom', 'Living Room'], completed: false },
  '3022': { areas: ['Kitchen', 'Bathroom', 'Bedroom'], completed: false },
  '3023': { areas: ['Kitchen', 'Bathroom'], completed: false },
  '3024': { areas: ['Kitchen', 'Dining Room', 'Bathroom'], completed: false },
  '3025': { areas: ['Kitchen', 'Bathroom', 'Bedroom'], completed: false },
  '3026': { areas: ['Kitchen', 'Bathroom', 'Living Room', 'Bedroom'], completed: false },
  '3027': { areas: ['Kitchen', 'Bathroom'], completed: false },
  '3028': { areas: ['Kitchen', 'Bathroom', 'Living Room'], completed: false },
  '3029': { areas: ['Kitchen', 'Bathroom', 'Bedroom'], completed: false },
  '3030': { areas: ['Kitchen', 'Dining Room', 'Bathroom'], completed: false },
  '3031': { areas: ['Kitchen', 'Bathroom', 'Living Room'], completed: false },
  '3032': { areas: ['Kitchen', 'Bathroom', 'Dining Room', 'Living Room'], completed: false },
  '3033': { areas: ['Kitchen', 'Bathroom'], completed: false },
  '3034': { areas: ['Kitchen', 'Bathroom', 'Bedroom', 'Living Room'], completed: false },
  '3035': { areas: ['Kitchen', 'Bathroom', 'Bedroom'], completed: false },
  '3036': { areas: ['Kitchen', 'Bathroom', 'Bedroom', 'Living Room'], completed: false },
  '3037': { areas: ['Kitchen', 'Bathroom'], completed: false },
  '3038': { areas: ['Kitchen', 'Dining Room', 'Bathroom'], completed: false },
  '3039': { areas: ['Kitchen', 'Bathroom', 'Bedroom'], completed: false },
  '3040': { areas: ['Kitchen', 'Bathroom', 'Living Room'], completed: false },
  '3041': { areas: ['Kitchen', 'Bathroom', 'Bedroom'], completed: false },
};

for (const [orderNum, config] of Object.entries(quickOrderAreas)) {
  // Match quickOrder('30XX', client, { ... }, [ ...sections... ], ['employees']);
  // We need to replace the sections array [ ... ] that comes after the order data object }
  const escapedNum = orderNum.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Pattern: find quickOrder('30XX', client, { ...orderData... }, [ ...sections... ], [
  // The sections array starts after "}, [" and ends before "], ["
  const pattern = new RegExp(
    `(quickOrder\\('${escapedNum}', client, \\{[\\s\\S]*?\\}, )\\[[\\s\\S]*?\\](, \\[)`,
  );
  
  const areasStr = JSON.stringify(config.areas);
  let replacement;
  if (config.completed) {
    replacement = `$1sectionsFromAreas(${areasStr}, { completed: true })$2`;
  } else {
    replacement = `$1sectionsFromAreas(${areasStr})$2`;
  }
  
  const before = content.length;
  content = content.replace(pattern, replacement);
  if (content.length === before) {
    console.error(`✗ Failed to update order #${orderNum}`);
  } else {
    console.log(`✓ Updated order #${orderNum}`);
  }
}

fs.writeFileSync(seedPath, content, 'utf8');
console.log('\n✓ Seed file patched successfully');
