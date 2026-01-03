
import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';

interface LayoutProps {
    children: React.ReactNode;
    view: 'home' | 'workout' | 'history' | 'stats';
    setView: (v: 'home' | 'workout' | 'history' | 'stats') => void;
    onOpenSettings: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, view, setView, onOpenSettings }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];

    const NavBtn = ({ id, label, icon }: { id: typeof view, label: string, icon: any }) => (
        <button 
            onClick={() => setView(id)} 
            className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 border-t-2 transition-all ${view === id ? 'text-red-600 border-red-600 bg-red-50/50 dark:bg-red-500/5' : 'text-zinc-400 dark:text-zinc-500 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300'}`}
        >
            <Icon name={icon} size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans">
            {/* Header with Safe Area Top padding */}
            {view !== 'workout' && (
                <div className="glass sticky top-0 z-20 shrink-0 pt-safe">
                    <div className="px-4 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-red-700 rounded flex items-center justify-center text-white font-black italic text-xs shadow-md shadow-red-600/20">RP</div>
                            <h1 className="text-zinc-900 dark:text-white font-bold tracking-tight text-lg">IronLog <span className="text-red-500 text-xs align-top font-black">PRO</span></h1>
                        </div>
                        <button onClick={onOpenSettings} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <Icon name="Menu" size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={`flex-1 overflow-y-auto scroll-container pb-24 relative ${view === 'workout' ? 'pt-safe' : ''}`}>
                {children}
            </div>

            {/* Bottom Nav with Safe Area Bottom padding handled by pb-safe in styles */}
            {view !== 'workout' && (
                <div className="fixed bottom-0 left-0 right-0 glass flex z-30 pb-safe">
                    <NavBtn id="home" label={t.active} icon="Layout" />
                    <NavBtn id="history" label={t.history} icon="FileText" />
                    <NavBtn id="stats" label="Stats" icon="BarChart2" />
                </div>
            )}
        </div>
    );
};
