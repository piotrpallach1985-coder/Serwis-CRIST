import React from 'react';

export default function LoadingState({ message = "Wczytywanie danych..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 w-full text-center">
      <i className="ph ph-circle-notch animate-spin text-blue-500 text-4xl mb-4"></i>
      <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>
    </div>
  );
}
