
import { useEffect, useRef, useState } from 'react';
import TinySynthEngine from '../utils/tinySynthEngine';
import { useMidiOutput } from './useMidiOutput';

// Instrument IDs based on General MIDI standard
export const INSTRUMENT_MAP = {
  'grand-piano': 0,    // Acoustic Grand Piano
  'upright-piano': 1,  // Bright Acoustic Piano
  'epiano': 4,         // Electric Piano 1
  'organ': 16,         // Drawbar Organ
  'clavinet': 7,       // Clavinet
  'synth': 80,         // Lead 1 (square)
};

export type SynthInstrumentType = keyof typeof INSTRUMENT_MAP;

interface UsePianoSynthOptions {
  fallbackToOscillator?: boolean;
}

export const usePianoSynth = (options: UsePianoSynthOptions = {}) => {
  const { fallbackToOscillator = true } = options;
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const synthRef = useRef<TinySynthEngine | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const midi = useMidiOutput();

  // Initialize the synth engine
  useEffect(() => {
    let isMounted = true;
    const initSynth = async () => {
      try {
        setIsLoading(true);
        
        // Get the TinySynth instance
        const synth = TinySynthEngine.getInstance();
        await synth.initialize();
        
        synthRef.current = synth;
        
        if (isMounted) {
          setIsInitialized(true);
          setIsLoading(false);
          console.log('Piano synthesizer initialized successfully');
        }
      } catch (err) {
        console.error('Failed to initialize piano synth:', err);
        
        if (fallbackToOscillator) {
          // Create a standard AudioContext as fallback
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize synthesizer'));
          setIsLoading(false);
        }
      }
    };

    initSynth();

    return () => {
      isMounted = false;
      // Cleanup synth resources when component unmounts
    };
  }, [fallbackToOscillator]);

  // Reset audio function
  const resetAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (synthRef.current) {
        await synthRef.current.reset();
        console.log('Audio reset successfully');
      }
      
      setIsInitialized(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to reset audio:', err);
      setError(err instanceof Error ? err : new Error('Failed to reset audio'));
      setIsLoading(false);
    }
  };

  // Function to play a note using TinySynth or MIDI
  const playNote = async (noteName: string, velocity = 100) => {
    try {
      const midiNote = TinySynthEngine.noteNameToMidi(noteName);

      if (midi.isInitialized && midiNote >= 0) {
        midi.sendNoteOn(midiNote, velocity);
      } else if (synthRef.current && midiNote >= 0) {
        await synthRef.current.playNote(midiNote, velocity);
      } else if (fallbackToOscillator && audioContextRef.current) {
        playWithOscillator(noteName);
      }
    } catch (err) {
      console.error('Error playing note:', err);
      if (fallbackToOscillator) {
        playWithOscillator(noteName);
      }
    }
  };

  // Function to stop a note
  const stopNote = async (noteName: string) => {
    try {
      const midiNote = TinySynthEngine.noteNameToMidi(noteName);
      if (midi.isInitialized && midiNote >= 0) {
        midi.sendNoteOff(midiNote);
      }

      if (synthRef.current && midiNote >= 0) {
        await synthRef.current.stopNote(midiNote);
      }
    } catch (err) {
      console.error('Error stopping note:', err);
    }
  };

  // Fallback method using standard Web Audio API
  const playWithOscillator = (noteName: string) => {
    if (!audioContextRef.current) return;
    
    // Parse note name to get frequency
    const noteRegex = /^([A-G][#]?)(\d+)$/;
    const match = noteName.match(noteRegex);
    
    if (!match) return;
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const note = match[1];
    const octave = parseInt(match[2]);
    
    const noteIndex = noteNames.indexOf(note);
    if (noteIndex === -1) return;
    
    // Calculate frequency: A4 = 440Hz
    const a4 = 440;
    const n = noteIndex - noteNames.indexOf('A') + (octave - 4) * 12;
    const frequency = a4 * Math.pow(2, n / 12);
    
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 2.0);
    } catch (err) {
      console.error('Fallback oscillator failed:', err);
    }
  };

  // Set the instrument/program
  const setInstrument = async (instrument: SynthInstrumentType) => {
    const programNumber = INSTRUMENT_MAP[instrument];

    if (midi.isInitialized) {
      midi.sendProgramChange(programNumber);
    }

    if (synthRef.current) {
      try {
        await synthRef.current.setProgram(programNumber);
      } catch (err) {
        console.error('Error setting instrument:', err);
      }
    }
  };

  // Set the master volume
  const setVolume = async (volume: number) => {
    if (midi.isInitialized) {
      midi.setVolume(volume);
    }

    if (synthRef.current) {
      try {
        await synthRef.current.setVolume(volume);
      } catch (err) {
        console.error('Error setting volume:', err);
      }
    }
  };

  return {
    playNote,
    stopNote,
    setInstrument,
    setVolume,
    resetAudio,
    isInitialized,
    isLoading,
    error,
    hasSynth: Boolean(synthRef.current),
    hasMidi: midi.isInitialized && !midi.error,
  };
};
