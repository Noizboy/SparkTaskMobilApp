export interface Area {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // minutes
  checklist: string[];
}

let areas: Area[] = [
  {
    id: '1',
    name: 'Kitchen',
    description: 'Complete kitchen area cleaning',
    estimatedDuration: 40,
    checklist: [
      'Clean counters and surfaces',
      'Clean sink',
      'Clean stove and hood',
      'Clean appliances exteriors',
      'Sweep and mop floor',
      'Empty trash',
    ]
  },
  {
    id: '2',
    name: 'Bathroom',
    description: 'Bathroom cleaning and disinfection',
    estimatedDuration: 25,
    checklist: [
      'Clean and disinfect toilet',
      'Clean sink and faucet',
      'Clean shower/bathtub',
      'Clean mirrors',
      'Sweep and mop floor',
      'Refill supplies',
    ]
  },
  {
    id: '3',
    name: 'Bedroom',
    description: 'General bedroom cleaning',
    estimatedDuration: 20,
    checklist: [
      'Make the bed',
      'Dust surfaces',
      'Clean mirrors',
      'Organize items',
      'Vacuum',
    ]
  },
  {
    id: '4',
    name: 'Living Room',
    description: 'Living room and common areas',
    estimatedDuration: 25,
    checklist: [
      'Dust all surfaces',
      'Vacuum carpet/floor',
      'Clean windows',
      'Organize items',
      'Empty trash',
    ]
  },
  {
    id: '5',
    name: 'Dining Room',
    description: 'Dining area cleaning',
    estimatedDuration: 15,
    checklist: [
      'Clean table and chairs',
      'Dust surfaces',
      'Vacuum/mop floor',
      'Clean windows',
    ]
  },
  {
    id: '6',
    name: 'Master Bedroom',
    description: 'Master bedroom deep cleaning',
    estimatedDuration: 30,
    checklist: [
      'Make the bed',
      'Dust all surfaces',
      'Clean mirrors',
      'Organize closet',
      'Vacuum thoroughly',
    ]
  },
  {
    id: '7',
    name: 'Laundry',
    description: 'Laundry room cleaning',
    estimatedDuration: 12,
    checklist: [
      'Clean washer and dryer',
      'Wipe down surfaces',
      'Sweep and mop floor',
      'Organize supplies',
    ]
  },
];

export function getAreas(): Area[] {
  return [...areas];
}

export function getAreaById(id: string): Area | undefined {
  return areas.find(a => a.id === id);
}

export function getAreaByName(name: string): Area | undefined {
  return areas.find(a => a.name === name);
}

export function createArea(area: Omit<Area, 'id'>): Area {
  const newArea: Area = {
    ...area,
    id: Date.now().toString(),
  };
  areas.push(newArea);
  return newArea;
}

export function updateArea(id: string, updates: Partial<Omit<Area, 'id'>>): Area | undefined {
  const index = areas.findIndex(a => a.id === id);
  if (index === -1) return undefined;
  
  areas[index] = {
    ...areas[index],
    ...updates,
  };
  return areas[index];
}

export function deleteArea(id: string): boolean {
  const initialLength = areas.length;
  areas = areas.filter(a => a.id !== id);
  return areas.length < initialLength;
}
