
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useTimerContext } from './context/TimerContext';
import { Layout } from './components/layout/Layout';
import { HomeView } from './views/HomeView';
import { WorkoutView } from './views/WorkoutView';
import { ExercisesView } from './views/ExercisesView';
import { ProgramEditView } from './views/ProgramEditView';
import { RestTimerOverlay } from './components/ui/RestTimerOverlay';
import { OnboardingModal } from './components/ui/OnboardingModal';
import { getLastLogForExercise, parseTargetReps } from './utils';
import { Icon } from './components/ui/Icon';
import { TRANSLATIONS } from './constants';
import { ExerciseDef, ColorTheme } from './types';
import { Button } from './components/ui/Button';

// Lazy Load heavier views
const HistoryView = React.lazy(() => import('./views/HistoryView').then(module => ({ default: module.HistoryView })));
const StatsView = React.lazy(() => import('./views/StatsView').then(module => ({ default: module.StatsView })));

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center text-zinc-400">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);

// Define View Hierarchy for Directional Animations
// Lower number = Root level, Higher number = Deep level
const VIEW_DEPTH: Record<string, number> = {
    'home': 1,
    'history': 1,
    'stats': 1,
    'workout': 2,
    'exercises': 2,
    'program': 2
};

const AppContent = () => {
    const { 
        activeSession, activeMeso, setActiveSession, 
        program, exercises, lang, setLang, logs, setLogs,
        theme, setTheme, colorTheme, setColorTheme, setExercises, setProgram, setActiveMeso,
        config, setConfig, hasSeenOnboarding, setHasSeenOnboarding
    } = useApp();
    
    // Use new Timer Context
    const { setRestTimer } = useTimerContext();
    
    const t = TRANSLATIONS[lang];

    // Extended view state
    const [view, setViewState] = useState<'home' | 'workout' | 'history' | 'exercises' | 'program' | 'stats'>('home');
    const [showSettings, setShowSettings] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // UX: Helper to trigger View Transitions with Direction
    const setView = (newView: typeof view) => {
        if (newView === view) return;
        
        // Calculate Direction
        const currentDepth = VIEW_DEPTH[view] || 1;
        const nextDepth = VIEW_DEPTH[newView] || 1;
        
        let direction = 'fade';
        if (nextDepth > currentDepth) direction = 'forward';
        else if (nextDepth < currentDepth) direction = 'back';
        
        // Set transition type on root
        document.documentElement.dataset.transition = direction;

        // Check if browser supports View Transitions
        if ((document as any).startViewTransition) {
            const transition = (document as any).startViewTransition(() => {
                setViewState(newView);
            });
            
            // Clean up attribute after transition
            transition.finished.finally(() => {
                document.documentElement.dataset.transition = '';
            });
        } else {
            setViewState(newView);
        }
    };

    // History management for Android Back Button
    const isPopping = useRef(false);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.history) {
                window.history.replaceState({ view: 'home', settings: false }, '', '#home');
            }
        } catch (e) {}

        const handlePop = (e: PopStateEvent) => {
            isPopping.current = true;
            if (e.state) {
                // If popping state, usually implies "Back" or neutral
                // We'll treat history pops as 'back' transitions usually, or just fade
                document.documentElement.dataset.transition = 'back';

                if ((document as any).startViewTransition) {
                    const t = (document as any).startViewTransition(() => {
                        if (e.state.view) setViewState(e.state.view);
                        setShowSettings(!!e.state.settings);
                    });
                    t.finished.finally(() => { document.documentElement.dataset.transition = ''; });
                } else {
                    if (e.state.view) setViewState(e.state.view);
                    setShowSettings(!!e.state.settings);
                }
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
        } catch (e) {}
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
                
                // Separate History from Suggestion
                const prevWeight = historySet ? historySet.weight : undefined;
                const prevReps = historySet ? historySet.reps : undefined;
                
                let hintWeight = prevWeight;
                let hintReps = prevReps;

                // Simple Double Progression Logic (if RP Disabled)
                if (!config.rpEnabled && historySet && historySet.completed && slotDef.reps) {
                    const range = parseTargetReps(slotDef.reps);
                    // If range found and user hit upper bound (Max Reps)
                    if (range && Number(historySet.reps) >= range.max) {
                        const currentWeight = Number(historySet.weight);
                        if (!isNaN(currentWeight) && currentWeight > 0) {
                            // Suggest smallest increment (2.5kg is standard plate jump)
                            hintWeight = currentWeight + 2.5; 
                            hintReps = range.min; 
                        }
                    }
                }

                return {
                    id: Date.now() + Math.random() + i,
                    weight: '', 
                    reps: '', 
                    rpe: '', 
                    completed: false, 
                    type: 'regular',
                    hintWeight: hintWeight,
                    hintReps: hintReps,
                    prevWeight: prevWeight,
                    prevReps: prevReps
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
                        hintReps: lastSet ? lastSet.reps : undefined,
                        prevWeight: lastSet ? lastSet.prevWeight : undefined,
                        prevReps: lastSet ? lastSet.prevReps : undefined
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

    const ColorPill = ({ color, active, onClick, label }: { color: string, active: boolean, onClick: () => void, label: string }) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center gap-1.5 transition-transform active:scale-95 group`}
        >
            <div className={`w-10 h-10 rounded-full ${color} shadow-sm border-2 transition-all ${active ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent opacity-80 group-hover:opacity-100'}`} />
            <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>{label}</span>
        </button>
    );

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
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t.appearance}</label>
                                
                                {/* Theme Toggles */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <button 
                                        onClick={() => setTheme('dark')}
                                        className={`py-3 rounded-xl text-sm font-bold transition-all border flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-50 text-zinc-500 border-transparent'}`}
                                    >
                                        <Icon name="Moon" size={16} /> Dark
                                    </button>
                                    <button 
                                        onClick={() => setTheme('light')}
                                        className={`py-3 rounded-xl text-sm font-bold transition-all border flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-300 shadow-sm' : 'bg-zinc-800/50 text-zinc-500 border-transparent'}`}
                                    >
                                        <Icon name="Sun" size={16} /> Light
                                    </button>
                                </div>

                                {/* Color Palette Selector */}
                                <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Accent Color</label>
                                    <div className="grid grid-cols-4 gap-4">
                                        <ColorPill color="bg-red-600" label="Iron" active={colorTheme === 'iron'} onClick={() => setColorTheme('iron')} />
                                        <ColorPill color="bg-blue-600" label="Ocean" active={colorTheme === 'ocean'} onClick={() => setColorTheme('ocean')} />
                                        <ColorPill color="bg-emerald-600" label="Forest" active={colorTheme === 'forest'} onClick={() => setColorTheme('forest')} />
                                        <ColorPill color="bg-purple-600" label="Royal" active={colorTheme === 'royal'} onClick={() => setColorTheme('royal')} />
                                        <ColorPill color="bg-orange-500" label="Sunset" active={colorTheme === 'sunset'} onClick={() => setColorTheme('sunset')} />
                                        <ColorPill color="bg-zinc-600" label="System" active={colorTheme === 'monochrome'} onClick={() => setColorTheme('monochrome')} />
                                    </div>
                                </div>
                            </div>

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
                                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-xl">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t.language}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setLang('en')}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${lang === 'en' ? 'bg-red-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}
                                            >
                                                EN
                                            </button>
                                            <button 
                                                onClick={() => setLang('es')}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${lang === 'es' ? 'bg-red-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}
                                            >
                                                ES
                                            </button>
                                        </div>
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
                            <p className="text-xs font-medium text-zinc-400">IronLog Pro v2.2.0</p>
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
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}
