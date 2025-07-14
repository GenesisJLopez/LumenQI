import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Volume2, Sparkles, Heart, Zap, Brain, Mic, Play, Save, RotateCcw } from 'lucide-react';

interface VoicePersonality {
  // Voice characteristics
  voice: string;
  speed: number;
  pitch: number;
  energy: number;
  
  // Personality traits
  warmth: number;
  playfulness: number;
  intelligence: number;
  supportiveness: number;
  enthusiasm: number;
  
  // Speaking style
  formality: number;
  verbosity: number;
  emotiveness: number;
  
  // Custom settings
  preferredGreetings: string[];
  favoriteExpressions: string[];
  personalityDescription: string;
  responseStyle: string;
}

interface VoicePersonalityWizardProps {
  onSave: (personality: VoicePersonality) => void;
  onClose: () => void;
}

const defaultPersonality: VoicePersonality = {
  voice: 'nova',
  speed: 1.0,
  pitch: 1.0,
  energy: 0.8,
  warmth: 0.8,
  playfulness: 0.7,
  intelligence: 0.9,
  supportiveness: 0.8,
  enthusiasm: 0.7,
  formality: 0.3,
  verbosity: 0.6,
  emotiveness: 0.7,
  preferredGreetings: ['Hey there!', 'Hello Genesis!', 'How can I help you today?'],
  favoriteExpressions: ['Amazing!', 'That\'s fantastic!', 'I love that!', 'Perfect!'],
  personalityDescription: 'Warm, intelligent, and supportive AI companion',
  responseStyle: 'friendly'
};

const voiceOptions = [
  { id: 'nova', name: 'Nova', description: 'Balanced, clear female voice', gender: 'female' },
  { id: 'alloy', name: 'Alloy', description: 'Neutral, versatile voice', gender: 'neutral' },
  { id: 'echo', name: 'Echo', description: 'Warm, friendly male voice', gender: 'male' },
  { id: 'fable', name: 'Fable', description: 'Expressive, storytelling voice', gender: 'male' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative male voice', gender: 'male' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft, gentle female voice', gender: 'female' }
];

const personalityPresets = [
  {
    name: 'Supportive Friend',
    description: 'Warm, encouraging, and always there for you',
    personality: {
      ...defaultPersonality,
      warmth: 0.9,
      supportiveness: 0.95,
      playfulness: 0.6,
      formality: 0.2,
      emotiveness: 0.8,
      voice: 'nova'
    }
  },
  {
    name: 'Energetic Mentor',
    description: 'High energy, enthusiastic, and motivating',
    personality: {
      ...defaultPersonality,
      enthusiasm: 0.95,
      energy: 0.9,
      playfulness: 0.8,
      speed: 1.1,
      emotiveness: 0.9,
      voice: 'shimmer'
    }
  },
  {
    name: 'Calm Advisor',
    description: 'Thoughtful, measured, and wise',
    personality: {
      ...defaultPersonality,
      intelligence: 0.95,
      warmth: 0.7,
      formality: 0.6,
      speed: 0.9,
      emotiveness: 0.5,
      voice: 'alloy'
    }
  },
  {
    name: 'Playful Companion',
    description: 'Fun, spontaneous, and full of joy',
    personality: {
      ...defaultPersonality,
      playfulness: 0.95,
      enthusiasm: 0.9,
      energy: 0.85,
      formality: 0.1,
      emotiveness: 0.85,
      voice: 'nova'
    }
  }
];

export function VoicePersonalityWizard({ onSave, onClose }: VoicePersonalityWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [personality, setPersonality] = useState<VoicePersonality>(defaultPersonality);
  const [isPlaying, setIsPlaying] = useState(false);
  const [customGreeting, setCustomGreeting] = useState('');
  const [customExpression, setCustomExpression] = useState('');

  const steps = [
    'Voice Selection',
    'Personality Traits',
    'Speaking Style',
    'Custom Expressions',
    'Preview & Save'
  ];

  const updatePersonality = (updates: Partial<VoicePersonality>) => {
    setPersonality(prev => ({ ...prev, ...updates }));
  };

  const applyPreset = (preset: typeof personalityPresets[0]) => {
    setPersonality(preset.personality);
  };

  const testVoice = async () => {
    setIsPlaying(true);
    try {
      const testText = `Hi there! This is ${voiceOptions.find(v => v.id === personality.voice)?.name}. ${personality.preferredGreetings[0]} I'm excited to be your AI companion with this personality!`;
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testText,
          voice: personality.voice,
          speed: personality.speed,
          model: 'tts-1-hd'
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

  const addCustomGreeting = () => {
    if (customGreeting.trim()) {
      updatePersonality({
        preferredGreetings: [...personality.preferredGreetings, customGreeting.trim()]
      });
      setCustomGreeting('');
    }
  };

  const addCustomExpression = () => {
    if (customExpression.trim()) {
      updatePersonality({
        favoriteExpressions: [...personality.favoriteExpressions, customExpression.trim()]
      });
      setCustomExpression('');
    }
  };

  const removeGreeting = (index: number) => {
    updatePersonality({
      preferredGreetings: personality.preferredGreetings.filter((_, i) => i !== index)
    });
  };

  const removeExpression = (index: number) => {
    updatePersonality({
      favoriteExpressions: personality.favoriteExpressions.filter((_, i) => i !== index)
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Choose Your Voice</h3>
              <p className="text-gray-600">Select the voice that feels right for your AI companion</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voiceOptions.map((voice) => (
                <Card 
                  key={voice.id}
                  className={`cursor-pointer transition-all ${
                    personality.voice === voice.id 
                      ? 'ring-2 ring-purple-500 bg-purple-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => updatePersonality({ voice: voice.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{voice.name}</h4>
                        <p className="text-sm text-gray-600">{voice.description}</p>
                        <Badge variant="secondary" className="mt-1">
                          {voice.gender}
                        </Badge>
                      </div>
                      <Volume2 className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Speech Speed</Label>
                <Slider
                  value={[personality.speed]}
                  onValueChange={(value) => updatePersonality({ speed: value[0] })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Slow</span>
                  <span>{personality.speed.toFixed(1)}x</span>
                  <span>Fast</span>
                </div>
              </div>

              <Button onClick={testVoice} disabled={isPlaying} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                {isPlaying ? 'Playing...' : 'Test Voice'}
              </Button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Personality Traits</h3>
              <p className="text-gray-600">Adjust the core personality characteristics</p>
            </div>

            <div className="mb-6">
              <Label className="text-lg font-semibold mb-4 block">Quick Presets</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {personalityPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="h-auto p-4 text-left"
                    onClick={() => applyPreset(preset)}
                  >
                    <div>
                      <div className="font-semibold">{preset.name}</div>
                      <div className="text-sm text-gray-600">{preset.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'warmth', label: 'Warmth', icon: Heart, description: 'How caring and affectionate' },
                { key: 'playfulness', label: 'Playfulness', icon: Sparkles, description: 'How fun and spontaneous' },
                { key: 'intelligence', label: 'Intelligence', icon: Brain, description: 'How analytical and insightful' },
                { key: 'supportiveness', label: 'Supportiveness', icon: Heart, description: 'How encouraging and helpful' },
                { key: 'enthusiasm', label: 'Enthusiasm', icon: Zap, description: 'How energetic and excited' }
              ].map(({ key, label, icon: Icon, description }) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-purple-500" />
                    <Label className="font-medium">{label}</Label>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{description}</p>
                  <Slider
                    value={[personality[key as keyof VoicePersonality] as number]}
                    onValueChange={(value) => updatePersonality({ [key]: value[0] })}
                    min={0}
                    max={1}
                    step={0.1}
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Low</span>
                    <span>{((personality[key as keyof VoicePersonality] as number) * 100).toFixed(0)}%</span>
                    <span>High</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Speaking Style</h3>
              <p className="text-gray-600">Fine-tune how your AI companion communicates</p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'formality', label: 'Formality', description: 'How formal vs casual the language is' },
                { key: 'verbosity', label: 'Verbosity', description: 'How detailed vs concise responses are' },
                { key: 'emotiveness', label: 'Emotiveness', description: 'How expressive and emotional responses are' }
              ].map(({ key, label, description }) => (
                <div key={key}>
                  <Label className="font-medium">{label}</Label>
                  <p className="text-sm text-gray-600 mb-2">{description}</p>
                  <Slider
                    value={[personality[key as keyof VoicePersonality] as number]}
                    onValueChange={(value) => updatePersonality({ [key]: value[0] })}
                    min={0}
                    max={1}
                    step={0.1}
                    className="mt-1"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{key === 'formality' ? 'Casual' : key === 'verbosity' ? 'Concise' : 'Subtle'}</span>
                    <span>{((personality[key as keyof VoicePersonality] as number) * 100).toFixed(0)}%</span>
                    <span>{key === 'formality' ? 'Formal' : key === 'verbosity' ? 'Detailed' : 'Expressive'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="font-medium">Response Style</Label>
                <Select 
                  value={personality.responseStyle} 
                  onValueChange={(value) => updatePersonality({ responseStyle: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                    <SelectItem value="professional">Professional & Polished</SelectItem>
                    <SelectItem value="casual">Casual & Relaxed</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                    <SelectItem value="thoughtful">Thoughtful & Reflective</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-medium">Personality Description</Label>
                <Textarea
                  value={personality.personalityDescription}
                  onChange={(e) => updatePersonality({ personalityDescription: e.target.value })}
                  placeholder="Describe your AI companion's personality..."
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Custom Expressions</h3>
              <p className="text-gray-600">Add personalized greetings and favorite expressions</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="font-medium">Preferred Greetings</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={customGreeting}
                    onChange={(e) => setCustomGreeting(e.target.value)}
                    placeholder="Add a custom greeting..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomGreeting()}
                  />
                  <Button onClick={addCustomGreeting} disabled={!customGreeting.trim()}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {personality.preferredGreetings.map((greeting, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeGreeting(index)}
                    >
                      {greeting} ✕
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-medium">Favorite Expressions</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={customExpression}
                    onChange={(e) => setCustomExpression(e.target.value)}
                    placeholder="Add a favorite expression..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomExpression()}
                  />
                  <Button onClick={addCustomExpression} disabled={!customExpression.trim()}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {personality.favoriteExpressions.map((expression, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeExpression(index)}
                    >
                      {expression} ✕
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Preview & Save</h3>
              <p className="text-gray-600">Review your customized voice personality</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Voice Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Voice</Label>
                    <p className="font-medium">{voiceOptions.find(v => v.id === personality.voice)?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Speed</Label>
                    <p className="font-medium">{personality.speed.toFixed(1)}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Personality Traits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: 'warmth', label: 'Warmth' },
                    { key: 'playfulness', label: 'Playfulness' },
                    { key: 'intelligence', label: 'Intelligence' },
                    { key: 'supportiveness', label: 'Supportiveness' },
                    { key: 'enthusiasm', label: 'Enthusiasm' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm">{label}</Label>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(personality[key as keyof VoicePersonality] as number) * 100} 
                          className="w-20" 
                        />
                        <span className="text-sm font-medium w-8">
                          {((personality[key as keyof VoicePersonality] as number) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Expressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Greetings</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {personality.preferredGreetings.map((greeting, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {greeting}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Expressions</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {personality.favoriteExpressions.map((expression, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {expression}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={testVoice} variant="outline" disabled={isPlaying} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                {isPlaying ? 'Playing...' : 'Test Final Voice'}
              </Button>
              <Button onClick={() => onSave(personality)} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Personality
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Voice Personality Customization</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-600">{steps[currentStep]}</span>
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
          </div>
        </div>

        <div className="p-6 h-full overflow-y-auto">
          {renderStep()}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPersonality(defaultPersonality)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button onClick={() => onSave(personality)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save & Apply
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}