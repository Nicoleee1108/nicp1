import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Import language files
import cnTranslations from '../../locales/cn.json';
import enTranslations from '../../locales/en.json';

type Language = 'en' | 'cn';

const translations = {
  en: enTranslations,
  cn: cnTranslations,
};

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

// Helper function to replace parameters in string
function replaceParams(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

// Translation function for non-React contexts
async function getTranslation(key: string, params?: Record<string, string | number>): Promise<string> {
  try {
    const savedLanguage = await AsyncStorage.getItem('app_language');
    const language: Language = (savedLanguage === 'cn' || savedLanguage === 'en') ? savedLanguage : 'en';
    const translation = getNestedValue(translations[language], key);
    return replaceParams(translation, params);
  } catch (error) {
    console.error('Error getting translation:', error);
    // Fallback to English
    const translation = getNestedValue(translations.en, key);
    return replaceParams(translation, params);
  }
}

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

  // Get translated notification content
  const title = await getTranslation('notifications.medicationTime');
  const pillText = dosagePerIntake === 1 ? await getTranslation('common.pill') : await getTranslation('common.pills');
  const body = await getTranslation('notifications.timeToTake', { 
    dosage: dosagePerIntake, 
    pillText, 
    medicationName 
  });

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
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


export async function getScheduledNotifications(): Promise<any[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
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

  // Get translated notification content
  const title = await getTranslation('notifications.therapyReminderTitle');
  const body = await getTranslation('notifications.timeForTherapy', { 
    therapyTitle, 
    therapyDescription 
  });

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
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
