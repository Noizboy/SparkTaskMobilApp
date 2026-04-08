export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  ordersCompleted: number;
}

export const mockTeamMembers: TeamMember[] = [
  { id: '56f9e79e-86ec-433b-8542-cd1708ff739e', name: 'Alejandro Gomez', email: 'alejandro@sparktask.com', role: 'Member', status: 'active', ordersCompleted: 2 },
  { id: '1', name: 'John Perez', email: 'john@email.com', role: 'Member', status: 'active', ordersCompleted: 45 },
  { id: '2', name: 'Anna Lopez', email: 'anna@email.com', role: 'Member', status: 'active', ordersCompleted: 38 },
  { id: '3', name: 'Peter Sanchez', email: 'peter@email.com', role: 'Member', status: 'active', ordersCompleted: 52 },
  { id: '4', name: 'Maria Torres', email: 'maria@email.com', role: 'Member', status: 'active', ordersCompleted: 31 },
  { id: '5', name: 'Carlos Ramirez', email: 'carlos@email.com', role: 'Supervisor', status: 'active', ordersCompleted: 67 },
];

export function getTeamMembers(): TeamMember[] {
  return mockTeamMembers;
}
