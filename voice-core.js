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
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.value = finalTranscript || interimTranscript;
    }
  };

  recognition.onend = () => {
    console.log('Speech recognition ended.');
    isListening = false;
    updateMicUI(false);
    
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // Auto-send if we have a significant transcript
    if (chatInput && chatInput.value.trim().length > 2 && sendBtn) {
      console.log('Auto-sending spoken question...');
      sendBtn.click();
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    updateMicUI(false);
    if (event.error === 'not-allowed') {
      alert("Microphone access denied. Please enable it in browser settings.");
    }
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

// Global Initialization
window.addEventListener('load', () => {
  const btn = document.getElementById('voiceMicBtn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSpeech();
    });
  }
});
