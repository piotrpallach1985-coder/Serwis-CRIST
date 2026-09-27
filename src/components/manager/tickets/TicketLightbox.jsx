import React from 'react';

export default function TicketLightbox({ lightboxImg, setLightboxImg }) {
  if (!lightboxImg) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
      onClick={() => setLightboxImg(null)}
    >
      <img 
        src={lightboxImg} 
        alt="Powiększenie" 
        className="max-w-full max-h-full object-contain cursor-zoom-out"
      />
      <button 
        className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold p-2"
        onClick={() => setLightboxImg(null)}
      >
        &times;
      </button>
    </div>
  );
}
