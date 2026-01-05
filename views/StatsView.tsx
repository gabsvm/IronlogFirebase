
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { MuscleGroup } from '../types';
import { ProgressChart, ChartDataPoint } from '../components/stats/ProgressChart';
import { getTranslated } from '../utils';
import { Icon } from '../components/ui/Icon';
import { useStatsWorker } from '../hooks/useStatsWorker';

export const StatsView: React.FC = () => {
    const { logs, lang, activeMeso, exercises } = useApp();
    const t = TRANSLATIONS[lang];
    
    // UI State
    const [selectedExId, setSelectedExId] = useState<string | null>(null);
    const [chartMetric, setChartMetric] = useState<'1rm' | 'volume'>('1rm');
    const [showPicker, setShowPicker] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');

    // Async Data State
    const [volumeData, setVolumeData] = useState<[string, number][]>([]);
    const [availableExercises, setAvailableExercises] = useState<any[]>([]);
    const [chartPoints, setChartPoints] = useState<ChartDataPoint[]>([]);
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingChart, setLoadingChart] = useState(false);

    // Worker Hook
    const { isWorkerReady, calculateOverview, calculateChartData } = useStatsWorker();
    
    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);

    // 1. Load Overview (Volume + Exercise List)
    useEffect(() => {
        if (!isWorkerReady) return;

        const loadOverview = async () => {
            setLoadingOverview(true);
            const { volumeData, exerciseFrequency } = await calculateOverview(safeLogs, activeMeso?.id);
            
            setVolumeData(volumeData);
            
            // Transform frequency map to sorted exercise objects
            const sortedExs = Object.entries(exerciseFrequency)
                .sort((a, b) => (b[1] as number) - (a[1] as number)) // Most frequent first
                .map(([id]) => exercises.find(e => e.id === id))
                .filter(Boolean);
            
            setAvailableExercises(sortedExs);
            
            // Auto-select first exercise if none selected
            if (!selectedExId && sortedExs.length > 0) {
                setSelectedExId(sortedExs[0]!.id);
            }
            
            setLoadingOverview(false);
        };

        loadOverview();
    }, [isWorkerReady, safeLogs, activeMeso?.id, exercises, calculateOverview]); // Removed selectedExId dependency to avoid reset loop

    // 2. Load Chart Data (When Exercise or Metric Changes)
    useEffect(() => {
        if (!isWorkerReady || !selectedExId) return;

        const loadChart = async () => {
            setLoadingChart(true);
            const points = await calculateChartData(safeLogs, selectedExId, chartMetric);
            setChartPoints(points);
            setLoadingChart(false);
        };

        loadChart();
    }, [isWorkerReady, selectedExId, chartMetric, safeLogs, calculateChartData]);


    // Filter for the picker modal
    const filteredExercises = useMemo(() => {
        return availableExercises.filter(ex => 
            getTranslated(ex!.name, lang).toLowerCase().includes(pickerSearch.toLowerCase())
        );
    }, [availableExercises, pickerSearch, lang]);

    const maxVal = Math.max(...volumeData.map(d => d[1]), 10); // Scale
    const currentEx = exercises.find(e => e.id === selectedExId);

    return (
        <div className="p-4 space-y-8">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white px-2">Analytics</h2>
            
            {/* --- Progress Chart Section --- */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-white/5 shadow-sm">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center">
                                <Icon name="TrendingUp" size={16} />
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-white">Progress Tracker</h3>
                        </div>
                        
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                            <button 
                                onClick={() => setChartMetric('1rm')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartMetric === '1rm' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
                            >
                                1RM
                            </button>
                            <button 
                                onClick={() => setChartMetric('volume')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartMetric === 'volume' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
                            >
                                VOL
                            </button>
                        </div>
                    </div>

                    {/* Custom Picker Trigger */}
                    <button 
                        onClick={() => { setPickerSearch(''); setShowPicker(true); }}
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 flex justify-between items-center active:bg-zinc-100 dark:active:bg-white/10 transition-colors"
                    >
                        <span className="truncate">
                            {loadingOverview 
                                ? "Loading exercises..." 
                                : currentEx ? getTranslated(currentEx.name, lang) : t.selectEx}
                        </span>
                        <Icon name="CornerDownRight" size={16} className="text-zinc-400" />
                    </button>
                </div>

                {selectedExId && (
                    <ProgressChart 
                        dataPoints={chartPoints}
                        metric={chartMetric} 
                        loading={loadingChart}
                    />
                )}
            </div>

            {/* --- Volume Bar Chart Section --- */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-white/5 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Icon name="BarChart2" size={14} />
                    {t.volPerCycle}
                </h3>
                
                {loadingOverview ? (
                    <div className="space-y-4 animate-pulse">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="flex gap-3 items-center">
                                <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                                <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                                <div className="w-6 h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {volumeData.map(([muscle, count]) => (
                            <div key={muscle} className="flex items-center gap-3">
                                <div className="w-24 text-xs font-bold text-zinc-500 truncate text-right">
                                    {TRANSLATIONS[lang].muscle[muscle as MuscleGroup]}
                                </div>
                                <div className="flex-1 h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                                    <div 
                                        className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-1000" 
                                        style={{ width: `${(count / maxVal) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="w-6 text-xs font-mono font-bold text-zinc-900 dark:text-white text-right">
                                    {count}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-white/5">
                    <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1">
                        {safeLogs.length}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.totalWorkouts}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-white/5">
                    <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1">
                        {
                            safeLogs.length > 0
                            ? Math.round((safeLogs.reduce((acc, l) => acc + l.duration, 0) / 60) / safeLogs.length)
                            : 0
                        }m
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.avgDuration}</div>
                </div>
            </div>

            {/* --- Full Screen Picker Modal --- */}
            {showPicker && (
                <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-200">
                    <div className="glass px-4 h-16 shrink-0 flex items-center gap-3 border-b border-zinc-200 dark:border-white/5">
                        <button onClick={() => setShowPicker(false)} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                            <Icon name="X" size={24} />
                        </button>
                        <div className="relative flex-1">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input 
                                autoFocus
                                type="text" 
                                placeholder={t.searchPlaceholder}
                                className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-2 focus:ring-red-500 border-none outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                                value={pickerSearch}
                                onChange={e => setPickerSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 scroll-container">
                        <div className="space-y-1">
                            {filteredExercises.map(ex => (
                                <button
                                    key={ex!.id}
                                    onClick={() => {
                                        setSelectedExId(ex!.id);
                                        setShowPicker(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-xl active:scale-[0.99] transition-all flex items-center justify-between group
                                        ${selectedExId === ex!.id ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50' : 'hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'}
                                    `}
                                >
                                    <div>
                                        <div className={`font-bold text-sm ${selectedExId === ex!.id ? 'text-red-700 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                            {getTranslated(ex!.name, lang)}
                                        </div>
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                                            {TRANSLATIONS[lang].muscle[ex!.muscle]}
                                        </div>
                                    </div>
                                    {selectedExId === ex!.id && (
                                        <div className="text-red-600 dark:text-red-500">
                                            <Icon name="Check" size={18} />
                                        </div>
                                    )}
                                </button>
                            ))}
                            {filteredExercises.length === 0 && (
                                <div className="text-center py-10 text-zinc-400 text-xs">
                                    No exercises found in your history matching "{pickerSearch}".
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
