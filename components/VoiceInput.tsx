"use client";

import { useState, useEffect } from "react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceInput({
  onTranscript,
  isOpen,
  onClose,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        recognitionInstance.onstart = () => {
          setIsListening(true);
          setError("");
        };

        recognitionInstance.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + " ";
            } else {
              interimTranscript += transcriptPiece;
            }
          }

          setTranscript(finalTranscript || interimTranscript);
        };

        recognitionInstance.onerror = (event: any) => {
          setIsListening(false);
          setError(`Error: ${event.error}`);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      } else {
        setError("Speech recognition is not supported in this browser.");
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTranscript("");
      setError("");
    }
  }, [isOpen]);

  const startListening = () => {
    if (recognition) {
      setTranscript("");
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="modal-panel bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-apple-gray-900">
            Voice Input
          </h2>
          <button
            onClick={onClose}
            className="premium-button text-apple-gray-400 hover:text-apple-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Microphone Button */}
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!!error}
            className={`premium-button w-24 h-24 rounded-full flex items-center justify-center ${
              isListening
                ? "bg-red-500 animate-pulse shadow-lg"
                : "bg-gradient-to-br from-apple-gray-800 to-apple-gray-900 hover:scale-[1.02]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? (
              <svg
                className="w-12 h-12 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            ) : (
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
          <p className="mt-4 text-sm text-apple-gray-500">
            {isListening ? "Listening..." : "Tap to start speaking"}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-apple-gray-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-apple-gray-600 mb-2 font-medium">
            Example phrases:
          </p>
          <ul className="text-xs text-apple-gray-500 space-y-1">
            <li>• "Spent 1500 rupees on food yesterday"</li>
            <li>• "Earned 50000 from salary today"</li>
            <li>• "Paid 300 for transport on Monday"</li>
          </ul>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="bg-white border border-apple-gray-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-apple-gray-700 mb-1">
              Transcript:
            </p>
            <p className="text-apple-gray-900">{transcript}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        {transcript && !isListening && (
          <button
            onClick={handleSubmit}
            className="premium-button w-full py-3 bg-gradient-to-r from-apple-gray-800 to-apple-gray-900 text-white rounded-xl font-medium hover:opacity-90"
          >
            Parse Transaction
          </button>
        )}
      </div>
    </div>
  );
}
