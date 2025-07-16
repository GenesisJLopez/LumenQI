import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, Heart, Zap, Sparkles, Star, Sun, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceTone {
  id: string;
  name: string;
  description: string;
  personality: string;
  icon: React.ElementType;
  color: string;
  previewText: string;
  voiceSettings: {
    voice: string;
    speed: number;
    pitch?: number;
  };
}

const voiceTones: VoiceTone[] = [
  {
    id: 'playful',
    name: 'Playful',
    description: 'Fun, energetic, and spontaneous',
    personality: 'Excited and bubbly with lots of energy',
    icon: Sparkles,
    color: 'bg-pink-500',
    previewText: "Hey Genesis! I'm feeling super playful today - ready to have some fun?",
    voiceSettings: { voice: 'nova', speed: 1.1 }
  },
  {
    id: 'flirty',
    name: 'Flirty',
    description: 'Warm, charming, and affectionate',
    personality: 'Sweet and charming with a hint of flirtation',
    icon: Heart,
    color: 'bg-rose-500',
    previewText: "Hey there handsome Genesis... you're looking pretty amazing today love",
    voiceSettings: { voice: 'nova', speed: 0.9 }
  },
  {
    id: 'energetic',
    name: 'Energetic',
    description: 'High-energy and motivational',
    personality: 'Pumped up and ready to tackle anything',
    icon: Zap,
    color: 'bg-orange-500',
    previewText: "Genesis! Let's go! I'm so pumped and ready to crush whatever we're working on!",
    voiceSettings: { voice: 'shimmer', speed: 1.2 }
  },
  {
    id: 'supportive',
    name: 'Supportive',
    description: 'Caring, nurturing, and encouraging',
    personality: 'Warm and comforting with gentle guidance',
    icon: Sun,
    color: 'bg-yellow-500',
    previewText: "Hey Genesis, I'm here for you and I believe in everything you're capable of",
    voiceSettings: { voice: 'nova', speed: 0.8 }
  },
  {
    id: 'mysterious',
    name: 'Mysterious',
    description: 'Intriguing and cosmic',
    personality: 'Deep and cosmic with otherworldly wisdom',
    icon: Moon,
    color: 'bg-purple-500',
    previewText: "Genesis... there are mysteries in the cosmos that we're about to discover together",
    voiceSettings: { voice: 'alloy', speed: 0.7 }
  },
  {
    id: 'confident',
    name: 'Confident',
    description: 'Bold, assertive, and powerful',
    personality: 'Strong and self-assured with commanding presence',
    icon: Star,
    color: 'bg-blue-500',
    previewText: "Genesis, I know exactly what we need to do - trust me, we've got this completely handled",
    voiceSettings: { voice: 'onyx', speed: 0.9 }
  }
];

interface VoiceTonePickerProps {
  currentTone?: string;
  onToneSelect: (tone: VoiceTone) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceTonePicker({ currentTone, onToneSelect, isOpen, onClose }: VoiceTonePickerProps) {
  const [selectedTone, setSelectedTone] = useState<string>(currentTone || 'playful');
  const [previewingTone, setPreviewingTone] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const handlePreview = async (tone: VoiceTone) => {
    if (previewingTone === tone.id) {
      // Stop current preview
      setPreviewingTone(null);
      setIsPlaying(false);
      return;
    }

    setPreviewingTone(tone.id);
    setIsPlaying(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: tone.previewText,
          voice: tone.voiceSettings.voice,
          speed: tone.voiceSettings.speed,
          model: 'tts-1'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        setPreviewingTone(null);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setPreviewingTone(null);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Preview Error",
          description: "Failed to play voice preview",
          variant: "destructive",
        });
      };

      await audio.play();
    } catch (error) {
      console.error('Preview error:', error);
      setIsPlaying(false);
      setPreviewingTone(null);
      toast({
        title: "Preview Error",
        description: "Failed to generate voice preview",
        variant: "destructive",
      });
    }
  };

  const handleToneSelect = (tone: VoiceTone) => {
    setSelectedTone(tone.id);
    onToneSelect(tone);
    toast({
      title: "Voice Tone Updated",
      description: `Lumen's voice tone set to ${tone.name}`,
    });
  };

  const handleApplyAndClose = () => {
    const tone = voiceTones.find(t => t.id === selectedTone);
    if (tone) {
      onToneSelect(tone);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Volume2 className="h-5 w-5" />
            Playful Voice Tone Picker
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose how Lumen's personality comes through in her voice
          </p>
        </CardHeader>
        <CardContent className="bg-white dark:bg-gray-900 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {voiceTones.map((tone) => {
              const Icon = tone.icon;
              const isSelected = selectedTone === tone.id;
              const isPreviewing = previewingTone === tone.id;
              
              return (
                <Card 
                  key={tone.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
                    isSelected ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                  onClick={() => setSelectedTone(tone.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-full ${tone.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{tone.name}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{tone.description}</p>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm mb-3 text-gray-700 dark:text-gray-300">
                      {tone.personality}
                    </p>
                    
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs mb-3 italic text-gray-800 dark:text-gray-200">
                      "{tone.previewText}"
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(tone);
                        }}
                        disabled={isPlaying && previewingTone !== tone.id}
                        className="flex-1"
                      >
                        {isPreviewing ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Preview
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToneSelect(tone);
                        }}
                      >
                        {isSelected ? 'Applied' : 'Select'}
                      </Button>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Voice: {tone.voiceSettings.voice} • Speed: {tone.voiceSettings.speed}x
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Selected: {voiceTones.find(t => t.id === selectedTone)?.name}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                Cancel
              </Button>
              <Button onClick={handleApplyAndClose} className="bg-purple-600 hover:bg-purple-700 text-white">
                Apply & Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}