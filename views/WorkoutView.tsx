
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { ExerciseSelector } from '../components/ui/ExerciseSelector';
import { FeedbackModal } from '../components/ui/FeedbackModal';
import { WarmupModal } from '../components/ui/WarmupModal';
import { PlateCalculatorModal } from '../components/ui/PlateCalculatorModal'; 
import { PRCelebrationOverlay } from '../components/ui/PRCelebrationOverlay'; 
import { ExerciseDetailModal } from '../components/ui/ExerciseDetailModal'; // New Import
import { ExerciseDef, SessionExercise, SetType } from '../types';
import { getTranslated, getMesoStageConfig, getLastLogForExercise } from '../utils';
import { useWorkoutController } from '../hooks/useWorkoutController';
import { SortableExerciseCard } from '../components/workout/SortableExerciseCard';
import { triggerHaptic } from '../utils/audio';

// DnD Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface WorkoutViewProps {
    onFinish: () => void;
    onBack: () => void;
    onAddSet: (exId: number) => void;
    onDeleteSet: (exId: number, setId: number) => void;
}

// Container Component
export const WorkoutView: React.FC<WorkoutViewProps> = ({ onFinish, onBack, onAddSet, onDeleteSet }) => {
    const { activeSession, activeMeso, lang, config, exercises, logs } = useApp();
    const t = TRANSLATIONS[lang];
    
    // Use the Custom Controller Hook
    const ctrl = useWorkoutController(onFinish);

    // View State for Focus Mode
    const [viewMode, setViewMode] = useState<'list' | 'focus'>('list');
    const [focusedIndex, setFocusedIndex] = useState(0);

    // Derived State
    const stageConfig = activeMeso ? getMesoStageConfig(activeMeso.mesoType || 'hyp_1', activeMeso.week, !!activeMeso.isDeload) : null;
    const sessionExercises = ctrl.sessionExercises as SessionExercise[];
    
    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 0,
                tolerance: 5,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        triggerHaptic('light'); // Feedback when picking up an item
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        
        if (active.id !== over?.id) {
            const oldIndex = sessionExercises.findIndex((item) => item.instanceId === active.id);
            const newIndex = sessionExercises.findIndex((item) => item.instanceId === over?.id);
            
            ctrl.reorderSessionExercises(oldIndex, newIndex);
        }
    };
    
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

    const handleAddExercise = (newExId: string, customDef?: ExerciseDef) => {
        const newDef = customDef || exercises.find(e => e.id === newExId);
        if (!newDef) return;

        // Fetch history for added exercise
        const safeLogs = Array.isArray(logs) ? logs : [];
        const lastSets = getLastLogForExercise(newExId, safeLogs);

        const newInstanceId = Date.now();
        const initialSets = Array(3).fill(null).map((_, i) => {
            const historySet = lastSets && lastSets[i] ? lastSets[i] : null;
            return {
                id: newInstanceId + i + 1,
                weight: '', 
                reps: '', 
                rpe: '', 
                completed: false, 
                type: 'regular',
                hintWeight: historySet ? historySet.weight : undefined,
                hintReps: historySet ? historySet.reps : undefined,
                prevWeight: historySet ? historySet.weight : undefined,
                prevReps: historySet ? historySet.reps : undefined
            };
        });

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

         // Fetch history for the NEW exercise
         const safeLogs = Array.isArray(logs) ? logs : [];
         const lastSets = getLastLogForExercise(newExId, safeLogs);

         ctrl.updateSession(prev => !prev ? null : {
             ...prev,
             exercises: (prev.exercises || []).map(ex => {
                 if (ex.instanceId !== ctrl.replacingExId) return ex;
                 
                 // Map sets to reset values AND update hints with new exercise history
                 const resetSets = (ex.sets || []).map((s, i) => {
                     const historySet = lastSets && lastSets[i] ? lastSets[i] : null;
                     return { 
                         ...s, 
                         weight: '', 
                         reps: '', 
                         rpe: '', 
                         completed: false,
                         hintWeight: historySet ? historySet.weight : undefined,
                         hintReps: historySet ? historySet.reps : undefined,
                         prevWeight: historySet ? historySet.weight : undefined,
                         prevReps: historySet ? historySet.reps : undefined
                     };
                 });

                 return { ...ex, ...newDef, sets: resetSets };
             })
         });
         ctrl.setReplacingExId(null);
         ctrl.setOpenMenuId(null);
    };

    const finishedSets = sessionExercises.reduce((acc, ex) => acc + (ex.sets || []).filter(s => s.completed).length, 0);

    // Focus Mode Navigation
    const focusedExercise = sessionExercises[focusedIndex];
    const goToNext = () => setFocusedIndex(prev => Math.min(prev + 1, sessionExercises.length - 1));
    const goToPrev = () => setFocusedIndex(prev => Math.max(prev - 1, 0));

    // Helper to toggle view mode
    const toggleViewMode = () => {
        if ((document as any).startViewTransition) {
            (document as any).startViewTransition(() => {
                setViewMode(prev => prev === 'list' ? 'focus' : 'list');
            });
        } else {
             setViewMode(prev => prev === 'list' ? 'focus' : 'list');
        }
    };

    // Determine if we should show RIR info in header
    // Only show if config.showRIR is true OR if it is a deload (which is structural)
    const showStageInfo = stageConfig && (config.showRIR || stageConfig.label === 'recovery');

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
                    {showStageInfo && (
                        <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                             {stageConfig.label === 'recovery' ? (
                                <><Icon name="Activity" size={10} className="text-blue-500" /> DELOAD</>
                             ) : (
                                <><Icon name="Zap" size={10} className="text-yellow-500" /> {stageConfig.label} ({stageConfig.rir} RIR)</>
                             )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                     <button 
                         onClick={(e) => { e.stopPropagation(); toggleViewMode(); }}
                         className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${viewMode === 'focus' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}
                    >
                        <Icon name={viewMode === 'focus' ? 'Layout' : 'Eye'} size={18} />
                    </button>
                    
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

            {/* --- Main Content --- */}
            <div className="flex-1 overflow-hidden flex flex-col">
                
                {stageConfig?.note && viewMode === 'list' && showStageInfo && (
                    <div className="mx-4 mt-4 p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                        {stageConfig.note}
                    </div>
                )}

                {viewMode === 'list' ? (
                    // LIST MODE (With DnD)
                    <div className="flex-1 overflow-y-auto scroll-container p-4 pb-32 space-y-6">
                        <DndContext 
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext 
                                items={sessionExercises.map(ex => ex.instanceId)}
                                strategy={verticalListSortingStrategy}
                            >
                                {sessionExercises.map((ex) => {
                                    const ssStyle = ex.supersetId ? supersetStyles[ex.supersetId] : null;
                                    const isLinkingTarget = ctrl.linkingId && ctrl.linkingId !== ex.instanceId;

                                    return (
                                        <SortableExerciseCard
                                            key={ex.instanceId}
                                            exercise={ex}
                                            ctrl={ctrl}
                                            t={t}
                                            lang={lang}
                                            supersetStyle={ssStyle}
                                            isLinkingTarget={!!isLinkingTarget}
                                            config={config}
                                            stageConfig={stageConfig}
                                            onAddSet={onAddSet}
                                            onDeleteSet={onDeleteSet}
                                            onOpenDetail={(ex) => ctrl.setDetailExercise(ex)} // Pass handler
                                            viewMode="list"
                                        />
                                    );
                                })}
                            </SortableContext>
                        </DndContext>

                        <Button variant="secondary" onClick={() => ctrl.setAddingExercise(true)} fullWidth className="border-dashed py-3">
                            <Icon name="Plus" size={16} /> {t.addExercise}
                        </Button>
                        <div className="h-4"></div>
                        <Button onClick={(e) => { e.stopPropagation(); ctrl.setShowFinishModal(true); }} size="lg" fullWidth className="py-4 text-base shadow-xl shadow-red-600/20 bg-gradient-to-r from-red-600 to-red-500 border-none">
                            {t.finishWorkout}
                        </Button>
                    </div>
                ) : (
                    // FOCUS MODE (Carousel Style)
                    <div className="flex-1 flex flex-col p-4 pb-24 h-full relative">
                         {/* Progress Bar */}
                         <div className="flex items-center gap-2 mb-4 shrink-0">
                            {sessionExercises.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${idx === focusedIndex ? 'bg-red-600' : idx < focusedIndex ? 'bg-red-200 dark:bg-red-900/30' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                                ></div>
                            ))}
                        </div>

                        {/* Navigation Buttons (Top) */}
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <button 
                                onClick={goToPrev} 
                                disabled={focusedIndex === 0}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Icon name="ChevronLeft" size={20} />
                            </button>
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                {focusedIndex + 1} / {sessionExercises.length}
                            </span>
                            <button 
                                onClick={goToNext} 
                                disabled={focusedIndex === sessionExercises.length - 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Icon name="SkipForward" size={20} />
                            </button>
                        </div>

                        {/* The Card */}
                        <div className="flex-1 overflow-hidden relative">
                             {focusedExercise ? (
                                <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300" key={focusedExercise.instanceId}>
                                     <SortableExerciseCard
                                        exercise={focusedExercise}
                                        ctrl={ctrl}
                                        t={t}
                                        lang={lang}
                                        supersetStyle={focusedExercise.supersetId ? supersetStyles[focusedExercise.supersetId] : null}
                                        isLinkingTarget={false}
                                        config={config}
                                        stageConfig={stageConfig}
                                        onAddSet={onAddSet}
                                        onDeleteSet={onDeleteSet}
                                        onOpenDetail={(ex) => ctrl.setDetailExercise(ex)} // Pass handler
                                        viewMode="focus"
                                    />
                                    
                                    {/* Action Shortcuts for Focus Mode */}
                                    <div className="mt-4 flex gap-3 shrink-0">
                                         <button 
                                             onClick={(e) => { e.stopPropagation(); ctrl.setShowPlateCalc({ weight: 20 }); }}
                                             className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-sm text-zinc-600 dark:text-zinc-300 flex items-center justify-center gap-2"
                                        >
                                            <Icon name="Dumbbell" size={16} /> Calc
                                        </button>
                                         <button 
                                             onClick={(e) => { e.stopPropagation(); ctrl.setWarmupExId(focusedExercise.instanceId); }}
                                             className="flex-1 py-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl font-bold text-sm text-orange-600 dark:text-orange-400 flex items-center justify-center gap-2"
                                        >
                                            <Icon name="Zap" size={16} /> Warmup
                                        </button>
                                    </div>
                                </div>
                             ) : (
                                 <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                                     <p>No exercises yet.</p>
                                     <Button onClick={() => ctrl.setAddingExercise(true)} className="mt-4">{t.addExercise}</Button>
                                 </div>
                             )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- Modals (Rendered conditionally) --- */}
            
            {/* Exercise Detail Modal */}
            {ctrl.detailExercise && (
                <ExerciseDetailModal 
                    exercise={ctrl.detailExercise} 
                    onClose={() => ctrl.setDetailExercise(null)} 
                />
            )}

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
            
            {/* PR Celebration Overlay */}
            {ctrl.showPRSuccess && (
                <PRCelebrationOverlay onDismiss={ctrl.dismissPRSuccess} />
            )}
            
            {/* Plate Calculator Modal */}
            {ctrl.showPlateCalc && (
                <PlateCalculatorModal 
                    initialWeight={ctrl.showPlateCalc.weight}
                    onClose={() => ctrl.setShowPlateCalc(null)}
                />
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