import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { AppState, Lang, Theme, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay } from '../types';
import { DEFAULT_LIBRARY, DEFAULT_TEMPLATE } from '../constants';
import { playTimerFinishSound } from '../utils/audio';

interface AppContextType extends AppState {
    lang: Lang;
    theme: Theme;
    setLang: (l: Lang) => void;
    setTheme: (t: Theme) => void;
    
    // Actions
    setProgram: React.Dispatch<React.SetStateAction<ProgramDay[]>>;
    setActiveMeso: React.Dispatch<React.SetStateAction<MesoCycle | null>>;
    setActiveSession: React.Dispatch<React.SetStateAction<ActiveSession | null>>;
    setExercises: React.Dispatch<React.SetStateAction<ExerciseDef[]>>;
    setLogs: React.Dispatch<React.SetStateAction<Log[]>>;
    setConfig: React.Dispatch<React.SetStateAction<AppState['config']>>;
    setRpFeedback: React.Dispatch<React.SetStateAction<AppState['rpFeedback']>>;
    
    // Timer
    restTimer: { active: boolean; timeLeft: number; duration: number; endAt: number };
    setRestTimer: React.Dispatch<React.SetStateAction<{ active: boolean; timeLeft: number; duration: number; endAt: number }>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper for local storage with error handling and fallback
function useLS<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [val, setVal] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initial;
        } catch {
            return initial;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch(e) { console.error("LS Error", e); }
    }, [key, val]);

    return [val, setVal];
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState<Lang>('en');
    const [theme, setTheme] = useState<Theme>('dark');
    
    // IMPORTANT: Keys MUST match the original HTML/JS app to preserve user data
    const [program, setProgram] = useLS<ProgramDay[]>('il_prog_v15', DEFAULT_TEMPLATE);
    const [activeMeso, setActiveMeso] = useLS<MesoCycle | null>('il_meso_v15', null);
    const [activeSession, setActiveSession] = useLS<ActiveSession | null>('il_session_v15', null);
    const [exercises, setExercises] = useLS<ExerciseDef[]>('il_ex_v15', DEFAULT_LIBRARY);
    const [logs, setLogs] = useLS<Log[]>('il_logs_v15', []);
    
    // Config items split in original, unified here for cleaner context but synced separately if needed? 
    // The original used individual LS keys for config. We should respect that pattern.
    const [showRIR, setShowRIR] = useLS('il_cfg_rir', true);
    const [rpEnabled, setRpEnabled] = useLS('il_cfg_rp', true);
    const [rpTargetRIR, setRpTargetRIR] = useLS('il_cfg_rp_rir', 2);
    
    const [rpFeedback, setRpFeedback] = useLS<AppState['rpFeedback']>('il_rp_fb_v1', {});

    const [restTimer, setRestTimer] = useState({ active: false, timeLeft: 0, duration: 120, endAt: 0 });
    const workerRef = useRef<Worker | null>(null);

    // Sync theme class
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

    // Initialize Web Worker for Background Timer
    useEffect(() => {
        // Blob for inline worker to avoid external file issues in simple setups
        const workerCode = `
            let interval = null;
            self.onmessage = function(e) {
                if (e.data === 'start') {
                    if (interval) clearInterval(interval);
                    interval = setInterval(() => {
                        self.postMessage('tick');
                    }, 250); // Tick often to catch end times accurately
                } else if (e.data === 'stop') {
                    if (interval) clearInterval(interval);
                    interval = null;
                }
            };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        workerRef.current = new Worker(URL.createObjectURL(blob));

        // Request Notification Permission on mount (user interaction usually required, but we try)
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // Timer Logic driven by Web Worker
    useEffect(() => {
        if (!workerRef.current) return;

        const handleTick = () => {
            setRestTimer(prev => {
                if (!prev.active) return prev;
                
                const now = Date.now();
                const remainingMs = Math.max(0, (prev.endAt || 0) - now);
                const secondsLeft = Math.ceil(remainingMs / 1000);
                
                // Update Title for background visibility
                document.title = secondsLeft > 0 ? `(${Math.floor(secondsLeft/60)}:${(secondsLeft%60).toString().padStart(2,'0')}) Resting...` : "IronLog Pro";

                if (secondsLeft <= 0) {
                    // TIMER FINISHED
                    playTimerFinishSound();
                    
                    if ("Notification" in window && Notification.permission === "granted") {
                         // Only send if we haven't sent one recently (simple debounce logic implied by state change)
                         new Notification("Rest Finished!", {
                             body: "Get back to work!",
                             icon: "/vite.svg", // Fallback icon
                             vibrate: [200, 100, 200]
                         } as any);
                    }

                    // Reset title
                    document.title = "IronLog Pro";
                    
                    // Stop worker
                    workerRef.current?.postMessage('stop');
                    
                    return { ...prev, active: false, timeLeft: 0, endAt: 0 };
                }
                
                // Only update state if second changed to save renders
                if (secondsLeft === prev.timeLeft) return prev;
                return { ...prev, timeLeft: secondsLeft };
            });
        };

        workerRef.current.onmessage = handleTick;

        if (restTimer.active) {
            workerRef.current.postMessage('start');
        } else {
            workerRef.current.postMessage('stop');
            document.title = "IronLog Pro";
        }

    }, [restTimer.active]); // Re-bind when active status changes

    const setConfig = (newConfig: any) => {
        if (typeof newConfig === 'function') {
             console.warn("Update config via individual setters in this refactor version if strictly needed");
        } else {
            if (newConfig.showRIR !== undefined) setShowRIR(newConfig.showRIR);
            if (newConfig.rpEnabled !== undefined) setRpEnabled(newConfig.rpEnabled);
            if (newConfig.rpTargetRIR !== undefined) setRpTargetRIR(newConfig.rpTargetRIR);
        }
    };

    const config = { showRIR, rpEnabled, rpTargetRIR };

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
            restTimer, setRestTimer
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