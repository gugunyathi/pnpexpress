import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Volume2, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Globe, 
  MessageSquare, 
  Loader2,
  Send,
  Zap,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { VoiceAIResult } from '../types';

interface VoiceAIAssistantProps {
  onClose: () => void;
  onVoiceSuccess: () => void;
  isFullPage?: boolean;
}

const PRESET_VOICE_CLIPS = [
  {
    lang: 'Shona (chiShona)',
    prompt: 'Ndinoda hupfu hweSona ne mafuta ekubikisa',
    description: 'Add Maize Meal & Cooking Oil'
  },
  {
    lang: 'Ndebele (siNdebele)',
    prompt: 'Ngicela u-upfu le-bisi lonyama',
    description: 'Add Maize Meal, Milk & Meat'
  },
  {
    lang: 'English / Diaspora',
    prompt: 'Please add 2kg Sunfoil oil, Huletts sugar, and a solar light for Gogo in Harare',
    description: 'Add Oil, Sugar & Solar Charger'
  },
  {
    lang: 'Code-Switched Shona/Eng',
    prompt: 'Ndinoda 2L Mazoe orange crush ne Geisha soap bar',
    description: 'Add Mazoe Drink & Laundry Soap'
  }
];

export const VoiceAIAssistant: React.FC<VoiceAIAssistantProps> = ({
  onClose,
  onVoiceSuccess,
  isFullPage = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [manualText, setManualText] = useState('');
  const [aiResult, setAiResult] = useState<VoiceAIResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState(isFullPage);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Browser SpeechSynthesis function
  const speakNativeConfirmation = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  // Start Mic Recording
  const startRecording = async () => {
    try {
      setErrorMsg(null);
      setAiResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setErrorMsg('Microphone access denied or unavailable. You can use preset phrases or type below.');
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Process audio clip via server `/api/voice-ai`
  const handleAudioUpload = async (audioBlob: Blob) => {
    setProcessing(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'grocery-voice.webm');

      const res = await fetch('/api/voice-ai', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.result) {
        setAiResult(data.result);
        speakNativeConfirmation(data.result.spokenResponse);
        onVoiceSuccess();
      } else {
        throw new Error(data.error || 'Failed to parse voice request');
      }
    } catch (err: any) {
      console.error('Voice AI API error:', err);
      setErrorMsg('Failed to process voice audio. Try typing or selecting a preset phrase.');
    } finally {
      setProcessing(false);
    }
  };

  // Submit Text prompt
  const handleTextSubmit = async (promptText: string) => {
    if (!promptText.trim()) return;
    setProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/voice-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textPrompt: promptText })
      });

      const data = await res.json();
      if (data.success && data.result) {
        setAiResult(data.result);
        speakNativeConfirmation(data.result.spokenResponse);
        onVoiceSuccess();
      } else {
        throw new Error(data.error || 'Failed to process request');
      }
    } catch (err: any) {
      console.error('Voice AI Text error:', err);
      setErrorMsg('Failed to process text request.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white sm:bg-black/75 backdrop-blur-xs flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div 
        className={`bg-white w-full h-full flex flex-col relative overflow-hidden transition-all duration-200 shadow-2xl ${
          fullScreen 
            ? 'sm:max-w-4xl sm:h-[95vh] sm:rounded-2xl border-0 sm:border sm:border-stone-200' 
            : 'sm:max-w-xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl border-0 sm:border sm:border-stone-200'
        }`}
      >
        {/* Header - Fixed Flex Top */}
        <div className="bg-[#1a115e] text-white p-3.5 sm:p-4 flex-shrink-0 flex items-center justify-between border-b border-[#2a1d82]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1.5 text-stone-200 hover:text-white rounded-lg hover:bg-[#241a7d] sm:hidden"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="bg-[#ffb81c] text-[#1a115e] p-2 rounded-xl flex-shrink-0 font-extrabold">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-stone-100 text-sm sm:text-base font-sans leading-tight">
                  Multilingual African Voice AI
                </h3>
                <span className="bg-[#298bf5] text-white text-[10px] px-1.5 py-0.5 rounded font-mono hidden sm:inline-block">
                  Gemini 3.6
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90 line-clamp-1">
                Shona, Ndebele, Zulu, Xhosa & English Order Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFullScreen(!fullScreen)}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-[#241a7d] hidden sm:flex items-center gap-1 text-xs"
              title={fullScreen ? 'Standard View' : 'Expand View'}
            >
              {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-[#241a7d] hidden sm:block"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 bg-stone-50/50">
          {/* Recording / Processing Hero Display */}
          <div className="bg-gradient-to-b from-[#100a3d] to-[#1a115e] text-white p-5 sm:p-6 rounded-2xl text-center space-y-3.5 border border-[#2a1d82] relative overflow-hidden shadow-inner">
            {/* Ambient Waveform */}
            <div className="flex items-center justify-center gap-1 h-10 sm:h-12">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 bg-[#298bf5] rounded-full transition-all duration-300 ${
                    isRecording
                      ? 'animate-pulse'
                      : 'h-2'
                  }`}
                  style={{
                    height: isRecording ? `${Math.floor(Math.random() * 30 + 8)}px` : '8px',
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>

            <div>
              <span className="text-xs sm:text-sm text-blue-100 font-semibold block px-2 leading-snug">
                {isRecording
                  ? `Recording Audio... (${recordingTime}s)`
                  : processing
                  ? 'Processing via Gemini Multilingual Engine...'
                  : 'Tap microphone and speak your grocery order in any African dialect'}
              </span>
            </div>

            {/* Mic Button */}
            <div className="flex items-center justify-center gap-3 pt-1">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={processing}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#298bf5] to-[#60a5fa] text-white font-bold flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  aria-label="Start Voice Recording"
                >
                  <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#ff4f38] text-white font-bold flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all animate-bounce"
                  aria-label="Stop Voice Recording"
                >
                  <Square className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* AI Parsed Result Box */}
          {aiResult && (
            <div className="bg-emerald-50 rounded-xl p-3.5 sm:p-4 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Detected: {aiResult.detectedLanguage}</span>
                </div>
                <button
                  onClick={() => speakNativeConfirmation(aiResult.spokenResponse)}
                  className="flex items-center gap-1 text-[11px] bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-emerald-800"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audio Playback</span>
                </button>
              </div>

              {/* Native Confirmation Speech */}
              <div className="bg-white p-3 rounded-lg border border-emerald-300 font-serif text-xs sm:text-sm font-bold text-[#1b4332] italic">
                "{aiResult.spokenResponse}"
              </div>

              {/* Extracted Items */}
              <div className="text-xs text-stone-700 space-y-1">
                <span className="font-bold text-stone-900">Extracted & Synced to Cart:</span>
                <ul className="list-disc list-inside space-y-0.5 text-emerald-800 font-semibold">
                  {aiResult.items.map((it, idx) => (
                    <li key={idx}>
                      {it.qty}x {it.productName}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Preset Voice Phrases for Quick Demonstration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 px-0.5">
              <span>Try a sample African voice phrase:</span>
              <span className="text-[10px] text-stone-400 font-normal">1-Tap Demo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_VOICE_CLIPS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setManualText(preset.prompt);
                    handleTextSubmit(preset.prompt);
                  }}
                  disabled={processing}
                  className="p-3 bg-white hover:bg-blue-50/80 text-left rounded-xl border border-stone-200 hover:border-[#298bf5]/40 transition-all text-xs space-y-1 shadow-2xs active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1a115e] text-[11px]">{preset.lang}</span>
                    <Zap className="w-3.5 h-3.5 text-[#ffb81c] flex-shrink-0" />
                  </div>
                  <p className="font-semibold text-stone-800 text-[11px] leading-snug">
                    "{preset.prompt}"
                  </p>
                  <p className="text-[10px] text-stone-500 font-medium">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Prompt Input - Bottom Sticky */}
        <div className="bg-white p-3 sm:p-4 border-t border-stone-200 flex-shrink-0 flex items-center gap-2 shadow-lg">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit(manualText)}
            placeholder="Type in Shona, Ndebele, Zulu, English..."
            className="flex-1 px-3.5 py-2.5 bg-stone-50 text-stone-900 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#298bf5]"
          />
          <button
            onClick={() => handleTextSubmit(manualText)}
            disabled={processing || !manualText.trim()}
            className="bg-[#1a115e] hover:bg-[#241a7d] text-[#ffb81c] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 flex-shrink-0 active:scale-95 transition-all"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

