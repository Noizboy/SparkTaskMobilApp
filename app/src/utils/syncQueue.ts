import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_QUEUE_KEY = 'SYNC_QUEUE';

export type SyncOperation = {
  id: string;
  type:
    | 'toggleTodo'
    | 'toggleAddOn'
    | 'markSectionDone'
    | 'markSectionUndone'
    | 'photosChange'
    | 'completeJob'
    | 'cancelJob'
    | 'startJob';
  payload: Record<string, any>;
  timestamp: number;
  retries: number;
};

/** Generate a unique id without external deps */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Add a new operation to the tail of the persistent FIFO queue */
export async function enqueue(
  op: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>
): Promise<void> {
  try {
    const queue = await getQueue();
    const newOp: SyncOperation = {
      ...op,
      id: generateId(),
      timestamp: Date.now(),
      retries: 0,
    };
    queue.push(newOp);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[SyncQueue] enqueue failed:', err);
  }
}

/** Return the full queue (FIFO order) */
export async function getQueue(): Promise<SyncOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SyncOperation[]) : [];
  } catch {
    return [];
  }
}

/** Remove a processed (or abandoned) operation by id */
export async function removeFromQueue(id: string): Promise<void> {
  try {
    const queue = await getQueue();
    const updated = queue.filter((op) => op.id !== id);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[SyncQueue] removeFromQueue failed:', err);
  }
}

/** Increment the retry counter for a failed operation */
export async function incrementRetries(id: string): Promise<void> {
  try {
    const queue = await getQueue();
    const updated = queue.map((op) =>
      op.id === id ? { ...op, retries: op.retries + 1 } : op
    );
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[SyncQueue] incrementRetries failed:', err);
  }
}

/** Wipe the entire queue (use with caution) */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (err) {
    console.warn('[SyncQueue] clearQueue failed:', err);
  }
}
