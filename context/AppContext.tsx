
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, PropsWithChildren } from 'react';
import { User } from 'firebase/auth';
import { AppState, Lang, Theme, ColorTheme, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay, TutorialState, Set, Exercise } from '../types';
import { DEFAULT_LIBRARY, DEFAULT_TEMPLATE } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePersistedState } from '../hooks/usePersistedState';
import { useTimerContext, TimerProvider } from './TimerContext';
import { HomeSkeleton } from '../components/ui/SkeletonLoader';
import { auth } from '../utils/firebase';
import { db } from '../utils/db';
import { getLastLogForExercise, parseTargetReps } from '../utils';

interface AppContextType extends AppState {
    lang: Lang;
    theme: Theme;
    colorTheme: ColorTheme;
    setLang: (l: Lang) => void;
    setTheme: (t: Theme) => void;
    setColorTheme: (t: ColorTheme) => void;
    setProgram: (val: ProgramDay[] | ((prev: ProgramDay[]) => ProgramDay[])) => void;
    setActiveMeso: (val: MesoCycle | null | ((prev: MesoCycle | null) => MesoCycle | null)) => void;
    setActiveSession: (val: ActiveSession | null | ((prev: ActiveSession | null) => ActiveSession | null)) => void;
    setExercises: (val: ExerciseDef[] | ((prev: ExerciseDef[]) => ExerciseDef[])) => void;
    setLogs: (val: Log[] | ((prev: Log[]) => Log[])) => void;
    setConfig: (val: Partial<AppState['config']>) => void;
    setRpFeedback: (val: AppState['rpFeedback'] | ((prev: AppState['rpFeedback']) => AppState['rpFeedback'])) => void;
    setHasSeenOnboarding: (val: boolean) => void;
    markTutorialSeen: (section: keyof TutorialState) => void;
    resetTutorials: () => void;
    isAppLoading: boolean;
    user: User | null;
    isAuthLoading: boolean;
    logout: () => void;
    startSession: (dayIdx: number) => void;
    finishWorkout: () => void;
    addSet: (exInstanceId: number) => void;
    deleteSet: (exInstanceId: number, setId: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProviderContent = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setAuthLoading] = useState(true);
    const { setRestTimer } = useTimerContext();

    const [lang, setLang] = useLocalStorage<Lang>('il_lang_v1', 'en');
    const [theme, setTheme] = useLocalStorage<Theme>('il_theme_v1', 'dark');
    const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>('il_color_theme_v1', 'iron');
    const [config, setConfigValues] = useLocalStorage('il_config_v2', { showRIR: true, rpEnabled: true, rpTargetRIR: 2, keepScreenOn: false });
    const [tutorialProgress, setTutorialProgress] = useLocalStorage<TutorialState>('il_tutorial_v1', { home: false, workout: false, history: false, stats: false });

    const [program, setProgram, programLoading] = usePersistedState<ProgramDay[]>('il_prog_v16', DEFAULT_TEMPLATE);
    const [activeMeso, setActiveMeso, mesoLoading] = usePersistedState<MesoCycle | null>('il_meso_v16', null);
    const [activeSession, setActiveSession, sessionLoading] = usePersistedState<ActiveSession | null>('il_session_v16', null);
    const [exercises, setExercises, exLoading] = usePersistedState<ExerciseDef[]>('il_ex_v16', DEFAULT_LIBRARY);
    const [logs, setLogs, logsLoading] = usePersistedState<Log[]>('il_logs_v16', []);
    const [rpFeedback, setRpFeedback, fbLoading] = usePersistedState<AppState['rpFeedback']>('il_rp_fb_v1', {});
    const [hasSeenOnboarding, setHasSeenOnboarding, onboardingLoading] = usePersistedState<boolean>('il_onboarded_v2', false);

    const isAppLoading = isAuthLoading || programLoading || mesoLoading || sessionLoading || exLoading || logsLoading || fbLoading || onboardingLoading;

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
            setAuthLoading(true);
            setUser(firebaseUser);
            if (firebaseUser) {
                await db.syncFromCloud();
                window.location.reload(); 
            } else {
                setAuthLoading(false);
            }
        });
        return () => unsub();
    }, []);

    const logout = async () => {
        await auth.signOut();
        await db.clear();
        window.location.reload();
    };
    
    const startSession = useCallback((dayIdx: number) => {
        if (!activeMeso) return;
        if (activeSession && activeSession.dayIdx === dayIdx) return;

        const dayDef = program[dayIdx];
        if (!dayDef) return;

        const dayName = typeof dayDef.dayName === 'object' ? dayDef.dayName[lang] : dayDef.dayName;
        const isDeload = !!activeMeso.isDeload;

        const sessionExs = (dayDef.slots || []).map((slotDef, idx) => {
            const exId = activeMeso.plan[dayIdx][idx];
            const exDef = exercises.find(e => e.id === exId) || exercises.find(e => e.muscle === slotDef.muscle) || exercises[0];
            const lastSets = getLastLogForExercise(exDef.id, logs);
            
            let setTarget = slotDef.setTarget || 3;
            if (isDeload) setTarget = Math.max(1, Math.ceil(setTarget / 2));

            const initialSets = Array(setTarget).fill(null).map((_, i) => {
                const historySet = lastSets?.[i];
                let hintWeight = historySet?.weight;
                let hintReps = historySet?.reps;

                if (!config.rpEnabled && historySet?.completed && slotDef.reps) {
                    const range = parseTargetReps(slotDef.reps);
                    if (range && Number(historySet.reps) >= range.max) {
                        hintWeight = (Number(historySet.weight) || 0) + 2.5;
                        hintReps = range.min;
                    }
                }
                return { id: Date.now() + Math.random(), weight: '', reps: '', rpe: '', completed: false, type: 'regular', hintWeight, hintReps, prevWeight: historySet?.weight, prevReps: historySet?.reps };
            });

            return { ...exDef, instanceId: Date.now() + Math.random(), slotLabel: slotDef.muscle, targetReps: slotDef.reps, sets: initialSets as Set[] };
        });

        setActiveSession({
            id: Date.now(), dayIdx, name: `${activeMeso.week} • ${dayName} ${isDeload ? '(Deload)' : ''}`,
            exercises: sessionExs as Exercise[], startTime: Date.now(), mesoId: activeMeso.id, week: activeMeso.week
        });
    }, [activeMeso, activeSession, program, lang, exercises, logs, config.rpEnabled, setActiveSession]);

    const finishWorkout = useCallback(() => {
        if (!activeSession) return;
        const duration = (Date.now() - activeSession.startTime) / 1000;
        const log: Log = { ...activeSession, endTime: Date.now(), duration };
        setLogs(prev => [log, ...prev]);
        setActiveSession(null);
        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 });
    }, [activeSession, setLogs, setActiveSession, setRestTimer]);

    const addSet = useCallback((exInstanceId: number) => {
        setActiveSession(prev => {
            if (!prev) return null;
            const newExercises = prev.exercises.map(ex => {
                if (ex.instanceId !== exInstanceId) return ex;
                const lastSet = ex.sets[ex.sets.length - 1];
                const newSet: Set = { id: Date.now(), weight: lastSet?.weight || '', reps: '', rpe: '', completed: false, type: 'regular', hintWeight: lastSet?.weight, hintReps: lastSet?.reps };
                return { ...ex, sets: [...ex.sets, newSet] };
            });
            return { ...prev, exercises: newExercises };
        });
    }, [setActiveSession]);

    const deleteSet = useCallback((exInstanceId: number, setId: number) => {
        setActiveSession(prev => {
            if (!prev) return null;
            const newExercises = prev.exercises.map(ex => {
                if (ex.instanceId !== exInstanceId || ex.sets.length <= 1) return ex;
                return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
            });
            return { ...prev, exercises: newExercises };
        });
    }, [setActiveSession]);
    
    const setConfig = (newConfig: Partial<AppState['config']>) => setConfigValues(prev => ({...prev, ...newConfig}));
    const markTutorialSeen = (section: keyof TutorialState) => setTutorialProgress(prev => ({ ...prev, [section]: true }));
    const resetTutorials = () => setTutorialProgress({ home: false, workout: false, history: false, stats: false });

    const contextValue = useMemo(() => ({
        lang, setLang, theme, setTheme, colorTheme, setColorTheme, program, setProgram, activeMeso, setActiveMeso,
        activeSession, setActiveSession, exercises, setExercises, logs, setLogs, config, setConfig, rpFeedback, setRpFeedback,
        hasSeenOnboarding, setHasSeenOnboarding, tutorialProgress, markTutorialSeen, resetTutorials, isAppLoading, user,
        isAuthLoading, logout, startSession, finishWorkout, addSet, deleteSet
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [lang, theme, colorTheme, program, activeMeso, activeSession, exercises, logs, config, rpFeedback, hasSeenOnboarding, tutorialProgress, isAppLoading, user, isAuthLoading]);

    if (isAppLoading) return <HomeSkeleton />;

    return (
        <AppContext.Provider value={contextValue as any}>
            {children}
        </AppContext.Provider>
    );
};

export const AppProvider = ({ children }: PropsWithChildren) => (
    <TimerProvider>
        <AppProviderContent>{children}</AppProviderContent>
    </TimerProvider>
);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
}; 
