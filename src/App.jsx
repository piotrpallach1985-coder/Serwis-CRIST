
import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './components/Login';
import OfflineSyncManager from './components/OfflineSyncManager';
import ErrorBoundary from './components/ErrorBoundary';
import { USER_ROLES } from './utils/constants';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { useManagerStore } from './store/managerStore';
import { getCurrentTenant } from './utils/tenantHelper';

const ManagerView = lazy(() => import('./components/ManagerView'));
const OperatorView = lazy(() => import('./components/OperatorView'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
    <div className="flex flex-col items-center">
      <i className="ph ph-spinner animate-spin text-4xl text-blue-600 mb-4"></i>
      <p className="text-gray-500 font-medium animate-pulse">Ładowanie sesji użytkownika...</p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Eagerly set tenantId from URL for unlogged scans
  // HashRouter: location.search jest pusty, prawdziwe query params są w window.location.search
  useEffect(() => {
    const realParams = new URLSearchParams(window.location.search);
    const t = realParams.get('tenant');
    if (t) {
      useManagerStore.getState().setTenantId(t);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
          const tIdAnon = getCurrentTenant();
          useManagerStore.getState().setTenantId(tIdAnon);
          setUser({ name: 'Nieznany Zgłaszający', role: USER_ROLES.OPERATOR, uid: firebaseUser.uid, tenantId: tIdAnon });
          
          if (location.pathname === '/' || location.pathname === '/login') {
             navigate('/operator');
          }
        } else {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const tId = userData.tenantId || getCurrentTenant();
              useManagerStore.getState().setTenantId(tId);
              setUser({
                uid: firebaseUser.uid,
                name: userData.name || firebaseUser.email,
                role: userData.role || 'brak',
                permissions: userData.permissions || [],
                tenantId: tId
              });
              
              if (location.pathname === '/' || location.pathname === '/login') {
                if (userData.role === USER_ROLES.OPERATOR) {
          navigate('/operator');
        } else if (userData.role === 'superadmin' || userData.role === USER_ROLES.SUPERADMIN) {
          navigate('/manager/system_admin/superadmin');
        } else {
          navigate('/manager/home/home');
        }
              }
            } else {
              setUser(null);
            }
          } catch (e) {
            console.error('Błąd weryfikacji roli:', e);
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []); // Only run once on mount

  const handleSetUser = (userData) => {
    setUser(userData);
    if (userData?.tenantId) { useManagerStore.getState().setTenantId(userData.tenantId); }
    if (!userData) { 
      auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      useManagerStore.getState().setTenantId(null);
      navigate('/login');
    } else {
      if (userData.role === USER_ROLES.OPERATOR) {
        navigate('/operator');
      } else {
        navigate('/manager/home/home');
      }
    }
  };

  if (isAuthLoading) {
    return <LoadingFallback />;
  }

  // Jeśli użytkownik nie jest zalogowany
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleSetUser} currentUser={user} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <OfflineSyncManager />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/operator" element={
              <ProtectedRoute user={user} allowedRoles={[USER_ROLES.OPERATOR, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.KIEROWNIK, 'admin', 'superadmin', 'kierownik', 'operator']}>
                <OperatorView 
              user={user} 
              onLogout={() => handleSetUser(null)} 
              onSwitchView={(user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPERADMIN) ? () => navigate('/manager/home/home') : null}
            />
              </ProtectedRoute>
            } />
          
          <Route path="/manager/:module/:tab" element={
              <ProtectedRoute user={user} allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.KIEROWNIK, USER_ROLES.SUPERADMIN, 'admin', 'kierownik', 'superadmin']}>
                <ManagerView 
              user={user} 
              onLogout={() => handleSetUser(null)} 
              onSwitchView={(user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPERADMIN) ? () => navigate('/operator') : null}
            />
              </ProtectedRoute>
            } />
          
          {/* Default redirect based on role */}
          <Route path="/" element={
            user.role === USER_ROLES.OPERATOR ? <Navigate to="/operator" replace /> : (user.role === 'superadmin' || user.role === USER_ROLES.SUPERADMIN ? <Navigate to="/manager/system_admin/superadmin" replace /> : <Navigate to="/manager/home/home" replace />)
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
