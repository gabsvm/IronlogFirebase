import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup } from '../../types';
import { Button } from './Button';
import { Icon } from './Icon';

interface FeedbackModalProps {
    muscles: MuscleGroup[];
    onConfirm: (ratings: Record<string, number>) => void;
    onCancel: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ muscles, onConfirm, onCancel }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [ratings, setRatings] = useState<Record<string, number>>({});

    const handleRating = (m: string, r: number) => {
        setRatings(prev => ({ ...prev, [m]: r }));
    };

    const uniqueMuscles = Array.from(new Set(muscles)) as MuscleGroup[];

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border-t sm:border border-zinc-200 dark:border-white/10 max-h-[90vh] overflow-y-auto animate-slideUp">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Icon name="Activity" size={24} />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{t.rpFeedbackTitle}</h3>
                    <p className="text-sm text-zinc-500">{t.rpRatingHelp}</p>
                </div>

                <div className="space-y-6 mb-8">
                    {uniqueMuscles.map(m => (
                        <div key={m} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                    {(t.muscle as Record<string, string>)[m]}
                                </span>
                                <span className="text-xs font-bold text-red-500">
                                    {ratings[m] ? (ratings[m] === 1 ? "Easy / No Pump" : ratings[m] === 3 ? "Perfect" : "Too much / Sore") : "-"}
                                </span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <button
                                        key={rating}
                                        onClick={() => handleRating(m, rating)}
                                        className={`
                                            h-10 rounded-lg font-bold text-sm transition-all border
                                            ${ratings[m] === rating 
                                                ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20 scale-105' 
                                                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                            }
                                        `}
                                    >
                                        {rating}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={onCancel}>{t.cancel}</Button>
                    <Button 
                        onClick={() => onConfirm(ratings)}
                        disabled={Object.keys(ratings).length < uniqueMuscles.length}
                    >
                        {t.save} & {t.finishWorkout}
                    </Button>
                </div>
            </div>
        </div>
    );
};