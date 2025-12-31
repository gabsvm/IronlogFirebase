import React from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { MuscleGroup } from '../types';

export const StatsView: React.FC = () => {
    const { logs, lang, activeMeso } = useApp();
    const t = TRANSLATIONS[lang];
    
    // Calculate volume (sets) per muscle group for the current week/meso
    const data = React.useMemo(() => {
        const counts: Record<string, number> = {};
        Object.values(MUSCLE_GROUPS).forEach(m => counts[m] = 0);

        const safeLogs = Array.isArray(logs) ? logs : [];

        safeLogs.forEach(log => {
            // If active meso exists, filter by it. Otherwise show all recent.
            if (activeMeso && log.mesoId !== activeMeso.id) return;
            
            (log.exercises || []).forEach(ex => {
                const setsDone = (ex.sets || []).filter(s => s.completed).length;
                if (counts[ex.muscle] !== undefined) {
                    counts[ex.muscle] += setsDone;
                }
            });
        });
        return Object.entries(counts).sort((a,b) => b[1] - a[1]);
    }, [logs, activeMeso]);

    const maxVal = Math.max(...data.map(d => d[1]), 10); // Scale

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white px-2">Analytics</h2>
            
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-white/5 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-6">{t.volPerCycle}</h3>
                
                <div className="space-y-4">
                    {data.map(([muscle, count]) => (
                        <div key={muscle} className="flex items-center gap-3">
                            <div className="w-24 text-xs font-bold text-zinc-500 truncate text-right">
                                {TRANSLATIONS[lang].muscle[muscle as MuscleGroup]}
                            </div>
                            <div className="flex-1 h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-red-600 rounded-full" 
                                    style={{ width: `${(count / maxVal) * 100}%` }}
                                ></div>
                            </div>
                            <div className="w-6 text-xs font-mono font-bold text-zinc-900 dark:text-white text-right">
                                {count}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-white/5">
                    <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1">
                        {(Array.isArray(logs) ? logs : []).length}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.totalWorkouts}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-white/5">
                    <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1">
                        {
                            (Array.isArray(logs) ? logs : []).length > 0
                            ? Math.round(((Array.isArray(logs) ? logs : []).reduce((acc, l) => acc + l.duration, 0) / 60) / (Array.isArray(logs) ? logs : []).length)
                            : 0
                        }m
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.avgDuration}</div>
                </div>
            </div>
        </div>
    );
};