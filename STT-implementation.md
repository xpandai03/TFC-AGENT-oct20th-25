# Speech-to-Text (STT) Implementation Plan

## 📋 Requirement Summary

**Goal**: Add voice input functionality to allow users to speak their prompts instead of typing them.

**Current State**:
- ✅ Mic button exists in Composer.jsx (line 120-125)
- ❌ No functionality - just a placeholder
- ✅ Visual design already in place

**Desired State**:
- ✅ Click mic → Start recording
- ✅ Show visual feedback (waveform/timer/recording indicator)
- ✅ Convert speech to text in real-time
- ✅ Insert transcribed text into textarea
- ✅ User can edit transcription before sending
- ✅ Cancel button to abort recording
- ✅ Confirm button to finish recording

---

## 🎯 User Flow

```
1. User clicks mic button
   ↓
2. Browser requests microphone permission (first time only)
   ↓
3. Recording starts
   - Mic button changes color (red/pulsing)
   - Textarea shows recording UI overlay
   - Timer starts counting
   - Waveform animates (optional)
   ↓
4. User speaks
   - Speech-to-text transcription happens in real-time
   - Text appears in textarea as user speaks
   ↓
5. User stops recording (3 ways):
   a) Click mic again (stop)
   b) Click checkmark button (confirm)
   c) Click X button (cancel - clears text)
   ↓
6. Recording stops
   - Final transcription appears in textarea
   - User can edit text
   - User clicks send button
```

---

## 🔧 Technical Approach

### Option 1: Browser Web Speech API (RECOMMENDED - Phase 1)
**Pros**:
- ✅ Free (no API costs)
- ✅ Real-time transcription
- ✅ No backend required
- ✅ Fast implementation
- ✅ Works offline (some browsers)

**Cons**:
- ⚠️ Browser support varies (Chrome/Edge best, Safari limited, Firefox needs flags)
- ⚠️ Accuracy varies by browser
- ⚠️ Requires internet (sends audio to browser vendor's servers)

**Browser Support**:
- Chrome/Edge: ✅ Excellent
- Safari: ⚠️ Limited (iOS Safari doesn't support)
- Firefox: ⚠️ Requires flag enabled

**Implementation**: 5-10 lines of JavaScript, no dependencies

---

### Option 2: Azure Speech Services (Phase 2 - If Needed)
**Pros**:
- ✅ We already use Azure (easy integration)
- ✅ Highly accurate
- ✅ Consistent across all browsers
- ✅ Supports multiple languages
- ✅ Real-time transcription

**Cons**:
- ⚠️ Requires API key (we have Azure account)
- ⚠️ Costs money (but minimal for this use case)
- ⚠️ Requires npm package (@azure/cognitiveservices-speech-sdk)

**Cost**: ~$1 per hour of audio transcribed (first 5 hours free per month)

---

### Option 3: OpenAI Whisper API (Phase 3 - Fallback)
**Pros**:
- ✅ Very accurate
- ✅ Works with any browser

**Cons**:
- ⚠️ Not real-time (must wait for complete audio)
- ⚠️ Requires backend processing
- ⚠️ More expensive than Azure
- ⚠️ Slower user experience

---

## 📐 Architecture Design

### Components to Modify/Create

#### 1. **Composer.jsx** (Modify)
- Add recording state management
- Add mic button click handler
- Show/hide recording UI overlay
- Handle start/stop/cancel recording

#### 2. **VoiceRecorder.jsx** (NEW - Create)
Reusable voice recording component with:
- Microphone permission handling
- Audio recording state
- Speech-to-text integration
- Visual feedback (timer, waveform)
- Cancel/confirm buttons

#### 3. **RecordingOverlay.jsx** (NEW - Create)
Visual overlay shown during recording:
- Timer display (0:03, 0:04, etc.)
- Waveform animation (optional)
- Cancel button (X icon)
- Confirm button (checkmark icon)
- Placeholder text: "Listening..."

#### 4. **useSpeechRecognition.js** (NEW - Create)
Custom React hook for speech-to-text:
```javascript
const {
  transcript,      // Current transcription text
  isRecording,     // Recording state
  startRecording,  // Start function
  stopRecording,   // Stop function
  resetTranscript, // Clear text
  error           // Error state
} = useSpeechRecognition()
```

---

## 🚀 Implementation Plan - Phase 1: Web Speech API

### Step 1: Create Speech Recognition Hook (30 min)
**File**: `lib/hooks/useSpeechRecognition.js`

**Responsibilities**:
- Initialize Web Speech API
- Handle browser compatibility
- Manage recording state
- Return transcript text
- Handle errors gracefully

**Key Features**:
- Auto-restart on silence
- Continuous recognition
- Real-time interim results
- Final results on stop

**Browser Compatibility Check**:
```javascript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
if (!SpeechRecognition) {
  // Fallback: Show message or use alternative
}
```

---

### Step 2: Create Recording Overlay Component (45 min)
**File**: `components/RecordingOverlay.jsx`

**Props**:
- `isRecording` - Show/hide overlay
- `duration` - Recording duration in seconds
- `onCancel` - Cancel recording callback
- `onConfirm` - Confirm recording callback
- `transcript` - Current transcription (optional, for real-time display)

**Visual Elements**:
1. **Background**: Semi-transparent dark overlay
2. **Container**: Centered card with rounded corners
3. **Timer**: Large text showing elapsed time (0:03)
4. **Status Text**: "Listening..." or "Recording..."
5. **Waveform**: Animated bars (optional, can add later)
6. **Cancel Button**: X icon (top-left)
7. **Confirm Button**: Checkmark icon (bottom-right)

**Animation**:
- Fade in/out when showing/hiding
- Pulsing red circle around mic icon
- Waveform animation (CSS or simple bars)

---

### Step 3: Modify Composer Component (1 hour)
**File**: `components/Composer.jsx`

**State to Add**:
```javascript
const [isRecording, setIsRecording] = useState(false)
const [recordingDuration, setRecordingDuration] = useState(0)
```

**Hook Integration**:
```javascript
const {
  transcript,
  isRecording: speechIsRecording,
  startRecording,
  stopRecording,
  resetTranscript,
  error
} = useSpeechRecognition()
```

**Mic Button Handler**:
```javascript
const handleMicClick = async () => {
  if (isRecording) {
    // Stop recording
    stopRecording()
    setIsRecording(false)
  } else {
    // Start recording
    try {
      await startRecording()
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      // Show error to user
    }
  }
}
```

**Effect to Update Textarea**:
```javascript
useEffect(() => {
  if (transcript) {
    setValue(transcript) // Update textarea with transcription
  }
}, [transcript])
```

**Timer Effect**:
```javascript
useEffect(() => {
  let interval
  if (isRecording) {
    interval = setInterval(() => {
      setRecordingDuration(prev => prev + 1)
    }, 1000)
  } else {
    setRecordingDuration(0)
  }
  return () => clearInterval(interval)
}, [isRecording])
```

**Cancel Handler**:
```javascript
const handleCancelRecording = () => {
  stopRecording()
  resetTranscript()
  setValue('') // Clear textarea
  setIsRecording(false)
}
```

**Confirm Handler**:
```javascript
const handleConfirmRecording = () => {
  stopRecording()
  setIsRecording(false)
  // Keep transcript in textarea
  inputRef.current?.focus() // Focus textarea for editing
}
```

---

### Step 4: Visual Feedback Updates (30 min)

**Mic Button States**:
- **Idle**: Gray color, Mic icon
- **Recording**: Red color, pulsing animation
- **Processing**: Blue color, spinning animation

**CSS Animations**:
```css
/* Pulsing red circle */
@keyframes pulse-red {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

.recording-pulse {
  animation: pulse-red 1.5s ease-in-out infinite;
  background-color: #ef4444; /* red */
}
```

**Waveform Animation** (Optional - Simple Version):
- 3-5 vertical bars that animate up/down
- CSS animation, no need for complex audio analysis
- Gives visual feedback that recording is active

---

### Step 5: Error Handling & Permissions (30 min)

**Microphone Permission States**:
1. **Not Requested**: Show mic button normally
2. **Requesting**: Show loading state
3. **Granted**: Start recording
4. **Denied**: Show error message + instructions

**Error Messages**:
```javascript
const errorMessages = {
  'not-allowed': 'Microphone access denied. Please enable it in browser settings.',
  'not-found': 'No microphone found. Please connect a microphone.',
  'not-supported': 'Speech recognition not supported in this browser. Try Chrome or Edge.',
  'network': 'Network error. Please check your internet connection.',
  'aborted': 'Recording was aborted.',
}
```

**Permission Check**:
```javascript
const checkMicrophonePermission = async () => {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' })
    if (result.state === 'denied') {
      alert('Microphone access denied. Please enable it in browser settings.')
      return false
    }
    return true
  } catch (err) {
    // Permissions API not supported, try anyway
    return true
  }
}
```

---

### Step 6: Testing & Refinement (1 hour)

**Test Cases**:

1. **Happy Path**:
   - Click mic → Grant permission → Speak → See text appear → Stop → Edit → Send ✅

2. **Cancel Recording**:
   - Click mic → Speak → Click X → Text cleared ✅

3. **Permission Denied**:
   - Click mic → Deny permission → See error message ✅

4. **No Microphone**:
   - Disconnect mic → Click mic button → See error ✅

5. **Browser Not Supported**:
   - Open in Firefox → Click mic → See "not supported" message ✅

6. **Network Issues**:
   - Disconnect internet → Click mic → See error (Web Speech API needs internet) ✅

7. **Long Recording**:
   - Speak for 60+ seconds → Check if auto-restarts on silence ✅

8. **Real-time Updates**:
   - Speak continuously → See text update in real-time ✅

9. **Editing After Recording**:
   - Record → Stop → Edit text → Send ✅

10. **Multiple Recordings**:
    - Record → Cancel → Record again → Works correctly ✅

---

## 📂 File Structure

```
TFC-AGENT-OCT25/
├── components/
│   ├── Composer.jsx (MODIFY)
│   ├── RecordingOverlay.jsx (NEW)
│   └── VoiceRecorder.jsx (NEW - optional, can combine with Composer)
├── lib/
│   └── hooks/
│       └── useSpeechRecognition.js (NEW)
└── STT-implementation.md (this file)
```

---

## 🎨 UI/UX Design Specifications

### Recording Overlay Layout

```
┌─────────────────────────────────────────────┐
│  [X]                                        │
│                                             │
│              🎤 Listening...                │
│                                             │
│              ▂▄▆█▆▄▂▄                       │ (waveform)
│                                             │
│                  0:03                       │
│                                             │
│                                      [✓]    │
└─────────────────────────────────────────────┘
```

### Composer States

**Before Recording**:
```
┌──────────────────────────────────────┐
│ How can I help you today?           │
│                                      │
│  [+]                      [🎤] [↑]  │
└──────────────────────────────────────┘
```

**During Recording**:
```
┌──────────────────────────────────────┐
│ Tell me about the warmstone doc...   │ (text appears as user speaks)
│                                      │
│  [+]                      [🔴] [↑]  │ (red pulsing mic)
└──────────────────────────────────────┘

     [Overlay appears over entire UI]
```

**After Recording**:
```
┌──────────────────────────────────────┐
│ Tell me about the warmstone document │ (can edit)
│                                      │
│  [+]                      [🎤] [↑]  │ (normal mic, send enabled)
└──────────────────────────────────────┘
```

---

## 🔐 Security & Privacy Considerations

1. **Microphone Permission**:
   - Only request when user clicks mic button (not on page load)
   - Show clear message about what we're doing with audio
   - Audio never leaves the browser (Web Speech API handles it)

2. **HIPAA Compliance**:
   - Audio is processed by browser vendor (Google/Apple/Microsoft)
   - No audio stored on our servers
   - Transcription text treated like any other user input
   - If HIPAA requires: Switch to Azure Speech Services (Phase 2)

3. **Error Handling**:
   - Never break the app if mic fails
   - Always provide fallback to typing
   - Clear error messages for users

---

## 📊 Browser Compatibility Matrix

| Browser | Web Speech API | Notes |
|---------|----------------|-------|
| Chrome (desktop) | ✅ Excellent | Recommended |
| Edge (desktop) | ✅ Excellent | Recommended |
| Safari (desktop) | ⚠️ Limited | Works but less accurate |
| Safari (iOS) | ❌ No support | Fallback to typing |
| Firefox (desktop) | ⚠️ Requires flag | `media.webspeech.recognition.enable` |
| Mobile Chrome (Android) | ✅ Good | Works well |

**Fallback Strategy**:
- Detect if Web Speech API not supported
- Hide mic button OR show "Not supported in this browser" tooltip
- User can always type normally

---

## 🚀 Phase 2: Advanced Features (Future)

### If Web Speech API Quality Issues:

1. **Switch to Azure Speech Services**:
   - Better accuracy
   - Consistent across browsers
   - Real-time transcription
   - Support for medical/technical terminology
   - Cost: ~$1/hour (minimal for our use case)

2. **Add Language Selection**:
   - Dropdown to choose language
   - Spanish support (important for TFC's New Mexico audience)
   - Auto-detect language

3. **Add Noise Cancellation**:
   - Filter background noise
   - Improve accuracy in noisy environments

4. **Add Voice Commands**:
   - "Send message" → Auto-sends
   - "New paragraph" → Adds line break
   - "Delete that" → Removes last sentence

5. **Add Transcription History**:
   - Save previous transcriptions
   - Allow user to re-use or reference

---

## ⏱️ Implementation Timeline

### Total Estimated Time: 3-4 hours

**Phase 1 - Core Functionality**:
- Step 1: Speech Recognition Hook - 30 min
- Step 2: Recording Overlay - 45 min
- Step 3: Composer Integration - 1 hour
- Step 4: Visual Feedback - 30 min
- Step 5: Error Handling - 30 min
- Step 6: Testing - 1 hour

**Breakdown by Session**:
- **Session 1** (1.5 hours): Steps 1-2 (Hook + Overlay)
- **Session 2** (1.5 hours): Step 3 (Composer Integration)
- **Session 3** (1 hour): Steps 4-6 (Polish + Testing)

---

## 🧪 Testing Checklist

### Before Deploying:
- [ ] Mic button shows correct icon
- [ ] Click mic → Permission requested (first time)
- [ ] Permission granted → Recording starts
- [ ] Recording indicator visible (red pulsing)
- [ ] Timer counts up correctly
- [ ] Speech converts to text in real-time
- [ ] Text appears in textarea
- [ ] Click X → Recording cancelled, text cleared
- [ ] Click checkmark → Recording stopped, text kept
- [ ] Can edit transcribed text
- [ ] Can send transcribed message
- [ ] Error shown if permission denied
- [ ] Error shown if no microphone
- [ ] Works on Chrome/Edge (primary browsers)
- [ ] Graceful fallback on unsupported browsers

### After Deploying:
- [ ] Test on production with real users
- [ ] Monitor error logs
- [ ] Gather feedback on accuracy
- [ ] Decide if Azure Speech Services needed

---

## 📝 Code Examples

### Example: useSpeechRecognition Hook

```javascript
// lib/hooks/useSpeechRecognition.js
import { useState, useEffect, useRef } from 'react'

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('not-supported')
      return
    }

    // Initialize recognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'

    // Event handlers
    recognitionRef.current.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' '
        } else {
          interimTranscript += transcriptPart
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setError(event.error)
      setIsRecording(false)
    }

    recognitionRef.current.onend = () => {
      setIsRecording(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      setTranscript('')
      recognitionRef.current?.start()
      setIsRecording(true)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  const resetTranscript = () => {
    setTranscript('')
  }

  return {
    transcript,
    isRecording,
    startRecording,
    stopRecording,
    resetTranscript,
    error,
  }
}
```

---

## 🎯 Success Criteria

**Must Have** (Phase 1):
- ✅ Click mic button to start recording
- ✅ Visual indicator that recording is active
- ✅ Speech converts to text
- ✅ Text appears in textarea
- ✅ Can edit text before sending
- ✅ Can cancel recording
- ✅ Works in Chrome/Edge

**Nice to Have** (Phase 2):
- ⭐ Real-time waveform visualization
- ⭐ Support for Spanish
- ⭐ Voice commands
- ⭐ Better accuracy with Azure Speech Services

**User Feedback Goals**:
- Users prefer voice input for long messages
- Reduces typing time by 50%+
- Accuracy rate > 90%
- Zero errors that break the app

---

## 🔄 Rollback Plan

**If STT causes issues**:
1. Feature flag to disable STT
2. Hide mic button via CSS class
3. Users fallback to typing
4. No functionality broken

**Quick Disable**:
```javascript
// In Composer.jsx
const STT_ENABLED = false // Set to false to disable

{STT_ENABLED && (
  <button onClick={handleMicClick}>
    <Mic />
  </button>
)}
```

---

## 📚 Resources & References

**Web Speech API**:
- MDN Docs: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- Can I Use: https://caniuse.com/speech-recognition

**Azure Speech Services**:
- Documentation: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/
- Pricing: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/

**Example Apps**:
- Google Keep voice notes
- WhatsApp voice messages
- Notion voice dictation

---

**Created**: October 27, 2025
**Status**: Ready for Implementation
**Phase**: 1 (Web Speech API)
**Next Action**: Begin Step 1 - Create useSpeechRecognition hook
