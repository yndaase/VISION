/**
 * VISION EDUCATION - Voice Core Engine
 * Integrates Web Speech API (STT & TTS)
 */

let recognition = null;
let isListening = false;

// Initialize Speech Recognition (STT)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false; // Stop after one phrase
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    updateMicUI(true);
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('');

    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.value = transcript;
  };

  recognition.onend = () => {
    isListening = false;
    updateMicUI(false);
    
    // Auto-send logic: if we have content after a short delay
    const chatInput = document.getElementById('chatInput');
    if (chatInput && chatInput.value.trim().length > 3) {
      setTimeout(() => {
        if (!isListening) {
           document.getElementById('sendBtn').click();
        }
      }, 1500);
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    updateMicUI(false);
  };
}

// Initialize Speech Synthesis (TTS)
function speakText(text) {
  if (!window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Clean text of markdown characters for better speech
  const cleanText = text.replace(/[*_#`~]/g, '');
  utterance.text = cleanText;
  
  // Find a good professional English voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
  if (preferredVoice) utterance.voice = preferredVoice;

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

// UI Toggle
function toggleSpeech() {
  if (!recognition) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

function updateMicUI(listening) {
  const btn = document.getElementById('voiceMicBtn');
  if (!btn) return;
  
  if (listening) {
    btn.classList.add('listening');
    btn.innerHTML = '🛑'; // Stop icon
  } else {
    btn.classList.remove('listening');
    btn.innerHTML = '🎙️';
  }
}

// Attach listener to button
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('voiceMicBtn');
  if (btn) {
    btn.addEventListener('click', toggleSpeech);
  }
});
