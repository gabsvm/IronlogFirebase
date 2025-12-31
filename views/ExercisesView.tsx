import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { MuscleGroup } from '../types';

interface ExercisesViewProps {
    onBack: () => void;
}

export const ExercisesView: React.FC<ExercisesViewProps> = ({ onBack }) => {
    const { exercises, setExercises, lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [mode, setMode] = useState<'list' | 'create'>('list');
    
    // Create State
    const [newName, setNewName] = useState('');
    const [newMuscle, setNewMuscle] = useState<MuscleGroup>('CHEST');

    const handleDelete = (id: string) => {
        if (window.confirm(t.deleteConfirm)) {
            setExercises(prev => prev.filter(e => e.id !== id));
        }
    };

    const handleCreate = () => {
        if (!newName.trim()) return;
        const newEx = {
            id: `custom_${Date.now()}`,
            name: newName,
            muscle: newMuscle
        };
        setExercises(prev => [...prev, newEx]);
        setMode('list');
        setNewName('');
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="glass px-4 h-14 shrink-0 flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    <Icon name="ChevronLeft" size={20} />
                    <span className="font-bold text-sm">{t.back}</span>
                </button>
                <h1 className="font-bold text-zinc-900 dark:text-white">{t.manageEx}</h1>
                <div className="w-8"></div>
            </div>

            {mode === 'list' ? (
                <div className="flex-1 overflow-y-auto p-4 scroll-container relative">
                    <div className="space-y-2 pb-24">
                        {exercises.sort((a,b) => {
                             const na = typeof a.name === 'object' ? a.name[lang] : a.name;
                             const nb = typeof b.name === 'object' ? b.name[lang] : b.name;
                             return na.localeCompare(nb);
                        }).map(ex => (
                            <div key={ex.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-white/5 flex justify-between items-center shadow-sm">
                                <div>
                                    <div className="font-bold text-zinc-900 dark:text-white text-sm">
                                        {typeof ex.name === 'object' ? ex.name[lang] : ex.name}
                                    </div>
                                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400">
                                        {TRANSLATIONS[lang].muscle[ex.muscle]}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleDelete(ex.id)}
                                    className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                                >
                                    <Icon name="Trash2" size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="fixed bottom-6 right-6 z-10">
                        <button 
                            onClick={() => setMode('create')}
                            className="w-14 h-14 bg-red-600 rounded-full text-white shadow-xl shadow-red-600/30 flex items-center justify-center hover:scale-110 transition-transform"
                        >
                            <Icon name="Plus" size={24} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2 block">{t.exName}</label>
                        <input 
                            type="text" 
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g., Incline Machine Press"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2 block">{t.selectMuscle}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(MUSCLE_GROUPS).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setNewMuscle(m)}
                                    className={`p-3 rounded-xl text-xs font-bold border transition-all ${newMuscle === m ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                                >
                                    {TRANSLATIONS[lang].muscle[m]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setMode('list')} fullWidth>{t.cancel}</Button>
                        <Button onClick={handleCreate} disabled={!newName.trim()} fullWidth>{t.save}</Button>
                    </div>
                </div>
            )}
        </div>
    );
};