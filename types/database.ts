// Database schema and types for all health data
export interface DatabaseSchema {
  medications: Medication[];
  bloodPressureReadings: BloodPressureReading[];
  therapySessions: TherapySession[];
  settings: AppSettings;
  lastUpdated: Date;
}

// Enhanced medication interface
export interface Medication {
  id: string;
  name: string;
  usage: string;
  dosagePerIntake: number;
  timesPerDay: number;
  reminders: Reminder[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  adherenceData?: AdherenceData;
}

export interface Reminder {
  notificationId: string;
  hour: number;
  minute: number;
  isActive: boolean;
}

export interface AdherenceData {
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  lastTaken?: Date;
  streakDays: number;
}

// Blood pressure interface (already exists but adding to unified schema)
export interface BloodPressureReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: Date;
  notes?: string;
}

// Therapy session interface
export interface TherapySession {
  id: string;
  type: 'exercise' | 'diet' | 'other';
  title: string;
  description: string;
  duration?: number; // in minutes
  timestamp: Date;
  notes?: string;
  reminder?: TherapyReminder; // Optional reminder for recurring sessions
}

// Therapy reminder interface
export interface TherapyReminder {
  notificationId: string;
  hour: number;
  minute: number;
  isActive: boolean;
  frequency: 'daily' | 'weekly' | 'custom'; // How often to remind
  customDays?: number[]; // For custom frequency (0=Sunday, 1=Monday, etc.)
}

// App settings interface
export interface AppSettings {
  notificationsEnabled: boolean;
  reminderSound: string;
  theme: 'light' | 'dark' | 'auto';
  units: {
    bloodPressure: 'mmHg';
    weight: 'kg' | 'lbs';
    temperature: 'celsius' | 'fahrenheit';
  };
  privacySettings: {
    dataSharing: boolean;
    analytics: boolean;
  };
}

// Health summary interface for homepage
export interface HealthSummary {
  medications: {
    total: number;
    active: number;
    nextDose?: {
      medication: string;
      time: string;
    };
  };
  bloodPressure: {
    lastReading?: BloodPressureReading;
    average7d?: {
      systolic: number;
      diastolic: number;
    };
    trend: 'stable' | 'increasing' | 'decreasing' | 'unknown';
  };
  therapy: {
    todaySessions: number;
    lastSession?: TherapySession;
    weeklyGoal?: number;
  };
}

