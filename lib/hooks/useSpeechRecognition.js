/**
 * useSpeechRecognition Hook
 * Browser Web Speech API wrapper for real-time speech-to-text
 *
 * Features:
 * - Continuous recognition with auto-restart
 * - Real-time interim results
 * - Full error handling
 * - Browser compatibility detection
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  // Initialize Speech Recognition on mount
  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser')
      setError('not-supported')
      return
    }

    // Initialize recognition instance
    const recognition = new SpeechRecognition()
    recognition.continuous = true // Keep listening
    recognition.interimResults = true // Show interim results
    recognition.lang = 'en-US' // Language
    recognition.maxAlternatives = 1 // Only need top result

    // Handle results
    recognition.onresult = (event) => {
      let interimTranscript = ''

      // Process all results from the event
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript

        if (event.results[i].isFinal) {
          // Final result - add to accumulated transcript
          finalTranscriptRef.current += transcriptPart + ' '
        } else {
          // Interim result - show temporarily
          interimTranscript += transcriptPart
        }
      }

      // Update state with final + interim
      const fullTranscript = finalTranscriptRef.current + interimTranscript
      setTranscript(fullTranscript)
    }

    // Handle errors
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)

      // Map error types
      const errorTypes = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please connect a microphone.',
        'not-allowed': 'Microphone access denied. Please enable it in browser settings.',
        'network': 'Network error. Voice input requires an internet connection.',
        'aborted': 'Recording was stopped.',
        'language-not-supported': 'Language not supported.',
      }

      setError(event.error)

      // Don't stop recording for 'no-speech' - user might be pausing
      if (event.error !== 'no-speech') {
        setIsRecording(false)
      }
    }

    // Handle end of recognition
    recognition.onend = () => {
      console.log('Speech recognition ended')

      // If we were recording and it ended unexpectedly, try to restart
      // This handles the case where recognition stops due to silence
      if (isRecording) {
        try {
          recognition.start()
          console.log('Recognition restarted after silence')
        } catch (err) {
          console.error('Failed to restart recognition:', err)
          setIsRecording(false)
        }
      }
    }

    // Handle start
    recognition.onstart = () => {
      console.log('Speech recognition started')
      setError(null)
    }

    recognitionRef.current = recognition

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
    }
  }, [isRecording])

  // Start recording
  const startRecording = useCallback(async () => {
    if (!recognitionRef.current) {
      setError('not-supported')
      throw new Error('Speech recognition not supported')
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Close the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop())

      // Reset state
      setError(null)
      setTranscript('')
      finalTranscriptRef.current = ''

      // Start recognition
      recognitionRef.current.start()
      setIsRecording(true)

      console.log('📢 Recording started')
    } catch (err) {
      console.error('Failed to start recording:', err)

      // Handle specific errors
      if (err.name === 'NotAllowedError') {
        setError('not-allowed')
      } else if (err.name === 'NotFoundError') {
        setError('audio-capture')
      } else {
        setError('unknown')
      }

      throw err
    }
  }, [])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop()
        setIsRecording(false)
        console.log('📢 Recording stopped')
      } catch (err) {
        console.error('Error stopping recording:', err)
      }
    }
  }, [isRecording])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    finalTranscriptRef.current = ''
  }, [])

  // Check if speech recognition is supported
  const isSupported = useCallback(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }, [])

  return {
    transcript,
    isRecording,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
  }
}
