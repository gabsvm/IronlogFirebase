export type Lang = 'en' | 'es';
export type Theme = 'light' | 'dark' | 'system';
export type ColorTheme = 'iron' | 'ocean' | 'forest' | 'royal' | 'sunset' | 'monochrome';

export type MuscleGroup = 
  | 'CHEST' | 'BACK' | 'QUADS' | 'HAMSTRINGS' 
  | 'GLUTES' | 'CALVES' | 'SHOULDERS' | 'BICEPS' 
  | 'TRICEPS' | 'TRAPS' | 'ABS' | 'FOREARMS'
  | 'CARDIO'; 

export type CardioType = 'steady' | 'hiit' | 'tabata';

export type SetType = 'warmup' | 'regular' | 'drop' | 'failure';

export interface Set {
  id: number;
  weight: number | string;
  reps: number | string;
  rpe?: number | string;
  rir?: number | string;
  completed: boolean;
  type: SetType;
  hintWeight?: number | string;
  hintReps?: number | string;
  prevWeight?: number | string;
  prevReps?: number | string;
}

export interface ExerciseDef {
  id: string;
  name: string;
  muscle: MuscleGroup;
  custom?: boolean;
}

export interface Exercise extends ExerciseDef {
  instanceId: number;
  slotLabel: string;
  targetReps?: string;
  sets: Set[];
}

export interface ActiveSession {
  id: number;
  dayIdx: number;
  mesoId: string;
  week: number;
  name: string;
  exercises: Exercise[];
  startTime: number;
}

export interface Log extends ActiveSession {
  endTime: number;
  duration: number; // in seconds
}

export interface ProgramSlot {
  muscle: MuscleGroup;
  setTarget?: number;
  reps?: string; // e.g., "8-12"
}

export interface ProgramDay {
  dayName: string | { [key in Lang]: string };
  slots: ProgramSlot[];
}

export interface MesoCycle {
  id: string;
  name: string;
  startDate: string;
  plan: { [dayIndex: number]: string[] }; // Map of day index to array of exercise IDs
  week: number;
  isDeload?: boolean;
}

export interface RPFeedback {
  [exerciseId: string]: 'EASY' | 'GOOD' | 'HARD';
}

export interface TutorialState {
  home: boolean;
  workout: boolean;
  history: boolean;
  stats: boolean;
}

export interface AppConfig {
  showRIR: boolean;
  rpEnabled: boolean;
  rpTargetRIR: number;
  keepScreenOn: boolean;
}

export interface AppState {
  program: ProgramDay[];
  activeMeso: MesoCycle | null;
  activeSession: ActiveSession | null;
  exercises: ExerciseDef[];
  logs: Log[];
  config: AppConfig;
  rpFeedback: RPFeedback;
  hasSeenOnboarding: boolean;
  tutorialProgress: TutorialState;
}