export interface Addon {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // minutes
}

let addons: Addon[] = [
  {
    id: '1',
    name: 'Microwave',
    description: 'Deep cleaning inside and outside microwave',
    estimatedDuration: 15,
  },
  {
    id: '2',
    name: 'Refrigerator',
    description: 'Clean inside and outside refrigerator',
    estimatedDuration: 30,
  },
  {
    id: '3',
    name: 'Oven',
    description: 'Deep clean oven interior and exterior',
    estimatedDuration: 45,
  },
  {
    id: '4',
    name: 'Windows',
    description: 'Clean windows inside and outside',
    estimatedDuration: 20,
  },
  {
    id: '5',
    name: 'Balcony',
    description: 'Sweep and clean balcony area',
    estimatedDuration: 25,
  },
  {
    id: '6',
    name: 'Cabinets',
    description: 'Clean inside and outside cabinets',
    estimatedDuration: 30,
  },
];

export function getAddons(): Addon[] {
  return [...addons];
}

export function getAddonById(id: string): Addon | undefined {
  return addons.find(a => a.id === id);
}

export function getAddonByName(name: string): Addon | undefined {
  return addons.find(a => a.name === name);
}

export function createAddon(addon: Omit<Addon, 'id'>): Addon {
  const newAddon: Addon = {
    ...addon,
    id: Date.now().toString(),
  };
  addons.push(newAddon);
  return newAddon;
}

export function updateAddon(id: string, updates: Partial<Omit<Addon, 'id'>>): Addon | undefined {
  const index = addons.findIndex(a => a.id === id);
  if (index === -1) return undefined;
  
  addons[index] = {
    ...addons[index],
    ...updates,
  };
  return addons[index];
}

export function deleteAddon(id: string): boolean {
  const initialLength = addons.length;
  addons = addons.filter(a => a.id !== id);
  return addons.length < initialLength;
}