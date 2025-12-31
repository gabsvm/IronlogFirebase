import { ExerciseDef, ProgramDay, MuscleGroup } from './types';

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = { 
    CHEST: 'CHEST', BACK: 'BACK', QUADS: 'QUADS', HAMS: 'HAMSTRINGS', 
    GLUTES: 'GLUTES', CALVES: 'CALVES', SHOULDERS: 'SHOULDERS', 
    BICEPS: 'BICEPS', TRICEPS: 'TRICEPS', TRAPS: 'TRAPS', 
    ABS: 'ABS', FOREARMS: 'FOREARMS'
};

export const DEFAULT_LIBRARY: ExerciseDef[] = [
    { id: 'bp_flat', name: { en: 'Machine Chest Press', es: 'Press Pecho Máquina' }, muscle: 'CHEST' },
    { id: 'bp_inc', name: { en: 'Incline Dumbbell Press', es: 'Press Inclinado Mancuernas' }, muscle: 'CHEST' },
    { id: 'bp_bar', name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' }, muscle: 'CHEST' },
    { id: 'pec_fly', name: { en: 'Pec Dec Flye', es: 'Aperturas Pec Dec' }, muscle: 'CHEST' },
    { id: 'lat_pull', name: { en: 'Lat Pulldown', es: 'Jalón al Pecho' }, muscle: 'BACK' },
    { id: 'row_mach', name: { en: 'Machine Row', es: 'Remo en Máquina' }, muscle: 'BACK' },
    { id: 'row_cable', name: { en: 'Cable Row', es: 'Remo en Polea' }, muscle: 'BACK' },
    { id: 'pullup', name: { en: 'Pull Ups', es: 'Dominadas' }, muscle: 'BACK' },
    { id: 'sq_hack', name: { en: 'Hack Squat', es: 'Sentadilla Hack' }, muscle: 'QUADS' },
    { id: 'leg_ext', name: { en: 'Leg Extension', es: 'Extensiones de Cuádriceps' }, muscle: 'QUADS' },
    { id: 'leg_press', name: { en: 'Leg Press', es: 'Prensa de Piernas' }, muscle: 'QUADS' },
    { id: 'rdl', name: { en: 'Romanian Deadlift', es: 'Peso Muerto Rumano' }, muscle: 'HAMSTRINGS' },
    { id: 'leg_curl', name: { en: 'Seated Leg Curl', es: 'Curl Femoral Sentado' }, muscle: 'HAMSTRINGS' },
    { id: 'lying_curl', name: { en: 'Lying Leg Curl', es: 'Curl Femoral Tumbado' }, muscle: 'HAMSTRINGS' },
    { id: 'calf_raise', name: { en: 'Calf Raise', es: 'Elevación de Talones' }, muscle: 'CALVES' },
    { id: 'ohp', name: { en: 'Overhead Press', es: 'Press Militar' }, muscle: 'SHOULDERS' },
    { id: 'lat_raise', name: { en: 'Lateral Raise', es: 'Elevaciones Laterales' }, muscle: 'SHOULDERS' },
    { id: 'face_pull', name: { en: 'Face Pull', es: 'Face Pull' }, muscle: 'SHOULDERS' },
    { id: 'shrug_db', name: { en: 'Dumbbell Shrugs', es: 'Encogimientos Mancuerna' }, muscle: 'TRAPS' },
    { id: 'curl_ez', name: { en: 'EZ Bar Curl', es: 'Curl Barra EZ' }, muscle: 'BICEPS' },
    { id: 'curl_db', name: { en: 'Dumbbell Curl', es: 'Curl con Mancuernas' }, muscle: 'BICEPS' },
    { id: 'tri_push', name: { en: 'Tricep Pushdown', es: 'Extensión Tríceps Polea' }, muscle: 'TRICEPS' },
    { id: 'tri_ext', name: { en: 'Overhead Extension', es: 'Extensión sobre Cabeza' }, muscle: 'TRICEPS' },
    { id: 'abs_cable', name: { en: 'Cable Crunch', es: 'Crunch en Polea' }, muscle: 'ABS' },
    { id: 'wrist_curl', name: { en: 'Wrist Curl', es: 'Curl de Muñeca' }, muscle: 'FOREARMS' }
];

export const DEFAULT_TEMPLATE: ProgramDay[] = [ 
    { id: 'd1', dayName: { en: "Upper 1", es: "Torso 1" }, slots: [{ muscle: 'CHEST', setTarget: 3 }, { muscle: 'CHEST', setTarget: 3 }, { muscle: 'TRICEPS', setTarget: 3 }, { muscle: 'BACK', setTarget: 3 }, { muscle: 'BACK', setTarget: 3 }, { muscle: 'BICEPS', setTarget: 3 }, { muscle: 'SHOULDERS', setTarget: 3 }] }, 
    { id: 'd2', dayName: { en: "Lower 1", es: "Pierna 1" }, slots: [{ muscle: 'QUADS', setTarget: 3 }, { muscle: 'QUADS', setTarget: 3 }, { muscle: 'GLUTES', setTarget: 3 }, { muscle: 'HAMSTRINGS', setTarget: 3 }, { muscle: 'CALVES', setTarget: 3 }] }, 
    { id: 'd3', dayName: { en: "Upper 2", es: "Torso 2" }, slots: [{ muscle: 'SHOULDERS', setTarget: 3 }, { muscle: 'BICEPS', setTarget: 3 }, { muscle: 'BICEPS', setTarget: 3 }, { muscle: 'BACK', setTarget: 3 }, { muscle: 'TRICEPS', setTarget: 3 }, { muscle: 'TRICEPS', setTarget: 3 }, { muscle: 'CHEST', setTarget: 3 }] }, 
    { id: 'd4', dayName: { en: "Lower 2", es: "Pierna 2" }, slots: [{ muscle: 'HAMSTRINGS', setTarget: 3 }, { muscle: 'HAMSTRINGS', setTarget: 3 }, { muscle: 'GLUTES', setTarget: 3 }, { muscle: 'QUADS', setTarget: 3 }, { muscle: 'CALVES', setTarget: 3 }] } 
];

export const TRANSLATIONS = {
    en: { 
        startMeso: "Start New Mesocycle", finishWorkout: "Finish Workout", finishConfirm: "Finish workout?", cancel: "Cancel", delete: "Delete", skip: "Skip Exercise", skipDay: "Skip Workout", skipped: "Skipped", completed: "Completed", swap: "Swap Exercise", changeMuscle: "Change muscle", chooseMuscle: "Choose muscle", addSetBelow: "Add Set Below", deleteSet: "Delete Set", skipSet: "Skip Set", unskipSet: "Unskip Set", sets: "Set", weight: "Weight", reps: "Reps", rir: "RIR", log: "Log", note: "Range: 6-10", active: "Active", history: "Progress", settings: "Settings", volume: "Weekly Volume", workouts: "Recent Workouts", noData: "No data", duration: "Duration", exercises: "Exercises", configure: "Configure", week: "WEEK", massPhase: "Mass Phase", resting: "Resting", language: "Language", theme: "Theme", back: "Back", finishCycle: "Finish Cycle", confirmCycle: "Finish current mesocycle?", selectEx: "Select Exercise", searchPlaceholder: "Search...", createEx: "Create", noExFound: "No exercises found", keepScreen: "Keep Screen On", setType: "SET TYPE", mesoStats: "Mesocycle Stats", totalWorkouts: "Total Workouts", currentWeek: "Current Week", linkSuperset: "Link Superset", unlinkSuperset: "Unlink", selectToLink: "Select exercise to link...", superset: "SUPERSET", workoutComplete: "WORKOUT COMPLETE", goodJob: "Great job!", totalVolume: "Total Volume", totalSets: "Total Sets", totalReps: "Total Reps", share: "Share", close: "Save & Close", resume: "Resume Workout", backup: "Data Backup", export: "Export Data", import: "Import Data", importConfirm: "Overwrite data?", dataSaved: "Saved!", addSet: "Set", remSet: "Set", delSlot: "Delete Slot", offline: "Local Mode", mesoAvg: "Meso Avg Volume", 
        types: { regular: "Regular", myorep: "Myorep", myorep_match: "Myorep Match", cluster: "Cluster", top: "Top Set", backoff: "Back-off Set" }, 
        typeDesc: { regular: "Standard set", myorep: "Rest-pause", myorep_match: "Match reps", cluster: "Intra-set rest", top: "High intensity", backoff: "Volume work" }, 
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
        volPerCycle: "Volume (Sets) / Cycle", avgDuration: "Avg Duration", addSetBtn: "ADD SET", removeSetBtn: "REMOVE SET",
        prev: "Prev", target: "TARGET",
        warmup: "Smart Warmup", warmupTitle: "Warmup Protocol", potentiation: "Potentiation", workingWeight: "Working Weight",
        warmupSets: { light: "Light", moderate: "Moderate", potentiation: "Potentiation" },
        // Onboarding
        onb: {
            skip: "Skip", next: "Next", start: "Start",
            s1_title: "Welcome to IronLog", s1_desc: "The ultimate tool for hypertrophy training, designed with RP principles.",
            s2_title: "Mesocycles", s2_desc: "Organize training into weeks. We auto-regulate volume based on your feedback.",
            s3_title: "Smart Tracking", s3_desc: "Track RIR, use our built-in rest timer, and get warmup sets calculated instantly.",
            s4_title: "Progress", s4_desc: "Visualize your volume landmarks (MEV/MRV) and ensure you are overloading progressively."
        },
        createAndSelect: "Create & Select"
    },
    es: { 
        startMeso: "Iniciar Mesociclo", finishWorkout: "Terminar Sesión", finishConfirm: "¿Terminar entrenamiento?", cancel: "Cancelar", delete: "Borrar", skip: "Saltar Ejercicio", skipDay: "Saltar Día", skipped: "Saltado", completed: "Completado", swap: "Reemplazar Ejercicio", changeMuscle: "Cambiar músculo", chooseMuscle: "Elegir músculo", addSetBelow: "Añadir Serie Debajo", deleteSet: "Borrar Serie", skipSet: "Saltar Serie", unskipSet: "Restaurar Serie", sets: "Serie", weight: "Peso", reps: "Reps", rir: "RIR", log: "Log", note: "Rango: 6-10", active: "Activo", history: "Progreso", settings: "Ajustes", rp: "Progresión RP", rpEnabled: "Sugerencias RP", rpTargetRIR: "RIR objetivo", volume: "Volumen Semanal", workouts: "Sesiones Recientes", noData: "Sin datos", duration: "Duración", exercises: "Ejercicios", configure: "Configurar", week: "SEMANA", massPhase: "Fase Volumen", resting: "Descansando", language: "Idioma", theme: "Tema", back: "Volver", finishCycle: "Terminar Ciclo", confirmCycle: "¿Terminar el mesociclo actual?", selectEx: "Seleccionar Ejercicio", searchPlaceholder: "Buscar...", createEx: "Crear", noExFound: "No encontrado", keepScreen: "Pantalla Encendida", setType: "TIPO DE SERIE", mesoStats: "Estadísticas Ciclo", totalWorkouts: "Entrenamientos", currentWeek: "Semana Actual", linkSuperset: "Vincular Superserie", unlinkSuperset: "Desvincular", selectToLink: "Selecciona para unir...", superset: "SUPERSERIE", workoutComplete: "¡ENTRENAMIENTO TERMINADO!", goodJob: "¡Buen trabajo!", totalVolume: "Volumen Total", totalSets: "Series Totales", totalReps: "Reps Totales", share: "Compartir", close: "Guardar y Cerrar", resume: "Reanudar", backup: "Copia de Seguridad", export: "Exportar Datos", import: "Importar Datos", importConfirm: "Esto sobrescribirá los datos. ¿Continuar?", dataSaved: "¡Guardado!", addSet: "Serie", remSet: "Serie", delSlot: "Eliminar Slot", offline: "Modo Local", mesoAvg: "Promedio Mesociclo", 
        types: { regular: "Regular", myorep: "Myorep", myorep_match: "Myorep Match", cluster: "Cluster", top: "Top Set", backoff: "Back-off Set" }, 
        typeDesc: { regular: "Estándar", myorep: "Rest-pause", myorep_match: "Igualar reps", cluster: "Descanso intra-serie", top: "Alta intensidad", backoff: "Trabajo volumen" }, 
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
        // Onboarding
        onb: {
            skip: "Omitir", next: "Siguiente", start: "Empezar",
            s1_title: "Bienvenido a IronLog", s1_desc: "La herramienta definitiva para hipertrofia, diseñada con principios RP.",
            s2_title: "Mesociclos", s2_desc: "Organiza tu entreno por semanas. Auto-regulamos el volumen según tu feedback.",
            s3_title: "Seguimiento Inteligente", s3_desc: "Registra RIR, usa el temporizador integrado y calcula el calentamiento al instante.",
            s4_title: "Progreso", s4_desc: "Visualiza tus hitos de volumen (MEV/MRV) y asegura la sobrecarga progresiva."
        },
        createAndSelect: "Crear y Seleccionar"
    }
};