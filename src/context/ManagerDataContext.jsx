import React, { createContext, useContext } from 'react';
import { useManagerData } from '../hooks/useManagerData';

const ManagerDataContext = createContext(null);

export function ManagerDataProvider({ children }) {
  const data = useManagerData();

  return (
    <ManagerDataContext.Provider value={data}>
      {children}
    </ManagerDataContext.Provider>
  );
}

export function useManagerContext() {
  const context = useContext(ManagerDataContext);
  if (!context) {
    throw new Error('useManagerContext must be used within a ManagerDataProvider');
  }
  return context;
}
