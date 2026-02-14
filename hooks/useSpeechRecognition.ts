
import { useState, useRef, useCallback } from 'react';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = (onResult: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const intentionalStopRef = useRef(false);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      intentionalStopRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recognition:", e);
      }
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);
  
  const startListening = useCallback((continuous: boolean = false, wakeWord?: string) => {
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
        stopListening();
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    intentionalStopRef.current = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => {
      if (continuous && !intentionalStopRef.current) {
        try { 
            recognition.start(); 
        } catch (e) { 
            setIsListening(false); 
        }
      } else {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        const trimmedTranscript = finalTranscript.trim();
        
        if (continuous && wakeWord) {
            const wakeWordLower = wakeWord.toLowerCase();
            const transcriptLower = trimmedTranscript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
            
            if (transcriptLower.includes(wakeWordLower)) {
                const index = transcriptLower.indexOf(wakeWordLower);
                const command = trimmedTranscript.slice(index + wakeWord.length).trim();
                
                if (command) {
                    onResult(command);
                    stopListening();
                }
            }
        } else {
            onResult(trimmedTranscript);
            stopListening();
        }
      }
    };
    
    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [onResult, stopListening]);

  return { isListening, startListening, stopListening };
};
