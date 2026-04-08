import { Job } from '../types';

export const API_BASE = process.env.EXPO_PUBLIC_API_URL as string;

/** Map API 'scheduled' status to mobile 'upcoming' */
function mapStatusIn(status: string): Job['status'] {
  if (status === 'scheduled') return 'upcoming';
  return status as Job['status'];
}

/** Map mobile 'upcoming' status to API 'scheduled' */
function mapStatusOut(status: Job['status']): string {
  if (status === 'upcoming') return 'scheduled';
  return status;
}

/** Convert API order to Job type used by mobile */
function toJob(order: any): Job {
  return {
    ...order,
    status: mapStatusIn(order.status),
    startedAt: order.startedAt ? new Date(order.startedAt).getTime() : undefined,
    completedAt: order.completedAt ? new Date(order.completedAt).getTime() : undefined,
    sections: (order.sections || []).map((s: any) => ({
      ...s,
      skipReason: s.skipReason ?? undefined,
      beforePhotos: s.beforePhotos ?? [],
      afterPhotos: s.afterPhotos ?? [],
    })),
    addOns: (order.addOns || []).map((a: any) => ({
      ...a,
      skipReason: a.skipReason ?? undefined,
    })),
  };
}

export async function fetchJobs(employeeName?: string): Promise<Job[]> {
  const url = new URL(`${API_BASE}/orders`);
  if (employeeName) {
    url.searchParams.set('employee', employeeName);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`fetchJobs failed: ${res.status}`);
  const orders = await res.json();
  return orders.map(toJob);
}

export async function apiMarkSectionDone(orderId: string, sectionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/sections/${sectionId}/complete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`markSectionDone failed: ${res.status}`);
}

export async function apiMarkSectionUndone(orderId: string, sectionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/sections/${sectionId}/uncomplete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`markSectionUndone failed: ${res.status}`);
}

export async function apiToggleTodo(
  orderId: string,
  todoId: string
): Promise<void> {
  console.log('[API] PATCH', `${API_BASE}/orders/${orderId}/todos/${todoId}`);
  const res = await fetch(`${API_BASE}/orders/${orderId}/todos/${todoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  console.log('[API] toggleTodo response status:', res.status);
  if (!res.ok) throw new Error(`toggleTodo failed: ${res.status}`);
}

export async function apiUpdateStatus(
  orderId: string,
  status: Job['status'],
  extra?: { startedAt?: number; completedAt?: number }
): Promise<void> {
  const body: any = { status: mapStatusOut(status) };
  if (extra?.startedAt) body.startedAt = new Date(extra.startedAt).toISOString();
  if (extra?.completedAt) body.completedAt = new Date(extra.completedAt).toISOString();
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`updateStatus failed: ${res.status}`);
}

export async function apiToggleAddOn(orderId: string, addOnId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/addons/${addOnId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`toggleAddOn failed: ${res.status}`);
}

export async function apiUpdateOrder(orderId: string, job: Job): Promise<void> {
  const body = {
    ...job,
    status: mapStatusOut(job.status),
    startedAt: job.startedAt ? new Date(job.startedAt).toISOString() : undefined,
    completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : undefined,
  };
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`updateOrder failed: ${res.status}`);
}
