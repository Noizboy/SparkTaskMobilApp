export interface Addon {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
}

let addons: Addon[] = [
  {
    id: '1',
    name: 'Microwave',
    description: 'Deep cleaning inside and outside microwave',
    estimatedTime: '15 min',
  },
  {
    id: '2',
    name: 'Refrigerator',
    description: 'Clean inside and outside refrigerator',
    estimatedTime: '30 min',
  },
  {
    id: '3',
    name: 'Oven',
    description: 'Deep clean oven interior and exterior',
    estimatedTime: '45 min',
  },
  {
    id: '4',
    name: 'Windows',
    description: 'Clean windows inside and outside',
    estimatedTime: '20 min per window',
  },
  {
    id: '5',
    name: 'Balcony',
    description: 'Sweep and clean balcony area',
    estimatedTime: '25 min',
  },
  {
    id: '6',
    name: 'Cabinets',
    description: 'Clean inside and outside cabinets',
    estimatedTime: '30 min',
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