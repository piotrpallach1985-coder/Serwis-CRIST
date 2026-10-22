import { useManagerStore } from '../../store/managerStore';
import { addService, updateService } from '../../services/dictionary.service';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { serverTimestamp } from 'firebase/firestore';

export default function Services() {
  const { t } = useTranslation();
  const services = useManagerStore(state => state.services) || [];

  const [newService, setNewService] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').substring(0, 9);
    return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  };

  const handlePhoneChange = (e) => {
    setContactPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newService.trim()) return;
    try {
      const payload = {
        name: newService.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        licenseNumber: licenseNumber.trim(),
      };
      if (editingId) {
        await updateService(editingId, payload);
      } else {
        await addService(payload);
      }
      setNewService('');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setLicenseNumber('');
      setEditingId(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Błąd zapisywania serwisu:', error);
    }
  };

  const handleEdit = (s) => {
    setNewService(s.name || '');
    setContactName(s.contactName || '');
    setContactEmail(s.contactEmail || '');
    setContactPhone(s.contactPhone || '');
    setLicenseNumber(s.licenseNumber || '');
    setEditingId(s.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (
      window.confirm(
        `Czy na pewno chcesz usunąć dział "${name}" z bazy danych?\n(Historia powiązanych z nim napraw pozostanie nienaruszona)`
      )
    ) {
      try {
        await updateService(id, {
          isDeleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: 'System',
        });
      } catch (error) {
        console.error('Błąd usuwania serwisu:', error);
        alert('Nie udało się usunąć serwisu.');
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">
            {t('admin.services.title')}
          </h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">
            {t('admin.services.subtitle')}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setNewService('');
            setContactName('');
            setContactEmail('');
            setContactPhone('');
            setLicenseNumber('');
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
        >
          <i className="ph ph-plus text-lg"></i> {t('admin.services.add_service')}
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-xl font-extrabold text-gray-800">
                {editingId ? t('admin.services.edit_service') : t('admin.services.add_new_service')}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200"
              >
                <i className="ph ph-x text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('admin.services.dept_name_placeholder', 'Nazwa działu / firmy serwisowej *')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('admin.services.dept_name_placeholder')}
                      value={newService}
                      onChange={e => setNewService(e.target.value)}
                      className="w-full p-3 border rounded outline-none focus:border-blue-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('admin.services.contact_person_placeholder', 'Osoba kontaktowa / Inspektor')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('admin.services.contact_person_placeholder')}
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      className="w-full p-3 border rounded outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('admin.services.email_placeholder', 'Adres e-mail')}
                    </label>
                    <input
                      type="email"
                      placeholder={t('admin.services.email_placeholder')}
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      className="w-full p-3 border rounded outline-none focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('admin.services.phone_placeholder', 'Telefon kontaktowy *')}
                    </label>
                    <input
                      type="tel"
                      placeholder={t('admin.services.phone_placeholder')}
                      value={contactPhone}
                      onChange={handlePhoneChange}
                      pattern="^(\d{3}\s?){3}$"
                      title="Wymagane 9 cyfr"
                      className="w-full p-3 border rounded outline-none focus:border-blue-900"
                      required
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t(
                        'admin.services.license_label',
                        'Nr uprawnień budowlanych / świadectwa kwalifikacji (np. PIIB / SEP / F-Gaz)'
                      )}
                    </label>
                    <input
                      type="text"
                      data-testid="service-license-input"
                      placeholder="np. POM/0123/OWOK/18, SEP E1/D1, FGAZ-O/27/00123/22"
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value)}
                      className="w-full p-3 border rounded outline-none focus:border-blue-900"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingId(null);
                      setNewService('');
                      setContactName('');
                      setContactEmail('');
                      setContactPhone('');
                      setLicenseNumber('');
                    }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors min-w-[120px]"
                  >
                    {editingId ? t('admin.services.save_changes') : t('admin.services.add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
          {t('admin.services.available_units')}
        </div>
        <ul className="divide-y divide-gray-100 p-2 md:p-0 flex flex-col gap-2 md:block">
          {services.map(s => (
            <li
              key={s.id}
              className="p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 border border-gray-200 md:border-0 rounded-xl md:rounded-none bg-white"
            >
              <div className="flex items-center gap-3 md:w-1/4">
                <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                  <i className="ph ph-wrench"></i>
                </div>
                <div>
                  <span className="font-bold text-gray-800 block">{s.name}</span>
                  {s.licenseNumber && (
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded inline-flex items-center gap-1 mt-0.5">
                      <i className="ph ph-certificate"></i> {s.licenseNumber}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <i className="ph ph-user mr-1 text-gray-400"></i> {s.contactName || '-'}
                </div>
                <div>
                  <i className="ph ph-phone mr-1 text-gray-400"></i> {s.contactPhone || '-'}
                </div>
                <div>
                  <i className="ph ph-envelope-simple mr-1 text-gray-400"></i>{' '}
                  {s.contactEmail || '-'}
                </div>
              </div>
              <div className="flex justify-end gap-1.5 mt-2 md:mt-0 border-t md:border-t-0 border-gray-100 pt-2 md:pt-0">
                <button
                  onClick={() => handleEdit(s)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"
                >
                  <i className="ph ph-pencil-simple"></i> {t('admin.users.edit')}
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"
                >
                  <i className="ph ph-trash"></i> {t('admin.users.delete')}
                </button>
              </div>
            </li>
          ))}
          {services.length === 0 && (
            <li className="p-4 text-gray-500 text-center">{t('admin.services.empty_list')}</li>
          )}
        </ul>
      </div>
    </div>
  );
}
