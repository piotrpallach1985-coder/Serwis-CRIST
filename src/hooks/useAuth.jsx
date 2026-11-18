import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useManagerStore } from '../store/managerStore';
import { getCurrentTenant } from '../utils/tenantHelper';
import { USER_ROLES } from '../utils/constants';
import { getLastAnonTenant } from '../services/qrAccess.service';
import {
  isAnonSessionRotating,
  getCachedUserProfile,
  saveCachedUserProfile,
  clearCachedUserProfile,
  resolveVerifiedUserProfile,
} from '../services/auth.service';

const AuthContext = createContext(null);

const formatUserObject = (userData, firebaseUser = null) => {
  const uid = userData.uid || firebaseUser?.uid || '';
  const tId = userData.tenantId || getCurrentTenant();
  return {
    ...userData,
    uid,
    email: userData.email || firebaseUser?.email || '',
    name: userData.name || firebaseUser?.email || '',
    role: userData.role || 'brak',
    permissions: userData.permissions || [],
    phone: userData.phone || '',
    licenseNumber: userData.licenseNumber || '',
    assignedService: userData.assignedService || '',
    onlyAssignedTasks: Boolean(userData.onlyAssignedTasks || userData.assignedService),
    tenantId: tId,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = getCachedUserProfile();
    if (cached && cached.uid && cached.role && cached.role !== USER_ROLES.OPERATOR) {
      const formatted = formatUserObject(cached);
      if (formatted.tenantId) {
        useManagerStore.getState().setTenantId(formatted.tenantId);
      }
      return formatted;
    }
    return null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(() => {
    const cached = getCachedUserProfile();
    return !(cached && cached.uid && cached.role && cached.role !== USER_ROLES.OPERATOR);
  });

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
          setIsAuthLoading(false);
        } else {
          // 1. Natychmiastowe użycie lokalnego cache (Cache-First < 50ms) przed pełną odpowiedzią sieciową
          const cachedProfile = getCachedUserProfile(firebaseUser.uid);
          if (cachedProfile) {
            const formattedCached = formatUserObject(cachedProfile, firebaseUser);
            useManagerStore.getState().setTenantId(formattedCached.tenantId);
            setUser(formattedCached);
            setIsAuthLoading(false);
          }

          // 2. Weryfikacja / odświeżenie profilu (współdzielone z loginWithEmail bez dublowania zapytań)
          try {
            const verifiedData = await resolveVerifiedUserProfile(firebaseUser.uid, {
              preferCache: Boolean(cachedProfile),
              fallbackEmail: firebaseUser.email || '',
            });
            if (verifiedData) {
              const formatted = formatUserObject(verifiedData, firebaseUser);
              useManagerStore.getState().setTenantId(formatted.tenantId);
              setUser(formatted);
            } else {
              clearCachedUserProfile();
              setUser(null);
            }
          } catch (e) {
            if (
              e?.message === 'USER_DELETED' ||
              e?.message === 'TENANT_SUSPENDED' ||
              e?.message === 'USER_NO_ROLE'
            ) {
              clearCachedUserProfile();
              setUser(null);
            } else {
              console.error('Błąd weryfikacji roli:', e);
              if (!cachedProfile) {
                setUser(null);
              }
            }
          }
          setIsAuthLoading(false);
        }
      } else {
        if (isAnonSessionRotating()) {
          return;
        }
        clearCachedUserProfile();
        setUser(null);
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (userData) => {
    setUser(userData);
    if (userData?.tenantId) {
      useManagerStore.getState().setTenantId(userData.tenantId);
    }
    if (userData && userData.uid && userData.uid !== 'anon' && userData.role !== USER_ROLES.OPERATOR) {
      saveCachedUserProfile(userData);
    }
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
    clearCachedUserProfile();
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
