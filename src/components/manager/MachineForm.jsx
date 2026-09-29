import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useManagerStore } from '../../store/managerStore';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { addMachine, updateMachine } from '../../services/machines.service';

export default function MachineForm({ isOpen, onClose, editingMachine, initialParentId, regions, onSaved, onError }) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [bay, setBay] = useState('');
  const [regionId, setRegionId] = useState('');
  const [internalId, setInternalId] = useState('');
  const [parentId, setParentId] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const limits = useManagerStore(state => state.limits);
  const machines = useManagerStore(state => state.machines);

  useEffect(() => {
    if (editingMachine) {
      setName(editingMachine.name || '');
      setBay(editingMachine.bay || '');
      setRegionId(editingMachine.regionId || '');
      setInternalId(editingMachine.internalId || '');
      setParentId(editingMachine.parentId || '');
      setAdditionalDescription(editingMachine.additionalDescription || '');
    } else {
      setName('');
      setInternalId('');
      setAdditionalDescription('');
      
      if (initialParentId) {
        setParentId(initialParentId);
        const pm = machines.find(m => m.id === initialParentId);
        if (pm) {
          setRegionId(pm.regionId || '');
          setBay(pm.bay || '');
        } else {
          setRegionId('');
          setBay('');
        }
      } else {
        setParentId('');
        setRegionId('');
        setBay('');
      }
    }
  }, [editingMachine, isOpen, initialParentId, machines]);

  if (!isOpen) return null;


  const handleParentChange = (e) => {
    const val = e.target.value;
    setParentId(val);
    if (val && !editingMachine) {
      const pm = machines.find(m => m.id === val);
      if (pm) {
        if (pm.regionId) setRegionId(pm.regionId);
        if (pm.bay) setBay(pm.bay);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const machines = useManagerStore.getState().machines || [];
    if (!editingMachine && limits && machines.length >= (limits.maxMachines || 50)) {
       alert(t('machines.form.limitReached') + (limits.maxMachines || 50) + ').');
       return;
    }
    if (!name.trim() || !regionId) return;
    setLoading(true);
    try {
      if (editingMachine) {
        let n = name.trim();
        if (n.includes('(DO WERYFIKACJI)')) {
          n = n.replace('(DO WERYFIKACJI)', '').trim();
        }
        await updateMachine(editingMachine.id, {
          name: n,
          bay: bay.trim(),
          regionId,
          internalId: internalId.trim(),
          parentId: parentId || null,
          additionalDescription: additionalDescription.trim(),
          qrCreatedAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
        onSaved(t('machines.toasts.machineUpdated'));
      } else {
        const res = await addMachine({
            name: name.trim(),
            bay: bay.trim(),
            regionId,
            internalId: internalId.trim(),
            parentId: parentId || null,
            additionalDescription: additionalDescription.trim(),
            isDeleted: false,
            currentWorkHours: 0
          });
          onSaved(t('machines.toasts.machineAdded'), res.id);
      }
      onClose();
    } catch (err) {
      onError(t('machines.toasts.error') + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-start justify-center p-4 overflow-y-auto" >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1.5">
            {editingMachine ? t('machines.form.editMachine') : t('machines.form.addMachine')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
            <i className="ph ph-x text-2xl"></i>
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('machines.form.machineName')}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none font-medium focus:ring-2 focus:ring-blue-500" placeholder={t('machines.form.machineNamePlaceholder')} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('machines.form.region')}</label>
                <select value={regionId} onChange={e => setRegionId(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" required>
                  <option value="">{t('machines.form.selectRegion')}</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('machines.form.bay')}</label>
                <input type="text" value={bay} onChange={(e) => setBay(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder={t('machines.form.bayPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('machines.form.internalIdLabel')}</label>
                <input type="text" value={internalId} onChange={(e) => setInternalId(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder={t('machines.form.internalIdPlaceholder')} />
              </div>
            </div>
              <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('machines.form.parentMachine')}</label>
              <select value={parentId} onChange={handleParentChange} className="w-full p-2 border border-gray-300 rounded outline-none bg-white">
                <option value="">{t('machines.form.noParent')}</option>
                {machines.filter(m => m.id !== (editingMachine ? editingMachine.id : null)).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('machines.form.additionalDescription')}</label>
              <textarea value={additionalDescription} onChange={(e) => setAdditionalDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded outline-none resize-y min-h-[80px]" placeholder={t('machines.form.additionalDescriptionPlaceholder')}></textarea>
              <p className="text-xs text-gray-400 mt-1">{t('machines.form.additionalDescriptionHint')}</p>
            </div>
            {editingMachine && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 text-yellow-800 text-sm">
                <p className="font-bold"><i className="ph ph-warning-circle mr-1"></i> {t('machines.form.qrWarningTitle')}</p>
                <p>{t('machines.form.qrWarningText')}<strong>{t('machines.form.newQr')}</strong>!</p>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={onClose}
                className="bg-gray-100 text-gray-700 font-semibold py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('machines.buttons.cancel')}
              </button>
              <button disabled={loading} type="submit" className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 min-w-[150px] shadow-sm">
                {loading ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-check font-bold"></i>}
                {editingMachine ? t('machines.buttons.saveChanges') : t('machines.buttons.addMachineBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

MachineForm.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  editingMachine: PropTypes.object,
  initialParentId: PropTypes.string,
  regions: PropTypes.array.isRequired,
  onSaved: PropTypes.func,
  onError: PropTypes.func,
};
