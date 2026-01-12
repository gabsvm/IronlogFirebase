
import React, { useState } from 'react';
import { auth } from '../../utils/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Icon } from '../ui/Icon';
import { db } from '../../utils/db';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                // On successful login, the onAuthStateChanged listener in AppContext will trigger the data sync
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                // After creating a user, we should sync the existing local data to the new cloud account.
                await db.syncToCloud();
            }
            onClose(); // Close modal on success
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm m-auto relative animate-scaleUp">
                <button onClick={onClose} className="absolute top-3 right-3 text-zinc-400 hover:text-red-500">
                    <Icon name="X" size={20}/>
                </button>

                <div className="p-8">
                    <div className="flex border-b border-zinc-200 dark:border-white/10 mb-6">
                        <button 
                            className={`flex-1 py-3 text-sm font-bold ${isLogin ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500'}`}
                            onClick={() => setIsLogin(true)}
                        >
                            LOGIN
                        </button>
                        <button 
                            className={`flex-1 py-3 text-sm font-bold ${!isLogin ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500'}`}
                            onClick={() => setIsLogin(false)}
                        >
                            SIGN UP
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-center mb-1 text-zinc-900 dark:text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
                    <p className="text-sm text-zinc-500 text-center mb-6">{isLogin ? 'Sign in to access your synced data.' : 'Get started with your free account.'}</p>
                    
                    <div className="space-y-4">
                         <input 
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500 text-zinc-900 dark:text-white"
                        />
                         <input 
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500 text-zinc-900 dark:text-white"
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs mt-4 text-center">{error}</p>}

                    <button 
                        onClick={handleAuthAction}
                        disabled={loading}
                        className="w-full bg-red-600 disabled:bg-red-400 text-white mt-6 py-3 rounded-xl font-bold"
                    >
                        {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </div>
            </div>
        </div>
    );
};
