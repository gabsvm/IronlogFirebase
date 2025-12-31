import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { HomeView } from './views/HomeView';
import { WorkoutView } from './views/WorkoutView';
import { HistoryView } from './views/HistoryView';
import { ExercisesView } from './views/ExercisesView';
import { ProgramEditView } from './views/ProgramEditView';
import { StatsView } from './views/StatsView';
import { RestTimerOverlay } from './components/ui/RestTimerOverlay';
import { getLastLogForExercise } from './utils';
import { Icon } from './components/ui/Icon';
import { TRANSLATIONS } from './constants';
import { ExerciseDef } from './types';

const AppContent = () => {
    const { 
        activeSession, activeMeso, setActiveSession, 
        program, exercises, lang, setLang, logs, setLogs,
        theme, setTheme, setRestTimer, setExercises, setProgram, setActiveMeso,
        config, setConfig
    } = useApp();
    
    const t = TRANSLATIONS[lang];

    // Extended view state
    const [view, setView] = useState<'home' | 'workout' | 'history' | 'exercises' | 'program' | 'stats'>('home');
    const [showSettings, setShowSettings] = useState(false);

    // PWA Install Prompt State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        });
    };

    // --- DATA MANAGEMENT ---
    const handleExport = () => {
        const data = {
            program, exercises, logs, activeMeso, activeSession,
            version: '2.1.3'
        };
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ironlog_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (window.confirm(t.importConfirm)) {
                    if (data.program) setProgram(data.program);
                    if (data.exercises) setExercises(data.exercises);
                    if (data.logs) setLogs(data.logs);
                    if (data.activeMeso) setActiveMeso(data.activeMeso);
                    if (data.activeSession) setActiveSession(data.activeSession);
                    alert(t.importSuccess);
                    window.location.reload();
                }
            } catch (err) {
                alert(t.invalidFile);
            }
        };
        reader.readAsText(file);
    };

    // --- WORKOUT LOGIC ---

    const startSession = (dayIdx: number) => {
        if (!activeMeso) return;
        
        // Resume if exists
        if (activeSession && activeSession.dayIdx === dayIdx) {
            setView('workout');
            return;
        }

        const dayPlan = activeMeso.plan[dayIdx];
        const dayDef = program[dayIdx];

        // Hydrate session exercises with history
        const sessionExs = dayPlan.map((exId, idx) => {
            const slotDef = dayDef.slots[idx];
            let exDef: ExerciseDef | undefined;

            // 1. Try to find the assigned exercise by ID
            if (exId) {
                exDef = exercises.find(e => e.id === exId);
            }

            // 2. If no ID (new plan), find the first exercise matching the muscle group
            if (!exDef) {
                exDef = exercises.find(e => e.muscle === slotDef.muscle);
            }

            // 3. Fallback to just the first exercise in DB if nothing matches (should rarely happen)
            if (!exDef) {
                exDef = exercises[0];
            }

            // Look up history for "Ghost Text" (Hints)
            const lastSets = exDef ? getLastLogForExercise(exDef.id, logs) : null;
            
            const setTarget = slotDef.setTarget || 3;
            const initialSets = Array(setTarget).fill(null).map((_, i) => {
                const historySet = lastSets ? lastSets[i] : null;
                return {
                    id: Date.now() + Math.random() + i,
                    weight: '', 
                    reps: '', 
                    rpe: '', 
                    completed: false, 
                    type: 'regular',
                    hintWeight: historySet ? historySet.weight : undefined,
                    hintReps: historySet ? historySet.reps : undefined
                };
            });

            return {
                ...exDef,
                instanceId: Date.now() + Math.random() + idx,
                slotLabel: slotDef.muscle,
                targetReps: slotDef.reps,
                sets: initialSets as any
            };
        });

        setActiveSession({
            id: Date.now(),
            dayIdx,
            name: `${activeMeso.week} • ${dayDef.dayName[lang]}`,
            exercises: sessionExs,
            startTime: Date.now(), 
            mesoId: activeMeso.id,
            week: activeMeso.week
        });
        setView('workout');
    };

    const finishWorkout = () => {
        if (!activeSession) return;
        const duration = activeSession.startTime ? (Date.now() - activeSession.startTime) / 1000 : 0;
        const log = {
            ...activeSession,
            endTime: Date.now(),
            duration,
        };
        setLogs([log as any, ...logs]);
        setActiveSession(null);
        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 }); // Kill timer
        setView('home');
    };

    const addSet = (exInstanceId: number) => {
        if (!activeSession) return;
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: prev.exercises.map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    const lastSet = ex.sets[ex.sets.length - 1];
                    const newSet = {
                        id: Date.now(),
                        weight: lastSet ? lastSet.weight : '',
                        reps: '',
                        rpe: '',
                        completed: false,
                        type: 'regular',
                        hintWeight: lastSet ? lastSet.weight : undefined,
                        hintReps: lastSet ? lastSet.reps : undefined
                    };
                    return { ...ex, sets: [...ex.sets, newSet as any] };
                })
            };
        });
    };

    const deleteSet = (exInstanceId: number, setId: number) => {
        if (!activeSession) return;
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: prev.exercises.map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    if (ex.sets.length <= 1) return ex; 
                    return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
                })
            };
        });
    };

    return (
        <>
            {/* View Routing */}
            {view === 'workout' && activeSession ? (
                <WorkoutView 
                    onFinish={finishWorkout} 
                    onBack={() => setView('home')} 
                    onAddSet={addSet}
                    onDeleteSet={deleteSet}
                />
            ) : view === 'exercises' ? (
                <ExercisesView onBack={() => { setView('home'); setShowSettings(true); }} />
            ) : view === 'program' ? (
                <ProgramEditView onBack={() => setView('home')} />
            ) : (
                <Layout view={view as any} setView={setView as any} onOpenSettings={() => setShowSettings(true)}>
                    {view === 'home' && <HomeView startSession={startSession} onEditProgram={() => setView('program')} />}
                    {view === 'history' && <HistoryView />}
                    {view === 'stats' && <StatsView />}
                </Layout>
            )}

            {/* Global Overlays */}
            <RestTimerOverlay />

            {/* Settings Overlay */}
            {showSettings && view !== 'exercises' && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex justify-end backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
                    <div className="w-80 bg-white dark:bg-zinc-900 h-full p-6 shadow-2xl border-l border-zinc-200 dark:border-white/5 flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h2 className="font-bold text-2xl dark:text-white mb-6 tracking-tight">{t.settings}</h2>
                        
                        <div className="space-y-8 flex-1">
                            {/* App Install Button (Only if prompt available) */}
                            {deferredPrompt && (
                                <div>
                                    <button 
                                        onClick={handleInstallClick}
                                        className="w-full py-4 mb-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                                    >
                                        <Icon name="DownloadCloud" size={20} /> {t.install}
                                    </button>
                                </div>
                            )}

                            {/* Workout Config */}
                            <div>
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.workoutConfig}</label>
                                <button 
                                    onClick={() => { setShowSettings(false); setView('program'); }}
                                    className="w-full py-3 mb-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Icon name="Edit" size={16} /> {t.editTemplate}
                                </button>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-xl">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t.showRIR}</span>
                                        <button 
                                            onClick={() => setConfig({ ...config, showRIR: !config.showRIR })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${config.showRIR ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${config.showRIR ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-xl">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t.rpEnabled}</span>
                                        <button 
                                            onClick={() => setConfig({ ...config, rpEnabled: !config.rpEnabled })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${config.rpEnabled ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${config.rpEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Appearance & Language */}
                            <div>
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.appearance}</label>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setTheme('dark')}
                                            className={`py-3 rounded-xl text-sm font-bold transition-all border ${theme === 'dark' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-50 text-zinc-500 border-transparent'}`}
                                        >
                                            Dark
                                        </button>
                                        <button 
                                            onClick={() => setTheme('light')}
                                            className={`py-3 rounded-xl text-sm font-bold transition-all border ${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-300 shadow-sm' : 'bg-zinc-800/50 text-zinc-500 border-transparent'}`}
                                        >
                                            Light
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setLang('en')}
                                            className={`py-3 rounded-xl text-sm font-bold transition-all border ${lang === 'en' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-transparent'}`}
                                        >
                                            English
                                        </button>
                                        <button 
                                            onClick={() => setLang('es')}
                                            className={`py-3 rounded-xl text-sm font-bold transition-all border ${lang === 'es' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-transparent'}`}
                                        >
                                            Español
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Database */}
                            <div>
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.database}</label>
                                <button 
                                    onClick={() => { setShowSettings(false); setView('exercises'); }}
                                    className="w-full py-3 mb-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Icon name="Dumbbell" size={16} /> {t.manageEx}
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={handleExport}
                                        className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Icon name="Download" size={14} /> {t.export}
                                    </button>
                                    <label className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                                        <Icon name="Upload" size={14} /> {t.import}
                                        <input type="file" onChange={handleImport} accept=".json" className="hidden" />
                                    </label>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div>
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.dangerZone}</label>
                                <button 
                                    onClick={() => {
                                        if(window.confirm(t.deleteDataConfirm)) {
                                            localStorage.clear();
                                            window.location.reload();
                                        }
                                    }}
                                    className="w-full py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-100 dark:border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                >
                                    {t.factoryReset}
                                </button>
                            </div>
                        </div>

                        <div className="text-center pt-6 border-t border-zinc-100 dark:border-white/5">
                            <p className="text-xs font-medium text-zinc-400">IronLog Pro v2.1.3</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default function App() {
    return (
        <AppProvider children={<AppContent />} />
    );
}