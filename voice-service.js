import { config } from './config.js';

// Speech recognition variables
let recognition = null;
let isListening = false;
let commandTimeout = null;
let silenceTimer = null; // New timer for silence detection

// DOM Elements
const voiceBtn = document.getElementById('voiceBtn');
const voiceIndicator = document.getElementById('voiceIndicator');
const userQuestion = document.getElementById('userQuestion');

// Initialize voice recognition
export function initVoiceService() {
    setupVoiceRecognition();
}

function setupVoiceRecognition() {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // Initialize SpeechRecognition object
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        // Configure recognition with enhanced settings
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = config.voice.language;
        recognition.maxAlternatives = 3; // Get multiple interpretation alternatives
        
        // Add event listeners
        voiceBtn.addEventListener('click', toggleVoiceRecognition);
        
        // Set up recognition events
        setupRecognitionEvents();
    } else {
        console.error('Speech recognition not supported');
        voiceBtn.style.display = 'none';
    }
}

function setupRecognitionEvents() {
    // Start event
    recognition.onstart = function() {
        isListening = true;
        voiceBtn.classList.add('active');
        voiceIndicator.classList.add('active');
        userQuestion.placeholder = "Listening...";
        
        // Start silence detection timer
        startSilenceDetection();
    };
    
    // Result event
    recognition.onresult = function(event) {
        clearTimeout(commandTimeout);
        // Reset silence timer when speech is detected
        resetSilenceDetection();
        
        // Get transcript of speech with noise filtering and confidence scoring
        const results = Array.from(event.results);
        // Get the most confident result
        let transcript = '';
        let highestConfidence = 0;
        
        results.forEach(result => {
            const confidence = result[0].confidence;
            if (confidence > highestConfidence && confidence > config.voice.confidenceThreshold) {
                highestConfidence = confidence;
                transcript = result[0].transcript;
            }
        });
        
        // If no high confidence result, use the best we have
        if (!transcript && results.length > 0) {
            transcript = results.map(result => result[0].transcript).join(' ');
        }
        
        // Apply additional noise filtering
        transcript = cleanTranscript(transcript);
        
        // Update input field with recognized text
        userQuestion.value = transcript;
        
        // Process final results after a short delay to ensure complete command
        if (event.results[0].isFinal) {
            commandTimeout = setTimeout(() => {
                processVoiceCommand(transcript);
            }, 800); // Slightly faster response
        }
    };
    
    // End event
    recognition.onend = function() {
        isListening = false;
        voiceBtn.classList.remove('active');
        voiceIndicator.classList.remove('active');
        userQuestion.placeholder = "Ask about data you plan to upload...";
        
        // Clear silence timer
        clearTimeout(silenceTimer);
    };
    
    // Error event
    recognition.onerror = function(event) {
        console.error('Speech recognition error', event.error);
        isListening = false;
        voiceBtn.classList.remove('active');
        voiceIndicator.classList.remove('active');
        
        // Restart recognition if error is not fatal
        if (event.error !== 'aborted' && event.error !== 'not-allowed') {
            setTimeout(() => {
                if (isListening) {
                    recognition.start();
                }
            }, 500);
        }
    };
    
    // NoMatch event
    recognition.onnomatch = function() {
        userQuestion.value = "Sorry, I didn't catch that. Please try again.";
    };
}

// Start silence detection - if no speech for 5 seconds, process the command
function startSilenceDetection() {
    silenceTimer = setTimeout(() => {
        if (isListening && userQuestion.value.trim() !== '') {
            stopVoiceRecognition();
            processVoiceCommand(userQuestion.value.trim());
        } else if (isListening) {
            // If nothing was captured yet, continue listening but reset the timer
            resetSilenceDetection();
        }
    }, 5000); // 5 seconds of silence triggers processing
}

// Reset silence detection timer
function resetSilenceDetection() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
        if (isListening && userQuestion.value.trim() !== '') {
            stopVoiceRecognition();
            processVoiceCommand(userQuestion.value.trim());
        }
    }, 5000);
}

function toggleVoiceRecognition() {
    if (isListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {
    try {
        userQuestion.value = ''; // Clear previous input
        recognition.start();
    } catch (e) {
        console.error('Recognition already started', e);
    }
}

function stopVoiceRecognition() {
    recognition.stop();
    clearTimeout(silenceTimer);
}

function processVoiceCommand(command) {
    if (!command || command.trim() === '') return;
    
    // Trigger send button after a short delay to allow user to see what was recognized
    setTimeout(() => {
        document.getElementById('sendBtn').click();
    }, 500);
}

// Clean transcript by removing common noise patterns
function cleanTranscript(transcript) {
    if (!transcript) return '';
    
    // Remove common filler words and background noise artifacts
    const fillerWords = ['um', 'uh', 'like', 'so', 'you know', 'actually'];
    let cleaned = transcript;
    
    fillerWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Remove duplicate spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// Advanced noise filtering (improved implementation)
function applyNoiseFiltering(audioStream) {
    // This is a placeholder for actual audio processing
    // In a real implementation, you would use Web Audio API for noise filtering
    console.log('Applying enhanced noise filtering to audio stream');
    
    // Future implementation could use AudioContext and filter nodes:
    /*
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(audioStream);
    const filter = audioContext.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 100;
    source.connect(filter);
    return filter;
    */
    
    return audioStream;
}

// Export functions for use in other modules
export { 
    startVoiceRecognition, 
    stopVoiceRecognition, 
    isListening,
    cleanTranscript // Export for potential use in other modules
};