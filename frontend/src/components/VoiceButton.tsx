import { useState, useRef, useEffect } from 'react';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  compact?: boolean;
}

type RecordState = 'idle' | 'recording' | 'processing';

export default function VoiceButton({ onTranscript, compact }: VoiceButtonProps) {
  const [state, setState] = useState<RecordState>('idle');
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (e: any) => {
      const text = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('');
      setTranscript(text);
    };
    rec.onend = () => {
      setState(prev => {
        if (prev === 'recording') {
          setState('processing');
          setTimeout(() => {
            setState('idle');
          }, 1200);
        }
        return prev;
      });
    };
    recognitionRef.current = rec;
  }, []);

  const handlePress = () => {
    if (state === 'recording') {
      recognitionRef.current?.stop();
      setState('processing');
      setTimeout(() => {
        if (transcript) onTranscript(transcript);
        setState('idle');
        setTranscript('');
      }, 800);
      return;
    }
    if (state === 'idle') {
      setTranscript('');
      setState('recording');
      recognitionRef.current?.start();
    }
  };

  const label = {
    idle: 'Tap & Speak',
    recording: 'Listening… tap to stop',
    processing: 'Thinking…',
  }[state];

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-3xl opacity-50">🎙</div>
        <p className="text-xs text-slate-400 text-center">Voice not supported<br />in this browser</p>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={handlePress}
        disabled={state === 'processing'}
        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
          state === 'recording'
            ? 'bg-red-500 text-white'
            : state === 'processing'
            ? 'bg-indigo-400 text-white cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        aria-label={label}
      >
        {state === 'recording' && (
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        )}
        <span>{state === 'processing' ? '⏳' : '🎙'}</span>
        <span>{state === 'recording' ? 'Stop' : state === 'processing' ? 'Thinking…' : 'Voice Add'}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handlePress}
        disabled={state === 'processing'}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
          state === 'recording'
            ? 'bg-red-500 scale-110 shadow-red-300 shadow-xl'
            : state === 'processing'
            ? 'bg-indigo-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95'
        }`}
        aria-label={label}
      >
        {state === 'recording' && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
        )}
        <span className="relative z-10">
          {state === 'processing' ? '⏳' : '🎙'}
        </span>
      </button>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {transcript && (
        <p className="text-xs text-indigo-600 italic text-center max-w-36 leading-tight">"{transcript}"</p>
      )}
    </div>
  );
}
