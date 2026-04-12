import { Request, Response } from 'express';

/** Anonymous SSE connections (dashboard, clients that don't supply a userId). */
const clients = new Set<Response>();

/**
 * Per-user SSE connections.
 * Key: userId (UUID string); Value: set of active Response objects for that user
 * (a single user can have multiple tabs / devices open simultaneously).
 */
const userClients = new Map<string, Set<Response>>();

/**
 * SSE endpoint handler — registers the client and keeps the connection alive.
 * Mount as: app.get('/api/events', sseHandler)
 *
 * Optional query param: ?userId=<uuid>
 * When provided the connection is indexed in `userClients` so events can be
 * targeted to specific users via `broadcastToUsers`.
 * Anonymous connections (no userId) are tracked in the global `clients` set
 * and still receive every `broadcast` call.
 */
export function sseHandler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if proxied
  res.flushHeaders();

  const userId = (req.query.userId as string | undefined) || undefined;

  if (userId) {
    if (!userClients.has(userId)) userClients.set(userId, new Set());
    userClients.get(userId)!.add(res);
  } else {
    clients.add(res);
  }

  // Send a heartbeat every 30s to prevent connection timeout
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    if (userId) {
      const userSet = userClients.get(userId);
      if (userSet) {
        userSet.delete(res);
        if (userSet.size === 0) userClients.delete(userId);
      }
    } else {
      clients.delete(res);
    }
  });
}

/**
 * Broadcast an event to ALL connected SSE clients (anonymous + all user-specific).
 * Use this for events that every connected client should receive (order:created,
 * order:deleted, todo/photo changes, etc.).
 *
 * @param event  Event name (e.g. 'order:updated', 'order:deleted')
 * @param data   JSON-serializable payload
 */
export function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) client.write(payload);
  for (const userSet of userClients.values()) {
    for (const client of userSet) client.write(payload);
  }
}

/**
 * Broadcast an event to anonymous clients (dashboard) and a specific set of
 * identified users.  Use this for status-change events that should only reach
 * cleaners assigned to the affected order.
 *
 * @param event    Event name
 * @param data     JSON-serializable payload
 * @param userIds  UUIDs of the users to target
 */
export function broadcastToUsers(event: string, data: unknown, userIds: string[]) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  // Anonymous connections (dashboard and any old mobile clients without a userId)
  for (const client of clients) client.write(payload);
  // Identified user connections
  for (const userId of userIds) {
    const userSet = userClients.get(userId);
    if (userSet) {
      for (const client of userSet) client.write(payload);
    }
  }
}
