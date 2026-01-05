
import React, { useState, useEffect, useRef } from 'react';
import { WorkoutSet, SetType } from '../../types';
import { Icon } from '../ui/Icon';
import { TRANSLATIONS } from '../../constants';

interface SetRowProps {
    set: WorkoutSet;
    exInstanceId: number;
    unit: string;
    unitLabel: string;
    plateWeight?: number;
    showRIR: boolean;
    stageRIR: string;
    onUpdate: (exId: number, setId: number, field: string, value: any) => void;
    onToggleComplete: (exId: number, setId: number) => void;
    onChangeType: (exId: number, setId: number, type: SetType) => void;
    lang: 'en' | 'es';
}

const getTypeColor = (type: SetType) => {
    switch(type) {
        case 'warmup': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'myorep': case 'myorep_match': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        case 'giant': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'top': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        default: return 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300';
    }
};

const getTypeLabel = (type: SetType) => {
    const map: Record<string, string> = { regular: 'R', warmup: 'W', myorep: 'M', myorep_match: 'MM', giant: 'G', top: 'T', backoff: 'B', cluster: 'C' };
    return map[type] || 'R';
};

export const SetRow = React.memo(({ set, exInstanceId, unit, unitLabel, plateWeight, showRIR, stageRIR, onUpdate, onToggleComplete, onChangeType, lang }: SetRowProps) => {
    const t = TRANSLATIONS[lang];
    const isDone = set.completed;
    const setType = set.type || 'regular';

    // --- Performance Optimization: Local State for Inputs ---
    // We only commit to the global store onBlur or Enter. This prevents re-rendering the whole tree on every keystroke.
    const [localWeight, setLocalWeight] = useState(set.weight);
    const [localReps, setLocalReps] = useState(set.reps);
    const [localRPE, setLocalRPE] = useState(set.rpe);

    // Sync local state if external props change (e.g. from history import or drag reorder)
    useEffect(() => { setLocalWeight(set.weight); }, [set.weight]);
    useEffect(() => { setLocalReps(set.reps); }, [set.reps]);
    useEffect(() => { setLocalRPE(set.rpe); }, [set.rpe]);

    const commitChange = (field: string, value: any) => {
        if (value !== set[field as keyof WorkoutSet]) {
            onUpdate(exInstanceId, set.id, field, value);
        }
    };

    let calculatedKg: number | null = null;
    if (unit === 'pl' && plateWeight && localWeight) {
        calculatedKg = Number(localWeight) * plateWeight;
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string, val: any) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur(); 
            commitChange(field, val); // Ensure commit happens before toggle
            if (!isDone) onToggleComplete(exInstanceId, set.id);
            // Optional: Auto-focus next input logic could go here
        }
    };

    return (
        <div className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors duration-300 relative group ${isDone ? 'bg-green-50/50 dark:bg-green-500/5' : ''}`}>
            {/* Type Indicator */}
            <div className="col-span-1 flex justify-center relative">
                <button 
                    onClick={(e) => { e.stopPropagation(); if (!isDone) onChangeType(exInstanceId, set.id, setType); }}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all active:scale-95 ${isDone ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : `${getTypeColor(setType)} ring-1 ring-inset ring-black/5 dark:ring-white/10 hover:ring-red-500`}`}
                >
                   {isDone ? <Icon name="Check" size={12} /> : getTypeLabel(setType)}
                </button>
            </div>
            
            {/* Weight Input */}
            <div className="col-span-4 relative flex items-center justify-center gap-1">
                <input 
                    type="number" 
                    inputMode="decimal" 
                    className={`w-full bg-transparent text-lg font-bold p-0 border-0 focus:ring-0 text-center transition-colors ${isDone ? 'text-green-800 dark:text-green-400' : 'text-zinc-900 dark:text-white'}`} 
                    placeholder={set.hintWeight ? String(set.hintWeight) : "0"} 
                    value={localWeight} 
                    onChange={(e) => setLocalWeight(e.target.value)}
                    onBlur={() => commitChange('weight', localWeight)}
                    onFocus={handleFocus}
                    onKeyDown={(e) => handleKeyDown(e, 'weight', localWeight)}
                />
                <div className="flex flex-col items-center">
                    <div className="text-[9px] text-zinc-400 font-medium -mt-1 leading-none">{set.hintWeight ? `${t.prev}: ${set.hintWeight}` : unitLabel}</div>
                    {calculatedKg !== null && <div className="text-[9px] text-blue-500 font-bold leading-none mt-0.5">≈{calculatedKg}kg</div>}
                </div>
            </div>

            {/* Reps Input */}
            <div className="col-span-4 relative">
                <input 
                    type="number" 
                    inputMode="numeric" 
                    className={`w-full bg-transparent text-lg font-bold p-0 border-0 focus:ring-0 text-center transition-colors ${isDone ? 'text-green-800 dark:text-green-400' : 'text-zinc-900 dark:text-white'}`} 
                    placeholder={set.hintReps ? String(set.hintReps) : "0"} 
                    value={localReps} 
                    onChange={(e) => setLocalReps(e.target.value)}
                    onBlur={() => commitChange('reps', localReps)}
                    onFocus={handleFocus}
                    onKeyDown={(e) => handleKeyDown(e, 'reps', localReps)}
                />
                <div className="text-[9px] text-zinc-400 text-center font-medium -mt-1">{set.hintReps ? `${t.prev}: ${set.hintReps}` : 'reps'}</div>
            </div>

            {/* RIR Input */}
            {showRIR && (
                <div className="col-span-2 flex justify-center">
                    <input 
                        type="number" 
                        inputMode="numeric" 
                        className={`w-12 bg-zinc-100 dark:bg-white/5 rounded text-sm font-bold py-2 border-0 focus:ring-1 focus:ring-zinc-500 text-center text-zinc-600 dark:text-zinc-300 ${isDone ? 'opacity-50' : ''}`} 
                        placeholder={stageRIR}
                        value={localRPE} 
                        onChange={(e) => setLocalRPE(e.target.value)}
                        onBlur={() => commitChange('rpe', localRPE)}
                        onFocus={handleFocus}
                        onKeyDown={(e) => handleKeyDown(e, 'rpe', localRPE)}
                    />
                </div>
            )}

            {/* Check Button */}
            <div className="col-span-1 flex justify-end">
                <button 
                    onClick={() => onToggleComplete(exInstanceId, set.id)} 
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90 ${isDone ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 rotate-0' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                >
                    <Icon name="Check" size={20} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
});
