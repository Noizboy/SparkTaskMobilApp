export interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
}

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Regular Cleaning',
    description: 'Standard recurring cleaning service for homes and offices',
    duration: '2 hours',
  },
  {
    id: '2',
    name: 'Deep Cleaning',
    description: 'Thorough and intensive cleaning for all areas',
    duration: '4 hours',
  },
  {
    id: '3',
    name: 'Welcome Baby Cleaning',
    description: 'Specialized deep cleaning for expecting parents',
    duration: '5 hours',
  },
  {
    id: '4',
    name: 'Garage Cleaning',
    description: 'Complete garage organization and cleaning service',
    duration: '3 hours',
  },
  {
    id: '5',
    name: 'Move In/Out Cleaning',
    description: 'Thorough cleaning for moving transitions',
    duration: '4 hours',
  },
  {
    id: '6',
    name: 'Post-Construction Cleaning',
    description: 'Deep cleaning after construction or renovation',
    duration: '6 hours',
  },
  {
    id: '7',
    name: 'Office Cleaning',
    description: 'Professional cleaning for office spaces',
    duration: '4 hours',
  },
  {
    id: '8',
    name: 'Carpet & Upholstery Cleaning',
    description: 'Deep cleaning for carpets and furniture',
    duration: '3 hours',
  },
  {
    id: '9',
    name: 'Window Cleaning',
    description: 'Interior and exterior window cleaning',
    duration: '2 hours',
  },
  {
    id: '10',
    name: 'Airbnb Turnover Cleaning',
    description: 'Fast and thorough cleaning between guest stays',
    duration: '2 hours',
  },
];

export function getServiceByName(name: string): Service | undefined {
  return mockServices.find(service => service.name === name);
}