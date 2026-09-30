import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getCurrentTenant } from '../../../utils/tenantHelper';

export default function ApiSettingsPanel() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const tenantId = getCurrentTenant();

  const fetchApiKeys = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'tenant_api_keys')));
      const keys = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.tenantId === tenantId) {
          keys.push({ id: docSnap.id, ...data });
        }
      });
      setApiKeys(keys);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const generateKey = () => {
    return 'vxnt_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return alert('Podaj nazwę dla klucza API (np. Integracja BIM)');
    setLoading(true);
    try {
      const apiKey = generateKey();
      
      // Compute SHA-256 hash
      const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey));
      const hashArray = Array.from(new Uint8Array(buffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const prefix = apiKey.substring(0, 9); // vxnt_xxxx

      await setDoc(doc(db, 'tenant_api_keys', hashHex), {
        prefix: prefix,
        tenantId: tenantId,
        name: newKeyName.trim(),
        active: true,
        createdAt: serverTimestamp()
      });
      setNewKeyName('');
      fetchApiKeys();
      alert('Twój nowy klucz API to:\n\n' + apiKey + '\n\nZapisz go teraz, ponieważ nie zostanie wyświetlony w całości ze względów bezpieczeństwa!');
    } catch (e) {
      console.error(e);
      alert('Błąd podczas tworzenia klucza API');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten klucz API? Systemy zewnętrzne korzystające z tego klucza stracą dostęp.')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'tenant_api_keys', keyId));
        fetchApiKeys();
      } catch (e) {
        console.error(e);
        alert('Błąd podczas usuwania klucza');
      } finally {
        setLoading(false);
      }
    }
  };

  

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex flex-col gap-4 text-white">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <i className="ph ph-plugs-connected text-emerald-400 text-2xl"></i>
          Integracje API (np. BIM, ERP)
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Zarządzaj kluczami dostępu do API REST. Przekaż wygenerowany klucz w nagłówku <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">x-api-key</code> swoim systemom zewnętrznym, aby mogły automatycznie komunikować się z aplikacją.
        </p>
      </div>
      
      <div className="flex gap-2 items-center mt-2">
        <input 
          type="text" 
          value={newKeyName}
          onChange={e => setNewKeyName(e.target.value)}
          placeholder="Nazwa systemu (np. BIM Zdalny)"
          className="flex-1 bg-slate-800 border border-slate-700 p-2 rounded-lg text-white outline-none focus:border-emerald-500"
        />
        <button 
          onClick={handleCreateKey}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? 'Przetwarzanie...' : 'Generuj nowy klucz'}
        </button>
      </div>

      {apiKeys.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Aktywne klucze</h3>
          {apiKeys.map(key => (
            <div key={key.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-3 rounded-lg border border-slate-700 gap-3">
              <div>
                <div className="font-bold text-slate-200">{key.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  Klucz: <span className="font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded tracking-widest">{key.prefix || key.id.substring(0, 9)}...</span>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {/* Kopiowanie wyłączone (haszowanie) */}
                <button onClick={() => handleDeleteKey(key.id)} className="flex-1 sm:flex-none text-xs bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded font-bold transition-colors">Usuń</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
