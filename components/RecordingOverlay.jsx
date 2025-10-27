/**
 * RecordingOverlay Component
 * Visual overlay shown during voice recording
 *
 * Features:
 * - Timer display
 * - Animated waveform
 * - Cancel and Confirm buttons
 * - Fade in/out animations
 */

"use client"

import { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'
import { cls } from './utils'

export default function RecordingOverlay({
  isRecording,
  duration = 0,
  onCancel,
  onConfirm
}) {
  const [isVisible, setIsVisible] = useState(false)

  // Handle fade in/out
  useEffect(() => {
    if (isRecording) {
      // Small delay for smooth animation
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [isRecording])

  // Don't render if not recording
  if (!isRecording) return null

  // Format duration as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={cls(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Main card */}
      <div
        className={cls(
          "relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        {/* Cancel button - Top left */}
        <button
          onClick={onCancel}
          className="absolute top-4 left-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
          title="Cancel recording"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main content */}
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Microphone icon with pulsing animation */}
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
            <div className="relative w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-8 h-10 bg-white rounded-full" />
              <div className="absolute bottom-2 w-12 h-6 border-b-4 border-white rounded-b-full" />
            </div>
          </div>

          {/* Status text */}
          <p className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
            Listening...
          </p>

          {/* Waveform animation */}
          <div className="flex items-center justify-center gap-1 h-16">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-red-500 rounded-full animate-wave"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatTime(duration)}
          </div>

          {/* Helper text */}
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center px-4">
            Speak clearly into your microphone
          </p>
        </div>

        {/* Confirm button - Bottom right */}
        <button
          onClick={onConfirm}
          className="absolute bottom-4 right-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors shadow-lg"
          title="Finish recording"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      {/* Global styles for animations */}
      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            height: 0.5rem;
            opacity: 0.5;
          }
          50% {
            height: 3rem;
            opacity: 1;
          }
        }

        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
