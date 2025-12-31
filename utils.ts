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
 * Safely gets a translated string from a potential object/string/null value.
 * Fixes crash where typeof null === 'object' causes access property on null.
 */
export const getTranslated = (val: string | { en: string; es: string } | null | undefined, lang: Lang): string => {
    if (!val) return 'Unknown';
    if (typeof val === 'string') return val;
    // Check if it's a valid object with translation keys, not null
    if (typeof val === 'object') {
        return val[lang] || val['en'] || 'Unknown';
    }
    return 'Unknown';
};

/**
 * Finds the last performance of a specific exercise to populate hints
 */
export const getLastLogForExercise = (exerciseId: string, logs: Log[]): WorkoutSet[] | null => {
    // 1. Strict input check
    if (!logs || !Array.isArray(logs)) return null;
    
    // 2. Filter out null/corrupted entries safely before sorting
    const validLogs = logs.filter(l => l && typeof l === 'object');

    // 3. Sort by date desc
    const sortedLogs = [...validLogs].sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
    
    for (const log of sortedLogs) {
        if (log.skipped) continue;
        
        const exercises = log.exercises;
        if (!Array.isArray(exercises)) continue;

        // 4. Find exercise safely handling potential nulls in exercise array
        const ex = exercises.find(e => e && e.id === exerciseId);
        
        if (ex && ex.sets && Array.isArray(ex.sets) && ex.sets.some(s => s && s.completed)) {
            return ex.sets;
        }
    }
    return null;
};