import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { MuscleGroup } from '../types';

interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ startSession, onEditProgram }) => {
    const { activeMeso, program, setActiveMeso, lang, logs, config, rpFeedback, setProgram } = useApp();
    const t = TRANSLATIONS[lang];
    const tm = (key: string) => (TRANSLATIONS[lang].muscle as any)[key] || key;
    
    // Modal for completion
    const [showCompleteModal, setShowCompleteModal] = useState<'week' | 'meso' | null>(null);

    const handleStartMeso = () => {
        const initialPlan = program.map(day => day.slots.map(slot => slot.exerciseId || null)); 
        setActiveMeso({ id: Date.now(), week: 1, plan: initialPlan });
    };

    const handleFinishMeso = () => {
        setActiveMeso(null);
        setShowCompleteModal(null);
    };

    const handleAdvanceWeek = () => {
        if (!activeMeso) return;

        // Auto-regulation logic
        let changesReport: string[] = [];
        if (config.rpEnabled) {
            const currentFeedback = rpFeedback[activeMeso.id]?.[activeMeso.week];
            if (currentFeedback) {
                // Map muscles to changes: 1 -> +1 set, 5 -> -1 set
                const adjustments: Record<string, number> = {};
                
                Object.entries(currentFeedback).forEach(([muscle, rating]) => {
                     if (rating === 1) adjustments[muscle] = 1;
                     if (rating === 5) adjustments[muscle] = -1;
                });

                if (Object.keys(adjustments).length > 0) {
                    setProgram(prev => prev.map(day => ({
                        ...day,
                        slots: day.slots.map(slot => {
                            const adj = adjustments[slot.muscle];
                            if (adj) {
                                const newTarget = Math.max(1, slot.setTarget + adj);
                                if (newTarget !== slot.setTarget) {
                                    // Only log unique changes for summary
                                    const msg = `${tm(slot.muscle)}: ${adj > 0 ? '+1' : '-1'} set`;
                                    if (!changesReport.includes(msg)) changesReport.push(msg);
                                    return { ...slot, setTarget: newTarget };
                                }
                            }
                            return slot;
                        })
                    })));
                }
            }
        }

        const msg = changesReport.length > 0 
            ? `${t.applyingChanges}\n• ${changesReport.join('\n• ')}` 
            : null;
        
        if (msg) alert(msg);

        setActiveMeso(prev => prev ? { ...prev, week: prev.week + 1 } : null);
        setShowCompleteModal(null);
    };

    if (!activeMeso) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl flex items-center justify-center text-zinc-400 shadow-inner">
                    <Icon name="Dumbbell" size={48} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">{t.rp}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[250px] mx-auto">
                        Start a new mesocycle to unlock RP-style progression and analytics.
                    </p>
                </div>
                <Button onClick={handleStartMeso} size="lg" className="w-full max-w-xs shadow-xl shadow-red-500/20 py-3">
                    {t.startMeso}
                </Button>
                
                <div className="pt-8 w-full max-w-xs">
                    <Button variant="ghost" onClick={onEditProgram} size="sm" fullWidth className="text-zinc-400">
                        <Icon name="Edit" size={14} /> {t.editTemplate}
                    </Button>
                </div>
            </div>
        );
    }

    // Check if current week is done
    const logsForWeek = logs.filter(l => l.mesoId === activeMeso.id && l.week === activeMeso.week);
    const uniqueDaysDone = new Set(logsForWeek.map(l => l.dayIdx)).size;
    const totalDays = program.length;
    const weekComplete = uniqueDaysDone >= totalDays;

    return (
        <div className="p-4 space-y-6">
            {/* Status Header */}
            <div className="flex flex-col items-center py-2">
                <div className="flex items-center gap-2 mb-1">
                     <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">{t.massPhase}</span>
                </div>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900 dark:bg-white/5 border border-zinc-800 dark:border-white/10 text-sm font-bold text-white shadow-lg">
                    <span className="text-red-500"><Icon name="Activity" size={16} /></span>
                    <span>{t.active}</span>
                    <span className="w-px h-3 bg-zinc-700"></span>
                    <span className="text-zinc-400">{t.week} {activeMeso.week}</span>
                </div>
            </div>

            <div className="space-y-4 pb-safe">
                {program.map((day, idx) => {
                    const logForToday = logs.find(l => l.mesoId === activeMeso.id && l.week === activeMeso.week && l.dayIdx === idx);
                    const isCompleted = logForToday && !logForToday.skipped;
                    
                    return (
                        <div 
                            key={idx} 
                            onClick={() => !logForToday && startSession(idx)}
                            className={`
                                group relative overflow-hidden rounded-2xl border transition-all duration-300
                                ${isCompleted 
                                    ? 'bg-zinc-50 dark:bg-zinc-900/50 border-green-500/30' 
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 hover:border-red-500/50 dark:hover:border-red-500/50 shadow-sm hover:shadow-lg hover:shadow-red-900/10 cursor-pointer active:scale-[0.98]'
                                }
                            `}
                        >
                            {!isCompleted && <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>}
                            
                            <div className="relative p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{t.day} {idx + 1}</div>
                                        <h3 className={`text-xl font-bold tracking-tight ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-white'}`}>
                                            {typeof day.dayName === 'object' ? day.dayName[lang] : day.dayName}
                                        </h3>
                                    </div>
                                    {isCompleted ? (
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                            <Icon name="Check" size={16} strokeWidth={3} />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 bg-zinc-100 dark:bg-white/5 text-zinc-400 rounded-full flex items-center justify-center group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-red-500 transition-colors">
                                            <Icon name="Play" size={14} fill="currentColor" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {day.slots.map((slot, sIdx) => (
                                        <span 
                                            key={sIdx} 
                                            className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border border-transparent dark:border-white/5"
                                        >
                                            {tm(slot.muscle)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="h-1 w-full bg-zinc-100 dark:bg-white/5">
                                <div className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-red-500 w-0 group-hover:w-full transition-all duration-700 ease-out'}`}></div>
                            </div>
                        </div>
                    );
                })}

                {/* Week/Meso Management Actions */}
                <div className="pt-6 space-y-3">
                    {weekComplete && (
                        <Button 
                            onClick={() => setShowCompleteModal('week')} 
                            fullWidth 
                            size="lg" 
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                        >
                            {t.completeWeek}
                        </Button>
                    )}
                    
                    <Button 
                        variant="ghost" 
                        onClick={() => setShowCompleteModal('meso')} 
                        fullWidth
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        {t.finishCycle}
                    </Button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showCompleteModal && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                                {showCompleteModal === 'week' ? t.completeWeek : t.finishCycle}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {showCompleteModal === 'week' ? t.completeWeekConfirm : t.finishMesoConfirm}
                            </p>
                            {showCompleteModal === 'week' && config.rpEnabled && (
                                <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                    <Icon name="Zap" size={12} className="inline mr-1" />
                                    {t.autoRegulateDesc}
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="secondary" onClick={() => setShowCompleteModal(null)}>{t.cancel}</Button>
                            <Button onClick={showCompleteModal === 'week' ? handleAdvanceWeek : handleFinishMeso}>
                                {t.completed}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};