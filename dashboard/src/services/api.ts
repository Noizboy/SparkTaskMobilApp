import { Order } from '../data/mockOrders';

const API_URL = import.meta.env.VITE_API_URL as string;

// ─── Token helpers ───────────────────────────────────────────────────────────

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('sparkTaskUser');
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user?.token ?? null;
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<any> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Invalid credentials');
  }
  return res.json();
}

export async function register(data: { email: string; password: string; name: string; company?: string }): Promise<any> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function updateUser(id: string, data: { name?: string; phone?: string }): Promise<any> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Update failed');
  }
  return res.json();
}

export async function fetchUsers(): Promise<any[]> {
  const res = await fetch(`${API_URL}/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

// ─── Team Members ─────────────────────────────────────────────────────────────

export interface TeamMemberAPI {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  orders_completed: number;
}

export async function fetchTeamMembers(): Promise<TeamMemberAPI[]> {
  const res = await fetch(`${API_URL}/users/team`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch team members');
  return res.json();
}

export async function updateTeamMember(id: string, data: { role?: string; name?: string; phone?: string }): Promise<any> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Update failed');
  }
  return res.json();
}

export async function deleteTeamMember(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Delete failed');
  }
}

export async function inviteTeamMember(email: string): Promise<{ token: string; inviteLink: string; email: string }> {
  const res = await fetch(`${API_URL}/auth/invite`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Invite failed');
  }
  return res.json();
}

export async function linkTeamMember(employeeEmail: string): Promise<any> {
  const res = await fetch(`${API_URL}/users/link`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ employee_email: employeeEmail }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Link failed');
  }
  return res.json();
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function fetchOrders(filters?: {
  status?: string;
  search?: string;
  from?: string;
  to?: string;
}): Promise<Order[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);

  const qs = params.toString();
  const res = await fetch(`${API_URL}/orders${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
  return res.json();
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch order: ${res.statusText}`);
  return res.json();
}

export async function createOrder(data: Partial<Order>): Promise<Order> {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create order: ${res.statusText}`);
  return res.json();
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update order: ${res.statusText}`);
  }
  return res.json();
}

export async function updateOrderStatus(
  id: string,
  status: Order['status'],
  timestamps?: { startedAt?: number; completedAt?: number }
): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...timestamps }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to update status: ${res.statusText}`);
  }
  return res.json();
}

export async function toggleTodo(
  orderId: string,
  todoId: string,
  completed: boolean
): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${orderId}/todos/${todoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error(`Failed to toggle todo: ${res.statusText}`);
  return res.json();
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete order: ${res.statusText}`);
}

// ─── Health check ───────────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
