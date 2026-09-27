import { gymAudio } from './audio';
import type { UserSettings, WorkoutSession, HistoryRecord } from './api';
import { isSameDay } from 'date-fns';

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermissionStatus(): NotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return false;
  }
}

export function sendWorkoutNotification(title: string, body: string): boolean {
  try {
    gymAudio.playRestTimerChime();
  } catch (e) {}

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'workout-reminder',
      });
      return true;
    } catch (err) {
      console.warn('Failed to dispatch system notification:', err);
    }
  }
  return false;
}

export function testWorkoutReminderNotification(isRTL: boolean = true): boolean {
  const title = isRTL ? 'تطبيق FORMA 💪' : 'FORMA Workout 💪';
  const body = isRTL 
    ? 'حان وقت تمرينك اليوم! جاهز لكسر أرقامك القياسية؟ 🔥' 
    : 'It’s workout time today! Ready to break your personal records? 🔥';
  return sendWorkoutNotification(title, body);
}

export function checkAndTriggerWorkoutReminder(
  settings: UserSettings | undefined,
  sessions: WorkoutSession[] = [],
  history: HistoryRecord[] = [],
  isRTL: boolean = true
): { triggered: boolean; title: string; message: string } | null {
  if (!settings || settings.workoutReminderEnabled === false) {
    return null;
  }

  const reminderTime = settings.workoutReminderTime || '18:00';
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  // Check if current time matches reminder time
  if (currentTimeStr !== reminderTime) {
    return null;
  }

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Check if already reminded today
  try {
    const lastReminder = localStorage.getItem('mygym_last_reminder_date');
    if (lastReminder === todayStr) {
      return null;
    }
  } catch (e) {}

  // Check if user already finished their workout today
  const hasFinishedHistory = history.some(h => isSameDay(new Date(h.date), now));
  const hasFinishedSession = sessions.some(s => s.isCompleted && isSameDay(new Date(s.date), now));

  if (hasFinishedHistory || hasFinishedSession) {
    return null;
  }

  // Record that we reminded today
  try {
    localStorage.setItem('mygym_last_reminder_date', todayStr);
  } catch (e) {}

  const title = isRTL ? 'حان وقت التمرين! 💪' : 'Workout Reminder! 💪';
  const message = isRTL 
    ? 'لا تفوت جلسة اليوم، الاستمرارية هي مفتاح القوة والتطور 🔥' 
    : 'Don’t miss your session today. Consistency compounds into results! 🔥';

  sendWorkoutNotification(title, message);

  return { triggered: true, title, message };
}
