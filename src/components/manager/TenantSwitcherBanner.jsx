import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useManagerStore } from '../../store/managerStore';
import { Crown, RefreshCw } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export default function TenantSwitcherBanner({ user }) {
  const [tenants, setTenants] = useState([]);
  const tenantId = useManagerStore(state => state.tenantId);
  const setTenantId = useManagerStore(state => state.setTenantId);
  const { showToast } = useToast();

  useEffect(() => {
    if (user?.role !== 'superadmin') return;
    
    const unsub = onSnapshot(collection(db, 'tenant_registry'), (snapshot) => {
      setTenants(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  if (user?.role !== 'superadmin') return null;

  const handleSwitch = (newId) => {
    if (newId === tenantId) return;
    setTenantId(newId);
    showToast(`Przełączono na dane firmy: ${newId.toUpperCase()}`, 'success');
  };

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 flex items-center justify-between text-sm shadow-sm relative z-50">
      <div className="flex items-center gap-2 font-bold">
        <Crown size={16} className="text-yellow-900" />
        SaaS God Mode: Widzisz dane firmy
      </div>
      
      <div className="flex items-center gap-2">
        <RefreshCw size={14} className="text-yellow-800 opacity-70" />
        <select 
          value={tenantId || ''} 
          onChange={(e) => handleSwitch(e.target.value)}
          className="bg-yellow-400 border border-yellow-600 rounded px-2 py-1 text-sm font-bold cursor-pointer text-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-700"
        >
          {tenants.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.id})
            </option>
          ))}
          {!tenants.find(t => t.id === tenantId) && tenantId && (
            <option value={tenantId}>{tenantId} (Nie w rejestrze!)</option>
          )}
        </select>
      </div>
    </div>
  );
}
