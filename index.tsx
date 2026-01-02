
import React, { ReactNode, Component } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Safely try to unregister service workers
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }
} catch (e) {
  // Silently ignore
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  declare props: Readonly<ErrorBoundaryProps>;

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-white/10">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <AlertTriangle size={40} strokeWidth={2} />
            </div>
            
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">Something went wrong</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              The application encountered an unexpected error. Try resetting the app data to fix this issue.
            </p>

            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Factory Reset App
            </button>
            
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-white/5">
                <p className="text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-widest">Error Details</p>
                <pre className="text-[10px] text-left bg-zinc-100 dark:bg-black/40 p-3 rounded-lg text-zinc-600 dark:text-zinc-500 overflow-x-auto font-mono">
                    {String(this.state.error)}
                </pre>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
