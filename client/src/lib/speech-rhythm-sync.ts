export class SpeechRhythmSync {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationId: number | null = null;
  private onRhythmCallback: ((intensity: number) => void) | null = null;
  
  constructor() {
    this.setupAudioContext();
  }
  
  private setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (error) {
      console.warn('Audio analysis not available:', error);
    }
  }
  
  public connectAudioElement(audio: HTMLAudioElement) {
    if (!this.audioContext || !this.analyser) return;
    
    try {
      const source = this.audioContext.createMediaElementSource(audio);
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Could not connect audio for rhythm analysis:', error);
    }
  }
  
  public startRhythmAnalysis(callback: (intensity: number) => void) {
    this.onRhythmCallback = callback;
    this.analyzeRhythm();
  }
  
  public stopRhythmAnalysis() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.onRhythmCallback = null;
  }
  
  private analyzeRhythm() {
    if (!this.analyser || !this.dataArray || !this.onRhythmCallback) return;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate intensity based on frequency data
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    const intensity = sum / (this.dataArray.length * 255); // Normalize to 0-1
    this.onRhythmCallback(intensity);
    
    this.animationId = requestAnimationFrame(() => this.analyzeRhythm());
  }
  
  public destroy() {
    this.stopRhythmAnalysis();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Global instance
export const speechRhythmSync = new SpeechRhythmSync();