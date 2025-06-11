
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const useAudioContext = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  const initializeAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setIsAudioEnabled(true);
      toast.success('Audio enabled');
      return audioContextRef.current;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      toast.error('Could not initialize audio');
      return null;
    }
  };

  const getAudioContext = () => {
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
    audioContext: audioContextRef.current,
    isAudioEnabled,
    initializeAudio,
    getAudioContext
  };
};
