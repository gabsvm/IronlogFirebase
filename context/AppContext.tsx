
import React, { createContext, useContext, useEffect, useRef, ReactNode, useState } from 'react';
import { AppState, Lang, Theme, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay } from '../types';
import { DEFAULT_LIBRARY, DEFAULT_TEMPLATE } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTimer } from '../hooks/useTimer';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState<Lang>('en');
    const [theme, setTheme] = useState<Theme>('dark');
    
    // Persistence using custom hook (preserves existing v16 keys)
    const [program, setProgram] = useLocalStorage<ProgramDay[]>('il_prog_v16', DEFAULT_TEMPLATE);
    const [activeMeso, setActiveMeso] = useLocalStorage<MesoCycle | null>('il_meso_v16', null);
    const [activeSession, setActiveSession] = useLocalStorage<ActiveSession | null>('il_session_v16', null);
    const [exercises, setExercises] = useLocalStorage<ExerciseDef[]>('il_ex_v16', DEFAULT_LIBRARY);
    const [logs, setLogs] = useLocalStorage<Log[]>('il_logs_v16', []);
    
    // Config items (Legacy split keys preserved)
    const [showRIR, setShowRIR] = useLocalStorage('il_cfg_rir', true);
    const [rpEnabled, setRpEnabled] = useLocalStorage('il_cfg_rp', true);
    const [rpTargetRIR, setRpTargetRIR] = useLocalStorage('il_cfg_rp_rir', 2);
    const [keepScreenOn, setKeepScreenOn] = useLocalStorage('il_cfg_screen', false);
    
    const [rpFeedback, setRpFeedback] = useLocalStorage<AppState['rpFeedback']>('il_rp_fb_v1', {});
    const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage<boolean>('il_onboarded_v2', false);

    // Timer Logic extracted
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
            hasSeenOnboarding, setHasSeenOnboarding
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
