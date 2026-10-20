import React, { useRef, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const safeGet2dContext = canvas => {
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  try {
    return canvas.getContext('2d');
  } catch {
    return null;
  }
};

/**
 * SignaturePad — uniwersalny komponent podpisu cyfrowego palcem na ekranie telefonu lub myszką.
 * Zwraca przez `onChange` obiekt `{ signatureDataUrl, signerName, signedAt }`.
 */
export default function SignaturePad({
  value = null,
  signerName = '',
  onSignerNameChange,
  onChange,
  disabled = false,
  label = 'Podpis potwierdzający odbiór prac (Klient / Odbierający)',
}) {
  const canvasRef = useRef(null);
  const lastDataUrlRef = useRef(value || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));

  useEffect(() => {
    if (value !== undefined && value !== null) {
      lastDataUrlRef.current = value;
      setHasSignature(Boolean(value));
    }
  }, [value]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = safeGet2dContext(canvas);
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const getCoordinates = e => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      x: ((e.clientX ?? 0) - rect.left) * scaleX,
      y: ((e.clientY ?? 0) - rect.top) * scaleY,
    };
  };

  const emitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dataUrl = '';
    try {
      dataUrl = canvas.toDataURL ? canvas.toDataURL('image/png') : '';
    } catch {
      dataUrl = '';
    }
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
    lastDataUrlRef.current = dataUrl;
    setHasSignature(true);
    if (onChange) {
      onChange({
        signatureDataUrl: dataUrl,
        signerName: signerName || '',
        signedAt: new Date().toISOString(),
      });
    }
  };

  const startDrawing = e => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = safeGet2dContext(canvas);
    const { x, y } = getCoordinates(e);
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    setIsDrawing(true);
  };

  const draw = e => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    const ctx = safeGet2dContext(canvas);
    const { x, y } = getCoordinates(e);
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    emitSignature();
  };

  const handleClear = () => {
    initCanvas();
    lastDataUrlRef.current = '';
    setHasSignature(false);
    if (onChange) {
      onChange({
        signatureDataUrl: '',
        signerName: signerName || '',
        signedAt: null,
      });
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <i className="ph ph-signature text-base text-blue-600"></i>
          <span>{label}</span>
        </label>
        {hasSignature && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            data-testid="signature-clear-btn"
            className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
          >
            <i className="ph ph-eraser"></i> Wyczyść podpis
          </button>
        )}
      </div>

      <div>
        <input
          type="text"
          disabled={disabled}
          value={signerName}
          onChange={e => {
            const nextName = e.target.value;
            if (onSignerNameChange) onSignerNameChange(nextName);
            if (onChange && hasSignature) {
              onChange({
                signatureDataUrl: lastDataUrlRef.current || value || '',
                signerName: nextName,
                signedAt: new Date().toISOString(),
              });
            }
          }}
          placeholder="Imię i nazwisko osoby podpisującej (np. Jan Kowalski - Klient / Mistrz)"
          data-testid="signature-signer-input"
          className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
        />
      </div>

      <div className="relative rounded-lg border-2 border-dashed border-slate-300 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={480}
          height={140}
          data-testid="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-[110px] block touch-none ${
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'
          }`}
        />
        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400 italic select-none">
            Złóż podpis palcem lub myszką tutaj...
          </div>
        )}
      </div>

      {hasSignature && (
        <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
          <i className="ph ph-check-circle"></i> Podpis cyfrowy zostanie dołączony do protokołu PDF.
        </div>
      )}
    </div>
  );
}

SignaturePad.propTypes = {
  value: PropTypes.string,
  signerName: PropTypes.string,
  onSignerNameChange: PropTypes.func,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  label: PropTypes.string,
};
