import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useManagerStore } from '../store/managerStore';
import { getCurrentTenant } from '../utils/tenantHelper';
import { USER_ROLES } from '../utils/constants';
import { getLastAnonTenant } from '../services/qrAccess.service';
import { isAnonSessionRotating } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
          const urlTenant =
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('tenant')
              : null;
          const tIdAnon =
            useManagerStore.getState().tenantId ||
            urlTenant ||
            getLastAnonTenant() ||
            getCurrentTenant();
          useManagerStore.getState().setTenantId(tIdAnon);
          setUser({ name: 'Nieznany Zgłaszający', role: USER_ROLES.OPERATOR, uid: firebaseUser.uid, tenantId: tIdAnon });
        } else {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.isDeleted || userData.status === 'suspended' || userData.isBlocked) {
                try {
                  sessionStorage.setItem('vexont_suspended_notice', '1');
                } catch {
                  // ignore
                }
                await signOut(auth);
                setUser(null);
                setIsAuthLoading(false);
                return;
              }
              const tId = userData.tenantId || getCurrentTenant();
              if (userData.role !== 'superadmin' && tId) {
                try {
                  const genDoc = await getDoc(doc(db, 'tenants', tId, 'settings', 'general'));
                  if (genDoc && typeof genDoc.exists === 'function' && genDoc.exists()) {
                    const genData = genDoc.data();
                    if (genData && genData.status === 'suspended') {
                      try {
                        sessionStorage.setItem('vexont_suspended_notice', '1');
                      } catch {
                        // ignore
                      }
                      await signOut(auth);
                      setUser(null);
                      setIsAuthLoading(false);
                      return;
                    }
                  }
                } catch {
                  // ignore
                }
              }
              useManagerStore.getState().setTenantId(tId);
              setUser({
                ...userData,
                uid: firebaseUser.uid,
                email: userData.email || firebaseUser.email || '',
                name: userData.name || firebaseUser.email,
                role: userData.role || 'brak',
                permissions: userData.permissions || [],
                phone: userData.phone || "",
                licenseNumber: userData.licenseNumber || "",
                assignedService: userData.assignedService || "",
                onlyAssignedTasks: Boolean(userData.onlyAssignedTasks || userData.assignedService),
                tenantId: tId
              });
            } else {
              setUser(null);
            }
          } catch (e) {
            console.error('Błąd weryfikacji roli:', e);
            setUser(null);
          }
        }
      } else {
        if (isAnonSessionRotating()) {
          return;
        }
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (userData) => {
    setUser(userData);
    if (userData?.tenantId) { useManagerStore.getState().setTenantId(userData.tenantId); }
  };

  const logout = async (options = {}) => {
    const hadSuspendedNotice =
      options?.preserveSuspendedNotice === true ||
      (typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('vexont_suspended_notice') === '1');
    const preservedQrEntries = [];
    try {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('vexont_qr_key_') || k === 'vexont_last_anon_tenant')) {
            const v = localStorage.getItem(k);
            if (v) preservedQrEntries.push([k, v]);
          }
        }
      }
    } catch {
      // ignore
    }
    try {
      await signOut(auth);
    } catch(err) {
      console.error(err);
    }
    localStorage.clear();
    sessionStorage.clear();
    try {
      preservedQrEntries.forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
    } catch {
      // ignore
    }
    if (hadSuspendedNotice) {
      try {
        sessionStorage.setItem('vexont_suspended_notice', '1');
      } catch {
        // ignore
      }
    }
    useManagerStore.getState().setTenantId(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
