import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getCurrentTenant } from '../../../utils/tenantHelper';

export default function ApiSettingsPanel() {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const tenantId = getCurrentTenant();

  const fetchApiKeys = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'tenant_api_keys'), where('tenantId', '==', tenantId)));
      const keys = [];
      snap.forEach(docSnap => {
        keys.push({ id: docSnap.id, ...docSnap.data() });
      });
      setApiKeys(keys);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchApiKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const generateKey = () => {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const randomHex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return 'vxnt_' + randomHex;
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return alert(t('dashboards.api_panel.enter_name_alert', 'Podaj nazwę dla klucza API (np. Integracja BIM)'));
    setLoading(true);
    try {
      const apiKey = generateKey();

      const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey));
      const hashArray = Array.from(new Uint8Array(buffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const prefix = apiKey.substring(0, 9);

      await setDoc(doc(db, 'tenant_api_keys', hashHex), {
        prefix: prefix,
        tenantId: tenantId,
        name: newKeyName.trim(),
        active: true,
        createdAt: serverTimestamp(),
      });
      const { logAudit } = await import('../../../services/audit.service');
      logAudit('CREATE', 'API_KEY', prefix, { name: newKeyName.trim() });
      setNewKeyName('');
      fetchApiKeys();
      alert(
        t('dashboards.api_panel.new_key_created', 'Twój nowy klucz API to:') +
          '\n\n' +
          apiKey +
          '\n\n' +
          t('dashboards.api_panel.save_key_warning', 'Zapisz go teraz, ponieważ nie zostanie wyświetlony w całości ze względów bezpieczeństwa!')
      );
    } catch (e) {
      console.error(e);
      alert('Błąd podczas tworzenia klucza API');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (
      window.confirm(
        t(
          'dashboards.api_panel.delete_confirm',
          'Czy na pewno chcesz usunąć ten klucz API? Systemy zewnętrzne korzystające z tego klucza stracą dostęp.'
        )
      )
    ) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'tenant_api_keys', keyId));
        const { logAudit } = await import('../../../services/audit.service');
        logAudit('DELETE', 'API_KEY', keyId.substring(0, 10), {});
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
    <div className="bg-slate-900 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-800 flex flex-col gap-4 text-white w-full min-w-0 overflow-hidden">
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white break-words">
          <i className="ph ph-plugs-connected text-emerald-400 text-2xl shrink-0"></i>
          <span>{t('dashboards.api_panel.title', 'Integracje API (np. BIM, ERP)')}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl break-words leading-relaxed">
          {t(
            'dashboards.api_panel.desc',
            'Zarządzaj kluczami dostępu do API REST. Przekaż wygenerowany klucz w nagłówku x-api-key swoim systemom zewnętrznym, aby mogły automatycznie komunikować się z aplikacją.'
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center mt-1 w-full min-w-0">
        <input
          type="text"
          value={newKeyName}
          onChange={e => setNewKeyName(e.target.value)}
          placeholder={t('dashboards.api_panel.name_placeholder', 'Nazwa systemu (np. BIM Zdalny)')}
          className="w-full sm:flex-1 min-w-0 bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white outline-none focus:border-emerald-500"
        />
        <button
          onClick={handleCreateKey}
          disabled={loading}
          className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors whitespace-nowrap text-sm flex items-center cursor-pointer"
        >
          {loading
            ? t('parts.issue_receive.processing', 'Przetwarzanie...')
            : t('dashboards.api_panel.generate_btn', 'Generuj nowy klucz')}
        </button>
      </div>

      {apiKeys.length > 0 && (
        <div className="mt-2 flex flex-col gap-2 min-w-0">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            {t('dashboards.api_panel.active_keys', 'Aktywne klucze')}
          </h3>
          {apiKeys.map(key => (
            <div
              key={key.id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-3 rounded-lg border border-slate-700 gap-3 min-w-0"
            >
              <div className="min-w-0 w-full sm:w-auto">
                <div className="font-bold text-slate-200 break-words">{key.name}</div>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1 mt-1">
                  <span>{t('dashboards.api_panel.key_label', 'Klucz:')}</span>
                  <span className="font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded tracking-widest break-all">
                    {key.prefix || key.id.substring(0, 9)}...
                  </span>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  className="flex-1 sm:flex-none text-xs bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded font-bold transition-colors cursor-pointer"
                >
                  {t('admin.users.delete', 'Usuń')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
