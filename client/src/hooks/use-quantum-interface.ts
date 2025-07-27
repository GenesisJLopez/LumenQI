import { useState, useEffect, useCallback } from 'react';

interface QuantumInterfaceHook {
  isElectron: boolean;
  hardwareInfo: any;
  mlMetrics: any;
  synthesizeAdvancedTTS: (text: string, provider: 'wavenet' | 'polly') => Promise<void>;
  adaptMachineLearning: (inputData: number[], feedback: number) => Promise<void>;
  connectToMLBackend: () => Promise<boolean>;
  mlBackendStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export function useQuantumInterface(): QuantumInterfaceHook {
  const [isElectron, setIsElectron] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState(null);
  const [mlMetrics, setMLMetrics] = useState(null);
  const [mlBackendStatus, setMLBackendStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [zmqSocket, setZMQSocket] = useState<any>(null);

  useEffect(() => {
    // Detect if running in Electron
    const electronCheck = window.require && window.process && window.process.type === 'renderer';
    setIsElectron(electronCheck);

    if (electronCheck) {
      initializeElectronIPC();
    }
  }, []);

  const initializeElectronIPC = useCallback(() => {
    if (!window.require) return;

    const { ipcRenderer } = window.require('electron');
    
    // Set up hardware monitoring
    const updateHardwareInfo = () => {
      ipcRenderer.invoke('get-hardware-info').then(setHardwareInfo);
    };
    
    const updateMLMetrics = () => {
      ipcRenderer.invoke('get-ml-metrics').then(setMLMetrics);
    };

    // Initial load
    updateHardwareInfo();
    updateMLMetrics();

    // Set up periodic updates
    const hardwareInterval = setInterval(updateHardwareInfo, 3000);
    const mlInterval = setInterval(updateMLMetrics, 2000);

    return () => {
      clearInterval(hardwareInterval);
      clearInterval(mlInterval);
    };
  }, []);

  const connectToMLBackend = useCallback(async (): Promise<boolean> => {
    if (!isElectron || mlBackendStatus === 'connected') return true;

    setMLBackendStatus('connecting');

    try {
      // Initialize ZeroMQ connection to Python backend
      const zmq = window.require('zeromq');
      const socket = zmq.socket('req');
      
      socket.connect('tcp://localhost:5555');
      setZMQSocket(socket);

      // Test connection
      const testMessage = JSON.stringify({ command: 'status' });
      
      return new Promise((resolve, reject) => {
        socket.send(testMessage);
        
        socket.on('message', (data: Buffer) => {
          try {
            const response = JSON.parse(data.toString());
            if (response.personality) {
              setMLBackendStatus('connected');
              resolve(true);
            } else {
              setMLBackendStatus('error');
              resolve(false);
            }
          } catch (error) {
            setMLBackendStatus('error');
            resolve(false);
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          setMLBackendStatus('error');
          resolve(false);
        }, 10000);
      });
    } catch (error) {
      console.error('Failed to connect to ML backend:', error);
      setMLBackendStatus('error');
      return false;
    }
  }, [isElectron, mlBackendStatus]);

  const synthesizeAdvancedTTS = useCallback(async (text: string, provider: 'wavenet' | 'polly') => {
    if (!isElectron) {
      console.warn('Advanced TTS only available in Electron app');
      return;
    }

    const { ipcRenderer } = window.require('electron');
    
    try {
      const options = {
        rate: 0.85,
        pitch: provider === 'wavenet' ? -2.0 : 0.0,
        volume: 0.0,
        language: 'en-US',
        gender: 'FEMALE',
        voiceName: provider === 'wavenet' ? 'en-US-Wavenet-F' : undefined,
        voiceId: provider === 'polly' ? 'Joanna' : undefined
      };

      const result = await ipcRenderer.invoke(`synthesize-${provider}`, text, options);
      
      if (result.success) {
        console.log(`${provider} TTS synthesis successful`);
        
        // Play the audio
        if (provider === 'wavenet') {
          const audioBlob = new Blob([result.audioContent], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
        } else if (provider === 'polly') {
          // Handle Polly audio stream
          const audioBlob = new Blob([result.audioStream], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
        }
      } else {
        console.error(`${provider} TTS synthesis failed:`, result.error);
      }
    } catch (error) {
      console.error('TTS synthesis error:', error);
    }
  }, [isElectron]);

  const adaptMachineLearning = useCallback(async (inputData: number[], feedback: number) => {
    if (!isElectron) {
      console.warn('ML adaptation only available in Electron app');
      return;
    }

    try {
      // Try Electron IPC first
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('ml-adapt', inputData, feedback);
      
      if (result.success) {
        setMLMetrics(result.metrics);
        console.log('ML adaptation successful via Electron IPC');
        return;
      }

      // If Electron IPC fails, try ZeroMQ backend
      if (zmqSocket && mlBackendStatus === 'connected') {
        const message = JSON.stringify({
          command: 'adapt',
          input_data: inputData,
          feedback: feedback
        });

        return new Promise((resolve, reject) => {
          zmqSocket.send(message);
          
          zmqSocket.once('message', (data: Buffer) => {
            try {
              const response = JSON.parse(data.toString());
              if (response.success) {
                setMLMetrics(response.metrics);
                console.log('ML adaptation successful via ZeroMQ');
                resolve(response);
              } else {
                reject(new Error('ML adaptation failed'));
              }
            } catch (error) {
              reject(error);
            }
          });

          // Timeout after 30 seconds
          setTimeout(() => {
            reject(new Error('ML adaptation timeout'));
          }, 30000);
        });
      }
    } catch (error) {
      console.error('ML adaptation error:', error);
    }
  }, [isElectron, zmqSocket, mlBackendStatus]);

  return {
    isElectron,
    hardwareInfo,
    mlMetrics,
    synthesizeAdvancedTTS,
    adaptMachineLearning,
    connectToMLBackend,
    mlBackendStatus
  };
}