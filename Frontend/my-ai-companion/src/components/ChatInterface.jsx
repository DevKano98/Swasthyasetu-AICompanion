import { useState, useRef } from 'react';
import { startSession, endSession, talk } from '../services/api';
import { browserTTS } from '../utils/browserTTS';

export default function VoiceCompanion({ userId }) {
  const [sessionActive, setSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  // 🎙 Setup speech recognition loop
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // change to 'hi-IN' for Hindi
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false; // we manually restart after AI speaks

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('User said:', transcript);

      try {
        const response = await talk({ message: transcript }, { tts: true });

        if (response.data.tts?.base64) {
          // During playback, DO NOT listen to avoid echo
          playAudioFromBase64(response.data.tts.base64, () => startListening());
        } else {
          // Improved warm female browser TTS fallback; await completion, then resume listening
          await browserTTS(response.data.aiResponse);
          startListening();
        }
      } catch (error) {
        console.error('Error talking to AI:', error);
        startListening();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // 🔊 Play audio from backend TTS
  const playAudioFromBase64 = (base64Audio, onEnd) => {
    const audioData = `data:audio/mp3;base64,${base64Audio}`;
    const audio = new Audio(audioData);

    setIsSpeaking(true);
    audio.play()
      .catch(err => console.error('Audio play error:', err))
      .finally(() => {
        audio.onended = () => {
          setIsSpeaking(false);
          if (onEnd) onEnd();
        };
      });
  };

  // Browser TTS handled by browserTTS utility

  // ▶ Start Session
  const handleStart = async () => {
    await startSession(userId);
    setSessionActive(true);
    startListening();
  };

  // ⏹ End Session
  const handleEnd = async () => {
    await endSession(userId);
    stopListening();
    setSessionActive(false);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Voice Companion</h3>

      {!sessionActive ? (
        <button
          onClick={handleStart}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Start Session
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {(isListening || isSpeaking) && (
            <div className="flex gap-2 mb-1">
              <div className="ball w-3 h-3 bg-blue-600 rounded-full"></div>
              <div className="ball w-3 h-3 bg-blue-600 rounded-full" style={{ animationDelay: '0.2s' }}></div>
              <div className="ball w-3 h-3 bg-blue-600 rounded-full" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
          {isListening && <p className="text-blue-600 text-sm">🎙 Listening...</p>}
          {isSpeaking && <p className="text-purple-600 text-sm">🗣 AI is speaking...</p>}

          <button
            onClick={handleEnd}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            End Session
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .ball {
          animation: bounce 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}