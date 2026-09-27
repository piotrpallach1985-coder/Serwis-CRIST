import React, { useState, useEffect } from 'react';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageCompressor';
import DictationButton from '../shared/DictationButton';

export default function ChecklistExecutor({ steps, onComplete, initialResponses = {}, storageKey = null }) {
  const [values, setValues] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem('checklist_values_' + storageKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialResponses.values || initialResponses || {};
  });
  
  const [notes, setNotes] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem('checklist_notes_' + storageKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialResponses.notes || {};
  });

  const [photos, setPhotos] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem('checklist_photos_' + storageKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialResponses.photos || {};
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem('checklist_values_' + storageKey, JSON.stringify(values));
      localStorage.setItem('checklist_notes_' + storageKey, JSON.stringify(notes));
      localStorage.setItem('checklist_photos_' + storageKey, JSON.stringify(photos));
    }
  }, [values, notes, photos, storageKey]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [uploadProgressId, setUploadProgressId] = useState(null);
  const [lockedSteps, setLockedSteps] = useState({});

  const updateValue = (id, value) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const updateNote = (id, noteText) => {
    setNotes(prev => ({ ...prev, [id]: noteText }));
  };

  const handleStepPhotoChange = async (e, stepId) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadProgressId(stepId);
    try {
      let newUrls = [];
      for (let i = 0; i < files.length; i++) {
        const compressedFile = await compressImage(files[i], 2);
        const safeName = compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storageRef = ref(storage, `checklists/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, compressedFile);
        const photoUrl = await getDownloadURL(storageRef);
        newUrls.push(photoUrl);
      }
      setPhotos(prev => {
        const existing = prev[stepId] || [];
        return { ...prev, [stepId]: [...existing, ...newUrls] };
      });
    } catch (err) {
      alert("Błąd podczas wgrywania zdjęcia: " + err.message);
    } finally {
      setUploadProgressId(null);
    }
  };

  const removeStepPhoto = (stepId, index) => {
    setPhotos(prev => {
      const existing = prev[stepId] || [];
      const updated = [...existing];
      updated.splice(index, 1);
      return { ...prev, [stepId]: updated };
    });
  };

  const handlePrimaryPhotoChange = async (e, stepId) => {
    // legacy dla typu PHOTO
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhotoId(stepId);
    try {
      const compressedFile = await compressImage(file);
      const safeName = compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `checklists/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, compressedFile);
      const photoUrl = await getDownloadURL(storageRef);
      updateValue(stepId, photoUrl);
    } catch (err) {
      alert("Błąd podczas wgrywania zdjęcia: " + err.message);
    } finally {
      setUploadingPhotoId(null);
    }
  };

  const isFormValid = () => {
    if (!steps || steps.length === 0) return true;
    
    return steps.every(step => {
      if (!step.isRequired) return true;
      const val = values[step.id];
      if (step.type === 'CHECKBOX') return val === true;
      if (step.type === 'VALUE_INPUT') return val !== undefined && val !== null && val.toString().trim() !== '';
      if (step.type === 'PHOTO') return val && val.length > 0;
      return true;
    });
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);
    try {
      await onComplete({ values, notes, photos });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!steps || steps.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
        Brak przypisanej listy kontrolnej do tego serwisu.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="space-y-4">
        {steps.map((step, index) => {
          const val = values[step.id];
          const stepNote = notes[step.id] || '';
          const stepPhotos = photos[step.id] || [];
          
          const isMissing = step.isRequired && (
            (step.type === 'CHECKBOX' && val !== true) ||
            (step.type === 'VALUE_INPUT' && (!val || val.toString().trim() === '')) ||
            (step.type === 'PHOTO' && !val)
          );

          return (
            <div 
              key={step.id} 
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-colors ${lockedSteps[step.id] ? 'border-gray-300 bg-gray-100 opacity-75' : (isMissing ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50')}`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-800 text-lg flex items-start gap-2">
                    <span className="bg-white text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0 border border-gray-200 shadow-sm">
                      {index + 1}
                    </span>
                    {step.taskName || 'Nienazwane zadanie'}
                  </h4>
                  {step.isRequired && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-100 px-2 py-1 rounded-md shrink-0">
                      Wymagane
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  {step.type === 'CHECKBOX' && (
                    <label className="flex items-center gap-3 cursor-pointer p-2 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                      <div className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-white">
                        <input 
                          type="checkbox"
                          className="opacity-0 absolute w-full h-full cursor-pointer"
                          checked={val === true}
                          onChange={(e) => updateValue(step.id, e.target.checked)}
                          disabled={lockedSteps[step.id]}
                        />
                        {val === true && <i className="ph-bold ph-check text-2xl text-blue-600"></i>}
                      </div>
                      <span className="text-lg font-semibold text-gray-700">
                        {val ? 'Odhaczone' : 'Do wykonania'}
                      </span>
                    </label>
                  )}

                  {step.type === 'VALUE_INPUT' && (
                    <input 
                      type="text"
                      value={val || ''}
                      onChange={(e) => updateValue(step.id, e.target.value)}
                      disabled={lockedSteps[step.id]}
                      placeholder="Wprowadź wartość..."
                      className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                    />
                  )}

                  {step.type === 'PHOTO' && (
                    <div className="flex flex-col gap-2">
                      {val ? (
                        <div className="relative">
                          <img src={val} alt="Załącznik" className="w-full h-24 sm:h-32 sm:h-48 object-cover rounded-xl border-2 border-gray-200" />
                          {!lockedSteps[step.id] && (
                            <button 
                              onClick={() => updateValue(step.id, null)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"
                            >
                              <i className="ph ph-x text-lg"></i>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full">
                          {uploadingPhotoId === step.id ? (
                            <div className="flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed border-gray-300 bg-white rounded-xl text-blue-600 gap-2">
                              <i className="ph ph-spinner-gap animate-spin text-3xl"></i>
                              <span className="font-semibold text-sm">Wgrywanie...</span>
                            </div>
                          ) : (
                            <>
                              <label className="flex-1 flex flex-col items-center justify-center h-24 sm:h-32 border-2 border-dashed border-gray-300 bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                <i className="ph ph-image text-3xl text-gray-400 mb-1"></i>
                                <span className="font-semibold text-gray-600 text-sm">Galeria</span>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="hidden"
                                  disabled={lockedSteps[step.id]}
                                  onChange={(e) => handlePrimaryPhotoChange(e, step.id)}
                                />
                              </label>
                              <label className="flex-1 flex flex-col items-center justify-center h-24 sm:h-32 border-2 border-dashed border-gray-300 bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                <i className="ph ph-camera text-3xl text-gray-400 mb-1"></i>
                                <span className="font-semibold text-gray-600 text-sm">Aparat</span>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  disabled={lockedSteps[step.id]}
                                  onChange={(e) => handlePrimaryPhotoChange(e, step.id)}
                                />
                              </label>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Opcjonalna Notatka i Zdjęcia (jak w awariach) */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="relative mb-3">
                    <textarea 
                      value={stepNote}
                      onChange={(e) => updateNote(step.id, e.target.value)}
                      disabled={lockedSteps[step.id]}
                      placeholder="Notatka / Wynik kroku (opcjonalnie)..."
                      className="w-full p-3 pr-10 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-slate-800 outline-none bg-white text-gray-800 shadow-sm transition-all text-sm"
                      rows="2"
                    ></textarea>
                    {!lockedSteps[step.id] && (
                      <div className="absolute bottom-2 right-2">
                        <DictationButton onResult={(text) => updateNote(step.id, stepNote ? stepNote + ' ' + text : text)} />
                      </div>
                    )}
                  </div>
                  
                  {stepPhotos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-2 mb-2">
                      {stepPhotos.map((url, i) => (
                        <div key={i} className="relative shrink-0">
                          <img src={url} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-gray-300 shadow-sm" />
                          {!lockedSteps[step.id] && (
                            <button onClick={() => removeStepPhoto(step.id, i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm text-[10px]">
                              <i className="ph ph-x"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!lockedSteps[step.id] && (
                    <div className="flex gap-2">
                      <label className="flex-1 text-center cursor-pointer bg-white hover:bg-gray-50 text-gray-700 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-300 shadow-sm">
                        <i className="ph ph-image text-lg text-slate-500"></i> Zdjęcie
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleStepPhotoChange(e, step.id)} />
                      </label>
                      <label className="flex-1 text-center cursor-pointer bg-white hover:bg-gray-50 text-gray-700 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-300 shadow-sm sm:hidden">
                        <i className="ph ph-camera text-lg text-slate-500"></i> Aparat
                        <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={(e) => handleStepPhotoChange(e, step.id)} />
                      </label>
                    </div>
                  )}
                  {uploadProgressId === step.id && <div className="text-xs text-blue-600 font-bold mt-2 text-center"><i className="ph ph-spinner animate-spin"></i> Wgrywanie zdjęcia...</div>}
                </div>

                <div className="mt-4 flex justify-end">
                  {!lockedSteps[step.id] ? (
                    <button
                      onClick={() => setLockedSteps(prev => ({...prev, [step.id]: true}))}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600 transition-colors shadow-sm"
                    >
                      Zatwierdź krok
                    </button>
                  ) : (
                    <button
                      onClick={() => setLockedSteps(prev => ({...prev, [step.id]: false}))}
                      className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors shadow-sm"
                    >
                      Edytuj krok
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isFormValid() || isSubmitting}
        className="w-full bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white font-bold text-lg py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
      >
        {isSubmitting ? (
          <>
            <i className="ph ph-spinner-gap animate-spin text-2xl"></i> Zapisywanie...
          </>
        ) : (
          <>
            <i className="ph-fill ph-check-circle text-2xl"></i> Zatwierdź Serwis
          </>
        )}
      </button>
    </div>
  );
}
