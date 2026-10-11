/**
 * Instant Cross-Tab & Multi-Surface Synchronization Channel
 *
 * Uses the native BroadcastChannel API to stream atomic delta patches between
 * open tabs on the same device with <5ms latency and zero network roundtrips.
 * Falls back gracefully to window storage events if BroadcastChannel is unsupported.
 */

import { WorkoutSession, Routine, HistoryRecord, MealRecord, BodyMetricEntry, NutritionGoals, UserSettings } from './api';

export type SyncEventType =
  | 'SESSION_SAVED'
  | 'SESSIONS_SAVED'
  | 'SESSION_DELETED'
  | 'SESSIONS_DELETED'
  | 'WORKOUT_FINISHED'
  | 'ROUTINE_SAVED'
  | 'ROUTINE_DELETED'
  | 'MEAL_SAVED'
  | 'MEAL_DELETED'
  | 'WATER_LOGGED'
  | 'WATER_RESET'
  | 'GOALS_UPDATED'
  | 'METRIC_SAVED'
  | 'METRIC_DELETED'
  | 'SETTINGS_UPDATED';

export interface SyncPayloadMap {
  SESSION_SAVED: { session: WorkoutSession };
  SESSIONS_SAVED: { sessions: WorkoutSession[] };
  SESSION_DELETED: { id: string };
  SESSIONS_DELETED: { ids: string[] };
  WORKOUT_FINISHED: { session: WorkoutSession; record: HistoryRecord };
  ROUTINE_SAVED: { routine: Routine };
  ROUTINE_DELETED: { id: string };
  MEAL_SAVED: { meal: MealRecord };
  MEAL_DELETED: { id: string };
  WATER_LOGGED: { dateStr: string; amountDelta: number; newTotal?: number };
  WATER_RESET: { dateStr: string };
  GOALS_UPDATED: { goals: NutritionGoals };
  METRIC_SAVED: { entry: BodyMetricEntry };
  METRIC_DELETED: { id: string };
  SETTINGS_UPDATED: { settings: UserSettings };
}

export type SyncEvent = {
  [K in SyncEventType]: {
    type: K;
    payload: SyncPayloadMap[K];
    senderId: string;
    uid: string;
    timestamp: number;
  };
}[SyncEventType];

const CHANNEL_NAME = 'forma_realtime_sync_v1';
const CLIENT_ID = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

type SyncListener = (event: SyncEvent) => void;
const listeners = new Set<SyncListener>();

let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (messageEvent) => {
      const data = messageEvent.data as SyncEvent;
      if (data && data.senderId !== CLIENT_ID) {
        listeners.forEach(listener => {
          try {
            listener(data);
          } catch (err) {
            console.warn('Error in sync channel listener:', err);
          }
        });
      }
    };
  } catch (err) {
    console.warn('BroadcastChannel initialization failed, falling back to window events:', err);
    broadcastChannel = null;
  }
}

// Fallback to storage events for cross-tab communication if BroadcastChannel is missing
if (typeof window !== 'undefined' && !broadcastChannel) {
  window.addEventListener('storage', (e) => {
    if (e.key === CHANNEL_NAME && e.newValue) {
      try {
        const data = JSON.parse(e.newValue) as SyncEvent;
        if (data && data.senderId !== CLIENT_ID) {
          listeners.forEach(listener => {
            try {
              listener(data);
            } catch (err) {
              console.warn('Error in storage sync listener:', err);
            }
          });
        }
      } catch {}
    }
  });
}

/**
 * Broadcast an atomic state change event across tabs
 */
export function broadcastSyncEvent<T extends SyncEventType>(
  type: T,
  payload: SyncPayloadMap[T],
  uid: string = 'guest'
): void {
  const event: SyncEvent = {
    type,
    payload,
    senderId: CLIENT_ID,
    uid,
    timestamp: Date.now()
  } as SyncEvent;

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch (err) {
      console.warn('BroadcastChannel postMessage failed:', err);
    }
  } else if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CHANNEL_NAME, JSON.stringify(event));
    } catch {}
  }
}

/**
 * Subscribe to cross-tab synchronization events
 */
export function subscribeSyncChannel(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSyncClientId(): string {
  return CLIENT_ID;
}
