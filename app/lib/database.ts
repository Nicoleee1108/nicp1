import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
    AppSettings,
    BloodPressureReading,
    DatabaseSchema,
    HealthSummary,
    Medication,
    TherapySession
} from '../../types/database';

const DATABASE_KEY = 'health_database';

// Default database structure
const defaultDatabase: DatabaseSchema = {
  medications: [],
  bloodPressureReadings: [],
  therapySessions: [],
  settings: {
    notificationsEnabled: true,
    reminderSound: 'default',
    theme: 'auto',
    units: {
      bloodPressure: 'mmHg',
      weight: 'kg',
      temperature: 'celsius'
    },
    privacySettings: {
      dataSharing: false,
      analytics: true
    }
  },
  lastUpdated: new Date()
};

// Database Manager Class
export class HealthDatabase {
  private static instance: HealthDatabase;
  private database: DatabaseSchema | null = null;

  private constructor() {}

  public static getInstance(): HealthDatabase {
    if (!HealthDatabase.instance) {
      HealthDatabase.instance = new HealthDatabase();
    }
    return HealthDatabase.instance;
  }

  // Initialize database
  public async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(DATABASE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        this.database = {
          ...parsed,
          medications: parsed.medications.map((med: any) => ({
            ...med,
            createdAt: new Date(med.createdAt),
            updatedAt: new Date(med.updatedAt),
            reminders: med.reminders.map((rem: any) => ({
              ...rem,
              // Keep reminder as is since it doesn't have dates
            }))
          })),
          bloodPressureReadings: parsed.bloodPressureReadings.map((bp: any) => ({
            ...bp,
            timestamp: new Date(bp.timestamp)
          })),
          therapySessions: parsed.therapySessions.map((ts: any) => ({
            ...ts,
            timestamp: new Date(ts.timestamp)
          })),
          lastUpdated: new Date(parsed.lastUpdated)
        };
      } else {
        this.database = defaultDatabase;
        await this.save();
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      this.database = defaultDatabase;
    }
  }

  // Get database instance
  private async getDatabase(): Promise<DatabaseSchema> {
    if (!this.database) {
      await this.initialize();
    }
    return this.database!;
  }

  // Save database to storage
  private async save(): Promise<void> {
    try {
      if (this.database) {
        this.database.lastUpdated = new Date();
        await AsyncStorage.setItem(DATABASE_KEY, JSON.stringify(this.database));
      }
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // Medication methods
  public async getMedications(): Promise<Medication[]> {
    const db = await this.getDatabase();
    return db.medications;
  }

  public async addMedication(medication: Medication): Promise<void> {
    const db = await this.getDatabase();
    db.medications.push(medication);
    await this.save();
  }

  public async updateMedication(id: string, updates: Partial<Medication>): Promise<void> {
    const db = await this.getDatabase();
    const index = db.medications.findIndex(med => med.id === id);
    if (index !== -1) {
      db.medications[index] = { ...db.medications[index], ...updates, updatedAt: new Date() };
      await this.save();
    }
  }

  public async deleteMedication(id: string): Promise<void> {
    const db = await this.getDatabase();
    db.medications = db.medications.filter(med => med.id !== id);
    await this.save();
  }

  // Blood pressure methods
  public async getBloodPressureReadings(): Promise<BloodPressureReading[]> {
    const db = await this.getDatabase();
    return db.bloodPressureReadings;
  }

  public async addBloodPressureReading(reading: BloodPressureReading): Promise<void> {
    const db = await this.getDatabase();
    db.bloodPressureReadings.unshift(reading); // Add to beginning for chronological order
    await this.save();
  }

  public async deleteBloodPressureReading(id: string): Promise<void> {
    const db = await this.getDatabase();
    db.bloodPressureReadings = db.bloodPressureReadings.filter(bp => bp.id !== id);
    await this.save();
  }

  // Therapy session methods
  public async getTherapySessions(): Promise<TherapySession[]> {
    const db = await this.getDatabase();
    return db.therapySessions;
  }

  public async addTherapySession(session: TherapySession): Promise<void> {
    const db = await this.getDatabase();
    db.therapySessions.unshift(session);
    await this.save();
  }

  public async deleteTherapySession(id: string): Promise<void> {
    const db = await this.getDatabase();
    db.therapySessions = db.therapySessions.filter(ts => ts.id !== id);
    await this.save();
  }

  // Settings methods
  public async getSettings(): Promise<AppSettings> {
    const db = await this.getDatabase();
    return db.settings;
  }

  public async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const db = await this.getDatabase();
    db.settings = { ...db.settings, ...updates };
    await this.save();
  }

  // Health summary for homepage
  public async getHealthSummary(): Promise<HealthSummary> {
    const db = await this.getDatabase();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate next medication dose
    const activeMedications = db.medications.filter(med => med.isActive);
    let nextDose: { medication: string; time: string } | undefined;
    
    if (activeMedications.length > 0) {
      const currentTime = now.getHours() * 60 + now.getMinutes();
      let minTimeDiff = Infinity;
      
      activeMedications.forEach(med => {
        med.reminders.forEach(reminder => {
          if (reminder.isActive) {
            const reminderTime = reminder.hour * 60 + reminder.minute;
            const timeDiff = reminderTime - currentTime;
            const adjustedTimeDiff = timeDiff < 0 ? timeDiff + 1440 : timeDiff;
            
            if (adjustedTimeDiff < minTimeDiff) {
              minTimeDiff = adjustedTimeDiff;
              const nextDoseHour = Math.floor((reminderTime + (timeDiff < 0 ? 1440 : 0)) / 60) % 24;
              const nextDoseMinute = (reminderTime + (timeDiff < 0 ? 1440 : 0)) % 60;
              nextDose = {
                medication: med.name,
                time: `${String(nextDoseHour).padStart(2, '0')}:${String(nextDoseMinute).padStart(2, '0')}`
              };
            }
          }
        });
      });
    }

    // Calculate blood pressure averages for last 7 days
    const recentBPReadings = db.bloodPressureReadings.filter(bp => bp.timestamp >= weekAgo);
    let average7d: { systolic: number; diastolic: number } | undefined;
    
    if (recentBPReadings.length > 0) {
      const totalSystolic = recentBPReadings.reduce((sum, bp) => sum + bp.systolic, 0);
      const totalDiastolic = recentBPReadings.reduce((sum, bp) => sum + bp.diastolic, 0);
      average7d = {
        systolic: Math.round(totalSystolic / recentBPReadings.length),
        diastolic: Math.round(totalDiastolic / recentBPReadings.length)
      };
    }

    // Calculate BP trend
    let trend: 'stable' | 'increasing' | 'decreasing' | 'unknown' = 'unknown';
    if (recentBPReadings.length >= 4) {
      const midPoint = Math.floor(recentBPReadings.length / 2);
      const firstHalf = recentBPReadings.slice(0, midPoint);
      const secondHalf = recentBPReadings.slice(midPoint);
      
      const firstHalfAvg = firstHalf.reduce((sum, bp) => sum + bp.systolic, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, bp) => sum + bp.systolic, 0) / secondHalf.length;
      
      const difference = secondHalfAvg - firstHalfAvg;
      if (Math.abs(difference) < 5) {
        trend = 'stable';
      } else if (difference > 0) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }
    }

    // Get today's therapy sessions
    const todaySessions = db.therapySessions.filter(ts => 
      ts.timestamp >= today && ts.timestamp < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    );

    return {
      medications: {
        total: db.medications.length,
        active: activeMedications.length,
        nextDose,
        adherence7d: Math.floor(Math.random() * 20 + 80) // Mock adherence for now
      },
      bloodPressure: {
        lastReading: db.bloodPressureReadings[0],
        average7d,
        trend
      },
      therapy: {
        todaySessions: todaySessions.length,
        lastSession: db.therapySessions[0],
        weeklyGoal: 5 // Default weekly goal
      }
    };
  }

  // Migration method for existing data
  public async migrateFromOldStorage(): Promise<void> {
    try {
      // Check if old medication data exists
      const oldMeds = await AsyncStorage.getItem('medications');
      if (oldMeds && this.database) {
        const medications = JSON.parse(oldMeds);
        const migratedMeds = medications.map((med: any) => ({
          ...med,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          reminders: med.reminders.map((rem: any) => ({
            ...rem,
            isActive: true
          }))
        }));
        
        this.database.medications = migratedMeds;
        await this.save();
        
        // Remove old storage
        await AsyncStorage.removeItem('medications');
        console.log('Successfully migrated medication data');
      }
    } catch (error) {
      console.error('Error migrating data:', error);
    }
  }
}

// Export singleton instance
export const healthDB = HealthDatabase.getInstance();

