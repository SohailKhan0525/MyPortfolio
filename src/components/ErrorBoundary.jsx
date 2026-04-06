import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Render error:', error, info);
    window.dispatchEvent(
      new CustomEvent('app-error', {
        detail: { message: error.message, stack: error.stack, type: 'render' },
      })
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            color: '#00f3ff',
            fontFamily: "'Space Grotesk','Inter',sans-serif",
            background: '#050505',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠ SYSTEM ERROR</h1>
          <p style={{ color: '#a0a0a0', marginBottom: '0.5rem' }}>
            Something went wrong. Please refresh the page.
          </p>
          {this.state.error && (
            <pre
              style={{
                color: '#ff8080',
                fontSize: '0.75rem',
                marginBottom: '1.5rem',
                maxWidth: '600px',
                overflowX: 'auto',
                textAlign: 'left',
                background: 'rgba(255,60,60,0.05)',
                border: '1px solid rgba(255,60,60,0.2)',
                padding: '0.75rem',
                borderRadius: '4px',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid #00f3ff',
              color: '#00f3ff',
              padding: '0.75rem 2rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              letterSpacing: '2px',
            }}
          >
            RELOAD
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
