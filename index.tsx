import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Safely try to unregister service workers without crashing in restricted environments (blobs/iframes)
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {}); // Silently fail if promise rejects
  }
} catch (e) {
  // Silently ignore invalid state errors
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public state: ErrorBoundaryState;

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 20, color: '#ef4444', fontFamily: 'sans-serif', background: '#09090b', height: '100vh'}}>
          <h1>Something went wrong.</h1>
          <p>Please try resetting the app data if this persists.</p>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', marginTop: 20, fontWeight: 'bold'}}
          >
            Factory Reset App
          </button>
          <pre style={{marginTop: 20, opacity: 0.7, fontSize: 12, overflow: 'auto'}}>{String(this.state.error)}</pre>
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