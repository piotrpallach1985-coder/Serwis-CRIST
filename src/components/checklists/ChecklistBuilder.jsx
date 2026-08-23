import React, { useState } from 'react';

const STEP_TYPES = [
  { value: 'CHECKBOX', label: 'Zwykłe odhaczenie' },
  { value: 'VALUE_INPUT', label: 'Wpisanie wartości' },
  { value: 'PHOTO', label: 'Wymagane zdjęcie' }
];

export default function ChecklistBuilder({ steps, onChange }) {
  const addStep = () => {
    const newStep = {
      id: Math.random().toString(36).substr(2, 9),
      taskName: '',
      type: 'CHECKBOX',
      isRequired: true
    };
    onChange([...steps, newStep]);
  };

  const updateStep = (id, field, value) => {
    onChange(steps.map(step => step.id === id ? { ...step, [field]: value } : step));
  };

  const removeStep = (id) => {
    onChange(steps.filter(step => step.id !== id));
  };

  const moveStep = (index, direction) => {
    if (index + direction < 0 || index + direction >= steps.length) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + direction];
    newSteps[index + direction] = temp;
    onChange(newSteps);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg">Lista Kontrolna (Checklista)</h3>
        <button type="button" 
          onClick={(e) => { e.preventDefault(); addStep(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <i className="ph ph-plus"></i> Dodaj krok
        </button>
      </div>

      {steps.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          Brak kroków. Dodaj pierwszy krok listy kontrolnej.
        </p>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              
              {/* Kolejność */}
              <div className="flex flex-row sm:flex-col gap-1 items-center">
                <button type="button" 
                  onClick={(e) => { e.preventDefault(); moveStep(index, -1); }}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                >
                  <i className="ph ph-caret-up text-lg"></i>
                </button>
                <button type="button" 
                  onClick={(e) => { e.preventDefault(); moveStep(index, 1); }}
                  disabled={index === steps.length - 1}
                  className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                >
                  <i className="ph ph-caret-down text-lg"></i>
                </button>
              </div>

              {/* Zawartość */}
              <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Treść zadania</label>
                  <input 
                    type="text" 
                    value={step.taskName} 
                    onChange={(e) => updateStep(step.id, 'taskName', e.target.value)}
                    placeholder="Naciśnij, aby wpisać..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="w-full sm:w-48 shrink-0">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Typ odpowiedzi</label>
                  <select 
                    value={step.type}
                    onChange={(e) => updateStep(step.id, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {STEP_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-20 shrink-0 flex flex-col justify-center items-center">
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Wymagane</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={step.isRequired}
                      onChange={(e) => updateStep(step.id, 'isRequired', e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Akcje */}
              <button type="button" 
                onClick={(e) => { e.preventDefault(); removeStep(step.id); }}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-auto sm:ml-0"
                title="Usuń krok"
              >
                <i className="ph ph-trash text-lg"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
