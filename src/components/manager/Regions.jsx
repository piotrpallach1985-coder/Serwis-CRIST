import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [machines, setMachines] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mapFile, setMapFile] = useState(null);
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubRegions = onSnapshot(collection(db, "regions"), (snapshot) => {
      setRegions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    const unsubMachines = onSnapshot(collection(db, "machines"), (snapshot) => {
      setMachines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !item.isDeleted));
    });
    return () => {
      unsubRegions();
      unsubMachines();
    };
  }, []);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = mapImageUrl;

      if (mapFile) {
        const fileRef = ref(storage, `regions_maps/${Date.now()}_${mapFile.name}`);
        const uploadTask = uploadBytesResumable(fileRef, mapFile);
        
        finalImageUrl = await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prog);
            },
            (error) => reject(error),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      if (editingId) {
        await updateDoc(doc(db, "regions", editingId), { 
          name: name.trim(), 
          description: description.trim(),
          mapImageUrl: finalImageUrl
        });
      } else {
        await addDoc(collection(db, "regions"), {
          name: name.trim(),
          description: description.trim(),
          mapImageUrl: finalImageUrl,
          createdAt: serverTimestamp()
        });
      }
      setName('');
      setDescription('');
      setMapFile(null);
      setMapImageUrl('');
      setUploadProgress(0);
      setEditingId(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Błąd zapisu:", error);
      alert("Błąd podczas zapisu: " + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (r) => {
    setName(r.name);
    setDescription(r.description || '');
    setEditingId(r.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      const machinesQuery = query(collection(db, 'machines'), where('regionId', '==', id));
      const machinesSnapshot = await getDocs(machinesQuery);
      
      if (!machinesSnapshot.empty) {
        alert(`Nie można usunąć tego rejonu, ponieważ jest on przypisany do ${machinesSnapshot.size} maszyn. Zmień rejon w przypisanych maszynach przed usunięciem.`);
        return;
      }
      
      if (confirm("Czy na pewno chcesz usunąć ten rejon?")) {
        await updateDoc(doc(db, "regions", id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: (typeof user !== 'undefined' && user?.name) ? user.name : 'System' });
      }
    } catch (err) {
      console.error(err);
      alert('Błąd podczas usuwania rejonu');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-sm uppercase tracking-wide md:text-lg font-bold text-gray-800">Rejony (Miejsca)</h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 leading-tight">Zarządzaj rejonami stoczni używanymi w systemie.</p>
        </div>
        <button onClick={() => { setEditingId(null); setName(''); setDescription(''); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 text-sm md:text-base rounded-md md:rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5">
          <i className="ph ph-plus text-lg"></i> Dodaj Rejon
        </button>
      </div>

      <div className="p-6">
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if(e.target === e.currentTarget) setIsFormOpen(false); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-in flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <h2 className="text-xl font-extrabold text-gray-800">
                  {editingId ? 'Edytuj rejon' : 'Dodaj nowy rejon'}
                </h2>
                <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-200">
                  <i className="ph ph-x text-2xl"></i>
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nazwa Rejonu <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. Hala K3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Opis (opcjonalnie)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. Główna hala montażowa"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Podmapa Rejonu (opcjonalnie)</label>
            {mapImageUrl && !mapFile && (
              <div className="mb-2 relative w-32 h-20 rounded-md overflow-hidden border border-gray-300">
                <img src={mapImageUrl} className="w-full h-full object-cover" alt="Podmapa" />
                <button type="button" onClick={() => setMapImageUrl('')} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"><i className="ph ph-x text-xs"></i></button>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setMapFile(e.target.files[0])}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2 text-xs font-bold text-blue-600">Wgrywanie: {Math.round(uploadProgress)}%</div>
            )}
          </div>

            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => { setIsFormOpen(false); setEditingId(null); setName(''); setDescription(''); }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                  >
                    Anuluj
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Dodaj Rejon')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

        <div className="overflow-x-auto">
<div className="lg:hidden flex flex-col gap-1.5 p-2">
    {regions.length === 0 ? (
      <div className="p-4 bg-white rounded-xl text-center text-slate-500 shadow-sm border border-slate-100">Brak danych.</div>
    ) : (
      regions.map(item => (
        
<div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col">
  <div className="flex justify-between items-start mb-2">
    <h4 className="font-bold text-[#002b5e] text-lg">{item.name || 'Bez nazwy'}</h4>
    {item.mapImageUrl && (
      <a href={item.mapImageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 w-12 h-8 rounded-md overflow-hidden border border-gray-200">
        <img src={item.mapImageUrl} alt="Podmapa" className="w-full h-full object-cover" />
      </a>
    )}
  </div>
  <p className="text-sm text-gray-600 mb-1">{item.description || '-'}</p>
  <div className="text-xs text-gray-500 mb-2 font-bold uppercase">Maszyny w rejonie:</div>
  <div className="flex flex-wrap gap-1 mb-2">
    {machines.filter(m => m.regionId === item.id).length > 0 ? (
      machines.filter(m => m.regionId === item.id).map(m => (
        <span key={m.id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100">{m.name}</span>
      ))
    ) : (
      <span className="text-gray-400 italic">Brak przypisanych maszyn</span>
    )}
  </div>
  <div className="mt-2 flex gap-1.5 justify-end border-t border-slate-100 pt-2">
    <button onClick={() => { handleEdit(item); }} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"><i className="ph ph-pencil-simple text-sm"></i> Edytuj</button>
    <button onClick={() => handleDelete(item.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-1.5 px-3 rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-xs"><i className="ph ph-trash text-sm"></i> Usuń</button>
  </div>
</div>

      ))
    )}
  </div>
  <table className="w-full text-left hidden lg:table border-collapse hidden lg:table">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nazwa Rejonu</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Opis</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Maszyny w rejonie</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Podmapa</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {regions.map(r => {
                const regionMachines = machines.filter(m => m.regionId === r.id);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                                          <td className="px-6 py-4 font-bold text-gray-800">{r.name || 'Bez nazwy'}</td>
                    <td className="px-6 py-4 text-gray-600">{r.description || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {regionMachines.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {regionMachines.map(m => (
                            <span key={m.id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Brak przypisanych maszyn</span>
                      )}
                    </td>
                      <td className="px-6 py-4 text-center">
                        {r.mapImageUrl ? (
                          <div className="flex justify-center">
                            <a href={r.mapImageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 w-16 h-10 rounded-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors shadow-sm relative group block" title="Kliknij by powiększyć mapę">
                              <img src={r.mapImageUrl} alt="Podmapa" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="ph ph-magnifying-glass-plus text-white"></i>
                              </div>
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Brak</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleEdit(r)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                            <i className="ph ph-pencil-simple"></i> Edytuj
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 text-sm">
                            <i className="ph ph-trash"></i> Usuń
                          </button>
                        </div>
                      </td>
                  </tr>
                );
              })}
              {regions.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    Brak zdefiniowanych rejonów.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
