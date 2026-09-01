import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';

export default function MachineDTR({ machine, canManage }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const dtrFiles = machine.dtrFiles || [];

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    
    if (file.type !== 'application/pdf') {
      setErrorMsg('Tylko pliki PDF są dozwolone.');
      return;
    }

    if (dtrFiles.length >= 10) {
      setErrorMsg('Osiągnięto limit 10 plików na maszynę.');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      setErrorMsg('Plik przekracza maksymalny rozmiar 50 MB.');
      return;
    }

    if (fileSizeMB > 30) {
      if (!window.confirm('Plik ma powyżej 30 MB. Jego ładowanie na wolniejszych sieciach (np. telefony na hali) może zająć więcej czasu. Czy chcesz kontynuować?')) {
        return;
      }
    }

    uploadFile(file);
  };

  const uploadFile = (file) => {
    setUploading(true);
    setProgress(0);
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `machines/${machine.id}/dtr/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(p));
      }, 
      (error) => {
        console.error('Błąd uploadu:', error);
        setErrorMsg('Błąd podczas wgrywania pliku.');
        setUploading(false);
      }, 
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newFileObj = {
            id: fileName,
            name: file.name,
            url: downloadURL,
            path: uploadTask.snapshot.ref.fullPath,
            uploadedAt: new Date().toISOString(),
            size: file.size
          };
          const updatedFiles = [...dtrFiles, newFileObj];
          await updateDoc(doc(db, 'machines', machine.id), {
            dtrFiles: updatedFiles
          });
        } catch (err) {
          console.error(err);
          setErrorMsg('Błąd zapisu w bazie danych.');
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    );
  };

  const handleDelete = async (fileObj) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć plik ${fileObj.name}?`)) return;
    try {
      const storageRef = ref(storage, fileObj.path);
      await deleteObject(storageRef).catch(e => console.warn('Plik w storage już nie istnieje:', e));
      
      const updatedFiles = dtrFiles.filter(f => f.id !== fileObj.id);
      await updateDoc(doc(db, 'machines', machine.id), {
        dtrFiles: updatedFiles
      });
    } catch (error) {
      console.error('Błąd usuwania:', error);
      alert('Błąd podczas usuwania pliku.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6 shrink-0">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <i className="ph ph-file-pdf text-red-500 text-xl"></i>
          Dokumentacja DTR ({dtrFiles.length}/10)
        </h3>
        {!canManage && (
          <div className="text-xs text-gray-400 italic">
            Brak uprawnień do edycji DTR
          </div>
        )}
        {canManage && dtrFiles.length < 10 && (
          <div>
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <i className="ph ph-upload-simple"></i>
              Wgraj DTR
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-medium">
            <i className="ph ph-warning-circle mr-2"></i>
            {errorMsg}
          </div>
        )}

        {uploading && (
          <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex justify-between text-xs text-blue-800 font-bold mb-1">
              <span>Wgrywanie pliku...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {dtrFiles.length === 0 ? (
          <div className="text-center p-6 text-gray-400 text-sm">
            Brak załączonych plików DTR dla tej maszyny.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dtrFiles.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <a 
                  href={f.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 overflow-hidden flex-1 group"
                >
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                    <i className="ph-fill ph-file-pdf text-2xl"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors" title={f.name}>
                      {f.name}
                    </div>
                    <div className="text-[10px] text-gray-500 flex gap-2">
                      <span>{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{new Date(f.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </a>
                {canManage && (
                  <button 
                    onClick={() => handleDelete(f)}
                    className="ml-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0"
                    title="Usuń plik"
                  >
                    <i className="ph ph-trash"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
