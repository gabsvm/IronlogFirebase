
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, PropsWithChildren } from 'react';
import { User } from 'firebase/auth';
import { AppState, Lang, Theme, ColorTheme, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay, TutorialState } from '../types';
import { DEFAULT_LIBRARY, DEFAULT_TEMPLATE } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePersistedState } from '../hooks/usePersistedState';
import { TimerProvider } from './TimerContext';
import { HomeSkeleton } from '../components/ui/SkeletonLoader';
import { auth } from '../utils/firebase';
import { db } from '../utils/db';

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
    setConfig: (val: AppState['config']) => void;
    setRpFeedback: (val: AppState['rpFeedback'] | ((prev: AppState['rpFeedback']) => AppState['rpFeedback'])) => void;
    setHasSeenOnboarding: (val: boolean) => void;
    markTutorialSeen: (section: keyof TutorialState) => void;
    resetTutorials: () => void;
    isAppLoading: boolean;
    
    // Auth State & Methods
    user: User | null;
    isAuthLoading: boolean;
    logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
    // --- Auth State ---
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setAuthLoading] = useState(true);

    // --- Synchronous Config (localStorage) ---
    const [lang, setLang] = useLocalStorage<Lang>('il_lang_v1', 'en');
    const [theme, setTheme] = useLocalStorage<Theme>('il_theme_v1', 'dark');
    const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>('il_color_theme_v1', 'iron');
    const [showRIR, setShowRIR] = useLocalStorage('il_cfg_rir', true);
    const [rpEnabled, setRpEnabled] = useLocalStorage('il_cfg_rp', true);
    const [rpTargetRIR, setRpTargetRIR] = useLocalStorage('il_cfg_rp_rir', 2);
    const [keepScreenOn, setKeepScreenOn] = useLocalStorage('il_cfg_screen', false);
    const [tutorialProgress, setTutorialProgress] = useLocalStorage<TutorialState>('il_tutorial_v1', { home: false, workout: false, history: false, stats: false });

    // --- Heavy Data (IndexedDB) ---
    const [program, setProgram, programLoading] = usePersistedState<ProgramDay[]>('il_prog_v16', DEFAULT_TEMPLATE);
    const [activeMeso, setActiveMeso, mesoLoading] = usePersistedState<MesoCycle | null>('il_meso_v16', null);
    const [activeSession, setActiveSession, sessionLoading] = usePersistedState<ActiveSession | null>('il_session_v16', null);
    const [exercises, setExercises, exLoading] = usePersistedState<ExerciseDef[]>('il_ex_v16', DEFAULT_LIBRARY);
    const [logs, setLogs, logsLoading] = usePersistedState<Log[]>('il_logs_v16', []);
    const [rpFeedback, setRpFeedback, fbLoading] = usePersistedState<AppState['rpFeedback']>('il_rp_fb_v1', {});
    const [hasSeenOnboarding, setHasSeenOnboarding, onboardingLoading] = usePersistedState<boolean>('il_onboarded_v2', false);

    const isDataLoading = programLoading || mesoLoading || sessionLoading || exLoading || logsLoading || fbLoading || onboardingLoading;
    const isAppLoading = isAuthLoading || isDataLoading;

    // Auth Effect: Listens to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            setAuthLoading(true);
            setUser(firebaseUser);
            if (firebaseUser) {
                // User is logged in
                await db.syncFromCloud();
                // After syncing, we might need to reload the app state from the updated DB
                window.location.reload();
            } else {
                // User is logged out
                // The local state will be used (or default values)
            }
            setAuthLoading(false);
        });
        return () => unsubscribe(); // Cleanup subscription
    }, []);

    const logout = async () => {
        await auth.signOut();
        // Clear local data to ensure a clean slate for the next user or offline session
        await db.clear(); 
        window.location.reload(); // Reload the app to reset all state
    };
    
    // Theme & Wake Lock Effects (no changes here, omitted for brevity)
    // ... (keep the existing useEffects for theme, colorTheme, wakeLock)

    const setConfig = useCallback((newConfig: any) => {
        if (newConfig.showRIR !== undefined) setShowRIR(newConfig.showRIR);
        if (newConfig.rpEnabled !== undefined) setRpEnabled(newConfig.rpEnabled);
        if (newConfig.rpTargetRIR !== undefined) setRpTargetRIR(newConfig.rpTargetRIR);
        if (newConfig.keepScreenOn !== undefined) setKeepScreenOn(newConfig.keepScreenOn);
    }, [setShowRIR, setRpEnabled, setRpTargetRIR, setKeepScreenOn]);

    const markTutorialSeen = useCallback((section: keyof TutorialState) => {
        setTutorialProgress(prev => ({ ...prev, [section]: true }));
    }, [setTutorialProgress]);

    const resetTutorials = useCallback(() => {
        setTutorialProgress({ home: false, workout: false, history: false, stats: false });
    }, [setTutorialProgress]);

    const config = useMemo(() => ({ showRIR, rpEnabled, rpTargetRIR, keepScreenOn }), [showRIR, rpEnabled, rpTargetRIR, keepScreenOn]);

    const contextValue = useMemo(() => ({
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        program, setProgram,
        activeMeso, setActiveMeso,
        activeSession, setActiveSession,
        exercises, setExercises,
        logs, setLogs,
        config, setConfig,
        rpFeedback, setRpFeedback,
        hasSeenOnboarding, setHasSeenOnboarding,
        tutorialProgress, markTutorialSeen, resetTutorials,
        isAppLoading,
        user,
        isAuthLoading,
        logout
    }), [
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        program, setProgram, activeMeso, setActiveMeso, activeSession, setActiveSession,
        exercises, setExercises, logs, setLogs, config, rpFeedback, setRpFeedback,
        hasSeenOnboarding, setHasSeenOnboarding, tutorialProgress, 
        isAppLoading, user, isAuthLoading, logout
    ]);

    if (isAppLoading) {
        return <HomeSkeleton />;
    }

    return (
        <AppContext.Provider value={contextValue}>
            <TimerProvider>
                {children}
            </TimerProvider>
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};
