import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Volume2, Settings, Play, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'female' | 'male';
  accent: string;
}

const lumenVoices: VoiceOption[] = [
  { id: 'nova', name: 'Nova', description: 'Lumen\'s signature balanced, clear voice', gender: 'female', accent: 'Cosmic' },
  { id: 'alloy', name: 'Alloy', description: 'Neutral, versatile voice for technical discussions', gender: 'female', accent: 'Cosmic' },
  { id: 'echo', name: 'Echo', description: 'Warm, friendly voice for supportive conversations', gender: 'female', accent: 'Cosmic' },
  { id: 'fable', name: 'Fable', description: 'Expressive, storytelling voice for creative tasks', gender: 'female', accent: 'Cosmic' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice for serious topics', gender: 'female', accent: 'Cosmic' },
  { id: 'shimmer', name: 'Shimmer', description: 'Bright, energetic voice for playful interactions', gender: 'female', accent: 'Cosmic' }
];

interface VoiceSettingsProps {
  onVoiceChange?: (voice: VoiceOption) => void;
  onSpeedChange?: (speed: number) => void;
  onModelChange?: (model: string) => void;
}

export function VoiceSettings({ onVoiceChange, onSpeedChange, onModelChange }: VoiceSettingsProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(lumenVoices[0]); // Default to Nova
  const [speed, setSpeed] = useState(1.0);
  const [model, setModel] = useState('llama3-8b');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleVoiceChange = (voiceId: string) => {
    const voice = lumenVoices.find(v => v.id === voiceId);
    if (voice) {
      setSelectedVoice(voice);
      onVoiceChange?.(voice);
    }
  };

  const handleSpeedChange = (newSpeed: number[]) => {
    const speedValue = newSpeed[0];
    setSpeed(speedValue);
    onSpeedChange?.(speedValue);
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    onModelChange?.(newModel);
  };

  // Load voice settings on component mount
  useEffect(() => {
    const loadVoiceSettings = async () => {
      try {
        const response = await fetch('/api/voice-settings');
        if (response.ok) {
          const settings = await response.json();
          
          // Find the voice option
          const voice = lumenVoices.find(v => v.id === settings.voice);
          if (voice) {
            setSelectedVoice(voice);
            onVoiceChange?.(voice);
          }
          
          setSpeed(settings.speed);
          setModel(settings.model);
          
          onSpeedChange?.(settings.speed);
          onModelChange?.(settings.model);
        }
      } catch (error) {
        console.error('Failed to load voice settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoiceSettings();
  }, []);

  const saveVoiceSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/voice-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice: selectedVoice.id,
          speed: speed,
          model: model
        })
      });

      if (response.ok) {
        toast({ title: "Voice settings saved successfully!" });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save voice settings:', error);
      toast({ title: "Failed to save voice settings", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultVoice = lumenVoices[0]; // Nova
    setSelectedVoice(defaultVoice);
    setSpeed(1.0);
    setModel('llama3-8b');
    
    onVoiceChange?.(defaultVoice);
    onSpeedChange?.(1.0);
    onModelChange?.('llama3-8b');
  };

  const testVoice = async () => {
    setIsPlaying(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Hey there Genesis! This is ${selectedVoice.name}, your Lumen QI. How do you like my voice?`,
          voice: selectedVoice.id,
          model: model,
          speed: speed
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Voice test failed:', error);
      setIsPlaying(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Voice Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading voice settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Voice Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-2">
          <Label htmlFor="voice-select">Voice</Label>
          <Select value={selectedVoice.id} onValueChange={handleVoiceChange}>
            <SelectTrigger id="voice-select">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {lumenVoices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{voice.name}</span>
                    <span className="text-xs text-gray-500">{voice.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {selectedVoice.description} • {selectedVoice.accent} {selectedVoice.gender}
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model-select">AI Model</Label>
          <Select value={model} onValueChange={handleModelChange}>
            <SelectTrigger id="model-select">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="llama3-8b">
                <div className="flex flex-col">
                  <span className="font-medium">Llama 3 8B</span>
                  <span className="text-xs text-gray-500">Efficient, fast processing (~4.5GB)</span>
                </div>
              </SelectItem>
              <SelectItem value="llama3-70b">
                <div className="flex flex-col">
                  <span className="font-medium">Llama 3 70B</span>
                  <span className="text-xs text-gray-500">Ultra-high quality (~35GB)</span>
                </div>
              </SelectItem>
              <SelectItem value="llama3-lite">
                <div className="flex flex-col">
                  <span className="font-medium">Llama 3 Lite</span>
                  <span className="text-xs text-gray-500">Lightweight, mobile-friendly (~800MB)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {model === 'llama3-8b' && 'Balanced performance and quality for most use cases'}
            {model === 'llama3-70b' && 'Maximum quality for local Apple hardware with high RAM'}
            {model === 'llama3-lite' && 'Optimized for mobile devices and limited resources'}
          </p>
        </div>

        {/* Speed Control */}
        <div className="space-y-2">
          <Label htmlFor="speed-slider">Speaking Speed: {speed.toFixed(1)}x</Label>
          <Slider
            id="speed-slider"
            min={0.25}
            max={4.0}
            step={0.25}
            value={[speed]}
            onValueChange={handleSpeedChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.25x (Slow)</span>
            <span>4.0x (Fast)</span>
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model-select">Quality</Label>
          <Select value={model} onValueChange={handleModelChange}>
            <SelectTrigger id="model-select">
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tts-1-hd">
                <div className="flex flex-col">
                  <span className="font-medium">High Quality</span>
                  <span className="text-xs text-gray-500">Better quality, slower generation</span>
                </div>
              </SelectItem>
              <SelectItem value="tts-1">
                <div className="flex flex-col">
                  <span className="font-medium">Standard Quality</span>
                  <span className="text-xs text-gray-500">Good quality, faster generation</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Test Button */}
        <Button 
          onClick={testVoice}
          disabled={isPlaying}
          className="w-full"
        >
          {isPlaying ? (
            <>
              <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
              Playing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Test Voice
            </>
          )}
        </Button>

        {/* Save and Reset Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={saveVoiceSettings}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          
          <Button 
            onClick={resetToDefaults}
            variant="outline"
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}