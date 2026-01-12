import React, { StrictMode, ReactNode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AppProvider } from './context/AppContext';

console.log("Starting App Initialization...");

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: any; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#09090b', 
            color: '#fff', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px', 
            fontFamily: 'monospace', 
            textAlign: 'center',
            zIndex: 99999
        }}>
            <h1 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '16px' }}>CRITICAL ERROR</h1>
            <p style={{ opacity: 0.8, marginBottom: '24px' }}>The application failed to initialize.</p>
            
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  marginBottom: '32px'
              }}
            >
              Factory Reset App
            </button>
            
            <div style={{ width: '100%', maxWidth: '500px', textAlign: 'left', background: '#000', padding: '16px', borderRadius: '8px', overflowX: 'auto' }}>
                <pre style={{ color: '#f87171', fontSize: '11px', margin: 0 }}>
                    {String(this.state.error)}
                </pre>
            </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <AppProvider>
            <App />
          </AppProvider>
        </ErrorBoundary>
      </StrictMode>
    );
} else {
    console.error("Root element not found");
    document.body.innerHTML = '<h1 style="color:red">FATAL: #root missing</h1>';
}
