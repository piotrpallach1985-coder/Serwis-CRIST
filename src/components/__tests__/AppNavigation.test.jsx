import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../App';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { USER_ROLES } from '../../utils/constants';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: null, isAuthLoading: false, login: vi.fn() })),
  AuthProvider: ({children}) => <div>{children}</div>
}));

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
  default: ({ onLogin }) => <div data-testid="login-view"><button onClick={() => onLogin({uid: '123', role: USER_ROLES.ADMIN, name: 'Admin'})}>Login As Admin</button></div>
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
        useAuth.mockReturnValue({ isAuthLoading: true, user: null });
    render(<BrowserRouter><App /></BrowserRouter>);
    expect(screen.getByText(/Ładowanie sesji użytkownika/i)).toBeInTheDocument();
  });

  it('shows Login view when not authenticated', () => {
    // Simulate no user
        useAuth.mockReturnValue({ isAuthLoading: false, user: null });
    
    render(<BrowserRouter><App /></BrowserRouter>);
    expect(screen.getByTestId('login-view')).toBeInTheDocument();
  });

  it('shows OperatorView if role is operator', async () => {
        useAuth.mockReturnValue({ isAuthLoading: false, user: { role: 'operator', uid: 'anon' } });

    window.history.replaceState({}, '', '?module=operator');

    render(<BrowserRouter><App /></BrowserRouter>);
    expect(await screen.findByTestId('operator-view')).toBeInTheDocument();
  });

  it('handles URL parameter navigation on load', () => {
        useAuth.mockReturnValue({ isAuthLoading: false, user: null });
    
    window.history.replaceState({}, '', '?module=planned_maintenance');
    
    render(<BrowserRouter><App /></BrowserRouter>);
    // Should still show login because not authenticated
    expect(screen.getByTestId('login-view')).toBeInTheDocument();
  });
});
