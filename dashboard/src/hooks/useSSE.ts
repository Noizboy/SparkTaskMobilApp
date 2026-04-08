import { useEffect, useRef } from 'react';

const SSE_URL = `${import.meta.env.VITE_API_URL}/events`;

interface SSEHandlers {
  onOrderCreated?: (order: any) => void;
  onOrderUpdated?: (order: any) => void;
  onOrderDeleted?: (payload: { id: string }) => void;
}

/**
 * Subscribes to the API's Server-Sent Events stream.
 * Automatically reconnects on connection loss (browser handles this natively
 * for EventSource with exponential back-off).
 */
export function useSSE(handlers: SSEHandlers) {
  // Use a ref so handlers don't need to be stable references
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const es = new EventSource(SSE_URL);

    es.addEventListener('order:created', (e: MessageEvent) => {
      try {
        handlersRef.current.onOrderCreated?.(JSON.parse(e.data));
      } catch {}
    });

    es.addEventListener('order:updated', (e: MessageEvent) => {
      try {
        handlersRef.current.onOrderUpdated?.(JSON.parse(e.data));
      } catch {}
    });

    es.addEventListener('order:deleted', (e: MessageEvent) => {
      try {
        handlersRef.current.onOrderDeleted?.(JSON.parse(e.data));
      } catch {}
    });

    return () => {
      es.close();
    };
  }, []); // only one connection for the lifetime of the component
}
