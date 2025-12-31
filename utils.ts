import { Lang, Log, WorkoutSet } from "./types";

export const formatDate = (d: number, l: Lang) => 
    new Date(d).toLocaleDateString(l==='en'?'en-US':'es-ES', {weekday:'short', month:'short', day:'numeric'});

export const formatSeconds = (s: number) => {
    const sec = Math.max(0, Math.floor(Number(s) || 0));
    return `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`;
};

export const formatHoursMinutes = (s: number) => {
    const sec = Math.max(0, Math.floor(Number(s) || 0));
    const totalMin = Math.floor(sec / 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}:${m.toString().padStart(2,'0')}`;
};

export const roundWeight = (w: number) => { 
    const x = Number(w)||0; 
    const step = x >= 20 ? 2.5 : 1; 
    return Math.round(x/step)*step; 
};

/**
 * Finds the last performance of a specific exercise to populate hints
 */
export const getLastLogForExercise = (exerciseId: string, logs: Log[]): WorkoutSet[] | null => {
    // Sort logs by date desc
    const sortedLogs = [...logs].sort((a, b) => b.endTime - a.endTime);
    
    for (const log of sortedLogs) {
        if (log.skipped) continue;
        const ex = log.exercises.find(e => e.id === exerciseId);
        if (ex && ex.sets.some(s => s.completed)) {
            return ex.sets;
        }
    }
    return null;
};
