
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { SessionExercise, ExerciseDef, SetType } from '../types';

export const useWorkoutController = (onFinishCallback: () => void) => {
    const { activeSession, activeMeso, setActiveSession, setRestTimer, exercises, rpFeedback, setRpFeedback, config } = useApp();
    const [sessionElapsed, setSessionElapsed] = useState(0);

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

    // Timer Logic
    useEffect(() => {
        let i: any;
        if (activeSession?.startTime) {
            const tick = () => setSessionElapsed(Math.floor((Date.now() - activeSession.startTime!) / 1000));
            tick();
            i = setInterval(tick, 1000);
        } else {
            setSessionElapsed(0);
        }
        return () => clearInterval(i);
    }, [activeSession?.startTime]);

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
        const ex = sessionExercises.find(e => e.instanceId === exInstanceId);
        const set = ex?.sets?.find(s => s.id === setId);
        if (!set || set.skipped) return;

        const completing = !set.completed;
        // Start session time if first set
        setActiveSession(prev => {
            if(!prev) return null;
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

        // Trigger Rest Timer
        if (completing) {
            const isMetabolite = activeMeso?.mesoType === 'metabolite';
            let dur = isMetabolite ? 60 : 120;
            if (set.type === 'myorep' || set.type === 'giant') dur = 30;
            setRestTimer({ active: true, duration: dur, timeLeft: dur, endAt: Date.now() + (dur * 1000) });
        }
    }, [activeMeso, sessionExercises, setActiveSession, setRestTimer]);

    const handleConfirmFinish = useCallback(() => {
        setShowFinishModal(false);
        // If RP feedback needed, show that modal, else finish
        if (config?.rpEnabled) {
            setShowFeedbackModal(true);
        } else {
            onFinishCallback();
        }
    }, [onFinishCallback, config]);

    const handleSaveFeedback = useCallback((feedbackData: Record<string, any>) => {
        if (!activeSession) return;
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
        onFinishCallback();
    }, [activeSession, setRpFeedback, onFinishCallback]);

    // Exercise Management Logic helpers state exposed to UI
    return {
        sessionElapsed,
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
        handleSetUpdate,
        handleNoteUpdate,
        toggleSetComplete,
        handleConfirmFinish,
        handleSaveFeedback,
        updateSession: setActiveSession,
        exercisesLibrary: exercises,
        activeSession
    };
};
