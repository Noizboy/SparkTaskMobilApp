export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  ordersCompleted: number;
}

export const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'John Perez', email: 'john@email.com', role: 'Employee', status: 'active', ordersCompleted: 45 },
  { id: '2', name: 'Anna Lopez', email: 'anna@email.com', role: 'Employee', status: 'active', ordersCompleted: 38 },
  { id: '3', name: 'Peter Sanchez', email: 'peter@email.com', role: 'Employee', status: 'active', ordersCompleted: 52 },
  { id: '4', name: 'Maria Torres', email: 'maria@email.com', role: 'Employee', status: 'active', ordersCompleted: 31 },
  { id: '5', name: 'Carlos Ramirez', email: 'carlos@email.com', role: 'Supervisor', status: 'active', ordersCompleted: 67 },
];

export function getTeamMembers(): TeamMember[] {
  return mockTeamMembers;
}
