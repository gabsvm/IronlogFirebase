
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SessionExercise } from '../../types';
import { Icon } from '../ui/Icon';
import { MuscleTag } from './MuscleTag';
import { SetRow } from './SetRow';
import { getTranslated } from '../../utils';

interface SortableExerciseCardProps {
    exercise: SessionExercise;
    ctrl: any; // Using any to avoid circular dependency complex types for now, allows for quick refactor
    t: any;
    lang: 'en' | 'es';
    supersetStyle: any;
    isLinkingTarget: boolean;
    config: any;
    stageConfig: any;
    onAddSet: (id: number) => void;
    onDeleteSet: (exId: number, setId: number) => void;
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
    onDeleteSet
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: ex.instanceId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.8 : 1,
        position: 'relative' as const,
    };

    const sets = ex.sets || [];
    const ssStyle = supersetStyle;
    const unit = ex.weightUnit || 'kg';
    const unitLabel = unit === 'pl' ? t.units.pl : t.units.kg;

    return (
        <div 
            ref={setNodeRef} 
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
            `}
        >
            {/* Exercise Header */}
            <div className="p-4 flex flex-col gap-2 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {/* Drag Handle - Made larger and more obvious */}
                            <div 
                                className="touch-none cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-200 p-3 -ml-3 mr-1" 
                                {...attributes} 
                                {...listeners}
                            >
                                <Icon name="GripVertical" size={22} />
                            </div>

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
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight tracking-tight pl-6">
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
                                    <button onClick={(e) => { e.stopPropagation(); ctrl.setReplacingExId(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
                                        <Icon name="RefreshCw" size={16} /> {t.replaceEx}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); ctrl.setEditingMuscleId(ex.instanceId); }} className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2">
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
                <input 
                    type="text"
                    placeholder={t.addNote}
                    value={ex.note || ''}
                    onChange={(e) => ctrl.handleNoteUpdate(ex.instanceId, e.target.value)}
                    className="w-full bg-transparent text-xs text-zinc-500 placeholder-zinc-300 dark:placeholder-zinc-700 outline-none border-b border-transparent focus:border-red-500/50 transition-colors pb-1 ml-6"
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

            {/* Sets List */}
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
};
