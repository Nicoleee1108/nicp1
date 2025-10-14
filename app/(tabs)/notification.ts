// lib/notifications.ts
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Set global handler once
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationSetup(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.status === "granted";
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.status === "granted";
  }

  if (!granted) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("med_reminders", {
      name: "Medication Reminders",
      importance: Notifications.AndroidImportance.MAX,
      description: "Daily medication reminder notifications",
      sound: "default",
      vibrationPattern: [300, 300],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  return true;
}

export type Reminder = {
  hour: number;
  minute: number;
  notificationId: string;
};

export async function scheduleDailyReminder(
  label: string,
  dosagePerIntake: number,
  d: Date
): Promise<Reminder> {
  const hour = d.getHours();
  const minute = d.getMinutes();

  const trigger: Notifications.CalendarTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    hour,
    minute,
    repeats: true,
  };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Medication Reminder",
      body: `Take ${dosagePerIntake} ${dosagePerIntake === 1 ? "pill" : "pills"} — ${label} at ${String(
        hour
      ).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      sound: "default",
    },
    trigger,
  });

  return { notificationId: id, hour, minute };
}

export async function cancelReminder(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn("Failed to cancel notification:", e);
  }
}

export async function cancelMany(ids: string[]) {
  await Promise.all(ids.map((id) => cancelReminder(id)));
}
