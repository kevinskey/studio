import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAudioContext } from '@/hooks/useAudioContext';

interface Note {
  name: string;
  frequency: number;
  isSharp: boolean;
}

type InstrumentType = 'grand-piano' | 'upright-piano' | 'epiano' | 'organ' | 'clavinet' | 'synth';

interface InstrumentConfig {
  name: string;
  waveType: OscillatorType;
  attackTime: number;
  releaseTime: number;
  harmonics?: number[];
}

const instruments: Record<InstrumentType, InstrumentConfig> = {
  'grand-piano': {
    name: 'Grand Piano',
    waveType: 'triangle',
    attackTime: 0.01,
    releaseTime: 2.0,
    harmonics: [1, 0.3, 0.15, 0.05]
  },
  'upright-piano': {
    name: 'Upright Piano',
    waveType: 'triangle',
    attackTime: 0.02,
    releaseTime: 1.5,
    harmonics: [1, 0.4, 0.2, 0.1]
  },
  'epiano': {
    name: 'Electric Piano',
    waveType: 'triangle',
    attackTime: 0.005,
    releaseTime: 1.0,
    harmonics: [1, 0.5, 0.25, 0.125]
  },
  'organ': {
    name: 'Organ',
    waveType: 'sine',
    attackTime: 0.1,
    releaseTime: 0.5,
    harmonics: [1, 0.8, 0.6, 0.4, 0.2]
  },
  'clavinet': {
    name: 'Clavinet',
    waveType: 'square',
    attackTime: 0.001,
    releaseTime: 0.3,
    harmonics: [1, 0.6, 0.3, 0.15]
  },
  'synth': {
    name: 'Synth',
    waveType: 'sawtooth',
    attackTime: 0.05,
    releaseTime: 0.8,
    harmonics: [1, 0.7, 0.5, 0.3, 0.2]
  }
};

export const PianoKeyboard = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('grand-piano');
  const [currentOctave, setCurrentOctave] = useState(3);
  const { audioContext, initializeAudio, isAudioEnabled } = useAudioContext();

  const keyboardRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Generate notes for current octave plus adjacent octaves for smooth transition
  const generateNotes = (octave: number): Note[] => {
    const notes: Note[] = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Generate 3 octaves (previous, current, next) for smooth transitions
    for (let oct = octave - 1; oct <= octave + 1; oct++) {
      const baseFrequency = 261.63 * Math.pow(2, oct - 4); // C4 = 261.63 Hz
      
      for (let i = 0; i < noteNames.length; i++) {
        const noteName = noteNames[i];
        const frequency = baseFrequency * Math.pow(2, i / 12);
        notes.push({
          name: `${noteName}${oct}`,
          frequency,
          isSharp: noteName.includes('#')
        });
      }
    }
    
    return notes;
  };

  const notes = generateNotes(currentOctave);
  
  // Get notes for the current octave only for display
  const currentOctaveNotes = notes.slice(12, 24); // Middle octave

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;
    
    // Only consider it a swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      e.preventDefault();
      isDragging.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !isDragging.current) {
      touchStartX.current = null;
      touchStartY.current = null;
      isDragging.current = false;
      return;
    }
    
    const touchX = e.changedTouches[0].clientX;
    const deltaX = touchX - touchStartX.current;
    const threshold = 80;
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentOctave > 1) {
        // Swipe right - lower octave
        setCurrentOctave(prev => Math.max(1, prev - 1));
      } else if (deltaX < 0 && currentOctave < 7) {
        // Swipe left - higher octave
        setCurrentOctave(prev => Math.min(7, prev + 1));
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
  };

  const changeOctave = (direction: 'up' | 'down') => {
    setCurrentOctave(prev => {
      if (direction === 'up' && prev < 7) return prev + 1;
      if (direction === 'down' && prev > 1) return prev - 1;
      return prev;
    });
  };

  const playNote = async (frequency: number, noteName: string) => {
    if (isMuted) return;

    let context = audioContext;
    if (!context || !isAudioEnabled) {
      context = await initializeAudio();
      if (!context) return;
    }

    try {
      const instrument = instruments[selectedInstrument];
      
      // Create main oscillator
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.type = instrument.waveType;
      
      // Set up ADSR envelope
      const attackTime = instrument.attackTime;
      const releaseTime = instrument.releaseTime;
      const sustainLevel = volume * 0.3;
      
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(sustainLevel, context.currentTime + attackTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + releaseTime);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + releaseTime);
      
      // Add harmonics for richer sound
      if (instrument.harmonics && instrument.harmonics.length > 1) {
        instrument.harmonics.slice(1).forEach((harmonic, index) => {
          const harmonicOsc = context!.createOscillator();
          const harmonicGain = context!.createGain();
          
          harmonicOsc.connect(harmonicGain);
          harmonicGain.connect(context!.destination);
          
          harmonicOsc.frequency.setValueAtTime(frequency * (index + 2), context!.currentTime);
          harmonicOsc.type = instrument.waveType;
          
          const harmonicVolume = sustainLevel * harmonic;
          harmonicGain.gain.setValueAtTime(0, context!.currentTime);
          harmonicGain.gain.linearRampToValueAtTime(harmonicVolume, context!.currentTime + attackTime);
          harmonicGain.gain.exponentialRampToValueAtTime(0.001, context!.currentTime + releaseTime);
          
          harmonicOsc.start(context!.currentTime);
          harmonicOsc.stop(context!.currentTime + releaseTime);
        });
      }

      setIsPlaying(noteName);
      setTimeout(() => setIsPlaying(null), 200);
      
      console.log(`Playing note: ${noteName} at ${frequency}Hz`);
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  const whiteKeys = currentOctaveNotes.filter(note => !note.isSharp);
  const blackKeys = currentOctaveNotes.filter(note => note.isSharp);

  return (
    <div className="w-full space-y-6">
      {/* Sound Controller */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Instrument:</span>
            <Select value={selectedInstrument} onValueChange={(value) => setSelectedInstrument(value as InstrumentType)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(instruments).map(([key, instrument]) => (
                  <SelectItem key={key} value={key}>
                    {instrument.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {!isAudioEnabled && (
            <Button
              onClick={initializeAudio}
              variant="outline"
              size="sm"
              className="bg-green-500 text-white hover:bg-green-600"
            >
              Enable Audio
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center gap-2"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Octave Controls */}
      <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeOctave('down')}
          disabled={currentOctave <= 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Lower
        </Button>
        
        <div className="text-center">
          <div className="text-lg font-semibold">Octave {currentOctave}</div>
          <div className="text-sm text-muted-foreground">Swipe left/right to change</div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeOctave('up')}
          disabled={currentOctave >= 7}
          className="flex items-center gap-2"
        >
          Higher
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Realistic Piano Keyboard */}
      <div 
        ref={keyboardRef}
        className="relative w-full overflow-hidden bg-gray-900 p-2 rounded-lg shadow-2xl select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <style>{`
          .piano-container {
            --white-key-width: max(calc(100vw / 21 - 4px), 44px);
            --black-key-width: calc(var(--white-key-width) * 0.6);
            --white-key-height: max(calc(var(--white-key-width) * 6), 200px);
            --black-key-height: calc(var(--white-key-height) * 0.6);
          }
        `}</style>
        
        <div className="piano-container relative w-full" style={{ height: 'max(calc(max(calc(100vw / 21 - 4px), 44px) * 6), 200px)' }}>
          {/* White Keys */}
          <div className="flex w-full h-full">
            {whiteKeys.map((note, index) => (
              <button
                key={note.name}
                className={`relative h-full transition-all duration-150 ease-out touch-manipulation select-none ${
                  isPlaying === note.name
                    ? 'bg-gradient-to-b from-gray-200 via-gray-300 to-gray-100 transform translate-y-1 shadow-inner'
                    : 'bg-gradient-to-b from-white via-gray-50 to-gray-100 hover:from-gray-50 hover:via-gray-100 hover:to-gray-200 shadow-lg hover:shadow-xl'
                } border-r border-gray-300 rounded-b-md`}
                style={{
                  width: 'var(--white-key-width)',
                  borderLeft: index === 0 ? '1px solid #d1d5db' : 'none'
                }}
                onMouseDown={() => playNote(note.frequency, note.name)}
                onTouchStart={(e) => {
                  if (!isDragging.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    playNote(note.frequency, note.name);
                  }
                }}
              >
                <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-medium pointer-events-none">
                  {note.name.replace(/\d/, '')}
                </span>
              </button>
            ))}
          </div>

          {/* Black Keys */}
          <div className="absolute top-0 left-0 flex w-full h-full pointer-events-none">
            {whiteKeys.map((whiteNote, whiteIndex) => {
              const noteWithoutOctave = whiteNote.name.replace(/\d/, '');
              const hasBlackKeyAfter = ['C', 'D', 'F', 'G', 'A'].includes(noteWithoutOctave);
              
              if (!hasBlackKeyAfter) {
                return (
                  <div 
                    key={whiteNote.name} 
                    style={{ width: 'var(--white-key-width)' }}
                  />
                );
              }

              const blackKeyName = noteWithoutOctave + '#' + whiteNote.name.match(/\d/)?.[0];
              const blackKey = blackKeys.find(key => key.name === blackKeyName);

              return (
                <div 
                  key={whiteNote.name} 
                  className="relative"
                  style={{ width: 'var(--white-key-width)' }}
                >
                  {blackKey && (
                    <button
                      className={`absolute top-0 z-10 transition-all duration-150 ease-out touch-manipulation select-none pointer-events-auto ${
                        isPlaying === blackKey.name
                          ? 'bg-gradient-to-b from-gray-700 via-gray-800 to-gray-600 transform translate-y-1 shadow-inner'
                          : 'bg-gradient-to-b from-gray-800 via-gray-900 to-black hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 shadow-xl hover:shadow-2xl'
                      } rounded-b-md border border-gray-600`}
                      style={{
                        width: 'var(--black-key-width)',
                        height: 'var(--black-key-height)',
                        left: 'calc(50% + var(--white-key-width) * 0.2)',
                        transform: 'translateX(-50%)'
                      }}
                      onMouseDown={() => playNote(blackKey.frequency, blackKey.name)}
                      onTouchStart={(e) => {
                        if (!isDragging.current) {
                          e.preventDefault();
                          e.stopPropagation();
                          playNote(blackKey.frequency, blackKey.name);
                        }
                      }}
                    >
                      <span className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs text-white font-medium pointer-events-none">
                        {blackKey.name.replace(/\d/, '')}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Tap or click the keys to play notes • Swipe left/right to change octaves</p>
        <p className="mt-1">Current: {instruments[selectedInstrument].name} • Octave {currentOctave}</p>
      </div>
    </div>
  );
};
