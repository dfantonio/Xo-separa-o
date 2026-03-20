import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

const REMINDER_MORNING = 'xo-separacao-reminder-morning';
const REMINDER_EVENING = 'xo-separacao-reminder-evening';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests notification permissions and schedules daily reminders:
 * - 06:30 — motivational reminder to start the day
 * - 20:00 — reminder about pending tasks
 */
export async function scheduleTaskReminders(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const existingIds = new Set(existing.map((n) => n.identifier));

  if (!existingIds.has(REMINDER_MORNING)) {
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_MORNING,
      content: {
        title: 'Bom dia! ☀️',
        body: 'Que tal cuidar do lar juntos? Você tem tarefas a fazer!',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: 6,
        minute: 30,
      },
    });
  }

  if (!existingIds.has(REMINDER_EVENING)) {
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_EVENING,
      content: {
        title: 'Xô Separação',
        body: 'Você ainda tem tarefas pendentes hoje! Dá tempo de completar antes de dormir 💪',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });
  }
}

/**
 * Cancels the daily task reminder notifications.
 * Call this when all tasks for the day are completed.
 */
export async function cancelTaskReminders(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_MORNING);
  await Notifications.cancelScheduledNotificationAsync(REMINDER_EVENING);
}
