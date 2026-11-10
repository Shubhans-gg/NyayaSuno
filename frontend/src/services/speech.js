/**
 * Speech Recognition and Speech Synthesis Utilities for NyayaSuno
 */

// Check SpeechRecognition support in browser
export const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

/**
 * Text-to-Speech service using browser window.speechSynthesis
 */
class TTSService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.onStateChange = null;
  }

  getVoices() {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  speak(text, lang = 'en', onEnd = null) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    if (!text || text.trim() === '') return;

    // Clean markdown formatting and citations for pleasant reading
    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\[Source:.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Set voice and language
    const voices = this.getVoices();
    const targetLang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.lang = targetLang;

    // Try finding an appropriate voice
    const matchedVoice = voices.find(v => 
      v.lang.toLowerCase().includes(lang === 'hi' ? 'hi' : 'en-in') || 
      v.lang.toLowerCase().includes(lang === 'hi' ? 'hindi' : 'en')
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.rate = lang === 'hi' ? 0.95 : 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStateChange) this.onStateChange(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false);
    };

    this.synth.speak(utterance);
  }

  pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false);
    }
  }
}

export const ttsService = new TTSService();

/**
 * Audio Recording Helper for sending audio files to backend Whisper
 */
export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }

  async start() {
    this.audioChunks = [];
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = MediaRecorder.isTypeSupported('audio/webm') 
        ? { mimeType: 'audio/webm' } 
        : {};
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect 100ms slices
      return true;
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      throw err;
    }
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('Recorder not initialized'));
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        resolve({ blob: audioBlob, mimeType });
      };

      this.mediaRecorder.stop();
    });
  }
}

