import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, AlertCircle, Loader2 } from 'lucide-react';
import { SpeechRecognition, AudioRecorder } from '../services/speech';

const VoiceRecorder = ({ onTranscriptionComplete, onAudioRecorded, language = 'en', disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [micError, setMicError] = useState(null);

  const recorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (event) => {
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const finalTranscript = event.results[i][0].transcript;
              setInterimText('');
              if (onTranscriptionComplete) {
                onTranscriptionComplete(finalTranscript);
              }
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          if (currentInterim) {
            setInterimText(currentInterim);
          }
        };

        recognition.onerror = (e) => {
          console.warn('SpeechRecognition error:', e);
          if (e.error === 'not-allowed') {
            setMicError('Microphone permission was denied. Please allow microphone access in your browser settings.');
          }
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.error('Speech recognition init error:', err);
      }
    }

    return () => {
      stopRecording();
    };
  }, [language]);

  const startRecording = async () => {
    setMicError(null);
    setInterimText('');
    setTimerSeconds(0);

    try {
      // 1. Start audio stream recorder
      const audioRec = new AudioRecorder();
      await audioRec.start();
      recorderRef.current = audioRec;
      setIsRecording(true);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);

      // 2. Start speech recognition for live visual feedback
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
          recognitionRef.current.start();
        } catch (e) {
          // May already be running
        }
      }
    } catch (err) {
      console.error('Start recording error:', err);
      setMicError('Could not access microphone. Please verify browser permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (recorderRef.current) {
      try {
        const { blob, mimeType } = await recorderRef.current.stop();
        if (onAudioRecorded) {
          onAudioRecorded(blob, mimeType, interimText);
        }
      } catch (e) {
        console.error('Error stopping audio recorder:', e);
      }
      recorderRef.current = null;
    }
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex flex-col items-center">
      
      {/* Live recording status or error banner */}
      {micError && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max max-w-sm px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {isRecording && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-max px-4 py-1.5 rounded-full bg-navy-900 text-white text-xs font-semibold flex items-center gap-3 shadow-lg border border-navy-700">
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          <div className="flex items-center gap-1 h-3">
            <span className="w-1 bg-amber-400 rounded-full wave-bar-1"></span>
            <span className="w-1 bg-amber-400 rounded-full wave-bar-2"></span>
            <span className="w-1 bg-amber-400 rounded-full wave-bar-3"></span>
            <span className="w-1 bg-amber-400 rounded-full wave-bar-4"></span>
            <span className="w-1 bg-amber-400 rounded-full wave-bar-5"></span>
          </div>

          <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">Wispr Flow</span>
            <span>{language === 'hi' ? 'बोलिए (ऑटो-एडिटिंग ऑन)...' : 'Listening & auto-formatting speech...'}</span>
          </span>
        </div>
      )}

      {/* Main Mic Button */}
      <div className="relative group">
        <button
          type="button"
          disabled={disabled}
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative flex items-center justify-center rounded-full transition shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isRecording
              ? 'w-12 h-12 bg-rose-600 text-white ring-4 ring-rose-300 animate-voice-pulse hover:bg-rose-700'
              : 'w-11 h-11 bg-navy-900 hover:bg-navy-800 text-amber-400 hover:text-amber-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={isRecording ? "Stop Recording" : "Speak naturally via Wispr Flow (Hindi / English / Hinglish)"}
        >
          {isRecording ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Wispr Flow small pill indicator */}
        {!isRecording && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-navy-800 text-amber-400 text-[8px] font-bold rounded-full tracking-wider border border-navy-700/80 shadow-xs uppercase">
            FLOW
          </span>
        )}
      </div>

      {/* Interim live text caption */}
      {isRecording && interimText && (
        <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max max-w-md text-xs text-slate-500 italic truncate">
          "{interimText}"
        </p>
      )}

    </div>
  );
};

export default VoiceRecorder;

