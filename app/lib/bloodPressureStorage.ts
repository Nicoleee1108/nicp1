import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BloodPressureReading, BloodPressureStats } from '../../types/bloodPressure';
import { healthDB } from './database';

const BP_READINGS_KEY = 'blood_pressure_readings';

// Legacy functions for backward compatibility
export async function loadBloodPressureReadings(): Promise<BloodPressureReading[]> {
  try {
    // Try new database first
    await healthDB.initialize();
    return await healthDB.getBloodPressureReadings();
  } catch (error) {
    console.error('Error loading blood pressure readings:', error);
    // Fallback to old storage
    const stored = await AsyncStorage.getItem(BP_READINGS_KEY);
    if (!stored) return [];
    
    const readings = JSON.parse(stored);
    return readings.map((reading: any) => ({
      ...reading,
      timestamp: new Date(reading.timestamp)
    }));
  }
}

export async function saveBloodPressureReadings(readings: BloodPressureReading[]): Promise<void> {
  try {
    await healthDB.initialize();
    
    // Clear existing readings and add new ones
    const existingReadings = await healthDB.getBloodPressureReadings();
    for (const reading of existingReadings) {
      await healthDB.deleteBloodPressureReading(reading.id);
    }
    
    for (const reading of readings) {
      await healthDB.addBloodPressureReading(reading);
    }
  } catch (error) {
    console.error('Error saving blood pressure readings:', error);
    // Fallback to old storage
    await AsyncStorage.setItem(BP_READINGS_KEY, JSON.stringify(readings));
  }
}

export async function addBloodPressureReading(reading: BloodPressureReading): Promise<void> {
  try {
    await healthDB.initialize();
    await healthDB.addBloodPressureReading(reading);
  } catch (error) {
    console.error('Error adding blood pressure reading:', error);
    // Fallback to old storage
    const existingReadings = await loadBloodPressureReadings();
    const updatedReadings = [reading, ...existingReadings];
    await saveBloodPressureReadings(updatedReadings);
  }
}

export async function deleteBloodPressureReading(id: string): Promise<void> {
  try {
    await healthDB.initialize();
    await healthDB.deleteBloodPressureReading(id);
  } catch (error) {
    console.error('Error deleting blood pressure reading:', error);
    // Fallback to old storage
    const existingReadings = await loadBloodPressureReadings();
    const updatedReadings = existingReadings.filter(reading => reading.id !== id);
    await saveBloodPressureReadings(updatedReadings);
  }
}

export function calculateBloodPressureStats(readings: BloodPressureReading[]): BloodPressureStats {
  if (readings.length === 0) {
    return {
      averageSystolic: 0,
      averageDiastolic: 0,
      readingsCount: 0,
      trend: 'unknown'
    };
  }

  const totalSystolic = readings.reduce((sum, reading) => sum + reading.systolic, 0);
  const totalDiastolic = readings.reduce((sum, reading) => sum + reading.diastolic, 0);
  const pulseReadings = readings.filter(r => r.pulse !== undefined);
  const totalPulse = pulseReadings.reduce((sum, reading) => sum + (reading.pulse || 0), 0);

  const averageSystolic = Math.round(totalSystolic / readings.length);
  const averageDiastolic = Math.round(totalDiastolic / readings.length);
  const averagePulse = pulseReadings.length > 0 ? Math.round(totalPulse / pulseReadings.length) : undefined;

  // Calculate trend (simple comparison of first half vs second half)
  let trend: 'stable' | 'increasing' | 'decreasing' | 'unknown' = 'unknown';
  if (readings.length >= 4) {
    const midPoint = Math.floor(readings.length / 2);
    const firstHalf = readings.slice(0, midPoint);
    const secondHalf = readings.slice(midPoint);
    
    const firstHalfAvgSystolic = firstHalf.reduce((sum, r) => sum + r.systolic, 0) / firstHalf.length;
    const secondHalfAvgSystolic = secondHalf.reduce((sum, r) => sum + r.systolic, 0) / secondHalf.length;
    
    const difference = secondHalfAvgSystolic - firstHalfAvgSystolic;
    if (Math.abs(difference) < 5) {
      trend = 'stable';
    } else if (difference > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }
  }

  return {
    averageSystolic,
    averageDiastolic,
    averagePulse,
    readingsCount: readings.length,
    lastReading: readings[0], // Most recent reading
    trend
  };
}
