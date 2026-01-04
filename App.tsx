
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { HomeView } from './views/HomeView';
import { WorkoutView } from './views/WorkoutView';
import { ExercisesView } from './views/ExercisesView';
import { ProgramEditView } from './views/ProgramEditView';
import { RestTimerOverlay } from './components/ui/RestTimerOverlay';
import { OnboardingModal } from './components/ui/OnboardingModal';
import { getLastLogForExercise } from './utils';
import { Icon } from './components/ui/Icon';
import { TRANSLATIONS } from './constants';
import { ExerciseDef } from './types';
import { Button } from './components/ui/Button';

// Lazy Load heavier views
const HistoryView = React.lazy(() => import('./views/HistoryView').then(module => ({ default: module.HistoryView })));
const StatsView = React.lazy(() => import('./views/StatsView').then(module => ({ default: module.StatsView })));

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center text-zinc-400">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);

const AppContent = () => {
    const { 
        activeSession, activeMeso, setActiveSession, 
        program, exercises, lang, setLang, logs, setLogs,
        theme, setTheme, setRestTimer, setExercises, setProgram, setActiveMeso,
        config, setConfig, hasSeenOnboarding, setHasSeenOnboarding
    } = useApp();
    
    const t = TRANSLATIONS[lang];

    // Extended view state
    const [view, setView] = useState<'home' | 'workout' | 'history' | 'exercises' | 'program' | 'stats'>('home');
    const [showSettings, setShowSettings] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // History management for Android Back Button
    const isPopping = useRef(false);

    useEffect(() => {
        // Wrap in try-catch for environments where History API is restricted (e.g. some previews)
        try {
            if (typeof window !== 'undefined' && window.history) {
                window.history.replaceState({ view: 'home', settings: false }, '', '#home');
            }
        } catch (e) {
            // Ignore history errors
        }

        const handlePop = (e: PopStateEvent) => {
            isPopping.current = true;
            if (e.state) {
                if (e.state.view) setView(e.state.view);
                setShowSettings(!!e.state.settings);
            } else {
                setView('home');
                setShowSettings(false);
            }
        };

        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, []);

    useEffect(() => {
        if (isPopping.current) {
            isPopping.current = false;
            return;
        }
        const state = { view, settings: showSettings };
        const hash = showSettings ? 'settings' : view;
        
        try {
            if (typeof window !== 'undefined' && window.history) {
                window.history.pushState(state, '', `#${hash}`);
            }
        } catch (e) {
            // Ignore history errors
        }
    }, [view, showSettings]);

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

    const skipSession = (dayIdx: number) => {
        if (!activeMeso) return;

        const safeProgram = Array.isArray(program) ? program : [];
        const dayDef = safeProgram[dayIdx];
        const name = dayDef 
            ? (typeof dayDef.dayName === 'object' ? dayDef.dayName[lang] : dayDef.dayName) 
            : `Day ${dayIdx + 1}`;

        const skippedLog = {
            id: Date.now(),
            dayIdx,
            name: `${activeMeso.week} • ${name}`,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            skipped: true,
            mesoId: activeMeso.id,
            week: activeMeso.week,
            exercises: []
        };
        
        setLogs([skippedLog as any, ...(Array.isArray(logs) ? logs : [])]);
    };

    const startSession = (dayIdx: number) => {
        if (!activeMeso) return;
        
        if (activeSession && activeSession.dayIdx === dayIdx) {
            setView('workout');
            return;
        }

        const safeProgram = Array.isArray(program) ? program : [];
        const dayDef = safeProgram[dayIdx];
        if (!dayDef) return;

        const dayNameSafe = dayDef.dayName 
            ? (typeof dayDef.dayName === 'object' ? dayDef.dayName[lang] : dayDef.dayName) 
            : `Day ${dayIdx + 1}`;

        const mesoPlan = Array.isArray(activeMeso.plan) ? activeMeso.plan : [];
        const dayPlan = Array.isArray(mesoPlan[dayIdx]) ? mesoPlan[dayIdx] : [];
        const safeExercises = Array.isArray(exercises) ? exercises.filter(e => !!e) : [];
        const safeLogs = Array.isArray(logs) ? logs : [];
        const isDeload = !!activeMeso.isDeload;

        const sessionExs = (dayDef.slots || []).map((slotDef, idx) => {
            if (!slotDef) return null;

            const exId = dayPlan[idx];
            let exDef: ExerciseDef | undefined;

            if (exId) {
                exDef = safeExercises.find(e => e.id === exId);
            }
            if (!exDef) {
                exDef = safeExercises.find(e => e.muscle === slotDef.muscle);
            }
            if (!exDef && safeExercises.length > 0) {
                exDef = safeExercises[0];
            }
            if (!exDef) {
                exDef = { id: 'unknown', name: 'Unknown Exercise', muscle: slotDef.muscle || 'CHEST' };
            }

            const lastSets = getLastLogForExercise(exDef.id, safeLogs);
            
            let setTarget = slotDef.setTarget || 3;
            if (isDeload) {
                setTarget = Math.max(1, Math.ceil(setTarget / 2));
            }

            const initialSets = Array(setTarget).fill(null).map((_, i) => {
                const historySet = lastSets && lastSets[i] ? lastSets[i] : null;
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
        }).filter(Boolean);

        setActiveSession({
            id: Date.now(),
            dayIdx,
            name: `${activeMeso.week} • ${dayNameSafe} ${isDeload ? '(Deload)' : ''}`,
            exercises: sessionExs as any,
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
        const safeLogs = Array.isArray(logs) ? logs : [];
        setLogs([log as any, ...safeLogs]);
        setActiveSession(null);
        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 }); 
        setView('home');
    };

    const addSet = (exInstanceId: number) => {
        if (!activeSession) return;
        setActiveSession(prev => {
            if (!prev) return null;
            const currentExercises = Array.isArray(prev.exercises) ? prev.exercises : [];
            return {
                ...prev,
                exercises: currentExercises.map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    const sets = Array.isArray(ex.sets) ? ex.sets : [];
                    const lastSet = sets[sets.length - 1];
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
                    return { ...ex, sets: [...sets, newSet as any] };
                })
            };
        });
    };

    const deleteSet = (exInstanceId: number, setId: number) => {
        if (!activeSession) return;
        setActiveSession(prev => {
            if (!prev) return null;
            const currentExercises = Array.isArray(prev.exercises) ? prev.exercises : [];
            return {
                ...prev,
                exercises: currentExercises.map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    const sets = Array.isArray(ex.sets) ? ex.sets : [];
                    if (sets.length <= 1) return ex; 
                    return { ...ex, sets: sets.filter(s => s.id !== setId) };
                })
            };
        });
    };

    return (
        <>
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
                    {view === 'home' && <HomeView startSession={startSession} onEditProgram={() => setView('program')} onSkipSession={skipSession} />}
                    {view === 'history' && (
                        <Suspense fallback={<LoadingSpinner />}>
                            <HistoryView />
                        </Suspense>
                    )}
                    {view === 'stats' && (
                         <Suspense fallback={<LoadingSpinner />}>
                            <StatsView />
                         </Suspense>
                    )}
                </Layout>
            )}

            <RestTimerOverlay />
            
            {!hasSeenOnboarding && (
                <OnboardingModal onClose={() => setHasSeenOnboarding(true)} />
            )}

            {/* Settings Overlay */}
            {showSettings && view !== 'exercises' && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex justify-end backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
                    <div className="w-80 bg-white dark:bg-zinc-900 h-full p-6 shadow-2xl border-l border-zinc-200 dark:border-white/5 flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h2 className="font-bold text-2xl dark:text-white mb-6 tracking-tight">{t.settings}</h2>
                        
                        <div className="space-y-8 flex-1">
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
                                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-xl">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t.keepScreen}</span>
                                            <span className="text-[10px] text-zinc-400">May drain battery</span>
                                        </div>
                                        <button 
                                            onClick={() => setConfig({ ...config, keepScreenOn: !config.keepScreenOn })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${config.keepScreenOn ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${config.keepScreenOn ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

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

                            <div>
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.dangerZone}</label>
                                <button 
                                    onClick={() => setShowResetModal(true)}
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

            {/* Factory Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowResetModal(false)}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center">
                                <Icon name="Trash2" size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{t.dangerZone}</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {t.deleteDataConfirm}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                <Button variant="secondary" onClick={() => setShowResetModal(false)} className="w-full">{t.cancel}</Button>
                                <Button 
                                    variant="danger" 
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.reload();
                                    }} 
                                    className="w-full"
                                >
                                    {t.factoryReset}
                                </Button>
                            </div>
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
