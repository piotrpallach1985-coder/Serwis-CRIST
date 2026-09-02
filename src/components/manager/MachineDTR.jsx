import { useState, useRef, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';

export default function MachineDTR({ machine, canManage }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const dtrFiles = machine.dtrFiles || [];

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canManage) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const uploadFile = (file) => {
    if (file.type !== 'application/pdf') {
      setErrorMsg('Tylko pliki PDF są obsługiwane.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('Plik jest za duży. Maksymalny rozmiar to 50MB.');
      return;
    }
    if (dtrFiles.length >= 10) {
      setErrorMsg('Możesz dodać maksymalnie 10 plików DTR do maszyny.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrorMsg('');
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
      await deleteObject(storageRef);
      const updatedFiles = dtrFiles.filter(f => f.id !== fileObj.id);
      await updateDoc(doc(db, 'machines', machine.id), {
        dtrFiles: updatedFiles
      });
    } catch (err) {
      console.error(err);
      alert('Nie udało się usunąć pliku.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4 shrink-0"
         onDragOver={(e) => { e.preventDefault(); if (canManage) setIsDragOver(true); }}
         onDragLeave={() => setIsDragOver(false)}
         onDrop={handleDrop}
    >
      <div className={`p-4 border-b flex justify-between items-center transition-colors ${isDragOver ? 'bg-blue-50 border-blue-200' : 'border-slate-200'}`}>
        <div className="flex flex-col">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="ph ph-files text-xl text-blue-500"></i> Dokumentacja DTR
          </h3>
          <span className="text-[10px] md:text-xs text-slate-500 mt-0.5">Tylko PDF. Max 50MB. Limit: 10 plików. Powyżej 30MB może działać wolniej. Przeciągnij i puść.</span>
        </div>
        {canManage ? (
          <div>
            <input 
              type="file" 
              accept=".pdf" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
            >
              <i className="ph ph-upload-simple"></i>
              Wgraj DTR
            </button>
          </div>
        ) : (
          <span className="text-xs italic text-gray-400">Brak uprawnień do edycji DTR</span>
        )}
      </div>
      
      <div className={`p-4 ${isDragOver ? 'bg-blue-50/30' : ''}`}>
        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-medium">
            <i className="ph ph-warning-circle mr-2"></i> {errorMsg}
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
          <div className="text-center py-6 text-slate-400 text-sm">
            Brak wgranych plików DTR dla tej maszyny.
            {canManage && <div className="text-xs mt-1">Przeciągnij plik PDF tutaj, aby go wgrać.</div>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dtrFiles.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all group">
                <a 
                  href={f.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 overflow-hidden flex-1"
                >
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                    <i className="ph ph-file-pdf text-2xl"></i>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-700 truncate">{f.name}</span>
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
