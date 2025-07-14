import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Volume2, Settings, Play } from 'lucide-react';

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'female' | 'male';
  accent: string;
}

const openaiVoices: VoiceOption[] = [
  { id: 'nova', name: 'Nova', description: 'Balanced, clear female voice', gender: 'female', accent: 'American' },
  { id: 'alloy', name: 'Alloy', description: 'Neutral, versatile voice', gender: 'male', accent: 'American' },
  { id: 'echo', name: 'Echo', description: 'Warm, friendly male voice', gender: 'male', accent: 'American' },
  { id: 'fable', name: 'Fable', description: 'Expressive, storytelling voice', gender: 'male', accent: 'British' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative male voice', gender: 'male', accent: 'American' },
  { id: 'shimmer', name: 'Shimmer', description: 'Bright, energetic female voice', gender: 'female', accent: 'American' }
];

interface VoiceSettingsProps {
  onVoiceChange?: (voice: VoiceOption) => void;
  onSpeedChange?: (speed: number) => void;
  onModelChange?: (model: string) => void;
}

export function VoiceSettings({ onVoiceChange, onSpeedChange, onModelChange }: VoiceSettingsProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(openaiVoices[0]); // Default to Nova
  const [speed, setSpeed] = useState(1.0);
  const [model, setModel] = useState('tts-1-hd');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVoiceChange = (voiceId: string) => {
    const voice = openaiVoices.find(v => v.id === voiceId);
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
              {openaiVoices.map((voice) => (
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
      </CardContent>
    </Card>
  );
}