import { Icon } from "../ui/Icon";
import { Logo } from "../ui/Logo";
import { ReactNode } from "react";

// Redefined the type to include all possible main views
export type NavView = 'home' | 'history' | 'stats' | 'settings';

interface LayoutProps {
    children: ReactNode;
    view: NavView;
    setView: (v: NavView) => void;
}

export const Layout = ({ children, view, setView }: LayoutProps) => {
    
    const navItems: { id: NavView, label: string, icon: string }[] = [
        { id: 'home', label: 'Home', icon: 'Home' },
        { id: 'history', label: 'History', icon: 'History' },
        { id: 'stats', label: 'Stats', icon: 'BarChart3' },
        { id: 'settings', label: 'Settings', icon: 'Settings' }
    ];

    const mainContentStyle = {
        viewTransitionName: `main-content`
    };

    return (
        <div className="h-full flex flex-col bg-zinc-50 dark:bg-black">
            <header className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <Logo />
                {/* Placeholder for potential header actions */}
            </header>
            
            <main className="flex-1 overflow-y-auto p-4" style={mainContentStyle}>
                {children}
            </main>
            
            <nav className="grid grid-cols-4 gap-2 p-2 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                            view === item.id 
                                ? 'bg-blue-500 text-white' 
                                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <Icon name={item.icon as any} size={22} />
                        <span className="text-xs mt-1">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};