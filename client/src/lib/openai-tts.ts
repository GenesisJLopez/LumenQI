// Lumen Custom Voice Engine - Built-in Voice Synthesis
export interface OpenAITTSOptions {
  voice?: 'lumen' | 'lumen-warm' | 'lumen-excited' | 'lumen-supportive' | 'lumen-playful' | 'lumen-cosmic';
  model?: 'lumen-custom' | 'lumen-enhanced';
  speed?: number; // 0.25 to 4.0
  response_format?: 'lumen' | 'custom';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export class OpenAITTS {
  private currentSpeech: SpeechSynthesisUtterance | null = null;
  private isPlaying = false;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.initializeVoices();
  }

  private async initializeVoices(): Promise<void> {
    // Wait for voices to be loaded
    if (speechSynthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        speechSynthesis.onvoiceschanged = () => {
          this.availableVoices = speechSynthesis.getVoices();
          resolve();
        };
      });
    } else {
      this.availableVoices = speechSynthesis.getVoices();
    }
  }

  async speak(text: string, options: OpenAITTSOptions = {}): Promise<void> {
    if (!text.trim()) return;

    try {
      // Stop any current speech
      this.stop();

      // Clean text for natural speech
      const cleanText = this.cleanTextForSpeech(text);
      if (!cleanText.trim()) return;

      options.onStart?.();
      this.isPlaying = true;

      // Get Lumen's voice from server (Llama TTS or fallback)
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          voice: options.voice || 'nova',
          model: options.model || 'llasa-3b',
          speed: options.speed || 1.0,
          response_format: options.response_format || 'audio'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lumen TTS request failed:', response.status, errorText);
        throw new Error(`Lumen TTS request failed: ${response.status} - ${errorText}`);
      }

      const voiceData = await response.json();
      console.log('🦙 Using Lumen TTS Service');
      
      if (!voiceData.success) {
        throw new Error('Lumen voice generation failed');
      }

      // Check if we got Llama TTS audio data or fallback config
      if (voiceData.audioData) {
        // Play Llama TTS generated audio
        await this.playLlamaAudio(voiceData.audioData, voiceData, options);
      } else if (voiceData.lumenVoiceConfig) {
        // Use enhanced synthesis fallback
        await this.synthesizeWithLumenVoice(voiceData.lumenVoiceConfig, options);
      } else {
        throw new Error('Invalid voice response from server');
      }

    } catch (error) {
      this.isPlaying = false;
      console.error('Natural TTS error:', error);
      options.onError?.(error instanceof Error ? error.message : 'Unknown TTS error');
    }
  }

  private async playLlamaAudio(audioBase64: string, voiceData: any, options: OpenAITTSOptions): Promise<void> {
    console.log('🦙 Playing Llama TTS generated audio...');
    
    try {
      // Create audio element for better compatibility
      const audio = new Audio();
      
      // Convert base64 to blob URL
      const audioBlob = this.base64ToBlob(audioBase64, 'audio/wav');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Set up audio source
      audio.src = audioUrl;
      audio.preload = 'auto';
      
      // Set up event handlers
      audio.onplay = () => {
        console.log('🎤 Llama TTS playback started');
        this.isPlaying = true;
        options.onStart?.();
      };
      
      audio.onended = () => {
        console.log('✨ Llama TTS playback completed');
        this.isPlaying = false;
        URL.revokeObjectURL(audioUrl);
        options.onEnd?.();
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        this.isPlaying = false;
        URL.revokeObjectURL(audioUrl);
        options.onError?.('Audio playback failed');
      };
      
      // Start playback
      await audio.play();
      
    } catch (error) {
      console.error('Llama TTS playback failed:', error);
      // Fall back to enhanced speech synthesis
      await this.fallbackToEnhancedSpeech({ 
        text: voiceData.text || 'Audio playback failed',
        emotionalTone: 'natural'
      }, options);
    }
  }

  private base64ToBlob(base64: string, contentType: string): Blob {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: contentType });
  }

  private async synthesizeWithLumenVoice(config: any, options: OpenAITTSOptions): Promise<void> {
    console.log(`🎙️ Synthesizing with Lumen's ${config.emotionalTone} voice...`);
    
    // Use enhanced speech synthesis with Lumen's characteristics
    await this.fallbackToEnhancedSpeech(config, options);
  }

  private async generateLumenWaveform(config: any, audioContext: AudioContext): Promise<AudioBuffer> {
    const sampleRate = audioContext.sampleRate;
    const duration = config.text.length * 0.08; // Estimate duration
    const frameCount = sampleRate * duration;
    
    // Create audio buffer for Lumen's voice
    const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Generate Lumen's unique voice characteristics
    const fundamentalFreq = 220 * config.pitch; // Base frequency for Lumen
    const words = config.text.split(' ');
    
    let currentFrame = 0;
    
    for (const word of words) {
      if (currentFrame >= frameCount) break;
      
      const wordDuration = word.length * 0.08;
      const wordFrames = Math.floor(wordDuration * sampleRate);
      
      // Generate phonemes for this word
      for (let i = 0; i < wordFrames && currentFrame < frameCount; i++) {
        const t = i / sampleRate;
        const progress = i / wordFrames;
        
        // Base wave with Lumen's fundamental frequency
        let sample = Math.sin(2 * Math.PI * fundamentalFreq * t);
        
        // Add harmonic content for richness
        sample += 0.3 * Math.sin(2 * Math.PI * fundamentalFreq * 2 * t); // Second harmonic
        sample += 0.2 * Math.sin(2 * Math.PI * fundamentalFreq * 3 * t); // Third harmonic
        
        // Apply formant filtering for vowel-like sounds
        const formant1 = 800 * config.resonance;
        const formant2 = 1200 * config.resonance;
        sample += 0.15 * Math.sin(2 * Math.PI * formant1 * t);
        sample += 0.1 * Math.sin(2 * Math.PI * formant2 * t);
        
        // Apply warmth (low-pass effect)
        if (i > 0) {
          sample = sample * (1 - config.warmth * 0.3) + 
                   channelData[currentFrame - 1] * (config.warmth * 0.3);
        }
        
        // Add subtle breathiness
        if (config.breathiness > 0) {
          const noise = (Math.random() - 0.5) * config.breathiness * 0.05;
          sample += noise;
        }
        
        // Apply amplitude envelope for natural sound
        const envelope = 0.5 * (1 - Math.cos(2 * Math.PI * progress));
        sample *= envelope * 0.3; // Reduced amplitude for comfortable listening
        
        channelData[currentFrame] = sample;
        currentFrame++;
      }
      
      // Add brief pause between words
      const pauseFrames = Math.floor(0.1 * sampleRate);
      for (let i = 0; i < pauseFrames && currentFrame < frameCount; i++) {
        channelData[currentFrame] = 0;
        currentFrame++;
      }
    }
    
    return audioBuffer;
  }

  private async playLumenVoice(audioBuffer: AudioBuffer, audioContext: AudioContext, options: OpenAITTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        console.log('✨ Lumen voice playback completed');
        this.isPlaying = false;
        options.onEnd?.();
        resolve();
      };
      
      source.onerror = (error) => {
        console.error('Lumen voice playback error:', error);
        this.isPlaying = false;
        options.onError?.('Lumen voice playback failed');
        reject(error);
      };
      
      console.log('🎤 Starting Lumen voice playback...');
      this.isPlaying = true;
      options.onStart?.();
      source.start();
    });
  }

  private async fallbackToEnhancedSpeech(config: any, options: OpenAITTSOptions): Promise<void> {
    console.log('🎤 Using Lumen\'s enhanced voice synthesis...');
    
    // Wait for voices to load
    await this.waitForVoices();
    
    // Create enhanced speech synthesis with Lumen's characteristics
    this.currentSpeech = new SpeechSynthesisUtterance(config.text);
    
    // Configure for Lumen's voice profile based on emotional tone
    const emotionalConfigs = {
      warm: { rate: 0.8, pitch: 1.1, volume: 0.9 },
      excited: { rate: 0.9, pitch: 1.3, volume: 0.95 },
      supportive: { rate: 0.75, pitch: 1.0, volume: 0.85 },
      playful: { rate: 0.85, pitch: 1.2, volume: 0.9 },
      cosmic: { rate: 0.7, pitch: 1.15, volume: 0.9 }
    };
    
    const emotionalConfig = emotionalConfigs[config.emotionalTone] || emotionalConfigs.warm;
    
    this.currentSpeech.rate = emotionalConfig.rate;
    this.currentSpeech.pitch = emotionalConfig.pitch;
    this.currentSpeech.volume = emotionalConfig.volume;
    
    // Find the best voice for Lumen
    const voices = speechSynthesis.getVoices();
    const lumenVoice = this.findBestLumenVoice(voices);
    
    if (lumenVoice) {
      this.currentSpeech.voice = lumenVoice;
      console.log(`🎤 Lumen speaking with: ${lumenVoice.name} (${config.emotionalTone} tone)`);
    }
    
    // Set up event handlers
    this.currentSpeech.onstart = () => {
      console.log('✨ Lumen started speaking');
      this.isPlaying = true;
      options.onStart?.();
    };
    
    this.currentSpeech.onend = () => {
      console.log('✨ Lumen finished speaking');
      this.isPlaying = false;
      options.onEnd?.();
    };

    this.currentSpeech.onerror = (error) => {
      console.error('Lumen speech error:', error);
      this.isPlaying = false;
      options.onError?.('Lumen speech synthesis failed');
    };

    // Start speech synthesis
    speechSynthesis.speak(this.currentSpeech);
  }

  private async waitForVoices(): Promise<void> {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve();
        return;
      }
      
      const voicesChanged = () => {
        speechSynthesis.removeEventListener('voiceschanged', voicesChanged);
        resolve();
      };
      
      speechSynthesis.addEventListener('voiceschanged', voicesChanged);
    });
  }

  private findBestLumenVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    // Voice preferences for Lumen (in order of preference)
    const lumenVoicePreferences = [
      'Samantha',     // macOS - warm, natural female voice
      'Karen',        // Windows - clear, pleasant female voice
      'Victoria',     // Windows - gentle female voice
      'Zira',         // Windows - Microsoft's female voice
      'Fiona',        // macOS - Scottish accent, unique
      'Moira',        // macOS - Irish accent, warm
      'Alex',         // macOS - clear, neutral (if no female voices)
      'Google US English Female',
      'Microsoft Zira - English (United States)',
      'Microsoft Hazel - English (Great Britain)'
    ];
    
    // Find the best available voice
    for (const preferredName of lumenVoicePreferences) {
      const voice = voices.find(v => 
        v.name.includes(preferredName) && 
        v.lang.includes('en')
      );
      if (voice) {
        return voice;
      }
    }
    
    // Fallback to any English female voice
    const femaleVoice = voices.find(v => 
      v.lang.includes('en') && 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('woman') ||
       v.name.toLowerCase().includes('girl'))
    );
    
    if (femaleVoice) {
      return femaleVoice;
    }
    
    // Final fallback to any English voice
    const englishVoice = voices.find(v => v.lang.includes('en'));
    return englishVoice || null;
  }

  private cleanTextForSpeech(text: string): string {
    // Remove markdown formatting
    let cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    cleanText = cleanText.replace(/\*(.*?)\*/g, '$1'); // Italic
    cleanText = cleanText.replace(/`(.*?)`/g, '$1'); // Code
    cleanText = cleanText.replace(/#{1,6}\s*(.*)/g, '$1'); // Headers
    cleanText = cleanText.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // Links
    
    // Remove emojis and special characters
    cleanText = cleanText.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc symbols
    cleanText = cleanText.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport
    cleanText = cleanText.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
    cleanText = cleanText.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
    cleanText = cleanText.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
    cleanText = cleanText.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental
    cleanText = cleanText.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Extended
    cleanText = cleanText.replace(/[\u{2190}-\u{21FF}]/gu, ''); // Arrows
    
    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText;
  }

  stop(): void {
    if (this.currentSpeech) {
      speechSynthesis.cancel();
      this.currentSpeech = null;
    }
    // Also stop any Web Audio API sources
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isPlaying = false;
  }

  private audioContext: AudioContext | null = null;

  pause(): void {
    if (this.currentSpeech && this.isPlaying) {
      speechSynthesis.pause();
    }
  }

  resume(): void {
    if (this.currentSpeech && !this.isPlaying) {
      speechSynthesis.resume();
    }
  }

  isCurrentlySpeaking(): boolean {
    return this.isPlaying;
  }

  // Get available voices (Llama 3 TTS - Nova Quality)
  getVoices(): Array<{name: string, description: string}> {
    return [
      { name: 'nova', description: 'Nova-quality voice using Llama 3 TTS - natural, warm, and vibrant' },
      { name: 'alloy', description: 'Balanced, professional voice with Llama 3 synthesis' },
      { name: 'echo', description: 'Clear, articulate voice with natural intonation' },
      { name: 'fable', description: 'Storytelling voice with expressive emotional range' },
      { name: 'onyx', description: 'Deep, resonant voice with authority and warmth' },
      { name: 'shimmer', description: 'Gentle, soothing voice with ethereal quality' }
    ];
  }
}

export const openAITTS = new OpenAITTS()