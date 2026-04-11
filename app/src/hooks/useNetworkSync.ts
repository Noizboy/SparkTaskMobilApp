import { useState, useEffect, useRef, useCallback } from 'react';
import * as Network from 'expo-network';
import {
  getQueue,
  removeFromQueue,
  incrementRetries,
  SyncOperation,
} from '../utils/syncQueue';
import {
  apiToggleTodo,
  apiToggleAddOn,
  apiMarkSectionDone,
  apiMarkSectionUndone,
  apiUpdateOrder,
  apiUpdateStatus,
} from '../services/api';
import { Job } from '../types';

/** Map a queued SyncOperation to the correct API call */
async function dispatchOp(op: SyncOperation): Promise<void> {
  const { type, payload } = op;
  switch (type) {
    case 'toggleTodo':
      return apiToggleTodo(payload.orderId as string, payload.todoId as string);

    case 'toggleAddOn':
      return apiToggleAddOn(payload.orderId as string, payload.addOnId as string);

    case 'markSectionDone':
      return apiMarkSectionDone(payload.orderId as string, payload.sectionId as string);

    case 'markSectionUndone':
      return apiMarkSectionUndone(payload.orderId as string, payload.sectionId as string);

    case 'photosChange':
      return apiUpdateOrder(payload.orderId as string, payload.job as Job);

    case 'completeJob':
      return apiUpdateOrder(payload.orderId as string, payload.job as Job);

    case 'cancelJob':
      return apiUpdateStatus(payload.orderId as string, 'upcoming');

    case 'startJob':
      return apiUpdateStatus(payload.orderId as string, 'in-progress', {
        startedAt: payload.startedAt as number,
      });

    default: {
      const _exhaustive: never = type;
      throw new Error(`[SyncQueue] Unknown operation type: ${_exhaustive}`);
    }
  }
}

interface UseNetworkSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  /** Call this after manually enqueueing to keep pendingCount in sync */
  refreshPendingCount: () => Promise<void>;
}

/** How often (ms) to poll expo-network for connectivity changes */
const POLL_INTERVAL_MS = 3000;

export function useNetworkSync(): UseNetworkSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  /** Guard against concurrent processQueue invocations */
  const isSyncingRef = useRef(false);

  /** Track previous online state to detect offline → online transitions */
  const wasOnlineRef = useRef(true);

  const refreshPendingCount = useCallback(async () => {
    try {
      const queue = await getQueue();
      setPendingCount(queue.length);
    } catch {
      // getQueue itself never throws (has its own try/catch), but be defensive
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (isSyncingRef.current) return;

    let queue: SyncOperation[];
    try {
      queue = await getQueue();
    } catch {
      return; // AsyncStorage unreadable — abort silently
    }

    if (queue.length === 0) {
      setPendingCount(0);
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    // Process in FIFO order — always reset the sync lock in the finally block so
    // that a mid-flight error can never leave isSyncingRef permanently stuck at true.
    try {
      for (const op of queue) {
        try {
          await dispatchOp(op);
          await removeFromQueue(op.id);
          console.log('[SyncQueue] ✓ Synced op:', op.type, op.id);
        } catch (err) {
          console.warn('[SyncQueue] ✗ Failed to sync op:', op.type, op.id, err);
          if (op.retries >= 3) {
            console.warn('[SyncQueue] Giving up on op after 3 retries:', op.id);
            await removeFromQueue(op.id);
          } else {
            await incrementRetries(op.id);
          }
        }
      }
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      // Always refresh the count — even if the loop was cut short.
      await refreshPendingCount().catch(() => {});
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    // expo-network has no real-time listener — poll every POLL_INTERVAL_MS ms.
    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        // NOTE: On Android, `isInternetReachable` is often `null` (not `false`),
        // so we must NOT treat null as "offline". Only treat it as offline when
        // it is explicitly `false`. Use `isConnected` as the primary signal.
        const connected =
          state.isConnected === true && state.isInternetReachable !== false;

        setIsOnline(connected);

        if (connected) {
          if (!wasOnlineRef.current) {
            // Offline → online transition: flush pending queue immediately.
            processQueue().catch(() => {});
          } else {
            // Still online: drain any items that were queued while online (e.g.
            // API calls that failed transiently) but only if not already syncing.
            if (!isSyncingRef.current) {
              refreshPendingCount().catch(() => {});
            }
          }
        }

        wasOnlineRef.current = connected;
      } catch {
        // If the network probe itself fails, stay with the last known state.
      }
    };

    // Run once immediately so we don't wait POLL_INTERVAL_MS for the first reading.
    // Stagger by one tick so that AppContext's initAuth effect (which also reads
    // AsyncStorage on mount) gets the bridge first — avoiding concurrent-read
    // stalls under @react-native-async-storage/async-storage v2 + RN 0.81.
    const initialCheckTimer = setTimeout(() => {
      checkNetwork();
      intervalId = setInterval(checkNetwork, POLL_INTERVAL_MS);
    }, 150);

    return () => {
      clearTimeout(initialCheckTimer);
      // intervalId may be undefined if the component unmounts before the
      // 150 ms stagger fires — guard so TypeScript is happy.
      if (intervalId !== undefined) clearInterval(intervalId);
      // Reset the sync lock so a mid-flight processQueue can't leave isSyncingRef
      // stuck at `true` across a cleanup/remount cycle (e.g. React Strict Mode,
      // HMR, or any future component unmount while syncing is in progress).
      isSyncingRef.current = false;
    };
    // processQueue and refreshPendingCount are stable useCallback references
    // (their own dep arrays never change at runtime). Using [] here makes the
    // poller truly singleton — exactly one setInterval for the lifetime of this
    // hook instance, regardless of future refactors upstream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, isSyncing, pendingCount, refreshPendingCount };
}
