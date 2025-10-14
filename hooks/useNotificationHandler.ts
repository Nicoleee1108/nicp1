import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

export function useNotificationHandler() {
  useEffect(() => {
    // Handle notification responses (when user taps on notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 Notification tapped:', response.notification.request.content);
      
      const notification = response.notification;
      const data = notification.request.content;
      
      if (data.title?.includes('Medication Reminder')) {
        console.log('💊 User tapped medication reminder');
        
        // Navigate to medication page when user taps notification
        router.push('/medication');
        
        // Optional: Show additional info
        Alert.alert(
          'Medication Reminder',
          data.body || 'Time to take your medication!',
          [
            { text: 'OK', style: 'default' },
            { text: 'View Medications', onPress: () => router.push('/medication') }
          ]
        );
      }
    });

    // Handle notifications received while app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received while app is open:', notification.request.content);
      
      const data = notification.request.content;
      
      // You can show custom in-app notifications here
      if (data.title?.includes('Medication Reminder')) {
        // Optional: Show a toast or custom modal
        console.log('💊 Medication reminder received in foreground');
      }
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);
}

// Hook for handling specific notification actions
export function useMedicationNotificationActions() {
  const markAsTaken = (medicationName: string) => {
    console.log(`✅ Marked ${medicationName} as taken`);
    // Here you can update your medication tracking
    // For example, save to AsyncStorage or update state
  };

  const snoozeReminder = (medicationName: string, minutes: number = 15) => {
    console.log(`⏰ Snoozed ${medicationName} for ${minutes} minutes`);
    // Here you can reschedule the notification
  };

  return {
    markAsTaken,
    snoozeReminder,
  };
}

