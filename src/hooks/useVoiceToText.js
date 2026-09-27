import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoiceToText() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize once
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false; // We only want final results for simpler logic
        recognitionRef.current.lang = 'pl-PL'; // Default to Polish

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          // Don't override 'no-speech' or 'aborted' with heavy errors, just stop.
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
             setError(event.error);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        setError('not-supported');
      }
    }
  }, []);

  const startListening = useCallback((onResultCallback) => {
    if (!recognitionRef.current) {
      setError('not-supported');
      return;
    }

    if (isListening) {
      stopListening();
      return; // Toggle behavior
    }

    // Set a new callback for this session
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResultCallback) {
        onResultCallback(transcript);
      }
    };

    try {
      recognitionRef.current.start();
    } catch (e) {
      // In case it's already started
      console.warn("Could not start recognition:", e);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    startListening,
    stopListening,
    error,
    isSupported: !!recognitionRef.current || (typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition))
  };
}
