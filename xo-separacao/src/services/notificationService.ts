import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

const REMINDER_IDENTIFIER_15H = 'xo-separacao-reminder-15h';
const REMINDER_IDENTIFIER_20H = 'xo-separacao-reminder-20h';

const REMINDER_BODY = 'Você ainda tem tarefas pendentes hoje! Abra o Xô Separação.';

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
 * Requests notification permissions and schedules daily reminders at 15h and 20h.
 * Skips scheduling if the notifications are already registered (avoids duplicates).
 */
export async function scheduleTaskReminders(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const existingIds = new Set(existing.map((n) => n.identifier));

  if (!existingIds.has(REMINDER_IDENTIFIER_15H)) {
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER_15H,
      content: {
        title: 'Xô Separação',
        body: REMINDER_BODY,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: 15,
        minute: 0,
      },
    });
  }

  if (!existingIds.has(REMINDER_IDENTIFIER_20H)) {
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER_20H,
      content: {
        title: 'Xô Separação',
        body: REMINDER_BODY,
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
 * Cancels the daily task reminder notifications for today.
 * Call this when all tasks for the day are completed.
 */
export async function cancelTaskReminders(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER_15H);
  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER_20H);
}
