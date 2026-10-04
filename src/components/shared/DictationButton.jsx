import React, { useState, useRef } from 'react';
import { useManagerStore } from '../../store/managerStore';
import { functions, app } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { getCurrentTenant } from '../../utils/tenantHelper';
import { useTranslation } from 'react-i18next';
import { getVertexAI, getGenerativeModel } from '@firebase/vertexai-preview';

export default function DictationButton({ onResult, onStart, className = '', mode = 'text' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  const { i18n } = useTranslation();
  const groqModel = useManagerStore(state => state.groqModel);
  const geminiModel = useManagerStore(state => state.geminiModel) || 'gemini-2.5-flash';
  const modelName = groqModel || 'whisper-large-v3';

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
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        const durationSeconds = Math.max(1, Math.ceil((Date.now() - recordingStartTimeRef.current) / 1000));
        await processAudio(audioBlob, ext, durationSeconds);
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

  const processAudio = async (audioBlob, ext, durationSeconds = 1) => {
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

      // 2. Przetwarzanie (Google Gemini - Vertex AI)
      let finalResult = originalText;

      try {
        const vertexAI = getVertexAI(app);
        
        if (mode === 'smart') {
          const model = getGenerativeModel(vertexAI, { 
            model: geminiModel,
            systemInstruction: 'Jesteś ekspertem utrzymania ruchu. Otrzymasz surowy tekst (z dyktowania).',
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: 'object',
                properties: {
                  note: { type: 'string', description: "profesjonalna notatka o zrobionej pracy, bez wspominania o czasie i zadaniach" },
                  timeSpentHours: { type: 'number', nullable: true },
                  actionItem: { type: 'string', nullable: true },
                  actionItemDays: { type: 'number', nullable: true }
                },
                required: ["note"]
              }
            }
          });

          const result = await model.generateContent(originalText);
          const responseText = result.response.text();
          
          try {
            finalResult = JSON.parse(responseText);
          } catch (e) {
            throw new Error('Niepoprawny format danych JSON od Gemini');
          }

          let geminiTokens = result.response.usageMetadata?.totalTokenCount || 0;
          if (geminiTokens === 0) {
            const inputLen = originalText.length + 300;
            const outputLen = responseText.length;
            geminiTokens = Math.ceil((inputLen + outputLen) / 4);
          }
          if (geminiTokens > 0) {
            const logFn = httpsCallable(functions, 'logAIUsage');
            logFn({ geminiTokens, tenantId: getCurrentTenant() }).catch(e => console.error("Billing log error:", e));
          }

        } else {
          const lang = i18n.language === 'en' ? 'angielski' : 'polski';
          const model = getGenerativeModel(vertexAI, { 
            model: geminiModel,
            systemInstruction: `Jesteś asystentem technicznym. Interfejs systemu jest w języku: ${lang.toUpperCase()}. Otrzymasz surowy tekst podyktowany przez pracownika stoczni. 
1. Jeśli oryginalny podyktowany tekst jest w języku ${lang} (albo bardzo do niego zbliżonym), po prostu sformatuj go poprawnie (dodaj interpunkcję) i zwróć TYLKO sam sformatowany tekst (bez dopisków o tłumaczeniu).
2. Jeśli oryginalny tekst jest w INNYM języku, przetłumacz go na język ${lang}. Wtedy (i tylko wtedy) zwróć wynik DOKŁADNIE w tym formacie:
[Oryginalny podyktowany tekst]

---
Tłumaczenie (${lang}):
[Przetłumaczony tekst]`
          });

          const result = await model.generateContent(originalText);
          finalResult = result.response.text().trim();

          let geminiTokens = result.response.usageMetadata?.totalTokenCount || 0;
          if (geminiTokens === 0) {
            const inputLen = originalText.length + 500;
            const outputLen = finalResult.length;
            geminiTokens = Math.ceil((inputLen + outputLen) / 4);
          }
          if (geminiTokens > 0) {
            const logFn = httpsCallable(functions, 'logAIUsage');
            logFn({ geminiTokens, tenantId: getCurrentTenant() }).catch(e => console.error("Billing log error:", e));
          }
        }
      } catch (geminiErr) {
        console.error("Gemini processing error:", geminiErr);
        throw new Error("Błąd AI Gemini: " + geminiErr.message);
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
