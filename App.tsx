
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
import { TRANSLATIONS } from './constants';

// Lazy Load heavier views
const HistoryView = React.lazy(() => import('./views/HistoryView').then(module => ({ default: module.HistoryView })));
const StatsView = React.lazy(() => import('./views/StatsView').then(module => ({ default: module.StatsView })));
const SettingsView = React.lazy(() => import('./views/SettingsView').then(module => ({ default: module.SettingsView })));


const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center text-zinc-400">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);

// Define View Hierarchy for Directional Animations
const VIEW_DEPTH: Record<string, number> = {
    'home': 1,
    'history': 1,
    'stats': 1,
    'settings': 1, // Added settings as a main view
    'workout': 2,
    'exercises': 2,
    'program': 2
};

type ViewState = 'home' | 'workout' | 'history' | 'exercises' | 'program' | 'stats' | 'settings';

const AppContent = () => {
    const { activeSession, hasSeenOnboarding, setHasSeenOnboarding } = useApp();
    const [view, setViewState] = useState<ViewState>('home');

    // Simplified view transition logic
    const setView = (newView: ViewState) => {
        if (newView === view) return;
        
        const currentDepth = VIEW_DEPTH[view] || 1;
        const nextDepth = VIEW_DEPTH[newView] || 1;
        let direction = (nextDepth > currentDepth) ? 'forward' : 'back';

        if (document.startViewTransition) {
            document.startViewTransition(() => setViewState(newView));
        } else {
            setViewState(newView);
        }
    };

    // --- Main Render Logic ---
    const renderView = () => {
        switch (view) {
            case 'home':
                return <HomeView startSession={() => {}} onEditProgram={() => setView('program')} onSkipSession={() => {}} />;
            case 'history':
                return <Suspense fallback={<LoadingSpinner />}><HistoryView /></Suspense>;
            case 'stats':
                return <Suspense fallback={<LoadingSpinner />}><StatsView /></Suspense>;
            case 'settings':
                return <Suspense fallback={<LoadingSpinner />}><SettingsView /></Suspense>;
            case 'workout':
                return activeSession ? <WorkoutView onFinish={() => setView('home')} onBack={() => setView('home')} onAddSet={()=>{}} onDeleteSet={()=>{}} /> : <HomeView startSession={() => {}} onEditProgram={() => setView('program')} onSkipSession={() => {}} />;
            case 'exercises':
                return <ExercisesView onBack={() => setView('settings')} />;
            case 'program':
                 return <ProgramEditView onBack={() => setView('home')} />;
            default:
                return <HomeView startSession={() => {}} onEditProgram={() => setView('program')} onSkipSession={() => {}} />;
        }
    };

    return (
        <>
            <Layout view={view} setView={setView} onOpenSettings={() => setView('settings')}>
                {renderView()}
            </Layout>
            
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
