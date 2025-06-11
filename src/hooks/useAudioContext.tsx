
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const useAudioContext = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  const initializeAudio = async (): Promise<AudioContext> => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(audioContextRef.current);
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setIsAudioEnabled(true);
      toast.success('Audio enabled');
      console.log('Audio context initialized:', audioContextRef.current);
      return audioContextRef.current;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      toast.error('Could not initialize audio');
      throw error;
    }
  };

  const resetAudio = async () => {
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
      audioContextRef.current = null;
      setAudioContext(null);
      setIsAudioEnabled(false);
      toast.success('Audio reset');
      console.log('Audio context reset');
    } catch (error) {
      console.error('Failed to reset audio:', error);
      toast.error('Could not reset audio');
    }
  };

  const getAudioContext = (): AudioContext | null => {
    return audioContextRef.current;
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    audioContext,
    isAudioEnabled,
    initializeAudio,
    resetAudio,
    getAudioContext
  };
};
