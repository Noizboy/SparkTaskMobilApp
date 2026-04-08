export interface ServiceType {
  id: string;
  name: string;
  description: string;
}

let serviceTypes: ServiceType[] = [
  {
    id: '1',
    name: 'Regular Cleaning',
    description: 'Standard recurring cleaning service for homes and offices',
  },
  {
    id: '2',
    name: 'Deep Cleaning',
    description: 'Thorough and intensive cleaning for all areas including hard-to-reach spots',
  },
  {
    id: '3',
    name: 'Move-in Cleaning',
    description: 'Full sanitization and deep clean for new tenants moving in',
  },
  {
    id: '4',
    name: 'Move-out Cleaning',
    description: 'Complete cleaning service for properties after tenants move out',
  },
  {
    id: '5',
    name: 'Quick Cleaning',
    description: 'Fast surface-level tidy-up for small spaces or touch-ups',
  },
  {
    id: '6',
    name: 'Office Cleaning',
    description: 'Professional cleaning for office and commercial spaces',
  },
  {
    id: '7',
    name: 'Post-Construction Cleaning',
    description: 'Specialized deep cleaning after construction or renovation work',
  },
];

export function getServiceTypes(): ServiceType[] {
  return [...serviceTypes];
}

export function getServiceTypeById(id: string): ServiceType | undefined {
  return serviceTypes.find(st => st.id === id);
}

export function createServiceType(serviceType: Omit<ServiceType, 'id'>): ServiceType {
  const newServiceType: ServiceType = {
    ...serviceType,
    id: Date.now().toString(),
  };
  serviceTypes.push(newServiceType);
  return newServiceType;
}

export function updateServiceType(id: string, updates: Partial<Omit<ServiceType, 'id'>>): ServiceType | undefined {
  const index = serviceTypes.findIndex(st => st.id === id);
  if (index === -1) return undefined;
  
  serviceTypes[index] = {
    ...serviceTypes[index],
    ...updates,
  };
  return serviceTypes[index];
}

export function deleteServiceType(id: string): boolean {
  const initialLength = serviceTypes.length;
  serviceTypes = serviceTypes.filter(st => st.id !== id);
  return serviceTypes.length < initialLength;
}
