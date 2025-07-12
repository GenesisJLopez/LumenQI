import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { TestTube, Volume2, Settings, Sparkles } from 'lucide-react';
import { enhancedSpeech } from '@/lib/enhanced-speech';
import type { VoiceOption } from '@/lib/enhanced-speech';

interface VoiceSettingsProps {
  onVoiceChange?: (voice: VoiceOption) => void;
}

export function VoiceSettings({ onVoiceChange }: VoiceSettingsProps) {
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [rate, setRate] = useState([1.0]);
  const [pitch, setPitch] = useState([1.1]);
  const [volume, setVolume] = useState([1.0]);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const voices = enhancedSpeech.getVoiceOptions();
      setVoiceOptions(voices);
      const current = enhancedSpeech.getCurrentVoice();
      if (current) {
        setSelectedVoice(current);
      } else if (voices.length > 0) {
        setSelectedVoice(voices[0]);
        enhancedSpeech.setVoice(voices[0]);
      }
    };

    loadVoices();
    // Reload voices after a delay to ensure they're loaded
    setTimeout(loadVoices, 500);
  }, []);

  const handleVoiceChange = (voiceId: string) => {
    const voice = voiceOptions.find(v => v.id === voiceId);
    if (voice) {
      setSelectedVoice(voice);
      enhancedSpeech.setVoice(voice);
      onVoiceChange?.(voice);
    }
  };

  const handleTestVoice = () => {
    if (selectedVoice) {
      enhancedSpeech.testVoice(selectedVoice);
    }
  };

  const toggleOfflineMode = () => {
    const newOfflineMode = !isOffline;
    setIsOffline(newOfflineMode);
    enhancedSpeech.setOfflineMode(newOfflineMode);
  };

  const getPersonalityColor = (personality: string) => {
    if (personality.includes('flirtatious')) return 'bg-pink-100 text-pink-800';
    if (personality.includes('sporty')) return 'bg-green-100 text-green-800';
    if (personality.includes('witty')) return 'bg-purple-100 text-purple-800';
    if (personality.includes('confident')) return 'bg-blue-100 text-blue-800';
    if (personality.includes('charming')) return 'bg-yellow-100 text-yellow-800';
    if (personality.includes('sweet')) return 'bg-rose-100 text-rose-800';
    if (personality.includes('bubbly')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getQualityIcon = (quality: string) => {
    if (quality === 'neural') return <Sparkles className="w-3 h-3" />;
    if (quality === 'premium') return <Volume2 className="w-3 h-3" />;
    return <Settings className="w-3 h-3" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Voice Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Voice Personality</label>
          <Select value={selectedVoice?.id || ''} onValueChange={handleVoiceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a voice..." />
            </SelectTrigger>
            <SelectContent>
              {voiceOptions.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  <div className="flex items-center gap-2">
                    {getQualityIcon(voice.quality)}
                    <span>{voice.name}</span>
                    <Badge variant="secondary" className={getPersonalityColor(voice.personality)}>
                      {voice.personality}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedVoice && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedVoice.description}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{selectedVoice.quality}</Badge>
                <Badge variant="outline">{selectedVoice.gender}</Badge>
                <Badge variant="outline">{selectedVoice.language}</Badge>
              </div>
            </div>
          )}
        </div>

        {/* Voice Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Speaking Rate: {rate[0].toFixed(2)}x</label>
            <Slider
              value={rate}
              onValueChange={setRate}
              max={2}
              min={0.5}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Pitch: {pitch[0].toFixed(2)}</label>
            <Slider
              value={pitch}
              onValueChange={setPitch}
              max={2}
              min={0.5}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Volume: {Math.round(volume[0] * 100)}%</label>
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={1}
              min={0.1}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Test and Options */}
        <div className="flex gap-2">
          <Button 
            onClick={handleTestVoice}
            className="flex-1"
            disabled={!selectedVoice}
          >
            <TestTube className="w-4 h-4 mr-2" />
            Test Voice
          </Button>
          <Button
            variant={isOffline ? "default" : "outline"}
            onClick={toggleOfflineMode}
          >
            {isOffline ? "Offline Mode" : "Online Mode"}
          </Button>
        </div>

        {/* Voice Tips */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            Voice Tips
          </div>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Flirtatious voices are perfect for playful conversations</li>
            <li>• Sporty voices bring energy and excitement</li>
            <li>• Neural quality voices sound most natural</li>
            <li>• Try different rates and pitches to find your perfect match</li>
            <li>• Offline mode ensures speech works without internet</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}