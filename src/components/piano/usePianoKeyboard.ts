
import { useState, useEffect, useRef } from 'react';
import { usePianoSynth, SynthInstrumentType } from '@/hooks/usePianoSynth';
import { InstrumentType } from './types';

export const usePianoKeyboard = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('grand-piano');
  const [currentOctave, setCurrentOctave] = useState(4);
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const initializationAttempted = useRef(false);
  
  const {
    playNote,
    stopNote,
    setInstrument,
    setVolume: setSynthVolume,
    isInitialized,
    isLoading,
    hasSynth
  } = usePianoSynth({ fallbackToOscillator: true });

  // Generate notes for 3 octaves starting from the current octave
  const generateNotesFor3Octaves = (startOctave: number) => {
    const notes = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseFrequency = 16.35; // C0

    for (let octave = startOctave; octave < startOctave + 3; octave++) {
      for (let i = 0; i < noteNames.length; i++) {
        const noteName = noteNames[i];
        const frequency = baseFrequency * Math.pow(2, (octave * 12 + i) / 12);
        notes.push({
          name: `${noteName}${octave}`,
          frequency,
          isSharp: noteName.includes('#')
        });
      }
    }

    return notes;
  };

  const notes = generateNotesFor3Octaves(currentOctave);

  // Initialize audio context on first user interaction for iOS
  const initializeAudioContext = async () => {
    if (!audioContextInitialized && isIOS && !initializationAttempted.current) {
      try {
        initializationAttempted.current = true;
        console.log('Initializing audio context for iOS...');
        
        await playNote('C4', 1);
        setTimeout(async () => {
          await stopNote('C4');
        }, 100);
        
        setAudioContextInitialized(true);
        console.log('Audio context initialized for iOS');
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        initializationAttempted.current = false;
      }
    }
  };

  // Update synth when instrument changes
  useEffect(() => {
    if (isInitialized) {
      setInstrument(selectedInstrument as SynthInstrumentType);
    }
  }, [selectedInstrument, isInitialized, setInstrument]);

  // Update volume when changed
  useEffect(() => {
    if (isInitialized) {
      setSynthVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted, isInitialized, setSynthVolume]);

  const handlePlayNote = async (frequency: number, noteName: string) => {
    if (isMuted) return;

    console.log('Attempting to play note:', noteName, 'on iOS:', isIOS);

    if (isIOS && !audioContextInitialized) {
      await initializeAudioContext();
    }

    const velocity = 100;
    await playNote(noteName, velocity);
    setIsPlaying(noteName);
  };

  const handleStopNote = async (noteName: string) => {
    await stopNote(noteName);
    setIsPlaying(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    
    if (isIOS && !audioContextInitialized) {
      initializeAudioContext();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      setCurrentOctave(prev => Math.min(5, prev + 1));
    } else if (distance < -minSwipeDistance) {
      setCurrentOctave(prev => Math.max(1, prev - 1));
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return {
    isPlaying,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    selectedInstrument,
    setSelectedInstrument,
    currentOctave,
    setCurrentOctave,
    audioContextInitialized,
    isIOS,
    notes,
    isInitialized,
    isLoading,
    hasSynth,
    handlePlayNote,
    handleStopNote,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
