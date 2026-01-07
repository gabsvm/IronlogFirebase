
import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SessionExercise, WorkoutSet, CardioType } from '../../types';
import { Icon } from '../ui/Icon';
import { MuscleTag } from './MuscleTag';
import { SetRow } from './SetRow';
import { getTranslated, roundWeight } from '../../utils';
import { useApp } from '../../context/AppContext';

interface SortableExerciseCardProps {
    exercise: SessionExercise;
    ctrl: any; 
    t: any;
    lang: 'en' | 'es';
    supersetStyle: any;
    isLinkingTarget: boolean;
    config: any;
    stageConfig: any;
    onAddSet: (id: number) => void;
    onDeleteSet: (exId: number, setId: number) => void;
    viewMode?: 'list' | 'focus';
}

export const SortableExerciseCard: React.FC<SortableExerciseCardProps> = ({ 
    exercise: ex, 
    ctrl, 
    t, 
    lang, 
    supersetStyle, 
    isLinkingTarget, 
    config, 
    stageConfig,
    onAddSet,
    onDeleteSet,
    viewMode = 'list'
}) => {
    const { logs } = useApp();
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: ex.instanceId });

    const style = viewMode === 'list' ? {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.8 : 1,
        position: 'relative' as const,
    } : { position: 'relative' as const };

    const sets = ex.sets || [];
    const ssStyle = supersetStyle;
    const unit = ex.weightUnit || 'kg';
    const unitLabel = unit === 'pl' ? t.units.pl : t.units.kg;
    
    // Check if it is a cardio exercise
    const isCardio = ex.muscle === 'CARDIO';
    const cardioMode: CardioType = ex.cardioType || ex.defaultCardioType || 'steady';
    const isInterval = cardioMode === 'hiit' || cardioMode === 'tabata';

    // 1. Get Last Note for Context
    const lastNote = useMemo(() => {
        if (!logs) return null;
        for (const log of logs) {
             if (log.skipped) continue;
             const found = log.exercises?.find(e => e.id === ex.id);
             if (found && found.note) return found.note;
        }
        return null;
    }, [logs, ex.id]);

    // 2. Smart Warmup Injection Logic
    const handleInjectWarmup = () => {
        const firstRegularSet = sets.find(s => s.type === 'regular');
        const targetWeight = Number(firstRegularSet?.weight) || Number(firstRegularSet?.hintWeight) || 0;

        if (targetWeight === 0) {
            alert(lang === 'es' ? "Introduce un peso objetivo en la primera serie para calcular." : "Enter a target weight in the first set to calculate.");
            return;
        }

        const newSets: WorkoutSet[] = [
            { pct: 0.5, reps: 12 },
            { pct: 0.75, reps: 5 },
            { pct: 0.9, reps: 1 }
        ].map((step, i) => ({
            id: Date.now() + i,
            type: 'warmup',
            weight: roundWeight(targetWeight * step.pct),
            reps: step.reps,
            rpe: '',
            completed: false
        }));

        ctrl.updateSession((prev: any) => !prev ? null : {
            ...prev,
            exercises: prev.exercises.map((e: any) => 
                e.instanceId === ex.instanceId 
                ? { ...e, sets: [...newSets, ...e.sets] } 
                : e
            )
        });
        ctrl.setOpenMenuId(null);
    };

    // 3. Switch Cardio Mode
    const handleCardioModeChange = (mode: CardioType) => {
        ctrl.updateSession((prev: any) => !prev ? null : {
            ...prev,
            exercises: prev.exercises.map((e: any) => 
                e.instanceId === ex.instanceId 
                ? { ...e, cardioType: mode } 
                : e
            )
        });
        ctrl.setOpenMenuId(null);
    };

    return (
        <div 
            ref={viewMode === 'list' ? setNodeRef : null} 
            style={style}
            onClick={() => {
                if (isLinkingTarget) {
                    const ssid = `ss_${Date.now()}`;
                    ctrl.updateSession((prev: any) => !prev ? null : {
                        ...prev,
                        exercises: prev.exercises.map((e: any) => (e.instanceId === ctrl.linkingId || e.instanceId === ex.instanceId) ? { ...e, supersetId: ssid } : e)
                    });
                    ctrl.setLinkingId(null);
                }
            }}
            className={`
                flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden transition-all
                ${ssStyle ? `border-l-4 ${ssStyle.border}` : ''}
                ${isLinkingTarget ? 'ring-2 ring-orange-500 cursor-pointer opacity-80 hover:opacity-100' : ''}
                ${ctrl.linkingId === ex.instanceId ? 'ring-2 ring-orange-500' : ''}
                ${isDragging ? 'shadow-2xl ring-2 ring-red-500/20 scale-[1.02]' : ''}
                ${viewMode === 'focus' ? 'h-full flex-1' : ''} 
            `}
        >
            {/* Exercise Header */}
            <div className="p-4 flex flex-col gap-2 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {/* Drag Handle - Only show in LIST mode */}
                            {viewMode === 'list' && (
                                <div 
                                    className="touch-none cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-200 p-3 -ml-3 mr-1" 
                                    {...attributes} 
                                    {...listeners}
                                >
                                    <Icon name="GripVertical" size={22} />
                                </div>
                            )}

                            {ssStyle && <span className={`${ssStyle.badge} text-[9px] font-bold px-1.5 py-0.5 rounded`}>SS</span>}
                            <MuscleTag label={ex.slotLabel || ex.muscle || 'CHEST'} />
                            
                            {/* Reps/Mode Target Badge */}
                            {isCardio ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                                    {t.cardioModes[cardioMode]}
                                </span>
                            ) : (
                                ex.targetReps && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                        {ex.targetReps} Reps
                                    </span>
                                )
                            )}

                            {!isCardio && unit === 'pl' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); ctrl.setConfigPlateExId(ex.instanceId); }}
                                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded hover:bg-blue-200"
                                >
                                    {ex.plateWeight ? `1 PL = ${ex.plateWeight}kg` : t.units.setPlateWeight}
                                </button>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight tracking-tight pl-1">
                            {getTranslated(ex.name, lang)}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Quick Warmup Button (Hide for Cardio) */}
                        {!isCardio && (
                            <button onClick={(e) => { e.stopPropagation(); handleInjectWarmup(); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/10 text-orange-500 hover:scale-110 transition-transform" title="Auto Warmup">
                                <Icon name="Zap" size={16} />
                            </button>
                        )}

                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); ctrl.setOpenMenuId(ctrl.openMenuId === ex.instanceId ? null : ex.instanceId); }} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                <Icon name="MoreVertical" size={20} />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {ctrl.openMenuId === ex.instanceId && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-white/5 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    {isCardio && (
                                        <>
                                            <div className="px-4 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.changeCardioMode}</div>
                                            <button onClick={(e) => { e.stopPropagation(); handleCardioModeChange('steady'); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2 ${cardioMode === 'steady' ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-300'}`}>
                                                {cardioMode === 'steady' && <Icon name="Check" size={14} />} {t.cardioModes.steady}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleCardioModeChange('hiit'); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2 ${cardioMode === 'hiit' ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-300'}`}>
                                                {cardioMode === 'hiit' && <Icon name="Check" size={14} />} {t.cardioModes.hiit}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleCardioModeChange('tabata'); }} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2 ${cardioMode === 'tabata' ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-300'}`}>
                                                {cardioMode === 'tabata' && <Icon name="Check" size={14} />} {t.cardioModes.tabata}
                                            </button>
                                            <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                                        </>
                                    )}

                                    {!isCardio && (
                                        <button onClick={(e) => { e.stopPropagation(); handleInjectWarmup(); }} className="w-full text-left px-4 py-3 text-sm font-bold text-orange-600 dark:text-orange-400 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                            <Icon name="Zap" size={16} /> Add Warmup Sets
                                        </button>
                                    )}
                                    
                                    {!isCardio && (
                                        <button onClick={(e) => { 
                                            e.stopPropagation();
                                            const newUnit = unit === 'kg' ? 'pl' : 'kg';
                                            ctrl.updateSession((prev: any) => !prev ? null : {
                                                ...prev,
                                                exercises: prev.exercises.map((e: any) => e.instanceId === ex.instanceId ? { ...e, weightUnit: newUnit } : e)
                                            });
                                            ctrl.setOpenMenuId(null);
                                        }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                            <Icon name="Settings" size={16} /> {t.units.toggle}
                                        </button>
                                    )}

                                    <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                                    <button onClick={(e) => { e.stopPropagation(); ctrl.setReplacingExId(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                        <Icon name="RefreshCw" size={16} /> {t.replaceEx}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); ctrl.setEditingMuscleId(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-purple-600 dark:text-purple-400 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                        <Icon name="Dumbbell" size={16} /> {t.changeMuscle}
                                    </button>
                                    <button onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (ex.supersetId) {
                                             ctrl.updateSession((prev: any) => !prev ? null : {
                                                 ...prev,
                                                 exercises: (prev.exercises || []).map((e: any) => e.instanceId === ex.instanceId ? { ...e, supersetId: undefined } : e)
                                             });
                                        } else {
                                            ctrl.setLinkingId(ex.instanceId);
                                        }
                                        ctrl.setOpenMenuId(null);
                                    }} className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2 ${ssStyle ? 'text-red-500' : 'text-orange-600'}`}>
                                        <Icon name={ssStyle ? "Unlink" : "Link"} size={16} /> {ssStyle ? t.unlinkSuperset : t.linkSuperset}
                                    </button>
                                    <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                                    <button onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if(window.confirm(t.confirmRemoveEx)) {
                                            ctrl.updateSession((prev: any) => prev ? { ...prev, exercises: prev.exercises.filter((e: any) => e.instanceId !== ex.instanceId) } : null);
                                            ctrl.setOpenMenuId(null);
                                        }
                                    }} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                                        <Icon name="Trash2" size={16} /> {t.removeEx}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Historical Note Display */}
                {lastNote && (
                    <div className="flex items-start gap-2 mb-1 px-1 opacity-70">
                         <Icon name="FileText" size={12} className="mt-0.5 text-zinc-400" />
                         <p className="text-[10px] text-zinc-500 italic leading-tight line-clamp-2">
                             Last: "{lastNote}"
                         </p>
                    </div>
                )}

                <input 
                    type="text"
                    placeholder={t.addNote}
                    value={ex.note || ''}
                    onChange={(e) => ctrl.handleNoteUpdate(ex.instanceId, e.target.value)}
                    className="w-full bg-transparent text-xs text-zinc-500 placeholder-zinc-300 dark:placeholder-zinc-700 outline-none border-b border-transparent focus:border-red-500/50 transition-colors pb-1 ml-1"
                />
            </div>

            {/* Sets Header - Conditional for Cardio Mode */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-50 dark:bg-black/20 border-b border-zinc-100 dark:border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">
                <div className="col-span-1">#</div>
                {isCardio ? (
                    isInterval ? (
                        // HIIT / Tabata Headers
                        <>
                            <div className="col-span-4 pl-2 text-left text-green-600 dark:text-green-400">{t.cardioWork}</div>
                            <div className="col-span-4 text-blue-500 dark:text-blue-400">{t.cardioRest}</div>
                            <div className="col-span-2">{t.cardioRounds}</div>
                        </>
                    ) : (
                        // Steady State Headers
                        <>
                            <div className="col-span-4 text-left pl-4">{t.cardioTime}</div>
                            <div className="col-span-4">{t.cardioDist}</div>
                            <div className="col-span-2">{t.cardioSpeed}</div>
                        </>
                    )
                ) : (
                    // Weightlifting Headers
                    <>
                        <div className="col-span-4 text-left pl-4">{t.weight} ({unit === 'pl' ? 'PL' : 'KG'})</div>
                        <div className="col-span-4">{t.reps}</div>
                        {config.showRIR && <div className="col-span-2">{t.rir}</div>}
                        {!config.showRIR && <div className="col-span-2"></div>}
                    </>
                )}
                <div className="col-span-1"></div>
            </div>

            {/* Sets List - Allow Scrolling in Focus Mode if sets list is long */}
            <div className={`divide-y divide-zinc-100 dark:divide-white/5 ${viewMode === 'focus' ? 'overflow-y-auto flex-1' : ''}`}>
                {sets.map((set) => (
                    <SetRow
                        key={set.id}
                        set={set}
                        exInstanceId={ex.instanceId}
                        unit={unit}
                        unitLabel={unitLabel}
                        plateWeight={ex.plateWeight}
                        showRIR={config.showRIR || isCardio} 
                        stageRIR={stageConfig?.rir !== null ? String(stageConfig?.rir) : "-"}
                        onUpdate={ctrl.handleSetUpdate}
                        onToggleComplete={ctrl.toggleSetComplete}
                        onChangeType={(exId, setId, type) => ctrl.setChangingSetType({ exId, setId, currentType: type })}
                        lang={lang}
                        isCardio={isCardio}
                        cardioMode={cardioMode}
                    />
                ))}
            </div>

            {/* Footer Actions */}
            <div className="p-2 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5 grid grid-cols-2 divide-x divide-zinc-200 dark:divide-white/10 shrink-0">
                <button onClick={() => sets.length > 0 && onDeleteSet(ex.instanceId, sets[sets.length - 1].id)} disabled={sets.length <= 1} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-red-500 disabled:opacity-30">
                    <Icon name="Minus" size={14} /> {t.removeSetBtn}
                </button>
                <button onClick={() => onAddSet(ex.instanceId)} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                    <Icon name="Plus" size={14} /> {t.addSetBtn}
                </button>
            </div>
        </div>
    );
};
