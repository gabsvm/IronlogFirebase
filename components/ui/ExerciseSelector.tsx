import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from './Icon';
import { MuscleGroup } from '../../types';

interface ExerciseSelectorProps {
    onSelect: (exId: string) => void;
    onClose: () => void;
    excludeIds?: string[];
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ onSelect, onClose, excludeIds = [] }) => {
    const { exercises, lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [search, setSearch] = useState('');
    const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'ALL'>('ALL');

    const filtered = useMemo(() => {
        return exercises
            .filter(ex => !excludeIds.includes(ex.id))
            .filter(ex => {
                const name = typeof ex.name === 'object' ? ex.name[lang] : ex.name;
                const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
                const matchesMuscle = filterMuscle === 'ALL' || ex.muscle === filterMuscle;
                return matchesSearch && matchesMuscle;
            })
            .sort((a, b) => {
                const na = typeof a.name === 'object' ? a.name[lang] : a.name;
                const nb = typeof b.name === 'object' ? b.name[lang] : b.name;
                return na.localeCompare(nb);
            });
    }, [exercises, search, filterMuscle, lang, excludeIds]);

    return (
        <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="glass px-4 h-16 shrink-0 flex items-center gap-3 border-b border-zinc-200 dark:border-white/5">
                <button onClick={onClose} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    <Icon name="X" size={24} />
                </button>
                <div className="flex-1 relative">
                    <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                        autoFocus
                        type="text" 
                        placeholder={t.searchPlaceholder}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-2 focus:ring-red-500 border-none outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="p-2 border-b border-zinc-200 dark:border-white/5 overflow-x-auto scroll-container flex gap-2 bg-white dark:bg-zinc-900/50 shrink-0">
                <button 
                    onClick={() => setFilterMuscle('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterMuscle === 'ALL' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                >
                    {t.any}
                </button>
                {Object.values(MUSCLE_GROUPS).map(m => (
                    <button 
                        key={m}
                        onClick={() => setFilterMuscle(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterMuscle === m ? 'bg-red-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                    >
                        {TRANSLATIONS[lang].muscle[m]}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 scroll-container">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 text-sm">
                        {t.noExFound}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filtered.map(ex => (
                            <button
                                key={ex.id}
                                onClick={() => onSelect(ex.id)}
                                className="w-full text-left p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-[0.99] transition-all flex items-center justify-between group"
                            >
                                <div>
                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                        {typeof ex.name === 'object' ? ex.name[lang] : ex.name}
                                    </div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                                        {TRANSLATIONS[lang].muscle[ex.muscle]}
                                    </div>
                                </div>
                                <div className="text-zinc-300 dark:text-zinc-700 group-hover:text-red-500">
                                    <Icon name="Plus" size={20} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};