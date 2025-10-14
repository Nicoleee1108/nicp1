export interface BloodPressureReading {
  id: string;
  systolic: number; // Top number (e.g., 120)
  diastolic: number; // Bottom number (e.g., 80)
  pulse?: number; // Optional heart rate
  timestamp: Date;
  notes?: string; // Optional notes about the reading
}

export interface BloodPressureStats {
  averageSystolic: number;
  averageDiastolic: number;
  averagePulse?: number;
  readingsCount: number;
  lastReading?: BloodPressureReading;
  trend: 'stable' | 'increasing' | 'decreasing' | 'unknown';
}

export type BloodPressureCategory = 
  | 'normal' 
  | 'elevated' 
  | 'high_stage_1' 
  | 'high_stage_2' 
  | 'hypertensive_crisis';

export function getBloodPressureCategory(systolic: number, diastolic: number): BloodPressureCategory {
  if (systolic < 120 && diastolic < 80) return 'normal';
  if (systolic < 130 && diastolic < 80) return 'elevated';
  if (systolic < 140 || diastolic < 90) return 'high_stage_1';
  if (systolic < 180 || diastolic < 120) return 'high_stage_2';
  return 'hypertensive_crisis';
}

export function getCategoryLabel(category: BloodPressureCategory): string {
  switch (category) {
    case 'normal': return 'Normal';
    case 'elevated': return 'Elevated';
    case 'high_stage_1': return 'High Stage 1';
    case 'high_stage_2': return 'High Stage 2';
    case 'hypertensive_crisis': return 'Hypertensive Crisis';
  }
}

export function getCategoryColor(category: BloodPressureCategory): string {
  switch (category) {
    case 'normal': return '#10b981'; // emerald-500
    case 'elevated': return '#f59e0b'; // amber-500
    case 'high_stage_1': return '#f97316'; // orange-500
    case 'high_stage_2': return '#ef4444'; // red-500
    case 'hypertensive_crisis': return '#dc2626'; // red-600
  }
}
