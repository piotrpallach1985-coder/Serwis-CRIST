import React, { useState, useRef } from 'react';
import { useManagerStore } from '../../store/managerStore';
import { doc, setDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { getCurrentTenant } from '../../utils/tenantHelper';

export default function DictationButton({ onResult, onStart, className = '' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const apiKey = useManagerStore(state => state.groqApiKey);

  const startRecording = async (e) => {
    e.preventDefault();
    if (!apiKey) {
      alert("Brak klucza API Groq. Poproś Administratora o dodanie klucza w Panelu SaaS.");
      return;
    }
    
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
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        await processAudio(audioBlob, ext);
      };

      mediaRecorder.start();
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

  const processAudio = async (audioBlob, ext) => {
    setIsProcessing(true);
    try {
      // 1. Transkrypcja (Groq Whisper)
      const formData = new FormData();
      formData.append('file', audioBlob, `audio.${ext}`);
      formData.append('model', 'whisper-large-v3');

      const resTranscribe = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!resTranscribe.ok) {
         const errData = await resTranscribe.json();
         throw new Error(errData.error?.message || "Błąd podczas transkrypcji dźwięku.");
      }

      const transcribeData = await resTranscribe.json();
      const originalText = transcribeData.text;

      if (!originalText || originalText.trim().length === 0) {
        setIsProcessing(false);
        return;
      }

      // 2. Tłumaczenie i Korekta na Polski (Groq Llama 3)
      const resTranslate = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [
            {
              role: 'system',
              content: 'Jesteś asystentem technicznym. Otrzymasz surowy tekst podyktowany przez pracownika stoczni (może być w dowolnym języku, np. ukraińskim, hiszpańskim, angielskim lub polskim). Twoim jedynym zadaniem jest przetłumaczenie go na czysty, poprawny język polski, zachowując techniczny sens i oryginalne słownictwo branżowe. Jeśli tekst jest już po polsku, po prostu sformatuj go poprawnie (dodaj kropki, przecinki, usuń zająknięcia "yyy", "eee", popraw literówki). Zwróć TYLKO wynikowy polski tekst bez żadnych wstępów ani komentarzy.'
            },
            {
              role: 'user',
              content: originalText
            }
          ],
          temperature: 0.1
        })
      });

      if (!resTranslate.ok) {
        const errData = await resTranslate.json().catch(() => ({}));
        throw new Error("Błąd API Groq (tłumaczenie): " + (errData.error?.message || "Status " + resTranslate.status));
      }

      const translateData = await resTranslate.json();
      const translatedText = translateData.choices[0].message.content.trim();

      // Log AI Usage
      const groqTokens = translateData.usage?.total_tokens || 0;
      if (groqTokens > 0) {
        const tenantId = getCurrentTenant();
        if (tenantId) {
          setDoc(doc(db, 'tenants', tenantId, 'stats', 'ai_usage'), {
            groqTokens: increment(groqTokens)
          }, { merge: true }).catch(err => console.error('Token tracking error:', err));
        }
      }

      if (onResult) {
        onResult(translatedText);
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
            : 'bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600'
        } ${className}`}
      title={isRecording ? "Zatrzymaj nagrywanie" : "Podyktuj tekst (AI Whisper + Tłumacz)"}
    >
      {isProcessing ? (
        <i className="ph ph-spinner animate-spin text-lg"></i>
      ) : (
        <i className={`ph ${isRecording ? 'ph-stop' : 'ph-microphone'} text-lg`}></i>
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
