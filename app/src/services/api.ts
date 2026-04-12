import { Job } from '../types';
import { storage } from '../utils/storage';
import { AUTH_CONFIG } from '../config/auth';

// EXPO_PUBLIC_API_URL must include the /api path segment, e.g.:
//   http://192.168.1.221:3001/api
// Without /api the app calls /orders/... instead of /api/orders/..., which
// produces a 404 because the Express server mounts all order routes under
// app.use('/api/orders', ordersRouter).
export const API_BASE: string =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ??
  'http://localhost:3001/api';

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
  todoId: string,
  completed: boolean
): Promise<void> {
  console.log('[API] PATCH', `${API_BASE}/orders/${orderId}/todos/${todoId}`);
  const res = await fetch(`${API_BASE}/orders/${orderId}/todos/${todoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
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
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `updateStatus failed: ${res.status}`);
  }
}

export async function apiToggleAddOn(orderId: string, addOnId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/addons/${addOnId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`toggleAddOn failed: ${res.status}`);
}

export async function apiUpdateOrder(
  orderId: string,
  job: Job,
  options?: { clientUpdatedAt?: string }
): Promise<void> {
  const body: Record<string, unknown> = {
    ...job,
    status: mapStatusOut(job.status),
    startedAt: job.startedAt ? new Date(job.startedAt).toISOString() : undefined,
    completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : undefined,
  };
  if (options?.clientUpdatedAt) {
    body.clientUpdatedAt = options.clientUpdatedAt;
  }
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 409) throw new Error('conflict');
  if (!res.ok) throw new Error(`updateOrder failed: ${res.status}`);
}

// ─── Photo upload ─────────────────────────────────────────────────────────────

/**
 * Upload a single before/after photo for a section.
 * Sends multipart/form-data with field "photo"; type is passed as a query param.
 * Returns the saved photo record from the server: { id, section_id, type, url }.
 */
export async function apiUploadPhoto(
  orderId: string,
  sectionId: string,
  type: 'before' | 'after',
  localUri: string
): Promise<{ id: string; section_id: string; type: string; url: string }> {
  const token = await storage.get(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);

  const formData = new FormData();
  const filename = localUri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  // React Native FormData accepts the object form for file entries
  formData.append('photo', {
    uri: localUri,
    name: filename,
    type: 'image/jpeg',
  } as any);

  const res = await fetch(
    `${API_BASE}/orders/${orderId}/sections/${sectionId}/photos?type=${type}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
        // Do NOT set Content-Type — FormData auto-sets multipart/form-data with boundary
      },
      body: formData,
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as any;
    throw new Error(errBody.error ?? `uploadPhoto failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Delete a photo by its server URL.
 * The photo is identified by orderId + sectionId + photoUrl (full server URL).
 */
export async function apiDeletePhoto(
  orderId: string,
  sectionId: string,
  photoUrl: string
): Promise<void> {
  const token = await storage.get(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);

  const res = await fetch(
    `${API_BASE}/orders/${orderId}/sections/${sectionId}/photos?url=${encodeURIComponent(photoUrl)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
      },
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as any;
    throw new Error(errBody.error ?? `deletePhoto failed: ${res.status}`);
  }
}
