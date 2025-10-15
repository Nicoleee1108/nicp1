import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Configure how notifications are handled when the app is in the foreground
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
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  return true;
}

export async function scheduleDailyReminder(
  medicationName: string,
  dosagePerIntake: number,
  time: Date
): Promise<{ notificationId: string; hour: number; minute: number }> {
  const hour = time.getHours();
  const minute = time.getMinutes();

  console.log(`📅 Scheduling daily reminder for ${medicationName} at ${hour}:${String(minute).padStart(2, '0')}`);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Medication Reminder',
      body: `Time to take ${dosagePerIntake} ${dosagePerIntake === 1 ? 'pill' : 'pills'} of ${medicationName}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });

  console.log(`✅ Reminder scheduled with ID: ${notificationId}`);

  return {
    notificationId,
    hour,
    minute,
  };
}

export async function cancelMany(notificationIds: string[]): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationIds.join(','));
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function testNotification(): Promise<void> {
  const setupOk = await ensureNotificationSetup();
  if (!setupOk) {
    console.log('❌ Notifications not set up properly');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧪  Notification',
      body: 'This is a test notification from MedT!',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2, // Send in 2 seconds
    },
  });
  
  console.log('✅ Test notification scheduled for 2 seconds from now');
}

export async function getScheduledNotifications(): Promise<any[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export async function createTestMedicationReminder(): Promise<void> {
  const setupOk = await ensureNotificationSetup();
  if (!setupOk) {
    console.log('❌ Notifications not set up properly');
    return;
  }

  // Create a test reminder for 1 minute from now
  const now = new Date();
  const testTime = new Date(now.getTime() + 60000); // 1 minute from now
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Test Medication Reminder',
      body: 'Time to take 1 pill of Test Medication',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: testTime,
    },
  });
  
  console.log(`✅ Test medication reminder scheduled for ${testTime.toLocaleTimeString()}`);
}

// Therapy reminder functions
export async function scheduleTherapyReminder(
  therapyTitle: string,
  therapyDescription: string,
  time: Date,
  frequency: 'daily' | 'weekly' | 'custom' = 'daily',
  customDays?: number[]
): Promise<{ notificationId: string; hour: number; minute: number }> {
  const hour = time.getHours();
  const minute = time.getMinutes();

  console.log(`📅 Scheduling therapy reminder for ${therapyTitle} at ${hour}:${String(minute).padStart(2, '0')}`);

  let trigger: any;

  if (frequency === 'daily') {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    };
  } else if (frequency === 'weekly') {
    // Schedule for the same day of the week
    const weekday = time.getDay();
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      weekday,
      repeats: true,
    };
  } else if (frequency === 'custom' && customDays && customDays.length > 0) {
    // For custom frequency, we'll schedule multiple notifications for each day
    // This is a simplified approach - in a real app you might want to handle this differently
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    };
  } else {
    // Default to daily
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    };
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏃‍♂️ Therapy Reminder',
      body: `Time for ${therapyTitle}: ${therapyDescription}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });

  console.log(`✅ Therapy reminder scheduled with ID: ${notificationId}`);

  return {
    notificationId,
    hour,
    minute,
  };
}

export async function cancelTherapyReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  console.log(`🗑️ Therapy reminder cancelled: ${notificationId}`);
}
