// DEPRECATED: This redirects to natural-speech.ts for better voice quality
import { naturalSpeech } from './natural-speech';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export class SpeechSynthesisService {
  speak(text: string, options: SpeechOptions = {}): void {
    // Use natural speech system instead
    naturalSpeech.speak(text, options);
  }

  stop(): void {
    naturalSpeech.stop();
  }

  pause(): void {
    naturalSpeech.pause();
  }

  resume(): void {
    naturalSpeech.resume();
  }

  isSpeaking(): boolean {
    return naturalSpeech.isCurrentlySpeaking();
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return naturalSpeech.getVoices();
  }
}

export const speechSynthesis = new SpeechSynthesisService();