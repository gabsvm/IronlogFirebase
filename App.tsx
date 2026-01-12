
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { HomeView } from './views/HomeView';
import { WorkoutView } from './views/WorkoutView';
import { ExercisesView } from './views/ExercisesView';
import { ProgramEditView } from './views/ProgramEditView';
import { RestTimerOverlay } from './components/ui/RestTimerOverlay';
import { OnboardingModal } from './components/ui/OnboardingModal';
import { Icon } from './components/ui/Icon';

// Lazy load views for better initial load performance
const HistoryView = React.lazy(() => import('./views/HistoryView').then(m => ({ default: m.HistoryView })));
const StatsView = React.lazy(() => import('./views/StatsView').then(m => ({ default: m.StatsView })));
const SettingsView = React.lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center text-zinc-400"><Icon name="RefreshCw" size={24} className="animate-spin" /></div>
);

type MainView = 'home' | 'history' | 'stats' | 'settings';
type ModalView = 'workout' | 'exercises' | 'program' | null;

const AppContent = () => {
    const { activeSession, hasSeenOnboarding, setHasSeenOnboarding, startSession, finishWorkout, addSet, deleteSet } = useApp();
    const [mainView, setMainView] = useState<MainView>('home');
    const [modalView, setModalView] = useState<ModalView>(null);

    const handleSetView = (view: MainView) => {
        if (document.startViewTransition) {
            document.startViewTransition(() => setMainView(view));
        } else {
            setMainView(view);
        }
    };
    
    const renderMainView = () => {
        switch (mainView) {
            case 'home': return <HomeView startSession={startSession} onEditProgram={() => setModalView('program')} onSkipSession={()=>{}} />;
            case 'history': return <Suspense fallback={<LoadingSpinner />}><HistoryView /></Suspense>;
            case 'stats': return <Suspense fallback={<LoadingSpinner />}><StatsView /></Suspense>;
            case 'settings': return <Suspense fallback={<LoadingSpinner />}><SettingsView /></Suspense>;
            default: return <HomeView startSession={startSession} onEditProgram={() => setModalView('program')} onSkipSession={()=>{}} />;
        }
    };

    const renderModalView = () => {
        switch (modalView) {
            case 'workout': return activeSession ? <WorkoutView onFinish={finishWorkout} onBack={() => setModalView(null)} onAddSet={addSet} onDeleteSet={deleteSet} /> : null;
            case 'exercises': return <ExercisesView onBack={() => setModalView(null)} />;
            case 'program': return <ProgramEditView onBack={() => setModalView(null)} />;
            default: return null;
        }
    }

    // Automatically open workout view when a session starts
    useEffect(() => {
        if (activeSession) {
            setModalView('workout');
        } else {
            // If session ends, close the workout modal
            if (modalView === 'workout') {
                setModalView(null);
            }
        }
    }, [activeSession]);

    return (
        <>
            <Layout view={mainView} setView={handleSetView}>
                {renderMainView()}
            </Layout>
            
            {/* Modal views render over the main layout */}
            {renderModalView()}

            <RestTimerOverlay />
            
            {!hasSeenOnboarding && (
                <OnboardingModal onClose={() => setHasSeenOnboarding(true)} />
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
