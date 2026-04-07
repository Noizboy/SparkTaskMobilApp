import { useEffect, useRef } from 'react';
import EventSource from 'react-native-sse';
import { API_BASE } from '../services/api';

type SSEEventName = 'order:created' | 'order:updated' | 'order:deleted';

interface SSEHandlers {
  onOrderCreated?: (order: any) => void;
  onOrderUpdated?: (order: any) => void;
  onOrderDeleted?: (payload: { id: string }) => void;
}

/**
 * Connects to the API SSE stream and dispatches order change events.
 * Should be mounted once while the user is authenticated.
 * Automatically reconnects on disconnect (pollingInterval: 5000).
 */
export function useSSE(handlers: SSEHandlers, enabled: boolean) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource<SSEEventName>(`${API_BASE}/events`, {
      pollingInterval: 5000,
    });

    const parse = (data: string | null) => {
      try { return data ? JSON.parse(data) : null; } catch { return null; }
    };

    es.addEventListener('order:created', (e) => {
      const order = parse(e.data);
      if (order) handlersRef.current.onOrderCreated?.(order);
    });

    es.addEventListener('order:updated', (e) => {
      const order = parse(e.data);
      if (order) handlersRef.current.onOrderUpdated?.(order);
    });

    es.addEventListener('order:deleted', (e) => {
      const payload = parse(e.data);
      if (payload) handlersRef.current.onOrderDeleted?.(payload);
    });

    es.addEventListener('error', (e: any) => {
      console.warn('[SSE] connection error:', e?.message);
    });

    return () => {
      es.removeAllEventListeners();
      es.close();
    };
  }, [enabled]);
}
