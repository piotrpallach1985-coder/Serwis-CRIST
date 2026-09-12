import React from 'react';
import { useManagerData } from '../hooks/useManagerData';

export function ManagerDataProvider({ children }) {
  useManagerData();

  return (
    <>
      {children}
    </>
  );
}

