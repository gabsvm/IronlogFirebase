
import React, { useState, memo, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { formatDate, formatHoursMinutes, getTranslated } from '../utils';
import { Icon } from '../components/ui/Icon';
import { Log } from '../types';
import { Virtuoso } from 'react-virtuoso';

// Helper to parse duration string "mm:ss" or number to string format
const formatDurationDisplay = (val: string | number) => {
    if (typeof val === 'number') return `${val}m`;
    if (!val) return '-';
    return val.includes(':') ? val : `${val}m`;
};

// 1. Extract and Memoize the Card Component for Performance
interface HistoryCardProps {
    log: Log;
    isExpanded: boolean;
    onToggle: (id: number) => void;
    lang: 'en' | 'es';
    t: any;
}

const HistoryCard = memo(({ log, isExpanded, onToggle, lang, t }: HistoryCardProps) => {
    
    // Process "Best Sets" for preview
    const bestSets = (log.exercises || []).map(ex => {
        const isCardio = ex.muscle === 'CARDIO';
        const validSets = (ex.sets || []).filter(s => s.completed);
        
        if (validSets.length === 0) return null;

        if (isCardio) {
            // For cardio, summarize total time or distance
            const totalDist = validSets.reduce((acc, s) => acc + Number(s.distance || 0), 0);
            const totalTime = validSets.reduce((acc, s) => {
                // Parse duration potentially
                let mins = 0;
                if(typeof s.duration === 'string' && s.duration.includes(':')) {
                    const [m, sec] = s.duration.split(':').map(Number);
                    mins = m + (sec/60);
                } else {
                    mins = Number(s.duration || 0);
                }
                return acc + mins;
            }, 0);
            
            return { 
                name: getTranslated(ex.name, lang), 
                isCardio: true,
                summary: `${Math.round(totalTime)} min ${totalDist > 0 ? `/ ${totalDist.toFixed(1)} km` : ''}`
            };
        }

        // Weightlifting logic
        const validLifts = validSets.filter(s => s.weight && s.reps);
        if (validLifts.length === 0) return null;
        
        const best = validLifts.reduce((prev, current) => (Number(prev.weight) > Number(current.weight)) ? prev : current);
        return { name: getTranslated(ex.name, lang), ...best, isCardio: false };
    }).filter(Boolean);

    return (
        <div 
            onClick={() => onToggle(log.id)}
            className={`bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer mb-4 mx-4
                ${isExpanded ? 'border-red-500/50 shadow-lg shadow-red-500/5' : 'border-zinc-200 dark:border-white/5 shadow-sm'}
            `}
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                            {formatDate(log.endTime, lang)}
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                            {log.name}
                        </h3>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-mono font-bold text-zinc-500 bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded inline-flex items-center gap-1">
                            <Icon name="Clock" size={12} />
                            {formatHoursMinutes(log.duration)}
                        </div>
                    </div>
                </div>
                
                {!isExpanded && (
                    <div className="space-y-2">
                        {bestSets.slice(0, 3).map((s: any, i) => (
                            <div key={i} className="flex justify-between items-center text-xs text-zinc-500">
                                <span className="truncate pr-4 max-w-[200px]">{s.name}</span>
                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                    {s.isCardio ? s.summary : `${s.weight}kg x ${s.reps}`}
                                </span>
                            </div>
                        ))}
                        {bestSets.length > 3 && <div className="text-[10px] text-zinc-400 italic">...and {bestSets.length - 3} more</div>}
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5 p-4 space-y-6 animate-slideUp">
                    {(log.exercises || []).map((ex, i) => {
                        const isCardio = ex.muscle === 'CARDIO';
                        return (
                            <div key={i}>
                                <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-2 flex items-center justify-between">
                                    <span>{getTranslated(ex.name, lang)}</span>
                                    {ex.note && <span className="text-[10px] text-zinc-400 italic font-normal max-w-[150px] truncate">{ex.note}</span>}
                                </h4>
                                <div className="space-y-1">
                                    {(ex.sets || []).filter(s => s.completed).map((s, idx) => (
                                        <div key={idx} className="flex items-center text-xs">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center font-bold mr-3 ${s.type === 'warmup' ? 'bg-yellow-100 text-yellow-600' : 'bg-zinc-200 dark:bg-white/10 text-zinc-500'}`}>
                                                {s.type === 'warmup' ? 'W' : idx + 1}
                                            </div>
                                            <div className="flex-1 font-mono text-zinc-700 dark:text-zinc-300">
                                                {isCardio ? (
                                                    <>
                                                        <span className="font-bold">{formatDurationDisplay(s.duration || 0)}</span>
                                                        {s.distance && (
                                                            <>
                                                                <span className="mx-2 text-zinc-300">|</span>
                                                                <span className="font-bold">{s.distance}</span> <span className="text-zinc-400 text-[10px]">KM</span>
                                                            </>
                                                        )}
                                                        {s.rpe && (
                                                            <>
                                                                <span className="mx-2 text-zinc-300">|</span>
                                                                <span className="text-zinc-500">{t.cardioSpeed}: {s.rpe}</span>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-bold">{s.weight}</span> <span className="text-zinc-400 text-[10px]">KG</span>
                                                        <span className="mx-2 text-zinc-300">|</span>
                                                        <span className="font-bold">{s.reps}</span> <span className="text-zinc-400 text-[10px]">REPS</span>
                                                        {s.rpe && (
                                                            <>
                                                                <span className="mx-2 text-zinc-300">|</span>
                                                                <span className="text-zinc-500">RIR {s.rpe}</span>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

export const HistoryView: React.FC = () => {
    const { logs, lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const safeLogs = Array.isArray(logs) ? logs : [];

    const filteredLogs = useMemo(() => {
        if (!search.trim()) return safeLogs;
        const q = search.toLowerCase();
        return safeLogs.filter(log => {
            if (log.name.toLowerCase().includes(q)) return true;
            return log.exercises?.some(ex => getTranslated(ex.name, lang).toLowerCase().includes(q));
        });
    }, [safeLogs, search, lang]);

    // Header component for Virtuoso
    const Header = () => (
        <div className="px-6 pt-6 pb-4 space-y-4 bg-gray-50 dark:bg-zinc-950">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">History</h2>
            <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                    type="text" 
                    placeholder="Search workouts or exercises..."
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500 text-zinc-900 dark:text-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
    );

    // Padding footer to avoid bottom nav overlap
    const Footer = () => <div className="h-24"></div>;

    if (safeLogs.length === 0) {
        return (
            <div className="p-4 space-y-6">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white px-2">History</h2>
                <div className="text-center py-20 opacity-50">
                    <Icon name="CloudOff" size={48} className="mx-auto mb-4 text-zinc-600" />
                    <p>No workouts logged yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-gray-50 dark:bg-zinc-950 flex flex-col">
            {filteredLogs.length === 0 ? (
                <>
                    <Header />
                    <div className="text-center py-10 text-zinc-400 text-sm">No matches found.</div>
                </>
            ) : (
                <Virtuoso
                    style={{ height: '100%' }}
                    data={filteredLogs}
                    components={{ Header, Footer }}
                    itemContent={(index, log) => (
                        <HistoryCard 
                            log={log} 
                            isExpanded={expandedId === log.id}
                            onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                            lang={lang}
                            t={t}
                        />
                    )}
                />
            )}
        </div>
    );
};
