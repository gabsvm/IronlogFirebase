import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { MuscleGroup } from '../types';
import { ExerciseSelector } from '../components/ui/ExerciseSelector';
import { getTranslated } from '../utils';

interface ProgramEditViewProps {
    onBack: () => void;
}

export const ProgramEditView: React.FC<ProgramEditViewProps> = ({ onBack }) => {
    const { program, setProgram, lang } = useApp();
    const t = TRANSLATIONS[lang];
    
    const [editingDayId, setEditingDayId] = useState<string | null>(null);
    const [pickingForSlot, setPickingForSlot] = useState<{dayId: string, slotIdx: number} | null>(null);

    const handleUpdateDayName = (id: string, name: string) => {
        setProgram(prev => prev.map(d => d.id === id ? { ...d, dayName: { en: name, es: name } } : d));
    };

    const handleAddDay = () => {
        const newDay = {
            id: `d_${Date.now()}`,
            dayName: { en: "New Day", es: "Nuevo Día" },
            slots: []
        };
        setProgram(prev => [...prev, newDay]);
    };

    const handleDeleteDay = (id: string) => {
        if(window.confirm(t.deleteConfirm)) {
            setProgram(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleAddSlot = (dayId: string) => {
        setProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const currentSlots = d.slots || [];
            return { ...d, slots: [...currentSlots, { muscle: 'CHEST', setTarget: 3 }] };
        }));
    };

    const handleRemoveSlot = (dayId: string, idx: number) => {
        setProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...(d.slots || [])];
            newSlots.splice(idx, 1);
            return { ...d, slots: newSlots };
        }));
    };

    const handleUpdateSlot = (dayId: string, idx: number, field: string, val: any) => {
        setProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...(d.slots || [])];
            if (!newSlots[idx]) return d; // Safety check
            newSlots[idx] = { ...newSlots[idx], [field]: val };
            return { ...d, slots: newSlots };
        }));
    };

    // Exercise Picker handling
    const handleSelectExercise = (exId: string) => {
        if (!pickingForSlot) return;
        handleUpdateSlot(pickingForSlot.dayId, pickingForSlot.slotIdx, 'exerciseId', exId);
        setPickingForSlot(null);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-950">
             {/* Header */}
             <div className="glass px-4 h-14 shrink-0 flex items-center justify-between z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    <Icon name="ChevronLeft" size={20} />
                    <span className="font-bold text-sm">{t.back}</span>
                </button>
                <h1 className="font-bold text-zinc-900 dark:text-white">{t.editTemplate}</h1>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scroll-container space-y-6 pb-24">
                {program.map((day, i) => (
                    <div key={day.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="bg-zinc-50 dark:bg-white/5 p-4 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
                            <input 
                                className="bg-transparent font-bold text-zinc-900 dark:text-white outline-none w-full"
                                value={getTranslated(day.dayName, lang)}
                                onChange={e => handleUpdateDayName(day.id, e.target.value)}
                            />
                            <button onClick={() => handleDeleteDay(day.id)} className="text-zinc-400 hover:text-red-500 ml-2">
                                <Icon name="Trash2" size={18} />
                            </button>
                        </div>
                        
                        <div className="divide-y divide-zinc-100 dark:divide-white/5">
                            {(day.slots || []).map((slot, idx) => (
                                <div key={idx} className="p-3 flex items-center gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex gap-2">
                                            {/* Muscle Select */}
                                            <select 
                                                className="bg-zinc-100 dark:bg-zinc-800 text-xs font-bold rounded-lg px-2 py-1.5 border-none outline-none text-zinc-700 dark:text-zinc-300"
                                                value={slot.muscle}
                                                onChange={(e) => handleUpdateSlot(day.id, idx, 'muscle', e.target.value)}
                                            >
                                                {Object.values(MUSCLE_GROUPS).map(m => (
                                                    <option key={m} value={m}>{TRANSLATIONS[lang].muscle[m]}</option>
                                                ))}
                                            </select>

                                            {/* Sets Input */}
                                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2">
                                                <span className="text-[9px] font-bold text-zinc-400">SETS</span>
                                                <input 
                                                    type="number" 
                                                    className="w-6 bg-transparent text-xs font-bold text-center outline-none"
                                                    value={slot.setTarget}
                                                    onChange={e => handleUpdateSlot(day.id, idx, 'setTarget', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        {/* Specific Exercise (Optional Override) */}
                                        <button 
                                            onClick={() => setPickingForSlot({dayId: day.id, slotIdx: idx})}
                                            className={`text-sm font-medium w-full text-left truncate ${slot.exerciseId ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 italic'}`}
                                        >
                                            {slot.exerciseId 
                                                ? getTranslated(useApp().exercises.find(e => e.id === slot.exerciseId)?.name, lang)
                                                : t.selectExBtn
                                            }
                                        </button>
                                    </div>
                                    <button onClick={() => handleRemoveSlot(day.id, idx)} className="text-zinc-300 hover:text-red-500 p-2">
                                        <Icon name="X" size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-zinc-100 dark:border-white/5">
                            <button onClick={() => handleAddSlot(day.id)} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                <Icon name="Plus" size={14} /> {t.addSlot}
                            </button>
                        </div>
                    </div>
                ))}

                <Button variant="outline" onClick={handleAddDay} fullWidth className="py-4 border-dashed">
                    {t.addDay}
                </Button>
            </div>

            {pickingForSlot && (
                <ExerciseSelector 
                    onClose={() => setPickingForSlot(null)}
                    onSelect={handleSelectExercise}
                />
            )}
        </div>
    );
};