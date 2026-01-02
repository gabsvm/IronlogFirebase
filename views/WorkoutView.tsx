
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { ExerciseSelector } from '../components/ui/ExerciseSelector';
import { FeedbackModal } from '../components/ui/FeedbackModal';
import { WarmupModal } from '../components/ui/WarmupModal';
import { MuscleGroup, ExerciseDef, SetType, SessionExercise } from '../types';
import { getTranslated, getMesoStageConfig } from '../utils';

const MuscleTag = ({ label }: { label: string }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400">
        {label}
    </span>
);

interface WorkoutViewProps {
    onFinish: () => void;
    onBack: () => void;
    onAddSet: (exId: number) => void;
    onDeleteSet: (exId: number, setId: number) => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({ onFinish, onBack, onAddSet, onDeleteSet }) => {
    const { activeSession, activeMeso, setActiveSession, setRestTimer, lang, config, exercises, rpFeedback, setRpFeedback } = useApp();
    const t = TRANSLATIONS[lang];
    const [sessionElapsed, setSessionElapsed] = useState(0);
    
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    
    // Modals state
    const [replacingExId, setReplacingExId] = useState<number | null>(null);
    const [addingExercise, setAddingExercise] = useState(false);
    const [linkingId, setLinkingId] = useState<number | null>(null);
    const [editingMuscleId, setEditingMuscleId] = useState<number | null>(null);
    const [warmupExId, setWarmupExId] = useState<number | null>(null);
    
    // Unit config state
    const [configPlateExId, setConfigPlateExId] = useState<number | null>(null);
    const [plateWeightInput, setPlateWeightInput] = useState('');

    // Set Type Selector State (Modal)
    const [changingSetType, setChangingSetType] = useState<{ exId: number, setId: number, currentType: SetType } | null>(null);

    // Calculate Stage Config (RIR, Phase notes)
    const stageConfig = activeMeso ? getMesoStageConfig(activeMeso.mesoType || 'hyp_1', activeMeso.week, !!activeMeso.isDeload) : null;

    useEffect(() => {
        let i: any;
        if (activeSession?.startTime) {
            const tick = () => setSessionElapsed(Math.floor((Date.now() - activeSession.startTime!) / 1000));
            tick();
            i = setInterval(tick, 1000);
        } else {
            setSessionElapsed(0);
        }
        return () => clearInterval(i);
    }, [activeSession?.startTime]);

    // Calculate unique superset IDs to assign colors
    const sessionExercises = (activeSession?.exercises || []).filter((e): e is SessionExercise => !!e);
    
    const supersetStyles = useMemo(() => {
        const uniqueIds = Array.from(new Set(sessionExercises.map(e => e.supersetId).filter((id): id is string => !!id)));
        const palette = [
            { border: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-600', ring: 'ring-orange-500' },
            { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-600', ring: 'ring-blue-500' },
            { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-600', ring: 'ring-purple-500' },
            { border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-500' },
            { border: 'border-l-pink-500', badge: 'bg-pink-100 text-pink-600', ring: 'ring-pink-500' },
            { border: 'border-l-cyan-500', badge: 'bg-cyan-100 text-cyan-600', ring: 'ring-cyan-500' },
        ];
        
        const map: Record<string, typeof palette[0]> = {};
        uniqueIds.forEach((id, idx) => {
            map[id] = palette[idx % palette.length];
        });
        return map;
    }, [sessionExercises.map(e => e.supersetId).join(',')]); // Re-calc only when structure changes

    const supersetStylesMap = supersetStyles; // Alias for cleaner usage if needed, though we use the map directly

    useEffect(() => {
        // Recalculate if needed, but the memo handles it
    }, [sessionExercises.length]);

    if (!activeSession) return null;

    const handleSetUpdate = (exInstanceId: number, setId: number, field: string, value: any) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    return {
                        ...ex,
                        sets: (ex.sets || []).map(s => s.id === setId ? { ...s, [field]: value } : s)
                    };
                })
            };
        });
    };

    const handleNoteUpdate = (exInstanceId: number, note: string) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => ex.instanceId === exInstanceId ? { ...ex, note } : ex)
            };
        });
    };

    const toggleSetComplete = (exInstanceId: number, setId: number) => {
        const ex = sessionExercises.find(e => e.instanceId === exInstanceId);
        const set = ex?.sets?.find(s => s.id === setId);
        if (!set || set.skipped) return;

        const completing = !set.completed;
        let startTime = activeSession.startTime;
        if (completing && !startTime) startTime = Date.now();

        setActiveSession(prev => {
            if(!prev) return null;
            return {
                ...prev,
                startTime,
                exercises: (prev.exercises || []).map(e => e.instanceId === exInstanceId ? {
                    ...e,
                    sets: (e.sets || []).map(s => s.id === setId ? { ...s, completed: completing } : s)
                } : e)
            }
        });

        if (completing) {
            const isMetabolite = activeMeso?.mesoType === 'metabolite';
            // Adjust rest based on set type if needed, e.g. Myo-reps shorter rest
            let dur = isMetabolite ? 60 : 120;
            if (set.type === 'myorep' || set.type === 'giant') dur = 30;
            
            setRestTimer({ active: true, duration: dur, timeLeft: dur, endAt: Date.now() + (dur * 1000) });
        }
    };

    const handleRequestFinish = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowFinishModal(true);
    };

    const handleConfirmFinish = () => {
        setShowFinishModal(false);
        if (config.rpEnabled) {
            setShowFeedbackModal(true);
        } else {
            onFinish();
        }
    };

    const handleSaveFeedback = (feedbackData: Record<string, any>) => {
        const { mesoId, week } = activeSession;
        setRpFeedback(prev => {
            const newFb = { ...prev };
            if (!newFb[mesoId]) newFb[mesoId] = {};
            if (!newFb[mesoId][week]) newFb[mesoId][week] = {};
            // Store complete object
            Object.keys(feedbackData).forEach(m => {
                newFb[mesoId][week][m] = feedbackData[m];
            });
            return newFb;
        });
        setShowFeedbackModal(false);
        onFinish();
    };

    const handleRemoveExercise = (exInstanceId: number) => {
        if (window.confirm(t.confirmRemoveEx)) {
            setActiveSession(prev => {
                if(!prev) return null;
                return { ...prev, exercises: (prev.exercises || []).filter(e => e.instanceId !== exInstanceId) };
            });
            setOpenMenuId(null);
        }
    };

    const handleReorder = (exInstanceId: number, direction: 'up' | 'down') => {
        const idx = sessionExercises.findIndex(e => e.instanceId === exInstanceId);
        if (idx === -1) return;
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === sessionExercises.length - 1) return;

        const newExercises = [...sessionExercises];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        [newExercises[idx], newExercises[swapIdx]] = [newExercises[swapIdx], newExercises[idx]];

        setActiveSession(prev => prev ? { ...prev, exercises: newExercises } : null);
        setOpenMenuId(null);
    };

    const handleReplaceExercise = (newExId: string, customDef?: ExerciseDef) => {
        if (!replacingExId) return;
        const newDef = customDef || exercises.find(e => e.id === newExId);
        if (!newDef) return;

        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => {
                    if (ex.instanceId !== replacingExId) return ex;
                    const resetSets = (ex.sets || []).map(s => ({
                        ...s,
                        weight: '', reps: '', rpe: '', completed: false,
                        hintWeight: undefined, hintReps: undefined
                    }));
                    return { ...ex, ...newDef, sets: resetSets };
                })
            };
        });
        setReplacingExId(null);
        setOpenMenuId(null);
    };

    const handleAddExercise = (newExId: string, customDef?: ExerciseDef) => {
        const newDef = customDef || exercises.find(e => e.id === newExId);
        if (!newDef) return;

        const newInstanceId = Date.now();
        const initialSets = Array(3).fill(null).map((_, i) => ({
            id: newInstanceId + i + 1,
            weight: '', reps: '', rpe: '', completed: false, type: 'regular'
        }));

        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: [...(prev.exercises || []), {
                    ...newDef,
                    instanceId: newInstanceId,
                    slotLabel: newDef.muscle,
                    sets: initialSets as any
                }]
            };
        });
        setAddingExercise(false);
    };

    const handleChangeMuscle = (muscle: MuscleGroup) => {
        if (!editingMuscleId) return;
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => ex.instanceId === editingMuscleId ? { ...ex, slotLabel: muscle } : ex)
            };
        });
        setEditingMuscleId(null);
        setOpenMenuId(null);
    };

    const handleToggleSupersetLink = (exInstanceId: number) => {
        const ex = sessionExercises.find(e => e.instanceId === exInstanceId);
        if (ex?.supersetId) {
            setActiveSession(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    exercises: (prev.exercises || []).map(e => e.instanceId === exInstanceId ? { ...e, supersetId: undefined } : e)
                };
            });
        } else {
            setLinkingId(exInstanceId);
        }
        setOpenMenuId(null);
    };

    const handleLinkTo = (targetInstanceId: number) => {
        if (!linkingId) return;
        const ssid = `ss_${Date.now()}`;
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(e => {
                    if (e.instanceId === linkingId || e.instanceId === targetInstanceId) {
                        return { ...e, supersetId: ssid };
                    }
                    return e;
                })
            };
        });
        setLinkingId(null);
    };

    const handleToggleUnit = (exInstanceId: number) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(e => {
                    if (e.instanceId !== exInstanceId) return e;
                    const newUnit = e.weightUnit === 'pl' ? 'kg' : 'pl';
                    return { ...e, weightUnit: newUnit };
                })
            };
        });
        setOpenMenuId(null);
    };

    const handleUpdatePlateWeight = (exInstanceId: number) => {
        const weight = parseFloat(plateWeightInput);
        if (!isNaN(weight) && weight > 0) {
            setActiveSession(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    exercises: (prev.exercises || []).map(e => e.instanceId === exInstanceId ? { ...e, plateWeight: weight } : e)
                };
            });
        }
        setConfigPlateExId(null);
        setPlateWeightInput('');
    };

    const finishedSets = sessionExercises.reduce((acc, ex) => acc + (ex.sets || []).filter(s => s.completed).length, 0);
    
    // Set Type Helpers
    const setTypes: SetType[] = ['regular', 'warmup', 'myorep', 'myorep_match', 'giant', 'top', 'backoff', 'cluster'];
    const getTypeColor = (type: SetType) => {
        switch(type) {
            case 'warmup': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'myorep': 
            case 'myorep_match': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'giant': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'top': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300';
        }
    };
    const getTypeLabel = (type: SetType) => {
        switch(type) {
            case 'regular': return 'R';
            case 'warmup': return 'W';
            case 'myorep': return 'M';
            case 'myorep_match': return 'MM';
            case 'giant': return 'G';
            case 'top': return 'T';
            case 'backoff': return 'B';
            case 'cluster': return 'C';
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-gray-50 dark:bg-zinc-950 font-sans" onClick={() => setOpenMenuId(null)}>
            
            {/* Header */}
            <div className="glass z-30 px-4 h-20 shrink-0 flex items-center justify-between border-b border-zinc-200 dark:border-white/5">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-zinc-200 dark:active:bg-zinc-800 transition-colors -ml-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    <Icon name="ChevronLeft" size={24} />
                </button>
                <div className="text-center">
                    <div className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-0.5">{t.active}</div>
                    <div className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-none mb-1">{activeSession.name}</div>
                    {stageConfig && (
                        <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                             {stageConfig.label === 'recovery' ? (
                                <><Icon name="Activity" size={10} className="text-blue-500" /> RECOVERY / DELOAD</>
                             ) : (
                                <><Icon name="Zap" size={10} className="text-yellow-500" /> TARGET: {stageConfig.label} ({stageConfig.rir} RIR)</>
                             )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="font-mono text-sm font-bold text-zinc-400 tabular-nums">
                        {Math.floor(sessionElapsed / 60)}:{(sessionElapsed % 60).toString().padStart(2, '0')}
                    </div>
                    <button onClick={handleRequestFinish} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg shadow-red-900/20 transition-transform active:scale-95 flex items-center justify-center">
                        <Icon name="Check" size={20} />
                    </button>
                </div>
            </div>

            {/* Linking Banner */}
            {linkingId && (
                <div className="bg-orange-500 text-white p-2 text-center text-xs font-bold animate-in slide-in-from-top">
                    {t.selectToLink}
                    <button onClick={() => setLinkingId(null)} className="ml-4 underline opacity-80">{t.cancel}</button>
                </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scroll-container p-4 pb-32 space-y-6">
                
                {stageConfig && stageConfig.note && (
                    <div className="p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {stageConfig.note}
                    </div>
                )}

                {sessionExercises.map((ex, idx) => {
                    if (!ex) return null;

                    const ssStyle = ex.supersetId ? supersetStyles[ex.supersetId] : null;
                    const isLinkingTarget = linkingId && linkingId !== ex.instanceId;
                    const isFirst = idx === 0;
                    const isLast = idx === sessionExercises.length - 1;
                    const sets = Array.isArray(ex.sets) ? ex.sets : [];
                    const unit = ex.weightUnit || 'kg';
                    const unitLabel = unit === 'pl' ? t.units.pl : t.units.kg;
                    
                    return (
                        <div 
                            key={ex.instanceId} 
                            onClick={() => isLinkingTarget && handleLinkTo(ex.instanceId)}
                            className={`
                                relative flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden transition-all
                                ${ssStyle ? `border-l-4 ${ssStyle.border}` : ''}
                                ${isLinkingTarget ? 'ring-2 ring-orange-500 cursor-pointer opacity-80 hover:opacity-100' : ''}
                                ${linkingId === ex.instanceId ? 'ring-2 ring-orange-500' : ''}
                            `}
                        >
                            {/* Exercise Header */}
                            <div className="p-4 flex flex-col gap-2 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            {ssStyle && <span className={`${ssStyle.badge} text-[9px] font-bold px-1.5 py-0.5 rounded`}>SS</span>}
                                            <MuscleTag label={ex.slotLabel || ex.muscle || 'CHEST'} />
                                            {ex.targetReps && <span className="text-[10px] font-bold text-zinc-400 tracking-wide">{t.target}: {ex.targetReps}</span>}
                                            {unit === 'pl' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setConfigPlateExId(ex.instanceId); }}
                                                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                >
                                                    {ex.plateWeight ? `1 PL = ${ex.plateWeight}kg` : t.units.setPlateWeight}
                                                </button>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight tracking-tight">
                                            {getTranslated(ex.name, lang)}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setWarmupExId(ex.instanceId); }}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/10 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                            title={t.warmup}
                                        >
                                            <Icon name="Zap" size={16} fill="currentColor" />
                                        </button>
                                        <div className="relative">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === ex.instanceId ? null : ex.instanceId); }}
                                                className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                <Icon name="MoreVertical" size={20} />
                                            </button>
                                            
                                            {openMenuId === ex.instanceId && (
                                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-white/5 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                    <div className="flex border-b border-zinc-100 dark:border-white/5">
                                                        <button 
                                                            disabled={isFirst}
                                                            onClick={(e) => { e.stopPropagation(); handleReorder(ex.instanceId, 'up'); }}
                                                            className="flex-1 py-3 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title={t.moveUp}
                                                        >
                                                            <Icon name="TrendingUp" size={16} />
                                                        </button>
                                                        <div className="w-px bg-zinc-100 dark:bg-white/5"></div>
                                                        <button 
                                                            disabled={isLast}
                                                            onClick={(e) => { e.stopPropagation(); handleReorder(ex.instanceId, 'down'); }}
                                                            className="flex-1 py-3 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transform rotate-180"
                                                            title={t.moveDown}
                                                        >
                                                            <Icon name="TrendingUp" size={16} />
                                                        </button>
                                                    </div>

                                                    <button onClick={(e) => { e.stopPropagation(); handleToggleUnit(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                        <Icon name="Dumbbell" size={16} /> {t.units.toggle}
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); setReplacingExId(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                        <Icon name="RefreshCw" size={16} /> {t.replaceEx}
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingMuscleId(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                                        <Icon name="Dumbbell" size={16} /> {t.changeMuscle}
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleToggleSupersetLink(ex.instanceId); }} className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2 ${ssStyle ? 'text-red-500' : 'text-orange-600'}`}>
                                                        <Icon name={ssStyle ? "Unlink" : "Link"} size={16} /> {ssStyle ? t.unlinkSuperset : t.linkSuperset}
                                                    </button>
                                                    <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveExercise(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                                        <Icon name="Trash2" size={16} /> {t.removeEx}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <input 
                                    type="text"
                                    placeholder={t.addNote}
                                    value={ex.note || ''}
                                    onChange={(e) => handleNoteUpdate(ex.instanceId, e.target.value)}
                                    className="w-full bg-transparent text-xs text-zinc-500 placeholder-zinc-300 dark:placeholder-zinc-700 outline-none border-b border-transparent focus:border-red-500/50 transition-colors pb-1"
                                />
                            </div>
                            
                            {/* Sets Header */}
                            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-50 dark:bg-black/20 border-b border-zinc-100 dark:border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">
                                <div className="col-span-1">#</div>
                                <div className="col-span-4 text-left pl-4">{t.weight} ({unit === 'pl' ? 'PL' : 'KG'})</div>
                                <div className="col-span-4">{t.reps}</div>
                                {config.showRIR && <div className="col-span-2">{t.rir}</div>}
                                <div className="col-span-1"></div>
                            </div>

                            {/* Sets Body */}
                            <div className="divide-y divide-zinc-100 dark:divide-white/5">
                                {sets.map((set, sIdx) => {
                                    const isDone = set.completed;
                                    const placeholderRIR = stageConfig?.rir !== null ? String(stageConfig?.rir) : "-";
                                    const setType = set.type || 'regular';
                                    
                                    let calculatedKg: number | null = null;
                                    if (unit === 'pl' && ex.plateWeight && set.weight) {
                                        calculatedKg = Number(set.weight) * ex.plateWeight;
                                    }

                                    return (
                                        <div key={set.id} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors duration-300 relative group ${isDone ? 'bg-green-50/50 dark:bg-green-500/5' : ''}`}>
                                            <div className="col-span-1 flex justify-center relative">
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        if (!isDone) {
                                                            setChangingSetType({ exId: ex.instanceId, setId: set.id, currentType: setType });
                                                        }
                                                    }}
                                                    className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold cursor-pointer transition-all active:scale-95 ${isDone ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : `${getTypeColor(setType)} ring-1 ring-inset ring-black/5 dark:ring-white/10 hover:ring-red-500`}`}
                                                >
                                                   {isDone ? <Icon name="Check" size={10} /> : getTypeLabel(setType)}
                                                </button>
                                            </div>
                                            <div className="col-span-4 relative flex items-center justify-center gap-1">
                                                <input type="number" inputMode="decimal" className={`w-full bg-transparent text-lg font-bold p-0 border-0 focus:ring-0 text-center transition-colors ${isDone ? 'text-green-800 dark:text-green-400' : 'text-zinc-900 dark:text-white'}`} placeholder={set.hintWeight ? String(set.hintWeight) : "0"} value={set.weight} onChange={(e) => handleSetUpdate(ex.instanceId, set.id, 'weight', e.target.value)} />
                                                <div className="flex flex-col items-center">
                                                    <div className="text-[9px] text-zinc-400 font-medium -mt-1 leading-none">{set.hintWeight ? `${t.prev}: ${set.hintWeight}` : unitLabel}</div>
                                                    {calculatedKg !== null && <div className="text-[9px] text-blue-500 font-bold leading-none mt-0.5">≈{calculatedKg}kg</div>}
                                                </div>
                                            </div>
                                            <div className="col-span-4 relative">
                                                <input type="number" inputMode="numeric" className={`w-full bg-transparent text-lg font-bold p-0 border-0 focus:ring-0 text-center transition-colors ${isDone ? 'text-green-800 dark:text-green-400' : 'text-zinc-900 dark:text-white'}`} placeholder={set.hintReps ? String(set.hintReps) : "0"} value={set.reps} onChange={(e) => handleSetUpdate(ex.instanceId, set.id, 'reps', e.target.value)} />
                                                <div className="text-[9px] text-zinc-400 text-center font-medium -mt-1">{set.hintReps ? `${t.prev}: ${set.hintReps}` : 'reps'}</div>
                                            </div>
                                            {config.showRIR && (
                                                <div className="col-span-2 flex justify-center">
                                                    <input 
                                                        type="number" 
                                                        inputMode="numeric" 
                                                        className={`w-12 bg-zinc-100 dark:bg-white/5 rounded text-sm font-bold py-1 border-0 focus:ring-1 focus:ring-zinc-500 text-center text-zinc-600 dark:text-zinc-300 ${isDone ? 'opacity-50' : ''}`} 
                                                        placeholder={placeholderRIR}
                                                        value={set.rpe} 
                                                        onChange={(e) => handleSetUpdate(ex.instanceId, set.id, 'rpe', e.target.value)} 
                                                    />
                                                </div>
                                            )}
                                            <div className="col-span-1 flex justify-end">
                                                <button onClick={() => toggleSetComplete(ex.instanceId, set.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90 ${isDone ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 rotate-0' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                                                    <Icon name="Check" size={18} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-2 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5 grid grid-cols-2 divide-x divide-zinc-200 dark:divide-white/10">
                                <button 
                                    onClick={() => {
                                        if (sets.length > 0) {
                                            onDeleteSet(ex.instanceId, sets[sets.length - 1].id);
                                        }
                                    }}
                                    disabled={sets.length <= 1}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                                >
                                    <Icon name="Minus" size={14} /> {t.removeSetBtn}
                                </button>
                                <button 
                                    onClick={() => onAddSet(ex.instanceId)} 
                                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                >
                                    <Icon name="Plus" size={14} /> {t.addSetBtn}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Add Exercise Button */}
                <Button variant="secondary" onClick={() => setAddingExercise(true)} fullWidth className="border-dashed py-3">
                    <Icon name="Plus" size={16} /> {t.addExercise}
                </Button>

                <div className="h-4"></div>
                <Button onClick={handleRequestFinish} size="lg" fullWidth className="py-4 text-base shadow-xl shadow-red-600/20 bg-gradient-to-r from-red-600 to-red-500 border-none">
                    {t.finishWorkout}
                </Button>
            </div>

            {/* Set Type Selector Modal */}
            {changingSetType && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setChangingSetType(null)}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-4 shadow-2xl border border-zinc-200 dark:border-white/10 animate-slideUp space-y-2" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-4">
                            <h3 className="font-bold text-zinc-900 dark:text-white">{t.setType}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {setTypes.map(type => (
                                <button 
                                    key={type}
                                    onClick={() => {
                                        handleSetUpdate(changingSetType.exId, changingSetType.setId, 'type', type);
                                        setChangingSetType(null);
                                    }}
                                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${changingSetType.currentType === type ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-300'}`}
                                >
                                    <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${getTypeColor(type)}`}>
                                        {getTypeLabel(type)}
                                    </span>
                                    <span className="text-xs font-bold">{t.types[type]}</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setChangingSetType(null)} className="w-full py-3 mt-2 text-zinc-400 font-bold text-xs">{t.cancel}</button>
                    </div>
                </div>
            )}

            {/* Finish Modal */}
            {showFinishModal && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${finishedSets > 0 ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600'}`}>
                                <Icon name={finishedSets > 0 ? "CheckCircle" : "Activity"} size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{finishedSets > 0 ? t.finishWorkout : t.emptyWorkoutTitle}</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {finishedSets > 0 
                                        ? t.completedSetsMsg.replace('{0}', String(finishedSets)) 
                                        : t.emptyWorkoutMsg
                                    }
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                <Button variant="secondary" onClick={() => setShowFinishModal(false)} className="w-full">{t.cancel}</Button>
                                <Button variant="primary" onClick={handleConfirmFinish} className="w-full">{t.finishWorkout}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RP Feedback */}
            {showFeedbackModal && activeSession && (
                <FeedbackModal 
                    muscles={sessionExercises.map(e => e?.muscle || 'CHEST')} 
                    onCancel={() => setShowFeedbackModal(false)} 
                    onConfirm={handleSaveFeedback} 
                />
            )}

            {/* Replace Exercise Selector */}
            {replacingExId && (
                <ExerciseSelector onSelect={handleReplaceExercise} onClose={() => setReplacingExId(null)} />
            )}

            {/* Add Exercise Selector */}
            {addingExercise && (
                <ExerciseSelector onSelect={handleAddExercise} onClose={() => setAddingExercise(false)} />
            )}

            {/* Muscle Selector Modal for Editing */}
            {editingMuscleId && (
                 <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-6" onClick={() => setEditingMuscleId(null)}>
                     <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg dark:text-white text-center">{t.selectMuscle}</h3>
                        <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
                            {Object.values(MUSCLE_GROUPS).map(m => (
                                <button key={m} onClick={() => handleChangeMuscle(m)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                                    {TRANSLATIONS[lang].muscle[m]}
                                </button>
                            ))}
                        </div>
                     </div>
                 </div>
            )}

            {/* Config Plate Weight Modal */}
            {configPlateExId && (
                 <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-6" onClick={() => setConfigPlateExId(null)}>
                     <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg dark:text-white text-center">{t.units.plateWeight}</h3>
                        <div className="space-y-4">
                            <input 
                                type="number" 
                                autoFocus
                                className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-center font-bold text-xl outline-none"
                                placeholder={t.units.enterWeight}
                                value={plateWeightInput}
                                onChange={(e) => setPlateWeightInput(e.target.value)}
                            />
                            <Button fullWidth onClick={() => handleUpdatePlateWeight(configPlateExId)}>
                                {t.save}
                            </Button>
                        </div>
                     </div>
                 </div>
            )}

            {/* Warmup Modal */}
            {warmupExId && activeSession && (
                <WarmupModal 
                    targetWeight={Number(sessionExercises.find(e => e.instanceId === warmupExId)?.sets?.[0]?.hintWeight || sessionExercises.find(e => e.instanceId === warmupExId)?.sets?.[0]?.weight || 0)}
                    exerciseName={
                        (() => {
                            const ex = sessionExercises.find(e => e.instanceId === warmupExId);
                            if (!ex) return '';
                            return getTranslated(ex.name, lang);
                        })()
                    }
                    onClose={() => setWarmupExId(null)}
                />
            )}
        </div>
    );
};
