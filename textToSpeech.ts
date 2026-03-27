/**
 * Text-to-Speech Service
 * 
 * Provides audio playback of text using browser-native speech synthesis
 * with fallback handling and comprehensive controls
 */

export interface TTSConfig {
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
  voice?: SpeechSynthesisVoice;
}

export interface TTSControls {
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  isPlaying: () => boolean;
  isPaused: () => boolean;
}

/**
 * Check if TTS is supported in the browser
 */
export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Get available voices
 */
export async function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isTTSSupported()) {
    return [];
  }

  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      resolve(voices);
    } else {
      // Voices might not be loaded yet
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(voices);
      };
      
      // Fallback timeout
      setTimeout(() => {
        resolve(window.speechSynthesis.getVoices());
      }, 1000);
    }
  });
}

/**
 * Get preferred voice (English, female if available)
 */
export async function getPreferredVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = await getAvailableVoices();
  
  if (voices.length === 0) {
    return null;
  }

  // Try to find English female voice
  let preferred = voices.find(v => 
    v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
  );

  // Fallback to any English voice
  if (!preferred) {
    preferred = voices.find(v => v.lang.startsWith('en'));
  }

  // Fallback to first available voice
  return preferred || voices[0];
}

/**
 * Create TTS instance with controls
 */
export async function createTTS(
  text: string,
  config: TTSConfig = {},
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<TTSControls> {
  if (!isTTSSupported()) {
    const error = new Error('Text-to-speech is not supported in your browser');
    onError?.(error);
    throw error;
  }

  if (!text || text.trim().length === 0) {
    const error = new Error('Text cannot be empty');
    onError?.(error);
    throw error;
  }

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);

  // Set configuration
  utterance.rate = config.rate ?? 1.0;
  utterance.pitch = config.pitch ?? 1.0;
  utterance.volume = config.volume ?? 1.0;

  // Set voice
  if (config.voice) {
    utterance.voice = config.voice;
  } else {
    const preferredVoice = await getPreferredVoice();
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }

  // Event handlers
  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (event) => {
    console.error('TTS Error:', event);
    onError?.(new Error(`Speech synthesis error: ${event.error}`));
  };

  // State tracking
  let isCurrentlyPlaying = false;
  let isCurrentlyPaused = false;

  // Controls
  const controls: TTSControls = {
    play: () => {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Start new speech
        window.speechSynthesis.speak(utterance);
        isCurrentlyPlaying = true;
        isCurrentlyPaused = false;
      } catch (error) {
        console.error('Error playing TTS:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to play audio'));
      }
    },

    pause: () => {
      try {
        if (isCurrentlyPlaying && !isCurrentlyPaused) {
          window.speechSynthesis.pause();
          isCurrentlyPaused = true;
        }
      } catch (error) {
        console.error('Error pausing TTS:', error);
      }
    },

    resume: () => {
      try {
        if (isCurrentlyPaused) {
          window.speechSynthesis.resume();
          isCurrentlyPaused = false;
        }
      } catch (error) {
        console.error('Error resuming TTS:', error);
      }
    },

    stop: () => {
      try {
        window.speechSynthesis.cancel();
        isCurrentlyPlaying = false;
        isCurrentlyPaused = false;
      } catch (error) {
        console.error('Error stopping TTS:', error);
      }
    },

    setRate: (rate: number) => {
      utterance.rate = Math.max(0.1, Math.min(10, rate));
    },

    setPitch: (pitch: number) => {
      utterance.pitch = Math.max(0, Math.min(2, pitch));
    },

    setVolume: (volume: number) => {
      utterance.volume = Math.max(0, Math.min(1, volume));
    },

    isPlaying: () => isCurrentlyPlaying && !isCurrentlyPaused,

    isPaused: () => isCurrentlyPaused
  };

  return controls;
}

/**
 * Simple play text function (fire and forget)
 */
export async function playText(text: string, config: TTSConfig = {}): Promise<void> {
  if (!isTTSSupported()) {
    throw new Error('Text-to-speech is not supported in your browser');
  }

  return new Promise((resolve, reject) => {
    createTTS(
      text,
      config,
      () => resolve(),
      (error) => reject(error)
    ).then(controls => {
      controls.play();
    }).catch(reject);
  });
}

/**
 * Stop all ongoing speech
 */
export function stopAllSpeech(): void {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
  }
}

export default {
  isTTSSupported,
  getAvailableVoices,
  getPreferredVoice,
  createTTS,
  playText,
  stopAllSpeech
};
