import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './style.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ErrorNotification from './components/ErrorNotification.jsx'

// Global error handlers – dispatch custom events consumed by ErrorNotification
window.addEventListener('unhandledrejection', (e) => {
  const message = e.reason?.message || String(e.reason) || 'Unhandled promise rejection';
  window.dispatchEvent(new CustomEvent('app-error', { detail: { message, type: 'promise' } }));
});

window.onerror = (_msg, _src, _line, _col, error) => {
  const message = error?.message || String(_msg) || 'Unknown runtime error';
  window.dispatchEvent(new CustomEvent('app-error', { detail: { message, type: 'runtime' } }));
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <ErrorNotification />
  </StrictMode>,
)
