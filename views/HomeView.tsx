
import React, { useState, Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, FULL_BODY_TEMPLATE, DEFAULT_TEMPLATE, METABOLITE_TEMPLATE, RESENS_TEMPLATE, UPPER_LOWER_TEMPLATE } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { getTranslated, formatDate } from '../utils';
import { MesoType, FeedbackEntry } from '../types';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { Logo } from '../components/ui/Logo';

// Lazy load the AI Chat component to save bundle size
const IronCoachChat = React.lazy(() => import('../components/ai/IronCoachChat').then(module => ({ default: module.IronCoachChat })));

interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
    onSkipSession?: (dayIdx: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ startSession, onEditProgram, onSkipSession }) => {
    const { activeMeso, program, setActiveMeso, lang, logs, config, rpFeedback, setProgram, exercises } = useApp();
    const t = TRANSLATIONS[lang];
    const tm = (key: string) => (TRANSLATIONS[lang].muscle as any)[key] || key;
    
    // Modal state
    const [showCompleteModal, setShowCompleteModal] = useState<'week' | 'meso' | null>(null);
    const [showMesoSettings, setShowMesoSettings] = useState(false);
    const [showStartWizard, setShowStartWizard] = useState(false);
    const [showRoutineGuide, setShowRoutineGuide] = useState(false);
    const [skipConfirmationId, setSkipConfirmationId] = useState<number | null>(null);
    const [showAIChat, setShowAIChat] = useState(false);

    // New Meso State
    const [newMesoType, setNewMesoType] = useState<MesoType>('hyp_1');

    // Defensive: Ensure program is an array
    const safeProgram = Array.isArray(program) ? program : [];
    const safeLogs = Array.isArray(logs) ? logs : [];

    const handleStartMeso = () => {
        let planToUse = safeProgram;

        // Apply specific template based on selection
        switch (newMesoType) {
            case 'hyp_1':
                planToUse = DEFAULT_TEMPLATE;
                setProgram(DEFAULT_TEMPLATE);
                break;
            case 'hyp_2':
                planToUse = UPPER_LOWER_TEMPLATE;
                setProgram(UPPER_LOWER_TEMPLATE);
                break;
            case 'metabolite':
                planToUse = METABOLITE_TEMPLATE;
                setProgram(METABOLITE_TEMPLATE);
                break;
            case 'resensitization':
                planToUse = RESENS_TEMPLATE;
                setProgram(RESENS_TEMPLATE);
                break;
            case 'full_body':
                planToUse = FULL_BODY_TEMPLATE;
                setProgram(FULL_BODY_TEMPLATE);
                break;
            default:
                // If it's a custom type or error, use existing
                break;
        }

        const initialPlan = planToUse.map(day => (day?.slots || []).map(slot => slot.exerciseId || null)); 
        
        let targetWeeks = 5;
        if (newMesoType === 'resensitization') targetWeeks = 4;
        
        setActiveMeso({ 
            id: Date.now(), 
            week: 1, 
            plan: initialPlan, 
            targetWeeks: targetWeeks, 
            isDeload: false,
            mesoType: newMesoType,
            name: t.phases[newMesoType]
        });
        setShowStartWizard(false);
    };

    const generateMesoReport = () => {
        if (!activeMeso) return null;
        
        const mesoLogs = safeLogs.filter(l => l.mesoId === activeMeso.id).sort((a,b) => a.endTime - b.endTime);
        if (mesoLogs.length === 0) return null;

        const startTime = mesoLogs[0].endTime;
        const endTime = mesoLogs[mesoLogs.length - 1].endTime;
        
        const volumeByWeek: Record<number, Record<string, number>> = {};
        
        mesoLogs.forEach(log => {
            if (log.skipped) return;
            if (!volumeByWeek[log.week]) volumeByWeek[log.week] = {};
            (log.exercises || []).forEach(ex => {
                const sets = (ex.sets || []).filter(s => s.completed).length;
                if (!volumeByWeek[log.week][ex.muscle]) volumeByWeek[log.week][ex.muscle] = 0;
                volumeByWeek[log.week][ex.muscle] += sets;
            });
        });

        const exerciseProgress: Record<string, any> = {};
        
        mesoLogs.forEach(log => {
            if (log.skipped) return;
            (log.exercises || []).forEach(ex => {
                const bestSet = (ex.sets || []).filter(s => s.completed).reduce((prev: any, curr: any) => {
                     return (Number(curr.weight) > Number(prev?.weight || 0)) ? curr : prev;
                }, null);

                if (bestSet) {
                    const exName = getTranslated(ex.name, 'en');
                    if (!exerciseProgress[exName]) {
                        exerciseProgress[exName] = { start: null, end: null, id: ex.id, muscle: ex.muscle };
                    }
                    
                    const setStr = `${bestSet.weight}kg x ${bestSet.reps}`;
                    if (!exerciseProgress[exName].start) {
                        exerciseProgress[exName].start = setStr;
                    }
                    exerciseProgress[exName].end = setStr; 
                }
            });
        });

        const report = {
            mesoName: activeMeso.name || "Unnamed Cycle",
            mesoType: activeMeso.mesoType,
            dateStart: formatDate(startTime, lang),
            dateEnd: formatDate(endTime, lang),
            durationWeeks: activeMeso.week,
            totalWorkouts: mesoLogs.length,
            volumeSummary: volumeByWeek,
            progression: exerciseProgress,
            feedback: rpFeedback[activeMeso.id] || {}
        };

        return report;
    };

    const handleFinishMeso = (exportReport: boolean) => {
        if (exportReport) {
            const report = generateMesoReport();
            if (report) {
                const blob = new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ironlog_meso_report_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
            }
        }
        setActiveMeso(null);
        setShowCompleteModal(null);
    };

    const handleSkipClick = (e: React.MouseEvent, dayIdx: number) => {
        e.stopPropagation();
        setSkipConfirmationId(dayIdx);
    };

    const confirmSkip = () => {
        if (onSkipSession && skipConfirmationId !== null) {
            onSkipSession(skipConfirmationId);
        }
        setSkipConfirmationId(null);
    };

    const handleAdvanceWeek = () => {
        if (!activeMeso) return;

        // Auto-regulation logic (RP Style)
        let changesReport: string[] = [];
        if (config.rpEnabled) {
            const currentFeedback = rpFeedback[activeMeso.id]?.[activeMeso.week];
            if (currentFeedback) {
                const adjustments: Record<string, number> = {};
                
                // Read adjustments directly from the feedback calculation done in Modal
                Object.entries(currentFeedback).forEach(([muscle, val]) => {
                     const data = val as FeedbackEntry;
                     if (data.adjustment !== 0) {
                         adjustments[muscle] = data.adjustment;
                     }
                });

                if (Object.keys(adjustments).length > 0) {
                    setProgram(prev => (Array.isArray(prev) ? prev : []).map(day => ({
                        ...day,
                        slots: (day.slots || []).map(slot => {
                            const adj = adjustments[slot.muscle];
                            if (adj) {
                                // Clamp between 1 and 10 sets roughly
                                const newTarget = Math.max(1, Math.min(12, slot.setTarget + adj));
                                if (newTarget !== slot.setTarget) {
                                    const msg = `${tm(slot.muscle)}: ${adj > 0 ? '+1' : '-1'} set (${newTarget})`;
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
        
        // Auto-detect deload if we passed target weeks
        const nextWeek = activeMeso.week + 1;
        const shouldBeDeload = activeMeso.targetWeeks ? nextWeek >= activeMeso.targetWeeks : false;

        setActiveMeso(prev => prev ? { 
            ...prev, 
            week: nextWeek,
            isDeload: shouldBeDeload // Suggest deload if we hit the target
        } : null);
        
        setShowCompleteModal(null);
    };

    const handleMesoSettingUpdate = (field: string, val: any) => {
        if (!activeMeso) return;
        setActiveMeso(prev => prev ? { ...prev, [field]: val } : null);
    };

    if (!activeMeso) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                {/* Hero Image - Dual Man/Woman Figures */}
                <div className="relative group cursor-pointer flex justify-center items-center -space-x-8" onClick={() => setShowStartWizard(true)}>
                    {/* Woman */}
                    <div className="relative z-10 w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-xl">
                        <img src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover grayscale" />
                    </div>
                    {/* Man */}
                    <div className="relative z-0 w-36 h-36 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover grayscale" />
                    </div>
                    {/* Plus Icon */}
                    <div className="absolute -bottom-2 right-10 bg-red-600 text-white p-2 rounded-full shadow-lg z-20">
                        <Icon name="Plus" size={20} />
                    </div>
                </div>

                <div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-3 tracking-tighter">IronCoach <span className="text-red-600">Pro</span></h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                        {t.onb.s1_desc}
                    </p>
                </div>

                <div className="w-full max-w-xs space-y-4">
                    <Button onClick={() => setShowStartWizard(true)} size="lg" fullWidth className="shadow-xl shadow-red-500/20 py-4 text-lg">
                        {t.startMeso}
                    </Button>
                    
                    <Button variant="ghost" onClick={onEditProgram} size="sm" fullWidth className="text-zinc-400">
                        <Icon name="Edit" size={14} /> {t.editTemplate}
                    </Button>
                </div>

                {/* Meso Start Wizard */}
                {showStartWizard && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
                        <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{t.startMeso}</h3>
                                <button onClick={() => setShowStartWizard(false)} className="text-zinc-400"><Icon name="X" size={24} /></button>
                            </div>
                            
                            <div className="space-y-4 mb-8 overflow-y-auto scroll-container flex-1">
                                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest sticky top-0 bg-white dark:bg-zinc-900 py-2 z-10">{t.mesoType}</p>
                                {(['hyp_1', 'hyp_2', 'full_body', 'metabolite', 'resensitization'] as MesoType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setNewMesoType(type)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                                            newMesoType === type 
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400' 
                                            : 'bg-zinc-50 dark:bg-white/5 border-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="font-bold mb-1">{t.phases[type]}</div>
                                        <div className="text-xs opacity-70 leading-relaxed">{t.phaseDesc[type]}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="shrink-0 space-y-4">
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl flex gap-3 items-start animate-in fade-in">
                                    <div className="text-orange-500 shrink-0 mt-0.5"><Icon name="Activity" size={16} /></div>
                                    <p className="text-xs text-orange-700 dark:text-orange-300 leading-tight font-medium">
                                        {t.overwriteTemplateConfirm}
                                    </p>
                                </div>

                                <Button onClick={handleStartMeso} fullWidth size="lg">
                                    {t.createAndSelect}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Check if current week is done
    const logsForWeek = safeLogs.filter(l => l.mesoId === activeMeso.id && l.week === activeMeso.week);
    const uniqueDaysDone = new Set(logsForWeek.map(l => l.dayIdx)).size;
    const totalDays = safeProgram.length;
    const weekComplete = uniqueDaysDone >= totalDays && totalDays > 0;
    const isDeload = !!activeMeso.isDeload;

    return (
        <div className="p-4 space-y-6 relative">
            {/* Status Header */}
            <div className="flex flex-col items-center py-2 relative">
                {activeMeso.name && (
                    <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-1">{activeMeso.name}</h2>
                )}
                <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded">
                        {t.phases[activeMeso.mesoType] || t.phases['hyp_1']}
                     </span>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border shadow-lg ${isDeload ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-zinc-900 dark:bg-white/5 border-zinc-800 dark:border-white/10 text-white'}`}>
                        <span className={isDeload ? 'text-blue-500' : 'text-red-500'}><Icon name="Activity" size={16} /></span>
                        <span className="font-bold text-sm">{isDeload ? t.recoveryWeek : t.active}</span>
                        <span className="w-px h-3 bg-zinc-700"></span>
                        <span className="text-zinc-400 text-sm font-bold">{t.week} {activeMeso.week} <span className="opacity-50 text-[10px]">/ {activeMeso.targetWeeks || 4}</span></span>
                    </div>
                    
                    <button 
                        onClick={() => setShowRoutineGuide(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:scale-105 transition-transform"
                        title={t.routineGuide}
                    >
                        <Icon name="FileText" size={16} />
                    </button>
                    
                    <button 
                        onClick={() => setShowMesoSettings(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <Icon name="Settings" size={16} />
                    </button>
                </div>
            </div>

            {/* Activity Heatmap - Visual Consistency Motivation */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-white/5 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Icon name="TrendingUp" size={14} /> Consistency
                </h3>
                <ActivityHeatmap logs={safeLogs} />
            </div>

            <div className="space-y-4 pb-safe">
                {safeProgram.map((day, idx) => {
                    if (!day) return null;

                    const logForToday = safeLogs.find(l => l.mesoId === activeMeso.id && l.week === activeMeso.week && l.dayIdx === idx);
                    const isCompleted = logForToday && !logForToday.skipped;
                    const isSkipped = logForToday && logForToday.skipped;
                    
                    return (
                        <div 
                            key={idx} 
                            onClick={() => !logForToday && startSession(idx)}
                            className={`
                                group relative overflow-hidden rounded-2xl border transition-all duration-300
                                ${isCompleted 
                                    ? 'bg-zinc-50 dark:bg-zinc-900/50 border-green-500/30' 
                                    : isSkipped
                                        ? 'bg-zinc-100 dark:bg-white/5 border-transparent opacity-60'
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 hover:border-red-500/30 dark:hover:border-red-500/30 shadow-sm hover:shadow-xl hover:shadow-red-900/5 cursor-pointer active:scale-[0.98]'
                                }
                            `}
                        >
                            {!isCompleted && !isSkipped && <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>}
                            
                            <div className="relative p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{t.day} {idx + 1}</div>
                                        <h3 className={`text-xl font-bold tracking-tight ${isCompleted ? 'text-green-600 dark:text-green-400' : isSkipped ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>
                                            {getTranslated(day.dayName, lang)}
                                        </h3>
                                    </div>
                                    {isCompleted ? (
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                            <Icon name="Check" size={16} strokeWidth={3} />
                                        </div>
                                    ) : isSkipped ? (
                                        <div className="w-8 h-8 bg-zinc-200 dark:bg-white/10 text-zinc-500 rounded-full flex items-center justify-center">
                                            <Icon name="SkipForward" size={14} />
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                             <button 
                                                onClick={(e) => handleSkipClick(e, idx)}
                                                className="w-8 h-8 bg-zinc-100 dark:bg-white/5 text-zinc-400 rounded-full flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                                                title={t.skipDay}
                                            >
                                                <Icon name="SkipForward" size={14} />
                                            </button>
                                            <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center shadow-sm">
                                                <Icon name="Play" size={14} fill="currentColor" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {(day.slots || []).map((slot, sIdx) => (
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
                                <div className={`h-full ${isCompleted ? 'bg-green-500' : isSkipped ? 'bg-zinc-400' : 'bg-red-500 w-0 group-hover:w-full transition-all duration-700 ease-out'}`}></div>
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

            {/* IronCoach FAB - Using a Portal-like placement (Fixed on screen) */}
            <div className="fixed bottom-24 right-4 z-30">
                <button
                    onClick={() => setShowAIChat(true)}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-600/40 flex items-center justify-center animate-in zoom-in duration-300 hover:scale-110 transition-transform"
                >
                    <Icon name="Bot" size={24} fill="currentColor" />
                </button>
            </div>

            {/* AI Chat Modal with Lazy Loading Suspense */}
            {showAIChat && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end justify-center sm:items-center">
                        <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md h-[50vh] rounded-t-3xl flex items-center justify-center">
                            <Icon name="RefreshCw" size={32} className="animate-spin text-zinc-400" />
                        </div>
                    </div>
                }>
                    <IronCoachChat onClose={() => setShowAIChat(false)} />
                </Suspense>
            )}

             {/* Routine Guide Modal */}
             {showRoutineGuide && activeMeso && (
                 <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowRoutineGuide(false)}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl p-0 shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-zinc-50/50 dark:bg-white/[0.02]">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{t.routineGuide}</h3>
                                <p className="text-xs text-zinc-500">{t.executionInfo}</p>
                            </div>
                            <button onClick={() => setShowRoutineGuide(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Icon name="X" size={24} /></button>
                        </div>
                        
                        <div className="overflow-y-auto p-6 space-y-8 scroll-container">
                            {safeProgram.map((day, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h4 className="font-black text-sm text-zinc-900 dark:text-white uppercase tracking-wider sticky top-0 bg-white dark:bg-zinc-900 py-2 z-10 border-b border-zinc-100 dark:border-white/5">
                                        {getTranslated(day.dayName, lang)}
                                    </h4>
                                    <div className="space-y-3">
                                        {day.slots?.map((slot, sIdx) => {
                                            // Find specific exercise if assigned, or generic info
                                            const exId = activeMeso.plan?.[idx]?.[sIdx] || slot.exerciseId;
                                            const exDef = exId ? exercises.find(e => e.id === exId) : null;
                                            
                                            // Only show if we have an exercise definition
                                            if (!exDef) return null;

                                            return (
                                                <div key={sIdx} className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3 border border-zinc-100 dark:border-white/5">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{getTranslated(exDef.name, lang)}</span>
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-white/5">{tm(slot.muscle)}</span>
                                                    </div>
                                                    {exDef.instructions ? (
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-2 italic border-l-2 border-red-500/30 pl-2">
                                                            {getTranslated(exDef.instructions, lang)}
                                                        </p>
                                                    ) : (
                                                        <p className="text-[10px] text-zinc-400 mt-1">{t.noData}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
             )}

            {/* Skip Confirmation Modal */}
            {skipConfirmationId !== null && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setSkipConfirmationId(null)}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 flex items-center justify-center mx-auto mb-4">
                                <Icon name="SkipForward" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                                {t.skipDay}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {t.skipDayConfirm}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="secondary" onClick={() => setSkipConfirmationId(null)}>{t.cancel}</Button>
                            <Button variant="danger" onClick={confirmSkip}>{t.skipDay}</Button>
                        </div>
                    </div>
                </div>
            )}

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
                        <div className={`grid ${showCompleteModal === 'meso' ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-3'}`}>
                             {showCompleteModal === 'week' ? (
                                <>
                                    <Button variant="secondary" onClick={() => setShowCompleteModal(null)}>{t.cancel}</Button>
                                    <Button onClick={handleAdvanceWeek}>{t.completed}</Button>
                                </>
                             ) : (
                                 <div className="flex flex-col gap-3">
                                     <Button onClick={() => handleFinishMeso(true)} className="bg-green-600 hover:bg-green-500 shadow-green-600/20">
                                        <Icon name="DownloadCloud" size={18} /> {t.exportReport}
                                     </Button>
                                     <Button variant="secondary" onClick={() => handleFinishMeso(false)}>
                                        {t.justFinish}
                                     </Button>
                                     <button onClick={() => setShowCompleteModal(null)} className="text-xs text-zinc-400 font-bold py-2">{t.cancel}</button>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

             {/* Meso Settings Modal */}
             {showMesoSettings && activeMeso && (
                 <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowMesoSettings(false)}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-100 dark:border-white/5 pb-4">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t.mesoConfig}</h3>
                            <button onClick={() => setShowMesoSettings(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Icon name="X" size={20} /></button>
                        </div>

                        <div className="space-y-6">
                            {/* Rename */}
                            <div>
                                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{t.mesoName}</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-red-500"
                                    value={activeMeso.name || ''}
                                    placeholder={t.massPhase}
                                    onChange={(e) => handleMesoSettingUpdate('name', e.target.value)}
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{t.targetWeeks}</label>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => handleMesoSettingUpdate('targetWeeks', Math.max(1, (activeMeso.targetWeeks || 4) - 1))}
                                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                                    >
                                        <Icon name="Minus" size={16} />
                                    </button>
                                    <span className="font-mono text-2xl font-bold w-12 text-center text-zinc-900 dark:text-white">{activeMeso.targetWeeks || 4}</span>
                                    <button 
                                        onClick={() => handleMesoSettingUpdate('targetWeeks', (activeMeso.targetWeeks || 4) + 1)}
                                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                                    >
                                        <Icon name="Plus" size={16} />
                                    </button>
                                    <span className="text-sm font-bold text-zinc-500">{t.weeks}</span>
                                </div>
                            </div>

                            {/* Deload Toggle */}
                            <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-zinc-900 dark:text-white text-sm mb-1">{t.deloadMode}</div>
                                    <div className="text-xs text-zinc-500 max-w-[180px] leading-tight">{t.deloadDesc}</div>
                                </div>
                                <button 
                                    onClick={() => handleMesoSettingUpdate('isDeload', !activeMeso.isDeload)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${activeMeso.isDeload ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${activeMeso.isDeload ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Button fullWidth onClick={() => setShowMesoSettings(false)}>{t.save}</Button>
                        </div>
                    </div>
                 </div>
             )}
        </div>
    );
};
