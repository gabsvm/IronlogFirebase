
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { ExerciseSelector } from '../components/ui/ExerciseSelector';
import { FeedbackModal } from '../components/ui/FeedbackModal';
import { WarmupModal } from '../components/ui/WarmupModal';
import { MuscleGroup, ExerciseDef, SessionExercise, SetType } from '../types';
import { getTranslated, getMesoStageConfig } from '../utils';
import { useWorkoutController } from '../hooks/useWorkoutController';
import { SetRow } from '../components/workout/SetRow';
import { MuscleTag } from '../components/workout/MuscleTag';

interface WorkoutViewProps {
    onFinish: () => void;
    onBack: () => void;
    onAddSet: (exId: number) => void;
    onDeleteSet: (exId: number, setId: number) => void;
}

// Container Component
export const WorkoutView: React.FC<WorkoutViewProps> = ({ onFinish, onBack, onAddSet, onDeleteSet }) => {
    const { activeSession, activeMeso, lang, config, exercises } = useApp();
    const t = TRANSLATIONS[lang];
    
    // Use the Custom Controller Hook
    const ctrl = useWorkoutController(onFinish);

    // Derived State
    const stageConfig = activeMeso ? getMesoStageConfig(activeMeso.mesoType || 'hyp_1', activeMeso.week, !!activeMeso.isDeload) : null;
    const sessionExercises = ctrl.sessionExercises as SessionExercise[];
    
    // Superset Color Logic
    const supersetStyles = useMemo(() => {
        const uniqueIds = Array.from(new Set(sessionExercises.map(e => e.supersetId).filter((id): id is string => typeof id === 'string' && !!id)));
        const palette = [
            { border: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-600' },
            { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-600' },
            { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-600' },
            { border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-600' },
        ];
        const map: Record<string, typeof palette[0]> = {};
        uniqueIds.forEach((id, idx) => { map[id] = palette[idx % palette.length]; });
        return map;
    }, [sessionExercises]);

    if (!activeSession) return null;

    // Handlers specific to data manipulation that are simple enough to keep here or passed from props
    const handleUpdatePlateWeight = (exInstanceId: number) => {
        const weight = parseFloat(ctrl.plateWeightInput);
        if (!isNaN(weight) && weight > 0) {
            ctrl.updateSession(prev => !prev ? null : {
                ...prev,
                exercises: (prev.exercises || []).map(e => e.instanceId === exInstanceId ? { ...e, plateWeight: weight } : e)
            });
        }
        ctrl.setConfigPlateExId(null);
        ctrl.setPlateWeightInput('');
    };

    // Generic handler for exercise array updates (reorder, remove, etc)
    const updateExercises = (newExercises: SessionExercise[]) => {
        ctrl.updateSession(prev => prev ? { ...prev, exercises: newExercises } : null);
    };

    const handleReorder = (exInstanceId: number, direction: 'up' | 'down') => {
        const idx = sessionExercises.findIndex(e => e.instanceId === exInstanceId);
        if (idx === -1) return;
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === sessionExercises.length - 1) return;
        const newExs = [...sessionExercises];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        [newExs[idx], newExs[swapIdx]] = [newExs[swapIdx], newExs[idx]];
        updateExercises(newExs);
        ctrl.setOpenMenuId(null);
    };
    
    const handleRemove = (exId: number) => {
        if(window.confirm(t.confirmRemoveEx)) {
            updateExercises(sessionExercises.filter(e => e.instanceId !== exId));
            ctrl.setOpenMenuId(null);
        }
    };

    const handleAddExercise = (newExId: string, customDef?: ExerciseDef) => {
        const newDef = customDef || exercises.find(e => e.id === newExId);
        if (!newDef) return;
        const newInstanceId = Date.now();
        const initialSets = Array(3).fill(null).map((_, i) => ({
            id: newInstanceId + i + 1,
            weight: '', reps: '', rpe: '', completed: false, type: 'regular'
        }));
        ctrl.updateSession(prev => !prev ? null : {
            ...prev,
            exercises: [...(prev.exercises || []), { ...newDef, instanceId: newInstanceId, slotLabel: newDef.muscle, sets: initialSets as any }]
        });
        ctrl.setAddingExercise(false);
    };

    const handleReplace = (newExId: string, customDef?: ExerciseDef) => {
         if (!ctrl.replacingExId) return;
         const newDef = customDef || exercises.find(e => e.id === newExId);
         if (!newDef) return;
         ctrl.updateSession(prev => !prev ? null : {
             ...prev,
             exercises: (prev.exercises || []).map(ex => {
                 if (ex.instanceId !== ctrl.replacingExId) return ex;
                 const resetSets = (ex.sets || []).map(s => ({ ...s, weight: '', reps: '', rpe: '', completed: false }));
                 return { ...ex, ...newDef, sets: resetSets };
             })
         });
         ctrl.setReplacingExId(null);
         ctrl.setOpenMenuId(null);
    };

    const handleToggleSuperset = (exId: number, currentSsId?: string) => {
        if (currentSsId) {
             ctrl.updateSession(prev => !prev ? null : {
                 ...prev,
                 exercises: (prev.exercises || []).map(e => e.instanceId === exId ? { ...e, supersetId: undefined } : e)
             });
        } else {
            ctrl.setLinkingId(exId);
        }
        ctrl.setOpenMenuId(null);
    };

    const finishedSets = sessionExercises.reduce((acc, ex) => acc + (ex.sets || []).filter(s => s.completed).length, 0);

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-gray-50 dark:bg-zinc-950 font-sans" onClick={() => ctrl.setOpenMenuId(null)}>
            
            {/* --- Header Section --- */}
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
                        {Math.floor(ctrl.sessionElapsed / 60)}:{(ctrl.sessionElapsed % 60).toString().padStart(2, '0')}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); ctrl.setShowFinishModal(true); }} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg shadow-red-900/20 transition-transform active:scale-95 flex items-center justify-center">
                        <Icon name="Check" size={20} />
                    </button>
                </div>
            </div>

            {/* --- Linking Banner --- */}
            {ctrl.linkingId && (
                <div className="bg-orange-500 text-white p-2 text-center text-xs font-bold animate-in slide-in-from-top">
                    {t.selectToLink}
                    <button onClick={() => ctrl.setLinkingId(null)} className="ml-4 underline opacity-80">{t.cancel}</button>
                </div>
            )}

            {/* --- Main Content (Exercises List) --- */}
            <div className="flex-1 overflow-y-auto scroll-container p-4 pb-32 space-y-6">
                
                {stageConfig?.note && (
                    <div className="p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {stageConfig.note}
                    </div>
                )}

                {sessionExercises.map((ex, idx) => {
                    const ssStyle = ex.supersetId ? supersetStyles[ex.supersetId] : null;
                    const isLinkingTarget = ctrl.linkingId && ctrl.linkingId !== ex.instanceId;
                    const unit = ex.weightUnit || 'kg';
                    const unitLabel = unit === 'pl' ? t.units.pl : t.units.kg;
                    const sets = ex.sets || [];

                    return (
                        <div 
                            key={ex.instanceId} 
                            onClick={() => {
                                if (isLinkingTarget) {
                                    const ssid = `ss_${Date.now()}`;
                                    ctrl.updateSession(prev => !prev ? null : {
                                        ...prev,
                                        exercises: prev.exercises.map(e => (e.instanceId === ctrl.linkingId || e.instanceId === ex.instanceId) ? { ...e, supersetId: ssid } : e)
                                    });
                                    ctrl.setLinkingId(null);
                                }
                            }}
                            className={`
                                relative flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden transition-all
                                ${ssStyle ? `border-l-4 ${ssStyle.border}` : ''}
                                ${isLinkingTarget ? 'ring-2 ring-orange-500 cursor-pointer opacity-80 hover:opacity-100' : ''}
                                ${ctrl.linkingId === ex.instanceId ? 'ring-2 ring-orange-500' : ''}
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
                                                    onClick={(e) => { e.stopPropagation(); ctrl.setConfigPlateExId(ex.instanceId); }}
                                                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded hover:bg-blue-200"
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
                                        <button onClick={(e) => { e.stopPropagation(); ctrl.setWarmupExId(ex.instanceId); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/10 text-orange-500">
                                            <Icon name="Zap" size={16} fill="currentColor" />
                                        </button>
                                        <div className="relative">
                                            <button onClick={(e) => { e.stopPropagation(); ctrl.setOpenMenuId(ctrl.openMenuId === ex.instanceId ? null : ex.instanceId); }} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                <Icon name="MoreVertical" size={20} />
                                            </button>
                                            
                                            {/* Dropdown Menu */}
                                            {ctrl.openMenuId === ex.instanceId && (
                                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-white/5 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                    <div className="flex border-b border-zinc-100 dark:border-white/5">
                                                        <button onClick={(e) => { e.stopPropagation(); handleReorder(ex.instanceId, 'up'); }} className="flex-1 py-3 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                                                            <Icon name="TrendingUp" size={16} />
                                                        </button>
                                                        <div className="w-px bg-zinc-100 dark:bg-white/5"></div>
                                                        <button onClick={(e) => { e.stopPropagation(); handleReorder(ex.instanceId, 'down'); }} className="flex-1 py-3 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-300 transform rotate-180">
                                                            <Icon name="TrendingUp" size={16} />
                                                        </button>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); ctrl.setReplacingExId(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-2">
                                                        <Icon name="RefreshCw" size={16} /> {t.replaceEx}
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); ctrl.setEditingMuscleId(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-2">
                                                        <Icon name="Dumbbell" size={16} /> {t.changeMuscle}
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleToggleSuperset(ex.instanceId, ex.supersetId); }} className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2 ${ssStyle ? 'text-red-500' : 'text-orange-600'}`}>
                                                        <Icon name={ssStyle ? "Unlink" : "Link"} size={16} /> {ssStyle ? t.unlinkSuperset : t.linkSuperset}
                                                    </button>
                                                    <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleRemove(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
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
                                    onChange={(e) => ctrl.handleNoteUpdate(ex.instanceId, e.target.value)}
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

                            {/* Sets List (Optimized) */}
                            <div className="divide-y divide-zinc-100 dark:divide-white/5">
                                {sets.map((set) => (
                                    <SetRow
                                        key={set.id}
                                        set={set}
                                        exInstanceId={ex.instanceId}
                                        unit={unit}
                                        unitLabel={unitLabel}
                                        plateWeight={ex.plateWeight}
                                        showRIR={config.showRIR}
                                        stageRIR={stageConfig?.rir !== null ? String(stageConfig?.rir) : "-"}
                                        onUpdate={ctrl.handleSetUpdate}
                                        onToggleComplete={ctrl.toggleSetComplete}
                                        onChangeType={(exId, setId, type) => ctrl.setChangingSetType({ exId, setId, currentType: type })}
                                        lang={lang}
                                    />
                                ))}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-2 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5 grid grid-cols-2 divide-x divide-zinc-200 dark:divide-white/10">
                                <button onClick={() => sets.length > 0 && onDeleteSet(ex.instanceId, sets[sets.length - 1].id)} disabled={sets.length <= 1} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-red-500 disabled:opacity-30">
                                    <Icon name="Minus" size={14} /> {t.removeSetBtn}
                                </button>
                                <button onClick={() => onAddSet(ex.instanceId)} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                    <Icon name="Plus" size={14} /> {t.addSetBtn}
                                </button>
                            </div>
                        </div>
                    );
                })}

                <Button variant="secondary" onClick={() => ctrl.setAddingExercise(true)} fullWidth className="border-dashed py-3">
                    <Icon name="Plus" size={16} /> {t.addExercise}
                </Button>
                <div className="h-4"></div>
                <Button onClick={(e) => { e.stopPropagation(); ctrl.setShowFinishModal(true); }} size="lg" fullWidth className="py-4 text-base shadow-xl shadow-red-600/20 bg-gradient-to-r from-red-600 to-red-500 border-none">
                    {t.finishWorkout}
                </Button>
            </div>

            {/* --- Modals (Rendered conditionally) --- */}
            {ctrl.changingSetType && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => ctrl.setChangingSetType(null)}>
                    {/* Simplified Type Selector UI - Keeping functionality identical but cleaner */}
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-2" onClick={e => e.stopPropagation()}>
                         <h3 className="text-center font-bold dark:text-white mb-2">{t.setType}</h3>
                         <div className="grid grid-cols-1 gap-2">
                             {(['regular', 'warmup', 'myorep', 'myorep_match', 'giant', 'top', 'backoff', 'cluster'] as SetType[]).map(type => (
                                 <button key={type} onClick={() => { ctrl.handleSetUpdate(ctrl.changingSetType!.exId, ctrl.changingSetType!.setId, 'type', type); ctrl.setChangingSetType(null); }} className="p-3 border border-zinc-200 dark:border-white/10 rounded-xl flex items-center gap-3 text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group">
                                     <span className="shrink-0 w-8 h-8 flex items-center justify-center text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-red-100 group-hover:text-red-600 dark:group-hover:bg-red-900/20 dark:group-hover:text-red-400 rounded-lg transition-colors">{type.substring(0,2).toUpperCase()}</span>
                                     <div>
                                        <div className="text-sm font-bold text-zinc-900 dark:text-white">{t.types[type]}</div>
                                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{t.typeDesc[type]}</div>
                                     </div>
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>
            )}

            {/* Finish Modal */}
            {ctrl.showFinishModal && (
                 <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
                     <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
                         <h3 className="text-xl font-bold text-center dark:text-white">{finishedSets > 0 ? t.finishWorkout : t.emptyWorkoutTitle}</h3>
                         <div className="grid grid-cols-2 gap-3">
                             <Button variant="secondary" onClick={() => ctrl.setShowFinishModal(false)}>{t.cancel}</Button>
                             <Button variant="primary" onClick={ctrl.handleConfirmFinish}>{t.finishWorkout}</Button>
                         </div>
                     </div>
                 </div>
            )}

            {/* Other Modals (Feedback, Exercise Selectors) pass their specific handlers */}
            {ctrl.showFeedbackModal && activeSession && (
                <FeedbackModal muscles={sessionExercises.map(e => e?.muscle || 'CHEST')} onCancel={() => ctrl.setShowFeedbackModal(false)} onConfirm={ctrl.handleSaveFeedback} />
            )}
            {ctrl.replacingExId && <ExerciseSelector onSelect={handleReplace} onClose={() => ctrl.setReplacingExId(null)} />}
            {ctrl.addingExercise && <ExerciseSelector onSelect={handleAddExercise} onClose={() => ctrl.setAddingExercise(false)} />}
            {ctrl.configPlateExId && (
                 <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-6" onClick={() => ctrl.setConfigPlateExId(null)}>
                     <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg dark:text-white text-center">{t.units.plateWeight}</h3>
                        <input type="number" autoFocus className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-center font-bold text-xl outline-none" value={ctrl.plateWeightInput} onChange={(e) => ctrl.setPlateWeightInput(e.target.value)} />
                        <Button fullWidth onClick={() => handleUpdatePlateWeight(ctrl.configPlateExId!)}>{t.save}</Button>
                     </div>
                 </div>
            )}
            {ctrl.warmupExId && activeSession && (
                <WarmupModal targetWeight={Number(sessionExercises.find(e => e.instanceId === ctrl.warmupExId)?.sets?.[0]?.weight || 0)} exerciseName={getTranslated(sessionExercises.find(e => e.instanceId === ctrl.warmupExId)?.name, lang)} onClose={() => ctrl.setWarmupExId(null)} />
            )}
        </div>
    );
};
