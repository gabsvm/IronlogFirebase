
import { Lang, Log, WorkoutSet, MesoType } from "./types";

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

export const getTranslated = (val: string | { en: string; es: string } | null | undefined, lang: Lang): string => {
    if (!val) return 'Unknown';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        return val[lang] || val['en'] || 'Unknown';
    }
    return 'Unknown';
};

export const getLastLogForExercise = (exerciseId: string, logs: Log[]): WorkoutSet[] | null => {
    if (!logs || !Array.isArray(logs)) return null;
    const validLogs = logs.filter(l => l && typeof l === 'object');
    const sortedLogs = [...validLogs].sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
    
    for (const log of sortedLogs) {
        if (log.skipped) continue;
        const exercises = log.exercises;
        if (!Array.isArray(exercises)) continue;
        const ex = exercises.find(e => e && e.id === exerciseId);
        if (ex && ex.sets && Array.isArray(ex.sets) && ex.sets.some(s => s && s.completed)) {
            return ex.sets;
        }
    }
    return null;
};

/**
 * Parses a rep range string like "8-12" or "10" into min/max numbers.
 * Returns null if invalid or non-numeric (e.g. "Myo").
 */
export const parseTargetReps = (str?: string): { min: number, max: number } | null => {
    if (!str) return null;
    const clean = str.replace(/\s/g, ''); // Remove spaces
    
    // Check for range "8-12"
    if (clean.includes('-')) {
        const parts = clean.split('-');
        const min = Number(parts[0]);
        const max = Number(parts[1]);
        if (!isNaN(min) && !isNaN(max)) return { min, max };
    }
    
    // Check for single number "10"
    const val = parseInt(clean);
    if (!isNaN(val)) return { min: val, max: val };
    
    return null;
};

/**
 * Calculates RIR and phase notes based on Meso Type and Week
 * RP Logic: W1: 3RIR, W2: 2RIR, W3: 1RIR, W4+: 0-1RIR
 */
export const getMesoStageConfig = (type: MesoType, week: number, isDeload: boolean) => {
    if (isDeload) {
        return { rir: null, label: 'recovery', note: 'DELOAD: Half reps, Light Weight. Focus on technique.' };
    }

    if (type === 'resensitization') {
         // Resensitization: Lower volume, Heavy weight, Stay away from failure to clear fatigue
         return { rir: 2, label: '2/fail', note: 'Resensitization: Heavy weight, low volume (3-6 reps).' };
    }

    if (type === 'metabolite') {
        // Metabolite: Burn focus, short rest
        if (week === 1) return { rir: 3, label: '3/fail', note: 'Metabolite: High Reps (20+), Short Rest (30-60s)' };
        if (week === 2) return { rir: 2, label: '2/fail', note: 'Increase Pump. Short Rest.' };
        return { rir: 0, label: 'FAILURE', note: 'Maximum Pump. Go to failure.' };
    }

    // Standard Hypertrophy
    if (week === 1) return { rir: 3, label: '3/fail', note: 'Week 1: Stop 3 reps before failure.' };
    if (week === 2) return { rir: 2, label: '2/fail', note: 'Week 2: Stop 2 reps before failure.' };
    if (week === 3) return { rir: 1, label: '1/fail', note: 'Week 3: Stop 1 rep before failure.' };
    
    return { rir: 0, label: '0-1/fail', note: 'Accumulation: Train near failure.' };
};

/**
 * RP-Style Algorithm for volume adjustment
 * Returns: -1 (reduce), 0 (maintain), 1 (increase)
 */
export const calculateVolumeAdjustment = (soreness: number, performance: number): number => {
    // Soreness: 1=None, 2=Recovered(Ideal), 3=Sore/Pain
    // Performance: 1=Bad, 2=Expected, 3=Great/Pump

    // 1. If still sore -> Reduce volume immediately
    if (soreness === 3) return -1;

    // 2. If recovered perfectly (2) or healed early (1)
    if (soreness <= 2) {
        // If performance was bad, maybe fatigue is masking it, or just bad day. Usually maintain or reduce.
        if (performance === 1) return 0; // Maintain (give another chance) or could be -1
        
        // If healed early (1) AND performance was Good/Great (2/3) -> Increase
        if (soreness === 1 && performance >= 2) return 1;
        
        // If recovered just in time (2) -> Maintain (Sweet spot)
        return 0;
    }

    return 0;
};
