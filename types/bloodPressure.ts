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
  | 'stage_1_hypertension' 
  | 'stage_2_hypertension' 
  | 'severe_hypertension'
  | 'hypertensive_emergency';

export function getBloodPressureCategory(systolic: number, diastolic: number): BloodPressureCategory {
  // NORMAL: Systolic < 120 AND Diastolic < 80
  if (systolic < 120 && diastolic < 80) return 'normal';
  
  // ELEVATED: Systolic 120-129 AND Diastolic < 80
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) return 'elevated';
  
  // STAGE 1 HYPERTENSION: Systolic 130-139 OR Diastolic 80-89
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return 'stage_1_hypertension';
  
  // STAGE 2 HYPERTENSION: Systolic >= 140 OR Diastolic >= 90
  if (systolic >= 140 || diastolic >= 90) {
    // Check for severe/emergency levels
    if (systolic > 180 || diastolic > 120) {
      // Both severe hypertension and hypertensive emergency have same criteria
      // The distinction is based on symptoms, which we can't determine from BP alone
      // We'll default to severe hypertension for now
      return 'severe_hypertension';
    }
    return 'stage_2_hypertension';
  }
  
  // This should not be reached with proper logic above, but fallback
  return 'normal';
}

export function getCategoryLabel(category: BloodPressureCategory): string {
  // This function will be updated to use translations
  // For now, return English labels - they will be replaced by t() calls in components
  switch (category) {
    case 'normal': return 'Normal';
    case 'elevated': return 'Elevated';
    case 'stage_1_hypertension': return 'Stage 1 Hypertension';
    case 'stage_2_hypertension': return 'Stage 2 Hypertension';
    case 'severe_hypertension': return 'Severe Hypertension';
    case 'hypertensive_emergency': return 'Hypertensive Emergency';
  }
}

export function getCategoryColor(category: BloodPressureCategory): string {
  switch (category) {
    case 'normal': return '#10b981'; // emerald-500 (light green)
    case 'elevated': return '#f59e0b'; // amber-500 (yellow)
    case 'stage_1_hypertension': return '#f97316'; // orange-500 (orange)
    case 'stage_2_hypertension': return '#dc2626'; // red-600 (darker orange/brown)
    case 'severe_hypertension': return '#dc2626'; // red-600 (red)
    case 'hypertensive_emergency': return '#7c2d12'; // red-900 (dark purple/maroon)
  }
}
