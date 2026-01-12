
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { AuthModal } from '../components/auth/AuthModal';

export const SettingsView: React.FC = () => {
    const { lang, setLang, theme, setTheme, colorTheme, setColorTheme, user, logout } = useApp();
    const t = TRANSLATIONS[lang];
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);

    return (
        <div className="p-6 space-y-8 bg-gray-50 dark:bg-zinc-950 min-h-full">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{t.settings}</h2>

            {/* Account Section */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-white/10">
                <h3 className="font-bold text-lg mb-4">Account</h3>
                {user ? (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">Logged in as <span className="font-bold">{user.email}</span></p>
                        <button 
                            onClick={logout}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-zinc-500 mb-4">Create an account to back up and sync your data across devices.</p>
                        <button 
                            onClick={() => setAuthModalOpen(true)}
                            className="w-full bg-red-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                           <Icon name="LogIn" size={16} />
                            Login or Sign Up
                        </button>
                    </div>
                )}
            </div>

            {/* Other settings can go here */}
            
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
        </div>
    );
};
