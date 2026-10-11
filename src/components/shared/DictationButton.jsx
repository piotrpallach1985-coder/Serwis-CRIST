import React, { useState, useRef } from 'react';
import { useManagerStore } from '../../store/managerStore';
import { functions, app } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { useTranslation } from 'react-i18next';


export default function DictationButton({ onResult, onStart, className = '', mode = 'text' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  const { i18n } = useTranslation();
  const transcribeModel = useManagerStore(state => state.transcribeModel);
  const geminiModel = useManagerStore(state => state.geminiModel) || 'gemini-3.8-flash';
  const modelName = transcribeModel || "whisper-large-v3";

  const startRecording = async (e) => {
    e.preventDefault();
    // apiKey verification removed - it is now securely handled on the backend
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          if (audioBlob.size < 100) { alert('Nagranie jest zbyt krotkie lub mikrofon nie nagrywa.'); return; }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        const durationSeconds = Math.max(1, Math.ceil((Date.now() - recordingStartTimeRef.current) / 1000));
        await processAudio(audioBlob, ext, durationSeconds, mimeType);
      };

      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
      if (onStart) onStart();
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.");
    }
  };

  const stopRecording = (e) => {
    e.preventDefault();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob, ext, durationSeconds = 1, mimeType = 'audio/webm') => {
    setIsProcessing(true);
    try {
      // 1. Transkrypcja (Groq Whisper via Cloud Function)
      const base64Audio = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const b64 = reader.result.split(',')[1];
          resolve(b64);
        };
        reader.onerror = reject;
      });

      const transcribeFn = httpsCallable(functions, 'transcribeAudio');
      const resTranscribe = await transcribeFn({
          mimeType: mimeType,
          ext: ext,
        audioBase64: base64Audio,
        model: modelName,
        durationSeconds: durationSeconds,
        tenantId: getCurrentTenant()
      });

      const originalText = resTranscribe.data.text;

      if (!originalText || originalText.trim().length === 0) {
        setIsProcessing(false);
        return;
      }

      // 2. Przetwarzanie (Cloud Function - Gemini)
      let finalResult = originalText;
      try {
        const processFn = httpsCallable(functions, "processDictationText");
        const lang = i18n.language === "en" ? "angielski" : "polski";
        const processRes = await processFn({
          rawText: originalText,
          mode: mode,
          lang: lang,
          tenantId: getCurrentTenant()
        });
        if (processRes && processRes.data && processRes.data.result) {
          finalResult = processRes.data.result;
        }
      } catch (geminiErr) {
        console.warn("Cloud formatting error, using raw transcription:", geminiErr);
        // Bezpieczny fallback - jeśli chmura Gemini ma opóźnienie/błąd, wstawiamy surowy tekst z Whisper!
        finalResult = originalText;
      }

      if (onResult) {
        onResult(finalResult);
      }
    } catch (err) {
      console.error("AI processing error:", err);
      alert("Błąd AI: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className={`relative flex items-center justify-center p-2 rounded-full transition-all shrink-0 z-10
        ${isRecording 
          ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/50' 
          : isProcessing 
            ? 'bg-amber-400 text-white cursor-wait' 
            : mode === 'smart' 
              ? 'bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 shadow-sm'
              : 'bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600'
        } ${className}`}
      title={isRecording ? "Zatrzymaj nagrywanie" : mode === 'smart' ? "Inteligentne Dyktowanie (Wypełnij automatycznie formularz)" : "Podyktuj tekst (AI Whisper)"}
    >
      {isProcessing ? (
        <i className="ph ph-spinner animate-spin text-lg"></i>
      ) : (
        <i className={`ph ${isRecording ? 'ph-stop' : mode === 'smart' ? 'ph-magic-wand' : 'ph-microphone'} text-lg`}></i>
      )}
      
      {isRecording && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
    </button>
  );
}



