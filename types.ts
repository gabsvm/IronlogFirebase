
export type Lang = 'en' | 'es';
export type Theme = 'light' | 'dark' | 'system';

export type MuscleGroup = 
  | 'CHEST' | 'BACK' | 'QUADS' | 'HAMSTRINGS' 
  | 'GLUTES' | 'CALVES' | 'SHOULDERS' | 'BICEPS' 
  | 'TRICEPS' | 'TRAPS' | 'ABS' | 'FOREARMS';

export interface ExerciseDef {
  id: string;
  name: string | { en: string; es: string };
  muscle: MuscleGroup;
}

export type SetType = 'regular' | 'myorep' | 'myorep_match' | 'cluster' | 'top' | 'backoff';

export interface WorkoutSet {
  id: number;
  weight: string | number;
  reps: string | number;
  rpe: string | number; // RIR
  completed: boolean;
  type: SetType;
  skipped?: boolean;
  hintWeight?: string | number;
  hintReps?: string | number;
}

export type WeightUnit = 'kg' | 'lb' | 'pl';

export interface SessionExercise extends ExerciseDef {
  instanceId: number;
  slotLabel?: string;
  targetReps?: string; // e.g., "6-10"
  note?: string;
  sets: WorkoutSet[];
  weightUnit?: WeightUnit; // Changed from 'kg' | 'pl'
  plateWeight?: number; // Weight per plate if unit is 'pl'
  supersetId?: string;
  isPlaceholder?: boolean;
}

export interface ActiveSession {
  id: number;
  dayIdx: number;
  name: string;
  startTime: number | null; // Timestamp
  endTime?: number;
  mesoId: number;
  week: number;
  exercises: SessionExercise[];
}

export interface ProgramSlot {
  muscle: MuscleGroup;
  setTarget: number;
  reps?: string;
  exerciseId?: string | null;
}

export interface ProgramDay {
  id: string;
  dayName: { en: string; es: string };
  slots: ProgramSlot[];
}

export type MesoType = 'hyp_1' | 'hyp_2' | 'metabolite' | 'resensitization' | 'full_body';

export interface MesoCycle {
  id: number;
  name?: string; // User defined name
  mesoType: MesoType; // NEW: Phase type
  week: number;
  plan: (string | null)[][]; // Array of Day Plans (Array of Exercise IDs)
  targetWeeks?: number; // How many weeks intended
  isDeload?: boolean; // Is current week a deload?
}

export interface Log {
  id: number;
  dayIdx: number;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  skipped?: boolean;
  mesoId: number;
  week: number;
  exercises: SessionExercise[];
}

// NEW: Structured feedback for advanced algorithm
export interface FeedbackEntry {
    soreness: number; // 1 (none) to 3 (hurt)
    performance: number; // 1 (bad) to 3 (great)
    adjustment: number; // Calculated change (-1, 0, +1)
}

export interface AppState {
    program: ProgramDay[];
    activeMeso: MesoCycle | null;
    activeSession: ActiveSession | null;
    exercises: ExerciseDef[];
    logs: Log[];
    config: {
        showRIR: boolean;
        rpEnabled: boolean;
        rpTargetRIR: number;
        keepScreenOn: boolean;
    };
    // Updated feedback structure: mesoId -> week -> muscle -> Entry
    rpFeedback: Record<string, Record<string, Record<string, FeedbackEntry>>>; 
    hasSeenOnboarding: boolean;
}