// Unified Order schema — compatible with mobile app's Job type
// Field names match the app so both systems can share the same DB records.

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export interface Section {
  id: string;
  name: string;
  icon: string;
  completed: boolean;
  beforePhotos: string[];
  afterPhotos: string[];
  todos: Todo[];
  skipReason?: string;
  estimatedTime?: string;
}

export interface AddOn {
  id: string;
  name: string;
  icon: string;
  price?: number;
  selected: boolean;
  skipReason?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  address: string;
  phone: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'canceled';
  date: string;            // ISO format: YYYY-MM-DD
  time: string;            // e.g. "10:00 AM"
  serviceType: string;
  duration: string;
  assignedEmployees: string[];
  sections: Section[];
  addOns: AddOn[];
  specialInstructions?: string;
  accessInfo?: string;
  goal?: string;
  startedAt?: number;
  completedAt?: number;
  propertyDetails?: {
    bedrooms: number;
    bathrooms: number;
    kitchens: number;
    livingRooms: number;
    garages: number;
    other?: string;
  };
}

// Helper: compute progress from sections
/** Returns { completed, total } counting todos + add-ons, matching mobile app logic */
export function getOrderTaskCounts(order: Order): { completed: number; total: number } {
  const todoTotal = order.sections.reduce((sum, s) => sum + s.todos.length, 0);
  const todoDone = order.sections.reduce(
    (sum, s) => sum + s.todos.filter(t => t.completed).length, 0
  );
  const addOnTotal = order.addOns?.length ?? 0;
  const addOnDone = order.addOns?.filter(a => a.selected).length ?? 0;
  return { completed: todoDone + addOnDone, total: todoTotal + addOnTotal };
}

export function getOrderProgress(order: Order): number {
  const { completed, total } = getOrderTaskCounts(order);
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: '#89456',
    clientName: 'Michael Johnson',
    clientEmail: 'michael.j@email.com',
    address: '350 Fifth Avenue, New York, NY 10118',
    phone: '+1 (555) 123-4567',
    status: 'scheduled',
    date: '2025-11-25',
    time: '10:00 AM',
    serviceType: 'Deep Office Cleaning',
    duration: '4 hours',
    assignedEmployees: ['John Smith', 'Maria Garcia', 'Robert Chen'],
    sections: [
      {
        id: 'reception',
        name: 'Reception Area',
        icon: 'Building',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '45 min',
        todos: [
          { id: '1-1', text: 'Vacuum carpets and rugs', completed: false },
          { id: '1-2', text: 'Dust all surfaces', completed: false },
          { id: '1-3', text: 'Clean windows', completed: false },
          { id: '1-4', text: 'Sanitize door handles', completed: false },
        ],
      },
      {
        id: 'offices',
        name: 'Office Spaces',
        icon: 'Monitor',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '50 min',
        todos: [
          { id: '2-1', text: 'Empty trash bins', completed: false },
          { id: '2-2', text: 'Dust desks and equipment', completed: false },
          { id: '2-3', text: 'Clean computer screens', completed: false },
          { id: '2-4', text: 'Vacuum floors', completed: false },
        ],
      },
      {
        id: 'conference',
        name: 'Conference Rooms',
        icon: 'Users',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '40 min',
        todos: [
          { id: '3-1', text: 'Clean tables and chairs', completed: false },
          { id: '3-2', text: 'Dust AV equipment', completed: false },
          { id: '3-3', text: 'Clean whiteboards', completed: false },
          { id: '3-4', text: 'Vacuum carpets', completed: false },
        ],
      },
      {
        id: 'restrooms',
        name: 'Restrooms',
        icon: 'Bath',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '35 min',
        todos: [
          { id: '4-1', text: 'Clean toilets and sinks', completed: false },
          { id: '4-2', text: 'Refill supplies', completed: false },
          { id: '4-3', text: 'Mop floors', completed: false },
          { id: '4-4', text: 'Disinfect all surfaces', completed: false },
        ],
      },
      {
        id: 'kitchen',
        name: 'Kitchen/Break Room',
        icon: 'ChefHat',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '20 min',
        todos: [
          { id: '5-1', text: 'Clean countertops', completed: false },
          { id: '5-2', text: 'Wipe appliances', completed: false },
        ],
      },
    ],
    addOns: [
      { id: 'ao-1', name: 'Window Cleaning', icon: 'Sparkles', selected: true },
      { id: 'ao-2', name: 'Carpet Deep Clean', icon: 'Sparkles', selected: true },
    ],
    specialInstructions: 'Please use eco-friendly cleaning products. Main entrance code: 1234',
    accessInfo: 'Use main entrance code: 1234. Building manager: John at ext. 555',
    goal: 'Deep clean all office areas to prepare for client meetings',
  },
  {
    id: '2',
    orderNumber: '#89457',
    clientName: 'Sarah Martinez',
    clientEmail: 'sarah.martinez@email.com',
    address: '1428 Elm Street, Dallas, TX 75202',
    phone: '+1 (555) 234-5678',
    status: 'in-progress',
    date: '2025-11-20',
    time: '2:00 PM',
    serviceType: 'Residential Cleaning',
    duration: '3 hours',
    assignedEmployees: ['Ana Lopez', 'Carlos Ruiz'],
    startedAt: 1732111200000,
    sections: [
      {
        id: 'living',
        name: 'Living Room',
        icon: 'Sofa',
        completed: true,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '30 min',
        todos: [
          { id: '1-1', text: 'Dust all surfaces', completed: true },
          { id: '1-2', text: 'Vacuum carpets', completed: true },
          { id: '1-3', text: 'Clean windows', completed: true },
        ],
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        icon: 'ChefHat',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '40 min',
        todos: [
          { id: '2-1', text: 'Clean countertops', completed: true },
          { id: '2-2', text: 'Clean appliances', completed: true },
          { id: '2-3', text: 'Mop floors', completed: false },
          { id: '2-4', text: 'Clean sink', completed: true },
        ],
      },
      {
        id: 'bedrooms',
        name: 'Bedrooms',
        icon: 'Bed',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '35 min',
        todos: [
          { id: '3-1', text: 'Change bed linens', completed: false },
          { id: '3-2', text: 'Dust furniture', completed: true },
          { id: '3-3', text: 'Vacuum floors', completed: false },
        ],
      },
      {
        id: 'bathrooms',
        name: 'Bathrooms',
        icon: 'Bath',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '30 min',
        todos: [
          { id: '4-1', text: 'Clean toilet', completed: false },
          { id: '4-2', text: 'Clean shower/tub', completed: false },
          { id: '4-3', text: 'Clean sink and mirror', completed: true },
        ],
      },
    ],
    addOns: [
      { id: 'ao-3', name: 'Laundry Service', icon: 'Shirt', selected: true },
    ],
    specialInstructions: 'Pet-friendly products only. Dog will be in the backyard.',
  },
  {
    id: '3',
    orderNumber: '#89458',
    clientName: 'David Chen',
    clientEmail: 'david.chen@medcenter.com',
    address: '789 Medical Plaza Drive, Los Angeles, CA 90017',
    phone: '+1 (555) 345-6789',
    status: 'completed',
    date: '2025-11-18',
    time: '8:00 AM',
    serviceType: 'Medical Facility Cleaning',
    duration: '5 hours',
    assignedEmployees: ['Emma Wilson', 'James Rodriguez', 'Lisa Park'],
    startedAt: 1731916800000,
    completedAt: 1731934800000,
    sections: [
      {
        id: 'waiting',
        name: 'Waiting Room',
        icon: 'Armchair',
        completed: true,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '30 min',
        todos: [
          { id: '1-1', text: 'Sanitize all seating', completed: true },
          { id: '1-2', text: 'Disinfect door handles', completed: true },
          { id: '1-3', text: 'Clean floors', completed: true },
        ],
      },
      {
        id: 'exam',
        name: 'Examination Rooms',
        icon: 'Stethoscope',
        completed: true,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '60 min',
        todos: [
          { id: '2-1', text: 'Sanitize exam tables', completed: true },
          { id: '2-2', text: 'Disinfect all surfaces', completed: true },
          { id: '2-3', text: 'Restock supplies', completed: true },
          { id: '2-4', text: 'Clean floors', completed: true },
        ],
      },
      {
        id: 'lab',
        name: 'Lab Area',
        icon: 'FlaskConical',
        completed: true,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '40 min',
        todos: [
          { id: '3-1', text: 'Clean countertops', completed: true },
          { id: '3-2', text: 'Sanitize equipment', completed: true },
          { id: '3-3', text: 'Dispose of waste properly', completed: true },
        ],
      },
      {
        id: 'restrooms',
        name: 'Restrooms',
        icon: 'Bath',
        completed: true,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '30 min',
        todos: [
          { id: '4-1', text: 'Deep clean all fixtures', completed: true },
          { id: '4-2', text: 'Refill supplies', completed: true },
          { id: '4-3', text: 'Disinfect thoroughly', completed: true },
        ],
      },
      {
        id: 'admin',
        name: 'Administrative Offices',
        icon: 'Monitor',
        completed: true,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '25 min',
        todos: [
          { id: '5-1', text: 'Dust all surfaces', completed: true },
          { id: '5-2', text: 'Vacuum floors', completed: true },
        ],
      },
    ],
    addOns: [
      { id: 'ao-4', name: 'Medical-Grade Disinfection', icon: 'ShieldCheck', selected: true },
      { id: 'ao-5', name: 'Biohazard Waste Disposal', icon: 'Trash2', selected: true },
    ],
    specialInstructions: 'Use hospital-grade disinfectants only. Access after hours.',
  },
  {
    id: '4',
    orderNumber: '#1243',
    clientName: 'Jennifer Davis',
    clientEmail: 'jennifer.davis@email.com',
    address: '456 Park Avenue, New York, NY 10022',
    phone: '+1 (555) 456-7890',
    status: 'in-progress',
    date: '2025-11-23',
    time: '10:00 AM',
    serviceType: 'Standard Cleaning',
    duration: '2.5 hours',
    assignedEmployees: ['Maria Garcia', 'John Smith'],
    startedAt: 1732352400000,
    sections: [
      {
        id: 'living',
        name: 'Living Room',
        icon: 'Sofa',
        completed: true,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '25 min',
        todos: [
          { id: '1-1', text: 'Dust all surfaces', completed: true },
          { id: '1-2', text: 'Vacuum carpets', completed: true },
          { id: '1-3', text: 'Clean windows', completed: true },
        ],
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        icon: 'ChefHat',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '35 min',
        todos: [
          { id: '2-1', text: 'Clean countertops', completed: true },
          { id: '2-2', text: 'Clean appliances', completed: true },
          { id: '2-3', text: 'Mop floors', completed: true },
          { id: '2-4', text: 'Clean sink', completed: false },
        ],
      },
      {
        id: 'bedroom',
        name: 'Bedroom',
        icon: 'Bed',
        completed: true,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '25 min',
        todos: [
          { id: '3-1', text: 'Change bed linens', completed: true },
          { id: '3-2', text: 'Dust furniture', completed: true },
          { id: '3-3', text: 'Vacuum floors', completed: true },
        ],
      },
    ],
    addOns: [
      { id: 'ao-6', name: 'Organize closets', icon: 'LayoutGrid', selected: true },
    ],
    specialInstructions: 'Keys under the doormat.',
  },
  {
    id: '5',
    orderNumber: '#89450',
    clientName: 'Robert Brown',
    clientEmail: 'robert.brown@email.com',
    address: '123 Main Street, Boston, MA 02108',
    phone: '+1 (555) 567-8901',
    status: 'canceled',
    date: '2025-11-19',
    time: '3:00 PM',
    serviceType: 'Office Cleaning',
    duration: '3 hours',
    assignedEmployees: ['Emma Wilson', 'James Rodriguez'],
    sections: [
      {
        id: 'office',
        name: 'Office Area',
        icon: 'Monitor',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '40 min',
        todos: [
          { id: '1-1', text: 'Vacuum floors', completed: false },
          { id: '1-2', text: 'Dust desks', completed: false },
          { id: '1-3', text: 'Empty trash bins', completed: false },
        ],
      },
      {
        id: 'breakroom',
        name: 'Break Room',
        icon: 'Coffee',
        completed: false,
        beforePhotos: [],
        afterPhotos: [],
        estimatedTime: '20 min',
        todos: [
          { id: '2-1', text: 'Clean countertops', completed: false },
          { id: '2-2', text: 'Clean microwave', completed: false },
        ],
      },
    ],
    addOns: [
      { id: 'ao-7', name: 'Window Cleaning', icon: 'Sparkles', selected: true },
    ],
    specialInstructions: 'Customer canceled due to schedule conflict.',
  },
];

export function getOrderById(id: string): Order | undefined {
  return mockOrders.find(order => order.id === id);
}

export function getOrderByCode(code: string): Order | undefined {
  return mockOrders.find(order => order.orderNumber === code);
}

export function updateOrder(updatedOrder: Order): void {
  const index = mockOrders.findIndex(order => order.id === updatedOrder.id);
  if (index !== -1) {
    mockOrders[index] = updatedOrder;
  }
}

export function deleteOrder(orderId: string): void {
  const index = mockOrders.findIndex(order => order.id === orderId);
  if (index !== -1) {
    mockOrders.splice(index, 1);
  }
}
