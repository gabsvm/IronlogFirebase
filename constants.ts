
import { ExerciseDef, ProgramDay, MuscleGroup } from './types';

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = { 
    CHEST: 'CHEST', BACK: 'BACK', QUADS: 'QUADS', HAMS: 'HAMSTRINGS', 
    GLUTES: 'GLUTES', CALVES: 'CALVES', SHOULDERS: 'SHOULDERS', 
    BICEPS: 'BICEPS', TRICEPS: 'TRICEPS', TRAPS: 'TRAPS', 
    ABS: 'ABS', FOREARMS: 'FOREARMS'
};

export const DEFAULT_LIBRARY: ExerciseDef[] = [
    // Chest
    { 
        id: 'bp_flat', 
        name: { en: 'Machine Chest Press', es: 'Press Pecho Máquina' }, 
        muscle: 'CHEST',
        instructions: { en: "Standard volume builder.", es: "Añade volumen de forma segura." }
    },
    { 
        id: 'bp_inc', 
        name: { en: 'Incline Dumbbell Press', es: 'Press Inclinado Mancuernas' }, 
        muscle: 'CHEST',
        instructions: { en: "Focus on upper chest. Get a deep stretch.", es: "Enfoque en pecho superior. Busca un estiramiento profundo." }
    },
    { 
        id: 'bp_bar', 
        name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' }, 
        muscle: 'CHEST' 
    },
    { 
        id: 'bp_inc_bar', 
        name: { en: 'Incline Barbell Press', es: 'Press Inclinado Barra' }, 
        muscle: 'CHEST',
        instructions: { en: "Regular grip, control the descent. Touches upper chest.", es: "Agarre regular, controla la bajada. Toca la parte superior del pecho." }
    },
    { 
        id: 'bp_inc_wide', 
        name: { en: 'Wide Grip Incline Press', es: 'Press Inclinado Agarre Ancho' }, 
        muscle: 'CHEST',
        instructions: { en: "Wider grip to bias chest. Pause at the bottom.", es: "Agarre más ancho para enfatizar el pecho. Haz una pausa en la parte inferior." }
    },
    { 
        id: 'pec_fly', 
        name: { en: 'Pec Dec Flye', es: 'Aperturas Pec Dec' }, 
        muscle: 'CHEST' 
    },
    
    // Back
    { 
        id: 'lat_pull', 
        name: { en: 'Lat Pulldown', es: 'Jalón al Pecho' }, 
        muscle: 'BACK',
        instructions: { en: "Prone, neutral, or supine grip. Focus on back width.", es: "Agarre prono, neutro o supino. Enfocado en la amplitud de espalda." }
    },
    { 
        id: 'lat_pull_supine', 
        name: { en: 'Supine Lat Pulldown', es: 'Jalón Supino (Chin-grip)' }, 
        muscle: 'BACK',
        instructions: { en: "Underhand grip. Great for lats.", es: "Agarre supino (palmas hacia ti). Excelente para dorsales." }
    },
    { 
        id: 'lat_prayer', 
        name: { en: 'Cable Lat Prayer', es: 'Pullover Polea Alta' }, 
        muscle: 'BACK',
        instructions: { en: "Isolation movement for back width. Keep tension constant.", es: "Movimiento de aislamiento para ancho de espalda. Mantén tensión constante." }
    },
    { id: 'row_mach', name: { en: 'Machine Row', es: 'Remo en Máquina' }, muscle: 'BACK' },
    { id: 'row_cable', name: { en: 'Cable Row', es: 'Remo en Polea' }, muscle: 'BACK' },
    { 
        id: 'pullup', 
        name: { en: 'Pull Ups', es: 'Dominadas' }, 
        muscle: 'BACK',
        instructions: { en: "Strict technique, full range of motion. No swinging.", es: "Técnica estricta, rango de movimiento completo. Sin balanceos." } 
    },
    
    // Legs
    { id: 'sq_hack', name: { en: 'Hack Squat', es: 'Sentadilla Hack' }, muscle: 'QUADS' },
    { id: 'leg_ext', name: { en: 'Leg Extension', es: 'Extensiones de Cuádriceps' }, muscle: 'QUADS' },
    { 
        id: 'leg_press', 
        name: { en: 'Leg Press', es: 'Prensa de Piernas' }, 
        muscle: 'QUADS',
        instructions: { en: "Maintenance volume. Full ROM.", es: "Volumen de mantenimiento. Rango completo." } 
    },
    { id: 'rdl', name: { en: 'Romanian Deadlift', es: 'Peso Muerto Rumano' }, muscle: 'HAMSTRINGS' },
    { id: 'leg_curl', name: { en: 'Seated Leg Curl', es: 'Curl Femoral Sentado' }, muscle: 'HAMSTRINGS' },
    { id: 'lying_curl', name: { en: 'Lying Leg Curl', es: 'Curl Femoral Tumbado' }, muscle: 'HAMSTRINGS' },
    { id: 'calf_raise', name: { en: 'Calf Raise', es: 'Elevación de Talones' }, muscle: 'CALVES' },
    
    // Shoulders
    { id: 'ohp', name: { en: 'Overhead Press', es: 'Press Militar' }, muscle: 'SHOULDERS' },
    { 
        id: 'lat_raise', 
        name: { en: 'Lateral Raise', es: 'Elevaciones Laterales' }, 
        muscle: 'SHOULDERS',
        instructions: { en: "Standard dumbbell raises for capped delts.", es: "Elevaciones estándar para hombros redondos 'capitaneados'." }
    },
    { 
        id: 'lat_raise_cable', 
        name: { en: 'Cable Lateral Raise', es: 'Elev. Laterales Polea' }, 
        muscle: 'SHOULDERS',
        instructions: { en: "Maintain constant tension throughout the movement.", es: "Mantén tensión constante durante todo el movimiento." }
    },
    { id: 'lat_raise_mach', name: { en: 'Machine Lateral Raise', es: 'Elev. Laterales Máquina' }, muscle: 'SHOULDERS' },
    { id: 'lat_raise_seat', name: { en: 'Seated Lateral Raise', es: 'Elev. Laterales Sentado' }, muscle: 'SHOULDERS' },
    { id: 'face_pull', name: { en: 'Face Pull', es: 'Face Pull' }, muscle: 'SHOULDERS' },
    { id: 'shrug_db', name: { en: 'Dumbbell Shrugs', es: 'Encogimientos Mancuerna' }, muscle: 'TRAPS' },
    
    // Arms
    { 
        id: 'curl_ez', 
        name: { en: 'EZ Bar Curl', es: 'Curl Barra EZ' }, 
        muscle: 'BICEPS',
        instructions: { en: "Strict curls. Range 5-10 or 10-15.", es: "Curl estricto. Rangos de 5-10 o 10-15 reps." }
    },
    { 
        id: 'curl_bar', 
        name: { en: 'Barbell Curl', es: 'Curl con Barra' }, 
        muscle: 'BICEPS',
        instructions: { en: "Can use Myo-reps here for volume.", es: "Puedes usar Myo-reps aquí para meter volumen rápido." }
    },
    { id: 'curl_db', name: { en: 'Dumbbell Curl', es: 'Curl con Mancuernas' }, muscle: 'BICEPS' },
    { 
        id: 'curl_cable', 
        name: { en: 'Cable Curl', es: 'Curl en Polea' }, 
        muscle: 'BICEPS',
        instructions: { en: "High reps (15-20). Constant tension.", es: "Altas repeticiones (15-20). Tensión constante." }
    },
    
    { 
        id: 'skull_crusher', 
        name: { en: 'Skull Crushers', es: 'Rompecráneos (Skullcrusher)' }, 
        muscle: 'TRICEPS',
        instructions: { en: "Keep elbows tucked in.", es: "Mantén los codos cerrados hacia dentro." }
    },
    { id: 'tri_push', name: { en: 'Tricep Pushdown', es: 'Extensión Tríceps Polea' }, muscle: 'TRICEPS' },
    { 
        id: 'tri_ext', 
        name: { en: 'Overhead Extension', es: 'Extensión sobre Cabeza' }, 
        muscle: 'TRICEPS',
        instructions: { en: "Focus on the long head stretch.", es: "Enfócate en el estiramiento de la cabeza larga." }
    },
    { 
        id: 'jm_press', 
        name: { en: 'JM Press / Smith Tri', es: 'Press JM / Smith Tríceps' }, 
        muscle: 'TRICEPS',
        instructions: { en: "Giant set style: aim for 50-60 total reps.", es: "Estilo 'Giant Set': busca 50-60 reps totales con descansos cortos." }
    },
    
    { id: 'abs_cable', name: { en: 'Cable Crunch', es: 'Crunch en Polea' }, muscle: 'ABS' },
    { 
        id: 'wrist_curl', 
        name: { en: 'Wrist Curl', es: 'Curl de Muñeca' }, 
        muscle: 'FOREARMS',
        instructions: { en: "Marathon sets: 50-60 reps with short breaks.", es: "Series maratón: 50-60 repeticiones con descansos cortos." }
    },
    {
        id: 'forearm_pushup',
        name: { en: 'Forearm Bar Pushups', es: 'Flexiones Antebrazo en Barra' },
        muscle: 'FOREARMS',
        instructions: { en: "Lean on bar, push with fingers/wrists.", es: "Apóyate en la barra, empuja usando dedos y muñecas." }
    }
];

export const DEFAULT_TEMPLATE: ProgramDay[] = [ 
    { id: 'd1', dayName: { en: "Upper 1", es: "Torso 1" }, slots: [{ muscle: 'CHEST', setTarget: 3 }, { muscle: 'CHEST', setTarget: 3 }, { muscle: 'TRICEPS', setTarget: 3 }, { muscle: 'BACK', setTarget: 3 }, { muscle: 'BACK', setTarget: 3 }, { muscle: 'BICEPS', setTarget: 3 }, { muscle: 'SHOULDERS', setTarget: 3 }] }, 
    { id: 'd2', dayName: { en: "Lower 1", es: "Pierna 1" }, slots: [{ muscle: 'QUADS', setTarget: 3 }, { muscle: 'QUADS', setTarget: 3 }, { muscle: 'GLUTES', setTarget: 3 }, { muscle: 'HAMSTRINGS', setTarget: 3 }, { muscle: 'CALVES', setTarget: 3 }] }, 
    { id: 'd3', dayName: { en: "Upper 2", es: "Torso 2" }, slots: [{ muscle: 'SHOULDERS', setTarget: 3 }, { muscle: 'BICEPS', setTarget: 3 }, { muscle: 'BICEPS', setTarget: 3 }, { muscle: 'BACK', setTarget: 3 }, { muscle: 'TRICEPS', setTarget: 3 }, { muscle: 'TRICEPS', setTarget: 3 }, { muscle: 'CHEST', setTarget: 3 }] }, 
    { id: 'd4', dayName: { en: "Lower 2", es: "Pierna 2" }, slots: [{ muscle: 'HAMSTRINGS', setTarget: 3 }, { muscle: 'HAMSTRINGS', setTarget: 3 }, { muscle: 'GLUTES', setTarget: 3 }, { muscle: 'QUADS', setTarget: 3 }, { muscle: 'CALVES', setTarget: 3 }] } 
];

// Dr. Mike's "Pure Bodybuilding / Aesthetic Focus" Routine (4 Days)
export const FULL_BODY_TEMPLATE: ProgramDay[] = [
    { 
        id: 'aes1', 
        dayName: { en: "Day 1: Back Width & Upper Chest", es: "Día 1: Amplitud Espalda & Pecho Alto" }, 
        slots: [
            { muscle: 'BACK', setTarget: 3, exerciseId: 'pullup' },        // Strict Technique
            { muscle: 'BACK', setTarget: 3, exerciseId: 'lat_pull' },      // Varied Grip
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc_bar' },   // Control descent
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc' },       // DB Volume
            { muscle: 'QUADS', setTarget: 2, exerciseId: 'leg_press' }     // Maintenance Legs
        ] 
    },
    { 
        id: 'aes2', 
        dayName: { en: "Day 2: Arms & Delts (Tri Focus)", es: "Día 2: Brazos & Hombros (Énfasis Tríceps)" }, 
        slots: [
            { muscle: 'TRICEPS', setTarget: 4, exerciseId: 'skull_crusher' }, // Elbows tucked
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'tri_ext' },       // Long head (Overhead)
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'lat_raise' },   // Side Delts
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise_cable' }, // Constant Tension
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_bar' },       // Myo-reps suggested
            { muscle: 'FOREARMS', setTarget: 3, exerciseId: 'wrist_curl' }    // High reps (50-60)
        ] 
    },
    { 
        id: 'aes3', 
        dayName: { en: "Day 3: Chest & Back (Chest Focus)", es: "Día 3: Pecho & Espalda (Énfasis Pecho)" }, 
        slots: [
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_inc_wide' },    // Wide Grip, Pause at bottom
            { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_flat' },        // Machine Press Volume
            { muscle: 'BACK', setTarget: 3, exerciseId: 'lat_pull_supine' }, // Supine/Chin Grip
            { muscle: 'BACK', setTarget: 3, exerciseId: 'lat_prayer' },      // Isolation Width
            { muscle: 'QUADS', setTarget: 2, exerciseId: 'leg_ext' }         // Maintenance Legs
        ] 
    },
    { 
        id: 'aes4', 
        dayName: { en: "Day 4: Arms & Delts (Bi Focus)", es: "Día 4: Brazos & Hombros (Énfasis Bíceps)" }, 
        slots: [
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_ez' },          // 5-10 or 10-15 range
            { muscle: 'BICEPS', setTarget: 4, exerciseId: 'curl_cable' },       // High rep 15-20
            { muscle: 'SHOULDERS', setTarget: 4, exerciseId: 'lat_raise_mach' },// Machine
            { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise_seat' },// Seated DB
            { muscle: 'TRICEPS', setTarget: 3, exerciseId: 'jm_press' },        // Giant set style (50-60 total)
            { muscle: 'FOREARMS', setTarget: 3, exerciseId: 'forearm_pushup' }  // Forearm pushups
        ] 
    }
];

export const TRANSLATIONS = {
    en: { 
        startMeso: "Start New Mesocycle", finishWorkout: "Finish Workout", finishConfirm: "Finish workout?", cancel: "Cancel", delete: "Delete", skip: "Skip Exercise", skipDay: "Skip Workout", skipped: "Skipped", completed: "Completed", swap: "Swap Exercise", changeMuscle: "Change muscle", chooseMuscle: "Choose muscle", addSetBelow: "Add Set Below", deleteSet: "Delete Set", skipSet: "Skip Set", unskipSet: "Unskip Set", sets: "Set", weight: "Weight", reps: "Reps", rir: "RIR", log: "Log", note: "Range: 6-10", active: "Active", history: "Progress", settings: "Settings", volume: "Weekly Volume", workouts: "Recent Workouts", noData: "No data", duration: "Duration", exercises: "Exercises", configure: "Configure", week: "WEEK", massPhase: "Mass Phase", resting: "Resting", language: "Language", theme: "Theme", back: "Back", finishCycle: "Finish Cycle", confirmCycle: "Finish current mesocycle?", selectEx: "Select Exercise", searchPlaceholder: "Search...", createEx: "Create", noExFound: "No exercises found", keepScreen: "Keep Screen On", setType: "SET TYPE", mesoStats: "Mesocycle Stats", totalWorkouts: "Total Workouts", currentWeek: "Current Week", linkSuperset: "Link Superset", unlinkSuperset: "Unlink", selectToLink: "Select exercise to link...", superset: "SUPERSET", workoutComplete: "WORKOUT COMPLETE", goodJob: "Great job!", totalVolume: "Total Volume", totalSets: "Total Sets", totalReps: "Total Reps", share: "Share", close: "Save & Close", resume: "Resume Workout", backup: "Data Backup", export: "Export Data", import: "Import Data", importConfirm: "Overwrite data?", dataSaved: "Saved!", addSet: "Set", remSet: "Set", delSlot: "Delete Slot", offline: "Local Mode", mesoAvg: "Meso Avg Volume", routineGuide: "Routine Guide", executionInfo: "Execution & Goals",
        types: { regular: "Regular", myorep: "Myorep", myorep_match: "Myorep Match", cluster: "Cluster", top: "Top Set", backoff: "Back-off Set", giant: "Giant Set", warmup: "Warmup" }, 
        typeDesc: { 
            regular: "Standard straight set", 
            myorep: "Activation set + mini-sets (short rest)", 
            myorep_match: "Match reps of previous set", 
            cluster: "Intra-set rest periods", 
            top: "Heaviest set (High Intensity)", 
            backoff: "Volume work after Top Set", 
            giant: "High reps to failure (Metabolite)", 
            warmup: "Low fatigue preparation" 
        }, 
        muscle: { CHEST: "Chest", BACK: "Back", QUADS: "Quads", HAMSTRINGS: "Hamstrings", GLUTES: "Glutes", CALVES: "Calves", SHOULDERS: "Shoulders", BICEPS: "Biceps", TRICEPS: "Triceps", TRAPS: "Traps", ABS: "Abs", FOREARMS: "Forearms" },
        rp: "RP Progression", rpEnabled: "RP suggestions", rpTargetRIR: "Target RIR", rpFeedbackTitle: "Muscle feedback", rpRatingHelp: "1=too little, 3=good, 5=too much", rpSave: "Save feedback", rpSuggestion: "Suggested", rpNoSuggestion: "No suggestion",
        editTemplate: "Edit Program", resetTemplate: "Reset to Default", editDay: "Edit Day", addDay: "Add Day", addSlot: "Add Exercise Slot", save: "Save", swapTitle: "Swap Exercise", swapMsg: "How do you want to apply this change?", swapSession: "This Session Only", swapForever: "Update Plan (Forever)", programEditor: "Program Editor", selectExBtn: "Select Exercise", any: "Any",
        manageEx: "Manage Exercises", addEx: "Add New Exercise", exName: "Exercise Name", selectMuscle: "Select Muscle", deleteConfirm: "Delete this exercise?",
        setsCount: "Sets", notes: "Notes", addNote: "Add Note...", volumeStatus: { low: "Low", maintenance: "Maint.", optimal: "Optimal", high: "High" }, showRIR: "Show RIR Column", install: "Install App", unitToggle: "Weight Unit", addExercise: "Add Exercise", updateTemplate: "Update Routine Template", selectMuscleToAdd: "Select Muscle to Add",
        appearance: "Appearance", database: "Base de Datos", dangerZone: "Danger Zone", factoryReset: "Factory Reset App", workoutConfig: "Workout Config",
        completeWeek: "Complete Week", completeWeekConfirm: "Advance to next week?", autoRegulate: "Auto-regulate volume?", autoRegulateDesc: "Based on your sore/pump feedback, we will adjust set counts for next week.", applyingChanges: "Applying Changes:", setsAdded: "sets added", setsRemoved: "sets removed", noChanges: "No volume changes needed.",
        finishMesoConfirm: "Finish this mesocycle? This will archive your current progress and let you start a fresh cycle.",
        deleteDataConfirm: "Delete ALL data? This cannot be undone.",
        importSuccess: "Import successful!", invalidFile: "Invalid file format",
        day: "Day",
        replaceEx: "Replace Exercise", removeEx: "Remove Exercise", moveUp: "Move Up", moveDown: "Move Down",
        emptyWorkoutTitle: "Empty Workout?", emptyWorkoutMsg: "You haven't completed any sets yet. Are you sure?",
        completedSetsMsg: "You've completed {0} sets. Save progress?", confirmRemoveEx: "Remove this exercise from current session?",
        volPerCycle: "Volume (Sets) / Cycle", avgDuration: "Duration", addSetBtn: "ADD SET", removeSetBtn: "REMOVE SET",
        prev: "Prev", target: "TARGET",
        warmup: "Smart Warmup", warmupTitle: "Warmup Protocol", potentiation: "Potentiation", workingWeight: "Working Weight",
        warmupSets: { light: "Light", moderate: "Moderate", potentiation: "Potentiation" },
        mesoConfig: "Mesocycle Settings", targetWeeks: "Planned Duration", weeks: "Weeks",
        deloadMode: "Deload Mode", deloadDesc: "Reduces volume (50%) for recovery.", enableDeload: "Enable Deload",
        skipDayConfirm: "Skip this workout? It will be marked as skipped.",
        mesoName: "Mesocycle Name",
        exportReport: "Export Report & Finish", justFinish: "Just Finish",
        mesoType: "Phase Type",
        phases: {
            hyp_1: "Base Hypertrophy 1",
            hyp_2: "Base Hypertrophy 2",
            metabolite: "Metabolite Phase",
            resensitization: "Resensitization",
            full_body: "Aesthetic V-Taper (Dr. Mike)"
        },
        phaseDesc: {
            hyp_1: "Standard volume accumulation. RIR 3->1.",
            hyp_2: "Higher initial volume. Aggressive overload.",
            metabolite: "High reps (20-30), short rests, the 'burn'.",
            resensitization: "Low volume, heavy weight (3-6 reps) to reset fatigue.",
            full_body: "Focus on V-Taper (Lats/Side Delts) & Arms. Maintenance Legs."
        },
        targetRIR: "Target RIR",
        recoveryWeek: "Recovery Week",
        
        // Plates & Units
        units: {
            kg: "KG",
            pl: "Plates",
            lb: "LBS",
            toggle: "Change Unit (KG/Plates)",
            plateWeight: "Weight per Plate",
            setPlateWeight: "Set Weight per Plate (kg)",
            enterWeight: "e.g. 5, 10..."
        },
        
        // Feedback Matrix
        fb: {
            sorenessLabel: "Soreness / Recovery",
            performanceLabel: "Performance / Pump",
            soreness: {
                1: "None / Healed Early",
                2: "Healed on Time",
                3: "Still Sore / Ouch"
            },
            performance: {
                1: "Bad / Weak",
                2: "Good / Target",
                3: "Great / Strong"
            },
            adjust: {
                add: "+1 Set",
                sub: "-1 Set",
                keep: "Keep Volume"
            }
        },
        
        // Onboarding
        onb: {
            skip: "Skip", next: "Next", start: "Start",
            s1_title: "Welcome to IronLog", s1_desc: "The ultimate tool for hypertrophy training, designed with RP principles.",
            s2_title: "Mesocycles", s2_desc: "Organize training into weeks. We auto-regulate volume based on your feedback.",
            s3_title: "Smart Tracking", s3_desc: "Track RIR, use our built-in rest timer, and get warmup sets calculated instantly.",
            s4_title: "Progress", s4_desc: "Visualize your volume landmarks (MEV/MRV) and ensure you are overloading progressively."
        },
        createAndSelect: "Create & Select",
        overwriteTemplateConfirm: "This overwrites your current plan with Dr. Mike's Aesthetic Split (4 Days/Week).",
        newRecord: "New Record!",
        prMessage: "You beat your previous best estimates!",
        continue: "Continue"
    },
    es: { 
        startMeso: "Iniciar Mesociclo", finishWorkout: "Terminar Sesión", finishConfirm: "¿Terminar entrenamiento?", cancel: "Cancelar", delete: "Borrar", skip: "Saltar Ejercicio", skipDay: "Saltar Día", skipped: "Saltado", completed: "Completado", swap: "Reemplazar Ejercicio", changeMuscle: "Cambiar músculo", chooseMuscle: "Elegir músculo", addSetBelow: "Añadir Serie Debajo", deleteSet: "Borrar Serie", skipSet: "Saltar Serie", unskipSet: "Restaurar Serie", sets: "Serie", weight: "Peso", reps: "Reps", rir: "RIR", log: "Log", note: "Rango: 6-10", active: "Activo", history: "Progreso", settings: "Ajustes", rp: "Progresión RP", rpEnabled: "Sugerencias RP", rpTargetRIR: "RIR objetivo", volume: "Volumen Semanal", workouts: "Sesiones Recientes", noData: "Sin datos", duration: "Duración", exercises: "Ejercicios", configure: "Configurar", week: "SEMANA", massPhase: "Fase Volumen", resting: "Descansando", language: "Idioma", theme: "Tema", back: "Volver", finishCycle: "Terminar Ciclo", confirmCycle: "¿Terminar el mesociclo actual?", selectEx: "Seleccionar Ejercicio", searchPlaceholder: "Buscar...", createEx: "Crear", noExFound: "No encontrado", keepScreen: "Pantalla Encendida", setType: "TIPO DE SERIE", mesoStats: "Estadísticas Ciclo", totalWorkouts: "Entrenamientos", currentWeek: "Semana Actual", linkSuperset: "Vincular Superserie", unlinkSuperset: "Desvincular", selectToLink: "Selecciona para unir...", superset: "SUPERSERIE", workoutComplete: "¡ENTRENAMIENTO TERMINADO!", goodJob: "¡Buen trabajo!", totalVolume: "Volumen Total", totalSets: "Series Totales", totalReps: "Reps Totales", share: "Compartir", close: "Guardar y Cerrar", resume: "Reanudar", backup: "Copia de Seguridad", export: "Exportar Datos", import: "Importar Datos", importConfirm: "Esto sobrescribirá los datos. ¿Continuar?", dataSaved: "¡Guardado!", addSet: "Serie", remSet: "Serie", delSlot: "Eliminar Slot", offline: "Modo Local", mesoAvg: "Promedio Mesociclo", routineGuide: "Guía de Rutina", executionInfo: "Ejecución & Objetivos",
        types: { regular: "Regular", myorep: "Myorep", myorep_match: "Myorep Match", cluster: "Cluster", top: "Top Set", backoff: "Back-off Set", giant: "Giant Set", warmup: "Calentamiento" }, 
        typeDesc: { 
            regular: "Serie efectiva estándar", 
            myorep: "Activación + mini-series (Rest-pause)", 
            myorep_match: "Igualar reps de serie anterior", 
            cluster: "Descansos dentro de la serie", 
            top: "Serie más pesada (Alta Intensidad)", 
            backoff: "Volumen tras Top Set", 
            giant: "Altas reps al fallo (Metabólico)", 
            warmup: "Preparación con baja fatiga" 
        }, 
        muscle: { CHEST: "Pecho", BACK: "Espalda", QUADS: "Cuádriceps", HAMSTRINGS: "Isquios", GLUTES: "Glúteos", CALVES: "Gemelos", SHOULDERS: "Hombros", BICEPS: "Bíceps", TRICEPS: "Tríceps", TRAPS: "Trapecios", ABS: "Abdominales", FOREARMS: "Antebrazos" },
        rpFeedbackTitle: "Valoración Muscular", rpRatingHelp: "1=fácil/sin dolor, 3=bien, 5=excesivo/dolor",
        editTemplate: "Editar Programa", resetTemplate: "Restaurar Defecto", editDay: "Editar Día", addDay: "Añadir Día", addSlot: "Añadir Slot", save: "Guardar", swapTitle: "Reemplazar Ejercicio", swapMsg: "¿Cómo quieres aplicar este cambio?", swapSession: "Solo esta Sesión", swapForever: "Actualizar Plan (Para siempre)", programEditor: "Editor de Programa", selectExBtn: "Elegir Ejercicio", any: "Cualquiera",
        manageEx: "Gestionar Ejercicios", addEx: "Añadir Nuevo Ejercicio", exName: "Nombre del Ejercicio", selectMuscle: "Seleccionar Músculo", deleteConfirm: "¿Borrar este ejercicio?",
        setsCount: "Series", notes: "Notas", addNote: "Añadir nota...", volumeStatus: { low: "Bajo", maintenance: "Mant.", optimal: "Óptimo", high: "Alto" }, showRIR: "Mostrar Columna RIR", install: "Instalar App", unitToggle: "Unidad Peso", addExercise: "Añadir Ejercicio", updateTemplate: "Actualizar Rutina Original", selectMuscleToAdd: "Elegir Músculo para el Slot",
        appearance: "Apariencia", database: "Base de Datos", dangerZone: "Zona de Peligro", factoryReset: "Restaurar Fábrica", workoutConfig: "Configuración Entreno",
        completeWeek: "Completar Semana", completeWeekConfirm: "¿Avanzar a la siguiente semana?", autoRegulate: "¿Auto-regular volumen?", autoRegulateDesc: "Basado en tu feedback (dolor/congestión), ajustaremos las series para la próxima semana.", applyingChanges: "Aplicando Cambios:", setsAdded: "series añadidas", setsRemoved: "series quitadas", noChanges: "Sin cambios de volumen.",
        finishMesoConfirm: "¿Terminar este mesociclo? Esto archivará el progreso actual y podrás iniciar uno nuevo.",
        deleteDataConfirm: "¿Borrar TODOS los datos? No se puede deshacer.",
        importSuccess: "¡Importación exitosa!", invalidFile: "Formato inválido",
        day: "Día",
        replaceEx: "Reemplazar Ejercicio", removeEx: "Eliminar Ejercicio", moveUp: "Mover Arriba", moveDown: "Mover Abajo",
        emptyWorkoutTitle: "¿Entreno vacío?", emptyWorkoutMsg: "No has completado ninguna serie. ¿Estás seguro?",
        completedSetsMsg: "Has completado {0} series. ¿Guardar progreso?", confirmRemoveEx: "¿Eliminar este ejercicio de la sesión actual?",
        volPerCycle: "Volumen (Series) / Ciclo", avgDuration: "Duración Media", addSetBtn: "AÑADIR SERIE", removeSetBtn: "QUITAR SERIE",
        prev: "Prev", target: "OBJETIVO",
        warmup: "Calentamiento", warmupTitle: "Protocolo Calentamiento", potentiation: "Potenciación", workingWeight: "Peso de Trabajo",
        warmupSets: { light: "Ligero", moderate: "Moderado", potentiation: "Potenciación" },
        mesoConfig: "Configurar Mesociclo", targetWeeks: "Duración Planeada", weeks: "Semanas",
        deloadMode: "Modo Descarga", deloadDesc: "Reduce el volumen (50%) para recuperación.", enableDeload: "Activar Descarga",
        skipDayConfirm: "¿Saltar este entrenamiento? Se marcará como saltado.",
        mesoName: "Nombre del Mesociclo",
        exportReport: "Exportar Reporte & Terminar", justFinish: "Solo Terminar",
        mesoType: "Fase (Tipo)",
        phases: {
            hyp_1: "Hipertrofia Base 1",
            hyp_2: "Hipertrofia Base 2",
            metabolite: "Fase Metabolitos",
            resensitization: "Resensibilización",
            full_body: "Estética / V-Taper (Dr. Mike)"
        },
        phaseDesc: {
            hyp_1: "Acumulación estándar. RIR 3->1.",
            hyp_2: "Mayor volumen inicial. Sobrecarga agresiva.",
            metabolite: "Altas reps (20-30), descansos cortos, 'burn'.",
            resensitization: "Bajo volumen, peso alto (3-6 reps) para limpiar fatiga.",
            full_body: "Enfoque V-Taper (Dorsal/Deltoides) y Brazos. Pierna mantenimiento."
        },
        targetRIR: "RIR Objetivo",
        recoveryWeek: "Semana Recuperación",

        // Plates & Units
        units: {
            kg: "KG",
            pl: "Planchas",
            lb: "LBS",
            toggle: "Cambiar Unidad (Kg/Planchas)",
            plateWeight: "Peso por Plancha",
            setPlateWeight: "Define Peso x Plancha (kg)",
            enterWeight: "ej. 5, 10..."
        },
        
        // Feedback Matrix
        fb: {
            sorenessLabel: "Agujetas / Recuperación",
            performanceLabel: "Rendimiento / Pump",
            soreness: {
                1: "Nada / Recuperado Antes",
                2: "Recuperado a Tiempo",
                3: "Con Agujetas / Dolor"
            },
            performance: {
                1: "Malo / Débil",
                2: "Bueno / Objetivo",
                3: "Genial / Fuerte"
            },
            adjust: {
                add: "+1 Serie",
                sub: "-1 Serie",
                keep: "Mantener Vol."
            }
        },

        // Onboarding
        onb: {
            skip: "Omitir", next: "Siguiente", start: "Empezar",
            s1_title: "Bienvenido a IronLog", s1_desc: "La herramienta definitiva para hipertrofia, diseñada con principios RP.",
            s2_title: "Mesociclos", s2_desc: "Organiza tu entreno por semanas. Auto-regulamos el volumen según tu feedback.",
            s3_title: "Seguimiento Inteligente", s3_desc: "Registra RIR, usa el temporizador integrado y calcula el calentamiento al instante.",
            s4_title: "Progreso", s4_desc: "Visualiza tus hitos de volumen (MEV/MRV) y asegura la sobrecarga progresiva."
        },
        createAndSelect: "Crear y Seleccionar",
        overwriteTemplateConfirm: "Esto sobrescribe tu rutina actual con el plan de Estética (4 días) de Dr. Mike.",
        newRecord: "¡Nuevo Récord!",
        prMessage: "¡Superaste tus marcas anteriores!",
        continue: "Continuar"
    }
};
