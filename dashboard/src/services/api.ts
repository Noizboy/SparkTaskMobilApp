import { Order } from '../data/mockOrders';

// Fallback to the default dev API URL so a missing/undefined env var doesn't
// produce fetch URLs like "undefined/users/team" that Vite serves as HTML.
const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  'http://localhost:3001/api';

// ─── Safe JSON parser ─────────────────────────────────────────────────────────
// Reads the response body only when Content-Type is application/json.
// For any other content type (HTML error pages, plain text) it reads the body
// as text and throws a descriptive error instead of the cryptic
// "Unexpected token '<'" SyntaxError.
async function safeJson<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `API returned non-JSON response (${res.status} ${res.statusText})` +
        (body ? ` — ${body.slice(0, 200)}` : '')
    );
  }
  return res.json() as Promise<T>;
}

// ─── Token helpers ───────────────────────────────────────────────────────────

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('sparkTaskUser') || sessionStorage.getItem('sparkTaskUser');
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
    const data = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(data.error || 'Invalid credentials');
  }
  return safeJson(res);
}

export async function register(data: { email: string; password: string; name: string; company?: string }): Promise<any> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Registration failed');
  }
  return safeJson(res);
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId, currentPassword, newPassword }),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Password change failed');
  }
}

export async function updateUser(id: string, data: { name?: string; phone?: string; company?: string; company_phone?: string; address?: string; city?: string; zip_code?: string }): Promise<any> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Update failed');
  }
  return safeJson(res);
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
  if (!res.ok) {
    // Try to extract a JSON error message; if the body isn't JSON (HTML 404/500
    // from a proxy etc.) fall back to the HTTP status line.
    const errBody = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(
      errBody.error || `Failed to fetch team members (HTTP ${res.status})`
    );
  }
  return safeJson<TeamMemberAPI[]>(res);
}

export async function updateTeamMember(id: string, data: { role?: string; name?: string; phone?: string }): Promise<any> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Update failed');
  }
  return safeJson(res);
}

export async function deleteTeamMember(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
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
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Invite failed');
  }
  return safeJson(res);
}

export async function linkTeamMember(employeeEmail: string): Promise<any> {
  const res = await fetch(`${API_URL}/users/link`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ employee_email: employeeEmail }),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Link failed');
  }
  return safeJson(res);
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

// ─── Services ───────────────────────────────────────────────────────────────

export interface ServiceAPI {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export async function fetchServices(businessId?: string): Promise<ServiceAPI[]> {
  const params = new URLSearchParams();
  if (businessId) params.set('business_id', businessId);
  const qs = params.toString();
  const res = await fetch(`${API_URL}/services${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch services');
  return safeJson<ServiceAPI[]>(res);
}

export async function createService(data: { name: string; description?: string; businessId: string }): Promise<ServiceAPI> {
  const res = await fetch(`${API_URL}/services`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Failed to create service');
  }
  return safeJson<ServiceAPI>(res);
}

export async function updateService(id: string, data: { name: string; description?: string }): Promise<ServiceAPI> {
  const res = await fetch(`${API_URL}/services/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Failed to update service');
  }
  return safeJson<ServiceAPI>(res);
}

export async function deleteService(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/services/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Failed to delete service');
  }
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

// ─── App info ────────────────────────────────────────────────────────────────

export async function fetchApiVersion(): Promise<string> {
  const res = await fetch(`${API_URL}/info`);
  if (!res.ok) throw new Error(`Failed to fetch version (HTTP ${res.status})`);
  const data = await safeJson<{ version: string }>(res);
  return data.version;
}

// ─── Areas ──────────────────────────────────────────────────────────────────

export interface AreaAPI {
  id: string;
  businessId: string;
  name: string;
  description: string;
  estimatedDuration: number;
  checklist: string[];
  createdAt?: string;
}

export async function fetchAreas(): Promise<AreaAPI[]> {
  const res = await fetch(`${API_URL}/areas`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch areas');
  return safeJson<AreaAPI[]>(res);
}

export async function createArea(data: { name: string; estimatedDuration?: number; checklist: string[] }): Promise<AreaAPI> {
  const res = await fetch(`${API_URL}/areas`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Failed to create area');
  }
  return safeJson<AreaAPI>(res);
}

export async function updateArea(id: string, data: { name: string; estimatedDuration?: number; checklist: string[] }): Promise<AreaAPI> {
  const res = await fetch(`${API_URL}/areas/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Failed to update area');
  }
  return safeJson<AreaAPI>(res);
}

export async function deleteArea(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/areas/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await safeJson<{ error?: string }>(res).catch(() => ({}));
    throw new Error(err.error || 'Failed to delete area');
  }
}
