export interface ServiceType {
  id: string;
  name: string;
  description: string;
}

let serviceTypes: ServiceType[] = [
  {
    id: '1',
    name: 'Regular Cleaning',
    description: 'Standard cleaning service for residential and commercial properties',
  },
  {
    id: '2',
    name: 'Deep Cleaning',
    description: 'Thorough cleaning including hard-to-reach areas and detailed work',
  },
  {
    id: '3',
    name: 'Move-out Cleaning',
    description: 'Complete cleaning service for properties after tenants move out',
  },
  {
    id: '4',
    name: 'Post-Construction Cleaning',
    description: 'Specialized cleaning after construction or renovation work',
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
