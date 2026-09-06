import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../App';
import { onAuthStateChanged } from 'firebase/auth';

vi.mock('../../firebase', () => ({
  auth: {},
  db: {}
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInAnonymously: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock('../Login', () => ({
  default: ({ onLogin }) => <div data-testid="login-view"><button onClick={() => onLogin({uid: '123', role: 'admin', name: 'Admin'})}>Login As Admin</button></div>
}));

vi.mock('../ManagerView', () => ({
  default: () => <div data-testid="manager-view">Manager View</div>
}));

vi.mock('../OperatorView', () => ({
  default: () => <div data-testid="operator-view">Operator View</div>
}));

vi.mock('../OfflineSyncManager', () => ({
  default: () => null
}));

describe('App Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean URL
    window.history.replaceState({}, '', '/');
  });

  it('shows loading initially', () => {
    onAuthStateChanged.mockImplementation(() => () => {});
    render(<App />);
    expect(screen.getByText(/Ładowanie sesji użytkownika/i)).toBeInTheDocument();
  });

  it('shows Login view when not authenticated', () => {
    // Simulate no user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });
    
    render(<App />);
    expect(screen.getByTestId('login-view')).toBeInTheDocument();
  });

  it('shows OperatorView if role is operator', () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ isAnonymous: true, uid: 'anon' }); // Triggers anonymous flow setting role to 'operator'
      return () => {};
    });

    window.history.replaceState({}, '', '?module=operator');

    render(<App />);
    expect(screen.getByTestId('operator-view')).toBeInTheDocument();
  });

  it('handles URL parameter navigation on load', () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });
    
    window.history.replaceState({}, '', '?module=planned_maintenance');
    
    render(<App />);
    // Should still show login because not authenticated
    expect(screen.getByTestId('login-view')).toBeInTheDocument();
  });
});
