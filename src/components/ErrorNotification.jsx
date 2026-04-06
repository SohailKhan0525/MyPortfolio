import { useState, useEffect } from 'react';

const MAX_NOTIFICATIONS = 4;
const AUTO_DISMISS_MS = 8000;

const ErrorNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleAppError = (e) => {
      const detail = e.detail || {};
      const message = detail.message || 'An unknown error occurred';

      const id = Date.now() + Math.random();
      setNotifications((prev) => {
        const next = [...prev, { id, message, type: detail.type || 'error' }];
        return next.slice(-MAX_NOTIFICATIONS);
      });

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, AUTO_DISMISS_MS);
    };

    window.addEventListener('app-error', handleAppError);
    return () => window.removeEventListener('app-error', handleAppError);
  }, []);

  const dismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 20000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
        width: 'calc(100vw - 3rem)',
      }}
    >
      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            background: 'rgba(5,5,5,0.96)',
            border: '1px solid #ff3c3c',
            borderLeft: '4px solid #ff3c3c',
            padding: '0.75rem 1rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 24px rgba(255,60,60,0.18)',
            fontFamily: "'Inter',sans-serif",
            fontSize: '0.8rem',
            color: '#fff',
          }}
        >
          <span style={{ color: '#ff3c3c', fontSize: '1rem', flexShrink: 0 }}>⚠</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: '#ff8080',
                fontWeight: 600,
                marginBottom: '0.25rem',
                fontSize: '0.7rem',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              {n.type === 'render' ? 'RENDER ERROR' : n.type === 'promise' ? 'ASYNC ERROR' : 'RUNTIME ERROR'}
            </div>
            <div style={{ color: '#ccc', wordBreak: 'break-word', lineHeight: 1.4 }}>
              {n.message}
            </div>
          </div>
          <button
            onClick={() => dismiss(n.id)}
            aria-label="Dismiss notification"
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '1.2rem',
              flexShrink: 0,
              padding: '0',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ErrorNotification;
