
import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTimerContext } from '../context/TimerContext';
import { SessionExercise, ExerciseDef, SetType, Log } from '../types';
import { arrayMove } from '@dnd-kit/sortable';
import { triggerHaptic } from '../utils/audio';
import { getLastLogForExercise } from '../utils';

export const useWorkoutController = (onFinishCallback: () => void) => {
    const { activeSession, activeMeso, setActiveSession, exercises, rpFeedback, setRpFeedback, config, logs } = useApp();
    const { setRestTimer } = useTimerContext();
    
    // REMOVED: sessionElapsed state and useEffect. 
    // This stops the hook from triggering a re-render every second.

    // Local UI State
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [replacingExId, setReplacingExId] = useState<number | null>(null);
    const [addingExercise, setAddingExercise] = useState(false);
    const [linkingId, setLinkingId] = useState<number | null>(null);
    const [editingMuscleId, setEditingMuscleId] = useState<number | null>(null);
    const [warmupExId, setWarmupExId] = useState<number | null>(null);
    const [configPlateExId, setConfigPlateExId] = useState<number | null>(null);
    const [plateWeightInput, setPlateWeightInput] = useState('');
    const [changingSetType, setChangingSetType] = useState<{ exId: number, setId: number, currentType: SetType } | null>(null);
    const [showPlateCalc, setShowPlateCalc] = useState<{ weight: number } | null>(null);
    const [detailExercise, setDetailExercise] = useState<SessionExercise | null>(null);
    
    // PR Logic
    const [hasNewPR, setHasNewPR] = useState(false);
    const [showPRSuccess, setShowPRSuccess] = useState(false);

    const sessionExercises = useMemo(() => 
        (activeSession?.exercises || []).filter((e): e is SessionExercise => !!e), 
    [activeSession?.exercises]);

    // Data Mutations
    const handleSetUpdate = useCallback((exInstanceId: number, setId: number, field: string, value: any) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    return {
                        ...ex,
                        sets: (ex.sets || []).map(s => s.id === setId ? { ...s, [field]: value } : s)
                    };
                })
            };
        });
    }, [setActiveSession]);

    const handleNoteUpdate = useCallback((exInstanceId: number, note: string) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => ex.instanceId === exInstanceId ? { ...ex, note } : ex)
            };
        });
    }, [setActiveSession]);

    const toggleSetComplete = useCallback((exInstanceId: number, setId: number) => {
        // Need to access latest state, so we use the functional update inside setActiveSession
        // effectively, but we need to know *what* to update for haptics/timer first.
        // To avoid stale closures without adding `sessionExercises` to dependency (which changes often),
        // we can assume the operation is valid.
        
        setActiveSession(prev => {
            if(!prev) return null;
            
            const ex = prev.exercises.find(e => e.instanceId === exInstanceId);
            const set = ex?.sets?.find(s => s.id === setId);
            if (!set || set.skipped) return prev;

            const completing = !set.completed;
            
            // Side Effects (Haptic/Timer) - We do this *inside* the update to ensure we have latest state
            // or we accept a small risk of stale state for the side effect trigger.
            // For safety and performance, we'll trigger side effects outside but optimistically.
            
            // Note: In React 18, state updates are batched. Side effects in render/set are tricky.
            // We'll rely on the fact that if the user clicked, they saw the current state.
            
            let startTime = prev.startTime;
            if (completing && !startTime) startTime = Date.now();
            
            return {
                ...prev,
                startTime,
                exercises: (prev.exercises || []).map(e => e.instanceId === exInstanceId ? {
                    ...e,
                    sets: (e.sets || []).map(s => s.id === setId ? { ...s, completed: completing } : s)
                } : e)
            }
        });
        
        // Trigger Haptic & Timer optimistically
        // We can't easily know if it was completing or uncompleting without reading state, 
        // but typically users tap to complete. 
        // To be precise, we'd need to find the set in `sessionExercises` before calling setter.
        const ex = sessionExercises.find(e => e.instanceId === exInstanceId);
        const set = ex?.sets.find(s => s.id === setId);
        if(set) {
            const willComplete = !set.completed;
            if(willComplete) {
                triggerHaptic('success');
                const isMetabolite = activeMeso?.mesoType === 'metabolite';
                let dur = isMetabolite ? 60 : 120;
                if (set.type === 'myorep' || set.type === 'giant') dur = 30;
                setRestTimer({ active: true, duration: dur, timeLeft: dur, endAt: Date.now() + (dur * 1000) });
            } else {
                triggerHaptic('light');
            }
        }

    }, [activeMeso, sessionExercises, setActiveSession, setRestTimer]);

    const detectPRs = useCallback((): boolean => {
        let prFound = false;
        const safeLogs = Array.isArray(logs) ? logs : [];

        for (const ex of sessionExercises) {
            let currentBest1RM = 0;
            (ex.sets || []).forEach(s => {
                if (s.completed && s.weight && s.reps) {
                    const e1rm = Number(s.weight) * (1 + Number(s.reps) / 30);
                    if (e1rm > currentBest1RM) currentBest1RM = e1rm;
                }
            });

            if (currentBest1RM > 0) {
                let historicalBest1RM = 0;
                safeLogs.forEach(l => {
                    const oldEx = l.exercises?.find(e => e.id === ex.id);
                    if (oldEx) {
                        (oldEx.sets || []).forEach(s => {
                            if (s.completed && s.weight && s.reps) {
                                const e1rm = Number(s.weight) * (1 + Number(s.reps) / 30);
                                if (e1rm > historicalBest1RM) historicalBest1RM = e1rm;
                            }
                        });
                    }
                });

                if (currentBest1RM > historicalBest1RM) {
                    prFound = true;
                    break; 
                }
            }
        }
        return prFound;
    }, [sessionExercises, logs]);

    const fireConfetti = useCallback(async () => {
        try {
            const confettiModule = await import('canvas-confetti');
            const confetti = (confettiModule.default || confettiModule) as any;
            
            const count = 200;
            const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
            function fire(particleRatio: number, opts: any) {
                confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
            }
            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        } catch (e) { console.warn("Confetti failed", e); }
    }, []);

    const handleConfirmFinish = useCallback(() => {
        triggerHaptic('medium');
        setShowFinishModal(false);
        
        const isPR = detectPRs();
        setHasNewPR(isPR);

        if (config?.rpEnabled) {
            setShowFeedbackModal(true);
        } else {
            if (isPR) {
                setShowPRSuccess(true);
                fireConfetti();
            } else {
                onFinishCallback();
            }
        }
    }, [onFinishCallback, config, detectPRs, fireConfetti]);

    const handleSaveFeedback = useCallback((feedbackData: Record<string, any>) => {
        if (!activeSession) return;
        triggerHaptic('success');
        const { mesoId, week } = activeSession;
        setRpFeedback(prev => {
            const newFb = { ...prev };
            if (!newFb[mesoId]) newFb[mesoId] = {};
            if (!newFb[mesoId][week]) newFb[mesoId][week] = {};
            Object.keys(feedbackData).forEach(m => {
                newFb[mesoId][week][m] = feedbackData[m];
            });
            return newFb;
        });
        
        setShowFeedbackModal(false);
        
        if (hasNewPR) {
            setShowPRSuccess(true);
            fireConfetti();
        } else {
            onFinishCallback();
        }
    }, [activeSession, setRpFeedback, onFinishCallback, hasNewPR, fireConfetti]);

    const dismissPRSuccess = useCallback(() => {
        setShowPRSuccess(false);
        onFinishCallback();
    }, [onFinishCallback]);

    const reorderSessionExercises = useCallback((oldIndex: number, newIndex: number) => {
        triggerHaptic('medium'); 
        if (!activeSession?.exercises) return;
        const newExercises = arrayMove(activeSession.exercises, oldIndex, newIndex);
        setActiveSession(prev => prev ? { ...prev, exercises: newExercises } : null);
    }, [activeSession, setActiveSession]);


    return {
        sessionExercises,
        openMenuId, setOpenMenuId,
        showFinishModal, setShowFinishModal,
        showFeedbackModal, setShowFeedbackModal,
        replacingExId, setReplacingExId,
        addingExercise, setAddingExercise,
        linkingId, setLinkingId,
        editingMuscleId, setEditingMuscleId,
        warmupExId, setWarmupExId,
        configPlateExId, setConfigPlateExId,
        plateWeightInput, setPlateWeightInput,
        changingSetType, setChangingSetType,
        showPlateCalc, setShowPlateCalc,
        showPRSuccess, dismissPRSuccess,
        detailExercise, setDetailExercise,
        handleSetUpdate,
        handleNoteUpdate,
        toggleSetComplete,
        handleConfirmFinish,
        handleSaveFeedback,
        reorderSessionExercises,
        updateSession: setActiveSession,
        exercisesLibrary: exercises,
        activeSession
    };
};
