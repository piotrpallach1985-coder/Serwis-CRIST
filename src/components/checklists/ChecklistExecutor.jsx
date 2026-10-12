import { getCurrentTenant } from '../../utils/tenantHelper';
import React, { useState, useEffect } from 'react';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageCompressor';
import DictationButton from '../shared/DictationButton';

export default function ChecklistExecutor({ steps, onComplete, onChange, initialResponses = {}, storageKey = null }) {
  const [values, setValues] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem('checklist_values_' + storageKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialResponses?.values || initialResponses || {};
  });
  
  const [notes, setNotes] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem('checklist_notes_' + storageKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialResponses?.notes || {};
  });

  const [photos, setPhotos] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem('checklist_photos_' + storageKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialResponses?.photos || {};
  });

  const [expandedNotes, setExpandedNotes] = useState({});
  const [validationError, setValidationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [uploadProgressId, setUploadProgressId] = useState(null);

  // Synchronizacja przy zmianie initialResponses (np. dociągnięcie z Firestore)
  useEffect(() => {
    if (initialResponses) {
      if (initialResponses.values && Object.keys(initialResponses.values).length > 0) {
        setValues(prev => Object.keys(prev).length === 0 ? initialResponses.values : prev);
      }
      if (initialResponses.notes && Object.keys(initialResponses.notes).length > 0) {
        setNotes(prev => Object.keys(prev).length === 0 ? initialResponses.notes : prev);
      }
      if (initialResponses.photos && Object.keys(initialResponses.photos).length > 0) {
        setPhotos(prev => Object.keys(prev).length === 0 ? initialResponses.photos : prev);
      }
    }
  }, [initialResponses]);

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem('checklist_values_' + storageKey, JSON.stringify(values));
      localStorage.setItem('checklist_notes_' + storageKey, JSON.stringify(notes));
      localStorage.setItem('checklist_photos_' + storageKey, JSON.stringify(photos));
    }
    if (onChange) {
      onChange({ values, notes, photos });
    }
  }, [values, notes, photos, storageKey]);

  const updateValue = (id, value) => {
    setValues(prev => ({ ...prev, [id]: value }));
    setValidationError(null);
  };

  const updateNote = (id, noteText) => {
    setNotes(prev => ({ ...prev, [id]: noteText }));
  };

  const toggleNote = (id) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
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
        const storageRef = ref(storage, `tenants/${getCurrentTenant()}/checklists/${Date.now()}_${safeName}`);
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
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhotoId(stepId);
    try {
      const compressedFile = await compressImage(file);
      const safeName = compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `tenants/${getCurrentTenant()}/checklists/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, compressedFile);
      const photoUrl = await getDownloadURL(storageRef);
      updateValue(stepId, photoUrl);
    } catch (err) {
      alert("Błąd podczas wgrywania zdjęcia: " + err.message);
    } finally {
      setUploadingPhotoId(null);
    }
  };

  const getMissingSteps = () => {
    if (!steps || steps.length === 0) return [];
    return steps.filter(step => {
      if (!step.isRequired) return false;
      const val = values[step.id];
      if (step.type === 'CHECKBOX') return val !== true;
      if (step.type === 'VALUE_INPUT') return val === undefined || val === null || val.toString().trim() === '';
      if (step.type === 'PHOTO') return !val || val.length === 0;
      return false;
    });
  };

  const handleSubmit = async (forceProceed = false) => {
    const missing = getMissingSteps();
    if (!forceProceed && missing.length > 0) {
      const names = missing.map(s => s.taskName || s.text || 'Wymagany punkt').join(', ');
      setValidationError(`Uzupełnij wymagane punkty checklisty: ${names}`);
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);
    try {
      if (onComplete) {
        await onComplete({ values, notes, photos });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!steps || steps.length === 0) {
    return (
      <div className="p-2.5 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        Brak przypisanej listy kontrolnej do tego serwisu.
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5 text-[#111827]">
      <div className="space-y-1.5">
        {steps.map((step, index) => {
          const val = values[step.id];
          const stepNote = notes[step.id] || '';
          const stepPhotos = photos[step.id] || [];
          const hasNoteOrPhoto = stepNote.trim().length > 0 || stepPhotos.length > 0;
          const isNoteOpen = expandedNotes[step.id] || hasNoteOrPhoto;

          const isMissing = step.isRequired && (
            (step.type === 'CHECKBOX' && val !== true) ||
            (step.type === 'VALUE_INPUT' && (!val || val.toString().trim() === '')) ||
            (step.type === 'PHOTO' && !val)
          );

          return (
            <div 
              key={step.id} 
              className={`p-2 rounded-lg border transition-colors ${
                val 
                  ? 'border-emerald-300 bg-emerald-50/30' 
                  : (isMissing ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-white hover:border-slate-300')
              }`}
            >
              {/* Linia nagłówkowa zadania */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 border ${
                    val ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}>
                    {val ? '✓' : index + 1}
                  </span>
                  <span className="font-bold text-xs text-slate-800 break-words leading-tight">
                    {step.taskName || step.text || 'Zadanie'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {step.isRequired && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-1 py-0.5 rounded">
                      Wymagane
                    </span>
                  )}
                  {/* Przycisk rozwinięcia notatki */}
                  <button
                    type="button"
                    onClick={() => toggleNote(step.id)}
                    className="text-[11px] text-slate-400 hover:text-blue-600 font-medium flex items-center gap-0.5 p-0.5"
                    title="Dodaj uwagę lub zdjęcie"
                  >
                    <i className="ph ph-chat-text text-sm"></i>
                    {hasNoteOrPhoto && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full inline-block"></span>}
                  </button>
                </div>
              </div>

              {/* Element kontrolny w kroku (kompaktowy) */}
              <div className="mt-1.5 pl-5.5 flex flex-wrap items-center gap-2">
                {step.type === 'CHECKBOX' && (
                  <label className="inline-flex items-center gap-1.5 cursor-pointer py-1 px-2.5 bg-white rounded-md border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs">
                    <input 
                      type="checkbox"
                      className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 cursor-pointer"
                      checked={val === true}
                      onChange={(e) => updateValue(step.id, e.target.checked)}
                    />
                    <span className={`text-[11px] font-bold ${val ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {val ? '✓ Wykonano' : 'Zaznacz wykonanie'}
                    </span>
                  </label>
                )}

                {step.type === 'VALUE_INPUT' && (
                  <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                    <input 
                      type="text"
                      value={val || ''}
                      onChange={(e) => updateValue(step.id, e.target.value)}
                      placeholder="Wprowadź pomiar / wartość..."
                      className="w-full py-1 px-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                )}

                {step.type === 'PHOTO' && (
                  <div className="flex items-center gap-1.5">
                    {val ? (
                      <div className="relative inline-block">
                        <img src={val} alt="Załącznik" className="w-10 h-10 object-cover rounded-md border border-slate-300" />
                        <button 
                          type="button"
                          onClick={() => updateValue(step.id, null)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] shadow"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {uploadingPhotoId === step.id ? (
                          <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                            <i className="ph ph-spinner animate-spin"></i> Wgrywanie...
                          </span>
                        ) : (
                          <>
                            <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-0.5 px-2 rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-2xs">
                              <i className="ph ph-image text-slate-500"></i> Galeria
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handlePrimaryPhotoChange(e, step.id)} 
                              />
                            </label>
                            <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-0.5 px-2 rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-2xs">
                              <i className="ph ph-camera text-slate-500"></i> Aparat
                              <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                className="hidden" 
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

              {/* Rozwinięty blok opcjonalnej notatki i zdjęć */}
              {isNoteOpen && (
                <div className="mt-2 pt-1.5 border-t border-slate-200/70 pl-5.5 space-y-1.5">
                  <div className="relative">
                    <textarea 
                      value={stepNote}
                      onChange={(e) => updateNote(step.id, e.target.value)}
                      placeholder="Wpisz uwagę techniczną do tego punktu..."
                      className="w-full p-1.5 pr-8 border border-slate-300 rounded-md resize-none focus:ring-1 focus:ring-slate-700 outline-none bg-white text-slate-800 text-xs min-h-[40px]"
                      rows="1"
                    ></textarea>
                    <div className="absolute bottom-1 right-1">
                      <DictationButton onResult={(text) => updateNote(step.id, stepNote ? stepNote + ' ' + text : text)} />
                    </div>
                  </div>

                  {stepPhotos.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto py-0.5">
                      {stepPhotos.map((url, i) => (
                        <div key={i} className="relative shrink-0">
                          <img src={url} alt="preview" className="w-10 h-10 object-cover rounded-md border border-slate-300" />
                          <button 
                            type="button" 
                            onClick={() => removeStepPhoto(step.id, i)} 
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] shadow"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-1.5 items-center">
                    <label className="cursor-pointer bg-white hover:bg-slate-50 text-slate-700 py-0.5 px-2 rounded-md text-[11px] font-semibold flex items-center gap-1 border border-slate-300 shadow-2xs">
                      <i className="ph ph-image text-slate-500"></i> Dodaj zdjęcie
                      <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleStepPhotoChange(e, step.id)} />
                    </label>
                    <label className="cursor-pointer bg-white hover:bg-slate-50 text-slate-700 py-0.5 px-2 rounded-md text-[11px] font-semibold flex items-center gap-1 border border-slate-300 shadow-2xs sm:hidden">
                      <i className="ph ph-camera text-slate-500"></i> Aparat
                      <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={(e) => handleStepPhotoChange(e, step.id)} />
                    </label>
                    {uploadProgressId === step.id && (
                      <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                        <i className="ph ph-spinner animate-spin"></i> Wgrywanie...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {validationError && (
        <p className="text-amber-800 bg-amber-50 border border-amber-300 p-2 rounded-xl text-xs font-bold text-center">
          ⚠️ {validationError}
        </p>
      )}

      {/* Przyciski zatwierdzenia checklisty i przejścia do podsumowania */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <><i className="ph ph-spinner animate-spin text-base"></i> Zapisywanie checklisty...</>
          ) : (
            <><i className="ph ph-check-circle text-base"></i> Zatwierdź checklistę i przejdź do Podsumowania</>
          )}
        </button>
        {validationError && (
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs py-2.5 px-3 rounded-xl border border-amber-300 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <i className="ph ph-fast-forward text-base"></i> Pomiń brakujące i przejdź dalej
          </button>
        )}
      </div>
    </div>
  );
}
