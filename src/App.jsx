import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import OfflineSyncManager from './components/OfflineSyncManager';
import { USER_ROLES } from './utils/constants';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { useManagerStore } from './store/managerStore';

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
  const { user, isAuthLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect after login if user state changes but still on login page
  useEffect(() => {
    if (user && (location.pathname === '/' || location.pathname === '/login')) {
      if (user.role === USER_ROLES.OPERATOR) {
        navigate('/operator');
      } else if (user.role === 'superadmin' || user.role === USER_ROLES.SUPERADMIN) {
        navigate('/manager/system_admin/superadmin');
      } else {
        navigate('/manager/home/home');
      }
    }
  }, [user, location.pathname, navigate]);

  const handleLogin = (userData) => {
    login(userData);
    if (!userData) {
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
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
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
              <ProtectedRoute allowedRoles={[USER_ROLES.OPERATOR, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.KIEROWNIK, 'admin', 'superadmin', 'kierownik', 'operator']}>
                <OperatorView />
              </ProtectedRoute>
            } />
          
          <Route path="/manager/:module/:tab" element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.KIEROWNIK, USER_ROLES.SUPERADMIN, 'admin', 'kierownik', 'superadmin']}>
                <ManagerView />
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
