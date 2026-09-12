import React from 'react';
import { logCrashToFirebase } from '../services/crashReporter';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    logCrashToFirebase(error, errorInfo?.componentStack, 'react_error_boundary');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #f87171', margin: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{'Wyst\u0105pi\u0142 b\u0142\u0105d w tym komponencie.'}</h2>
          <p style={{ marginTop: '10px' }}>{'B\u0142\u0105d:'} {String(this.state.error)}</p>
          <details style={{ marginTop: '10px', whiteSpace: 'pre-wrap', fontSize: '12px', background: '#fef2f2', padding: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>{'Poka\u017c szczeg\u00f3\u0142y'}</summary>
            {String(this.state.errorInfo?.componentStack || '')}
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{ marginTop: '10px', padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {'Spr\u00f3buj ponownie'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
