import React, { useState, useEffect } from 'react';

export default function ChecklistExecutor({ steps, onComplete, initialResponses = {} }) {
  const [responses, setResponses] = useState(initialResponses);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);

  const updateResponse = (id, value) => {
    setResponses(prev => ({ ...prev, [id]: value }));
  };

  // Zmockowana funkcja do uploadu zdjęcia do Firebase Storage
  const mockUploadPhoto = async (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Zwracamy zmockowany URL zdjęcia (w prawdziwym kodzie będzie to url z getDownloadURL)
        resolve(URL.createObjectURL(file));
      }, 1500);
    });
  };

  const handlePhotoChange = async (e, stepId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhotoId(stepId);
    try {
      // TU PODPIĄĆ PRAWDZIWY UPLOAD DO FIREBASE STORAGE
      // np. const storageRef = ref(storage, `checklists/\${Date.now()}_\${file.name}`);
      // await uploadBytes(storageRef, file);
      // const url = await getDownloadURL(storageRef);
      
      const photoUrl = await mockUploadPhoto(file);
      updateResponse(stepId, photoUrl);
    } catch (err) {
      alert("Błąd podczas wgrywania zdjęcia: " + err.message);
    } finally {
      setUploadingPhotoId(null);
    }
  };

  // Walidacja - czy wszystkie wymagane pola są wypełnione
  const isFormValid = () => {
    if (!steps || steps.length === 0) return true;
    
    return steps.every(step => {
      if (!step.isRequired) return true;
      const val = responses[step.id];
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
      await onComplete(responses);
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
          const val = responses[step.id];
          const isMissing = step.isRequired && (
            (step.type === 'CHECKBOX' && val !== true) ||
            (step.type === 'VALUE_INPUT' && (!val || val.toString().trim() === '')) ||
            (step.type === 'PHOTO' && !val)
          );

          return (
            <div 
              key={step.id} 
              className={`p-5 rounded-2xl border-2 transition-colors \${isMissing ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
            >
              <div className="flex flex-col gap-3">
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
                    <label className="flex items-center gap-4 cursor-pointer p-2 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                      <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-300 bg-white">
                        <input 
                          type="checkbox"
                          className="opacity-0 absolute w-full h-full cursor-pointer"
                          checked={val === true}
                          onChange={(e) => updateResponse(step.id, e.target.checked)}
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
                      onChange={(e) => updateResponse(step.id, e.target.value)}
                      placeholder="Wprowadź wartość..."
                      className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                    />
                  )}

                  {step.type === 'PHOTO' && (
                    <div className="flex flex-col gap-3">
                      {val ? (
                        <div className="relative">
                          <img src={val} alt="Załącznik" className="w-full h-48 object-cover rounded-xl border-2 border-gray-200" />
                          <button 
                            onClick={() => updateResponse(step.id, null)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"
                          >
                            <i className="ph ph-x text-lg"></i>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                          {uploadingPhotoId === step.id ? (
                            <div className="flex flex-col items-center gap-2 text-blue-600">
                              <i className="ph ph-spinner-gap animate-spin text-3xl"></i>
                              <span className="font-semibold text-sm">Wgrywanie...</span>
                            </div>
                          ) : (
                            <>
                              <i className="ph ph-camera text-4xl text-gray-400 mb-2"></i>
                              <span className="font-semibold text-gray-600">Zrób zdjęcie / Wgraj plik</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoChange(e, step.id)}
                              />
                            </>
                          )}
                        </label>
                      )}
                    </div>
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
        className="w-full bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white font-bold text-lg py-5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
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
