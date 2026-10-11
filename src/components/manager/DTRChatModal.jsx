import React, { useState, useRef, useEffect } from 'react';

import { app, db, functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, increment } from 'firebase/firestore';
import { getCurrentTenant } from '../../utils/tenantHelper';
import DictationButton from '../shared/DictationButton';
import { useManagerStore } from '../../store/managerStore';

export default function DTRChatModal({ isOpen, onClose, document, allDocuments, machineName }) {
  const geminiPrice = useManagerStore(state => state.geminiPrice) || 0.60;
  const geminiModel = useManagerStore(state => state.geminiModel) || 'gemini-2.5-flash';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const isGlobal = !document && allDocuments && allDocuments.length > 0;
  const docsToAnalyze = isGlobal ? allDocuments : (document ? [document] : []);

  useEffect(() => {
    if (isOpen) {
      const storageKey = `dtr_chat_${machineName}_${document ? document.name : 'global'}`;
      const savedMessages = localStorage.getItem(storageKey);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error('Błąd parsowania historii czatu DTR', e);
        }
      } else {
        setMessages([
          { 
            role: 'model', 
            text: isGlobal 
              ? `Cześć! Przeanalizowałem całą dokumentację maszyny **${machineName}** (${docsToAnalyze.length} plików). W czym mogę pomóc?`
              : `Cześć! Przeanalizowałem dokument **${document?.name}**. W czym mogę pomóc?` 
          }
        ]);
      }
      setInput('');
    }
  }, [isOpen, document, allDocuments, machineName, isGlobal]);

  // Zapis do localStorage przy każdej zmianie messages, zachowując max 10 elementów (5 ostatnich pytań/odpowiedzi)
  useEffect(() => {
    if (messages.length > 0 && isOpen) {
      const storageKey = `dtr_chat_${machineName}_${document ? document.name : 'global'}`;
      // Zawsze zostawiamy pierwszą wiadomość powitalną, a z reszty bierzemy max 10 ostatnich
      const welcomeMessage = messages[0];
      const otherMessages = messages.slice(1);
      const messagesToSave = [welcomeMessage, ...otherMessages.slice(-10)];
      
      localStorage.setItem(storageKey, JSON.stringify(messagesToSave));
    }
  }, [messages, machineName, document, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const chatWithDTR = httpsCallable(functions, "chatWithDTR");
      const documentPaths = docsToAnalyze.map(doc => doc.path);
      
      const response = await chatWithDTR({
        messages: [...messages, { role: "user", text: userMessage }],
        documentPaths,
        machineName
      });

      const responseText = response.data.text;
      setMessages(prev => [...prev, { role: "model", text: responseText }]);

      // Log AI Usage
      let geminiTokens = response.data.tokens || 0;
      if (geminiTokens === 0) {
        geminiTokens = (docsToAnalyze.length * 1500) + Math.ceil(userMessage.length / 4) + Math.ceil(responseText.length / 4);
      }
      if (geminiTokens > 0) {
        const tenantId = getCurrentTenant();
        if (tenantId) {
          const logAIUsage = httpsCallable(functions, "logAIUsage");
          logAIUsage({ tenantId, geminiTokens }).catch(err => console.error("Cloud Function token tracking error:", err));
        }
      }
    } catch (error) {
      console.error('Błąd Gemini:', error);
      let errorMsg = 'Wystąpił błąd podczas analizy. Upewnij się, że usługa Vertex AI jest włączona w konsoli Firebase.';
      if (error.message && error.message.includes('API key not valid')) errorMsg = 'Klucz API lub konfiguracja Vertex AI jest nieprawidłowa.';
      setMessages(prev => [...prev, { role: 'model', text: `❌ ${errorMsg} (${error.message})`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col h-[85vh] sm:h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <i className="ph ph-sparkle text-xl"></i>
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Asystent DTR (AI)</h2>
              <p className="text-xs text-slate-300 font-medium">
                {isGlobal ? `Cała dokumentacja maszyny (${docsToAnalyze.length} plików)` : document?.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative group ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : msg.isError
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  {msg.role !== 'user' && !msg.isError && (
                    <button
                      onClick={(e) => {
                        navigator.clipboard.writeText(msg.text);
                        const btn = e.currentTarget;
                        const icon = btn.querySelector('i');
                        icon.className = 'ph ph-check text-sm text-green-500';
                        setTimeout(() => {
                          icon.className = 'ph ph-copy text-sm';
                        }, 2000);
                      }}
                      className="absolute -bottom-2 -right-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                      title="Kopiuj odpowiedź"
                    >
                      <i className="ph ph-copy text-sm"></i>
                    </button>
                  )}
                </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm flex items-center gap-2">
                <i className="ph ph-spinner animate-spin text-blue-500 text-lg"></i>
                <span className="text-slate-500 font-medium">Analizuję dokumentację...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <DictationButton 
              onResult={(text) => setInput(prev => prev ? prev + ' ' + text : text)}
              className="!w-10 !h-10 shrink-0"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Zapytaj o parametry, schematy, błędy..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors shrink-0"
            >
              <i className="ph ph-paper-plane-tilt text-lg"></i>
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
              <i className="ph ph-shield-check"></i> Vertex AI przetwarza pliki wewnątrz Google Cloud. <strong>Odpowiedzi generuje AI - weryfikuj z oryginałem.</strong>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
