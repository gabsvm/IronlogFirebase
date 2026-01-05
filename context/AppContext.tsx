import React, { createContext, useContext, useEffect, useRef, ReactNode, useState, PropsWithChildren } from 'react';
import { AppState, Lang, Theme, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay } from '../types';
import { DEFAULT_LIBRARY, DEFAULT_TEMPLATE } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePersistedState } from '../hooks/usePersistedState'; // New Async Hook
import { useTimer } from '../hooks/useTimer';
import { Icon } from '../components/ui/Icon';

interface AppContextType extends AppState {
    lang: Lang;
    theme: Theme;
    setLang: (l: Lang) => void;
    setTheme: (t: Theme) => void;
    
    setProgram: (val: ProgramDay[] | ((prev: ProgramDay[]) => ProgramDay[])) => void;
    setActiveMeso: (val: MesoCycle | null | ((prev: MesoCycle | null) => MesoCycle | null)) => void;
    setActiveSession: (val: ActiveSession | null | ((prev: ActiveSession | null) => ActiveSession | null)) => void;
    setExercises: (val: ExerciseDef[] | ((prev: ExerciseDef[]) => ExerciseDef[])) => void;
    setLogs: (val: Log[] | ((prev: Log[]) => Log[])) => void;
    setConfig: (val: AppState['config']) => void;
    setRpFeedback: (val: AppState['rpFeedback'] | ((prev: AppState['rpFeedback']) => AppState['rpFeedback'])) => void;
    setHasSeenOnboarding: (val: boolean) => void;
    
    restTimer: { active: boolean; timeLeft: number; duration: number; endAt: number };
    setRestTimer: React.Dispatch<React.SetStateAction<{ active: boolean; timeLeft: number; duration: number; endAt: number }>>;
    
    isAppLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
    // --- Synchronous Config (Keep in LocalStorage to prevent FOUC) ---
    const [lang, setLang] = useLocalStorage<Lang>('il_lang_v1', 'en');
    const [theme, setTheme] = useLocalStorage<Theme>('il_theme_v1', 'dark');
    
    // Config items (Legacy split keys preserved in LS for speed)
    const [showRIR, setShowRIR] = useLocalStorage('il_cfg_rir', true);
    const [rpEnabled, setRpEnabled] = useLocalStorage('il_cfg_rp', true);
    const [rpTargetRIR, setRpTargetRIR] = useLocalStorage('il_cfg_rp_rir', 2);
    const [keepScreenOn, setKeepScreenOn] = useLocalStorage('il_cfg_screen', false);

    // --- Heavy Data (Migrated to IndexedDB) ---
    const [program, setProgram, programLoading] = usePersistedState<ProgramDay[]>('il_prog_v16', DEFAULT_TEMPLATE);
    const [activeMeso, setActiveMeso, mesoLoading] = usePersistedState<MesoCycle | null>('il_meso_v16', null);
    const [activeSession, setActiveSession, sessionLoading] = usePersistedState<ActiveSession | null>('il_session_v16', null);
    const [exercises, setExercises, exLoading] = usePersistedState<ExerciseDef[]>('il_ex_v16', DEFAULT_LIBRARY);
    const [logs, setLogs, logsLoading] = usePersistedState<Log[]>('il_logs_v16', []);
    
    const [rpFeedback, setRpFeedback, fbLoading] = usePersistedState<AppState['rpFeedback']>('il_rp_fb_v1', {});
    
    // Onboarding status can stay in IDB or LS, IDB is fine
    const [hasSeenOnboarding, setHasSeenOnboarding, onboardingLoading] = usePersistedState<boolean>('il_onboarded_v2', false);

    // Calculate global loading state
    const isAppLoading = programLoading || mesoLoading || sessionLoading || exLoading || logsLoading || fbLoading || onboardingLoading;

    // Timer Logic
    const { restTimer, setRestTimer } = useTimer();
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // Theme Effect
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    // Wake Lock Effect
    useEffect(() => {
        const requestWakeLock = async () => {
            if (keepScreenOn && 'wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.error('Wake Lock failed:', err);
                }
            } else if (!keepScreenOn && wakeLockRef.current) {
                wakeLockRef.current.release()
                    .then(() => { wakeLockRef.current = null; })
                    .catch(e => console.error(e));
            }
        };
        requestWakeLock();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && keepScreenOn) requestWakeLock();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockRef.current) wakeLockRef.current.release();
        };
    }, [keepScreenOn]);

    const setConfig = (newConfig: any) => {
        if (newConfig.showRIR !== undefined) setShowRIR(newConfig.showRIR);
        if (newConfig.rpEnabled !== undefined) setRpEnabled(newConfig.rpEnabled);
        if (newConfig.rpTargetRIR !== undefined) setRpTargetRIR(newConfig.rpTargetRIR);
        if (newConfig.keepScreenOn !== undefined) setKeepScreenOn(newConfig.keepScreenOn);
    };

    const config = { showRIR, rpEnabled, rpTargetRIR, keepScreenOn };

    if (isAppLoading) {
        return (
            <div className="fixed inset-0 bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center z-[9999]">
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-red-600/40 animate-pulse">
                     <Icon name="Dumbbell" size={32} />
                </div>
                <div className="mt-6 flex flex-col items-center gap-2">
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">IronLog <span className="text-red-600">PRO</span></h1>
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        <Icon name="RefreshCw" size={12} className="animate-spin" />
                        Loading Database...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AppContext.Provider value={{
            lang, setLang, theme, setTheme,
            program, setProgram,
            activeMeso, setActiveMeso,
            activeSession, setActiveSession,
            exercises, setExercises,
            logs, setLogs,
            config, setConfig,
            rpFeedback, setRpFeedback,
            restTimer, setRestTimer,
            hasSeenOnboarding, setHasSeenOnboarding,
            isAppLoading
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};