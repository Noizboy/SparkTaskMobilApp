import { Request, Response } from 'express';

/** Active SSE client connections */
const clients = new Set<Response>();

/**
 * SSE endpoint handler — registers the client and keeps the connection alive.
 * Mount as: app.get('/api/events', sseHandler)
 */
export function sseHandler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if proxied
  res.flushHeaders();

  clients.add(res);

  // Send a heartbeat every 30s to prevent connection timeout
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

/**
 * Broadcast an event to all connected SSE clients.
 * @param event  Event name (e.g. 'order:updated', 'order:deleted')
 * @param data   JSON-serializable payload
 */
export function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}
