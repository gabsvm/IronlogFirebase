
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
        case 'warmup': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900';
        case 'myorep': case 'myorep_match': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900';
        case 'giant': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900';
        case 'top': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900';
        default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
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
    const [localWeight, setLocalWeight] = useState(set.weight);
    const [localReps, setLocalReps] = useState(set.reps);
    const [localRPE, setLocalRPE] = useState(set.rpe);

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
            commitChange(field, val); 
            if (!isDone) onToggleComplete(exInstanceId, set.id);
        }
    };

    // Calculate progression indicator
    const isProgress = set.hintWeight && set.prevWeight && Number(set.hintWeight) > Number(set.prevWeight);
    const diff = isProgress ? `+${Number(set.hintWeight) - Number(set.prevWeight)}` : null;

    // Input Styles - Makes inputs look like actual interactive zones
    const inputBaseClass = `
        w-full text-lg font-bold text-center border-0 outline-none tabular-nums rounded-lg py-1.5 transition-all
        focus:ring-2 focus:ring-inset focus:ring-red-500/50 
    `;

    const activeInputClass = `
        bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-700 
        text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-600
    `;

    const doneInputClass = `
        bg-transparent text-green-700 dark:text-green-400 placeholder-green-700/30
    `;

    return (
        <div className={`grid grid-cols-12 gap-2 px-3 py-2 items-center transition-all duration-300 relative group rounded-xl my-1 mx-2 border border-transparent ${isDone ? 'bg-green-50/80 dark:bg-green-900/10 border-green-500/20' : ''}`}>
            
            {/* Type Indicator */}
            <div className="col-span-1 flex justify-center relative">
                <button 
                    onClick={(e) => { e.stopPropagation(); if (!isDone) onChangeType(exInstanceId, set.id, setType); }}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-black cursor-pointer transition-all active:scale-95 ${isDone ? 'bg-green-100 dark:bg-green-500/20 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400' : getTypeColor(setType)}`}
                >
                   {isDone ? <Icon name="Check" size={12} strokeWidth={4} /> : getTypeLabel(setType)}
                </button>
            </div>
            
            {/* Weight Input */}
            <div className="col-span-4 relative flex flex-col items-center">
                <div className="relative w-full">
                    {/* Progression Badge inside Input area if hint exists */}
                    {isProgress && !localWeight && !isDone && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-1 rounded pointer-events-none">
                            {diff}
                        </div>
                    )}
                    <input 
                        type="number" 
                        inputMode="decimal" 
                        className={`${inputBaseClass} ${isDone ? doneInputClass : activeInputClass}`}
                        placeholder={set.hintWeight ? String(set.hintWeight) : "-"} 
                        value={localWeight} 
                        onChange={(e) => setLocalWeight(e.target.value)}
                        onBlur={() => commitChange('weight', localWeight)}
                        onFocus={handleFocus}
                        onKeyDown={(e) => handleKeyDown(e, 'weight', localWeight)}
                    />
                </div>
                <div className="flex items-center gap-1 mt-1 opacity-70">
                    <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-tight">
                        {set.prevWeight ? `${t.prev}: ${set.prevWeight}` : unitLabel}
                    </span>
                    {calculatedKg !== null && !isDone && <span className="text-[9px] text-blue-500 font-bold">≈{calculatedKg}</span>}
                </div>
            </div>

            {/* Reps Input */}
            <div className="col-span-4 relative flex flex-col items-center">
                <input 
                    type="number" 
                    inputMode="numeric" 
                    className={`${inputBaseClass} ${isDone ? doneInputClass : activeInputClass}`} 
                    placeholder={set.hintReps ? String(set.hintReps) : "-"} 
                    value={localReps} 
                    onChange={(e) => setLocalReps(e.target.value)}
                    onBlur={() => commitChange('reps', localReps)}
                    onFocus={handleFocus}
                    onKeyDown={(e) => handleKeyDown(e, 'reps', localReps)}
                />
                <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-tight mt-1">
                    {set.prevReps ? `${t.prev}: ${set.prevReps}` : 'reps'}
                </div>
            </div>

            {/* RIR Input */}
            {showRIR ? (
                <div className="col-span-2 flex justify-center pb-4">
                    <input 
                        type="number" 
                        inputMode="numeric" 
                        className={`w-10 text-sm font-bold py-1.5 text-center rounded-lg transition-all focus:ring-1 focus:ring-zinc-500 outline-none border ${isDone ? 'bg-transparent border-transparent text-green-600 opacity-60' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'}`} 
                        placeholder={stageRIR}
                        value={localRPE} 
                        onChange={(e) => setLocalRPE(e.target.value)}
                        onBlur={() => commitChange('rpe', localRPE)}
                        onFocus={handleFocus}
                        onKeyDown={(e) => handleKeyDown(e, 'rpe', localRPE)}
                    />
                </div>
            ) : (
                <div className="col-span-2"></div>
            )}

            {/* Check Button */}
            <div className="col-span-1 flex justify-end pb-4">
                <button 
                    onClick={() => onToggleComplete(exInstanceId, set.id)} 
                    className={`
                        w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-75
                        ${isDone 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-100 rotate-0' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 scale-90'
                        }
                    `}
                >
                    <Icon name="Check" size={20} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
});
