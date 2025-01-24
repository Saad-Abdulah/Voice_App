const startButton = document.getElementById('start-recording');
const stopButton = document.getElementById('stop-recording');
const userText = document.getElementById('user-text');
const aiResponseBox = document.getElementById('ai-response');
const playButton = document.getElementById('play-audio');
const pauseButton = document.getElementById('pause-audio');
const progressLine = document.getElementById('progress-line');
const progressCircle = document.getElementById('progress-circle');

let recognition;
let audio = new Audio();
let interval;

// Initialize Speech Recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false; // Stop after one result
  recognition.interimResults = false; // Only return final results
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    console.log('Voice recording started...');
    startButton.disabled = true;
    stopButton.disabled = false;
    aiResponseBox.textContent = 'Listening... Speak now.';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('Transcript received:', transcript);
    userText.value = transcript; // Display the user's speech as text
    fetchAIResponse(transcript); // Pass transcript to Gemini AI
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);

    switch (event.error) {
      case 'not-allowed':
        aiResponseBox.textContent = 'Microphone access is blocked. Please enable it in your browser settings.';
        break;
      case 'network':
        aiResponseBox.textContent = 'Network error. Check your internet connection and try again.';
        break;
      case 'aborted':
        aiResponseBox.textContent = 'Recording was aborted. Please try again.';
        break;
      case 'no-speech':
        aiResponseBox.textContent = 'No speech detected. Please speak clearly and try again.';
        break;
      default:
        aiResponseBox.textContent = `Error occurred: ${event.error}. Please try again.`;
    }

    resetButtons();
  };

  recognition.onend = () => {
    console.log('Voice recording stopped.');
    resetButtons();
  };
} else {
  console.error('Speech recognition not supported in this browser.');
  aiResponseBox.textContent = 'Speech recognition is not supported in your browser.';
  startButton.disabled = true;
  stopButton.disabled = true;
}

// Start Recording
startButton.addEventListener('click', () => {
  if (recognition) {
    recognition.start();
  } else {
    aiResponseBox.textContent = 'Speech recognition is not available.';
  }
});

// Stop Recording
stopButton.addEventListener('click', () => {
  if (recognition) {
    recognition.stop();
  }
});

// Fetch AI Response
async function fetchAIResponse(message) {
  aiResponseBox.textContent = 'Fetching response...';

  try {
    const response = await fetch('https://api.gemini-ai.com/response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    // Check if response is okay
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.response || "No response received from AI.";
    aiResponseBox.textContent = aiMessage;
    convertTextToSpeech(aiMessage);
  } catch (error) {
    console.error('Error fetching AI response:', error);
    aiResponseBox.textContent = `Failed to fetch AI response. Please try again. Error: ${error.message}`;
  }
}

// Convert Text to Speech
function convertTextToSpeech(text) {
  const speech = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  speech.voice = voices[0] || null; // Use the first available voice

  speechSynthesis.speak(speech);

  speech.onstart = () => {
    console.log('AI response audio started.');
    playButton.disabled = false;
    pauseButton.disabled = false;
    startProgressAnimation();
  };

  speech.onend = () => {
    console.log('AI response audio ended.');
    resetProgressAnimation();
  };

  audio.src = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); // For playback progress
}

// Play Audio
playButton.addEventListener('click', () => {
  audio.play();
  startProgressAnimation();
});

// Pause Audio
pauseButton.addEventListener('click', () => {
  audio.pause();
  clearInterval(interval);
});

// Progress Bar Animation
function startProgressAnimation() {
  let progress = 0;
  progressLine.style.width = '0%';
  progressCircle.style.left = '0%';

  interval = setInterval(() => {
    if (progress >= 100) {
      clearInterval(interval);
    } else {
      progress += 1;
      progressLine.style.width = `${progress}%`;
      progressCircle.style.left = `${progress}%`;
    }
  }, audio.duration / 100);
}

function resetProgressAnimation() {
  clearInterval(interval);
  progressLine.style.width = '0%';
  progressCircle.style.left = '0%';
}

// Reset Buttons
function resetButtons() {
  startButton.disabled = false;
  stopButton.disabled = true;
}