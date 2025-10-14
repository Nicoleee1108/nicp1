import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Med } from '../../types/med';
import { healthDB } from './database';

const MEDS_KEY = 'medications';

// Legacy functions for backward compatibility
export async function loadMeds(): Promise<Med[]> {
  try {
    // Try new database first
    await healthDB.initialize();
    const medications = await healthDB.getMedications();
    
    // Convert to legacy format
    return medications.map(med => ({
      id: med.id,
      name: med.name,
      usage: med.usage,
      dosagePerIntake: med.dosagePerIntake,
      timesPerDay: med.timesPerDay,
      reminders: med.reminders.map(rem => ({
        notificationId: rem.notificationId,
        hour: rem.hour,
        minute: rem.minute
      }))
    }));
  } catch (error) {
    console.error('Error loading medications:', error);
    // Fallback to old storage
    const stored = await AsyncStorage.getItem(MEDS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveMeds(meds: Med[]): Promise<void> {
  try {
    await healthDB.initialize();
    
    // Convert legacy format to new format
    const medications = meds.map(med => ({
      id: med.id,
      name: med.name,
      usage: med.usage,
      dosagePerIntake: med.dosagePerIntake,
      timesPerDay: med.timesPerDay,
      reminders: med.reminders.map(rem => ({
        notificationId: rem.notificationId,
        hour: rem.hour,
        minute: rem.minute,
        isActive: true
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }));

    // Clear existing medications and add new ones
    const existingMeds = await healthDB.getMedications();
    for (const med of existingMeds) {
      await healthDB.deleteMedication(med.id);
    }
    
    for (const med of medications) {
      await healthDB.addMedication(med);
    }
  } catch (error) {
    console.error('Error saving medications:', error);
    // Fallback to old storage
    await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(meds));
  }
}

