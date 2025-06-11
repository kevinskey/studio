import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePianoSynth, SynthInstrumentType } from '@/hooks/usePianoSynth';

interface Note {
  name: string;
  frequency: number;
  isSharp: boolean;
}

type InstrumentType = 'grand-piano' | 'upright-piano' | 'epiano' | 'organ' | 'clavinet' | 'synth';

interface InstrumentConfig {
  name: string;
}

const instruments: Record<InstrumentType, InstrumentConfig> = {
  'grand-piano': {
    name: 'Grand Piano'
  },
  'upright-piano': {
    name: 'Upright Piano'
  },
  'epiano': {
    name: 'Electric Piano'
  },
  'organ': {
    name: 'Organ'
  },
  'clavinet': {
    name: 'Clavinet'
  },
  'synth': {
    name: 'Synth'
  }
};

export const PianoKeyboard = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8); // Higher default volume
  const [isMuted, setIsMuted] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('grand-piano');
  const [currentOctave, setCurrentOctave] = useState(4); // Start at octave 4 (C4)
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const isMobile = useIsMobile();
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const initializationAttempted = useRef(false);
  
  // Use our new WebAssembly-based synthesizer
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
  const generateNotesFor3Octaves = (startOctave: number): Note[] => {
    const notes: Note[] = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseFrequency = 16.35; // C0

    // Generate 3 octaves
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
        
        // Play a silent note to wake up the audio context
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

  // Auto-initialize for iOS when synth is ready
  useEffect(() => {
    if (isIOS && isInitialized && !audioContextInitialized && !initializationAttempted.current) {
      console.log('Auto-initializing audio for iOS...');
      // Don't auto-initialize, wait for user interaction
    }
  }, [isIOS, isInitialized, audioContextInitialized]);

  // Handle swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    
    // Initialize audio context on first touch for iOS
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
      // Swipe left - next octave (but limit to prevent going too high with 3 octaves)
      setCurrentOctave(prev => Math.min(5, prev + 1)); // Max 5 so we don't go beyond C7
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous octave
      setCurrentOctave(prev => Math.max(1, prev - 1));
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
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

  // Show message when advanced synth is loaded
  useEffect(() => {
    if (isInitialized && hasSynth) {
      
    }
  }, [isInitialized, hasSynth]);

  const handlePlayNote = async (frequency: number, noteName: string) => {
    if (isMuted) return;

    console.log('Attempting to play note:', noteName, 'on iOS:', isIOS);

    // Initialize audio context on first interaction for iOS
    if (isIOS && !audioContextInitialized) {
      await initializeAudioContext();
    }

    // Play the note using our synthesizer with higher velocity for mobile
    const velocity = isMobile ? 127 : 100;
    await playNote(noteName, velocity);
    
    // Visual feedback
    setIsPlaying(noteName);
  };

  const handleStopNote = async (noteName: string) => {
    // Stop the note using our synthesizer
    await stopNote(noteName);
    
    // Clear visual feedback
    setIsPlaying(null);
  };

  const whiteKeys = notes.filter(note => !note.isSharp);
  const blackKeys = notes.filter(note => note.isSharp);

  // Mobile horizontal layout
  if (isMobile) {
    return (
      <div className="w-full space-y-4">
        {/* iOS Audio Warning */}
        {isIOS && !audioContextInitialized && (
          <div className="flex items-center justify-center gap-2 p-4 bg-orange-50 rounded-lg border-2 border-orange-200 animate-pulse">
            <span className="text-sm text-orange-800 font-bold">
              🎹 Tap any piano key to enable sound on iPhone/iPad
            </span>
          </div>
        )}

        {/* Audio Status for iOS */}
        {isIOS && audioContextInitialized && (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm text-green-800 font-medium">
              ✅ Audio enabled and ready to play!
            </span>
          </div>
        )}

        {/* Rotate instruction for mobile */}
        <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <RotateCcw className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800 font-medium">
            Rotate your device horizontally for better piano experience
          </span>
        </div>

        {/* Mobile Controls */}
        <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Instrument:</span>
            <Select value={selectedInstrument} onValueChange={(value) => setSelectedInstrument(value as InstrumentType)}>
              <SelectTrigger className="w-32">
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

          {/* Octave Selection */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Start Octave:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentOctave(prev => Math.max(1, prev - 1))}
                disabled={currentOctave <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="w-16 text-center font-mono">C{currentOctave}-C{currentOctave + 2}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentOctave(prev => Math.min(5, prev + 1))}
                disabled={currentOctave >= 5}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
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
                className="w-16"
              />
            </div>
          </div>
        </div>

        {/* Swipe instruction */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Swipe left/right to change octaves • Current: C{currentOctave} to C{currentOctave + 2}</p>
        </div>

        {/* Mobile Horizontal Piano - 3 Octaves - Realistic Sizing */}
        <div 
          className="relative w-screen -mx-4 bg-gray-900 p-2 shadow-2xl"
          onTouchStart={(e) => {
            handleTouchStart(e);
            // Initialize audio on first touch for iOS
            if (isIOS && !audioContextInitialized) {
              initializeAudioContext();
            }
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <style>{`
            .piano-mobile {
              --white-key-width: 16mm; /* Scaled down from 23mm for mobile */
              --white-key-height: 100mm; /* Proportional height */
              --black-key-width: 7mm; /* Scaled down from 10mm for mobile */
              --black-key-height: 60mm; /* Proportional height */
            }
          `}</style>
          
          <div className="piano-mobile relative flex w-full">
            {/* White Keys */}
            <div className="flex w-full">
              {whiteKeys.map((note, index) => (
                <button
                  key={note.name}
                  className={`relative transition-all duration-150 ease-out touch-manipulation select-none ${
                    isPlaying === note.name
                      ? 'bg-gradient-to-b from-gray-200 via-gray-300 to-gray-100 transform translate-y-1 shadow-inner'
                      : 'bg-gradient-to-b from-white via-gray-50 to-gray-100 active:from-gray-200 active:via-gray-300 active:to-gray-100 shadow-lg'
                  } border-r border-gray-300 rounded-b-md`}
                  style={{
                    width: 'var(--white-key-width)',
                    height: 'var(--white-key-height)',
                    borderLeft: index === 0 ? '1px solid #d1d5db' : 'none'
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handlePlayNote(note.frequency, note.name);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleStopNote(note.name);
                  }}
                  onMouseDown={() => handlePlayNote(note.frequency, note.name)}
                  onMouseUp={() => handleStopNote(note.name)}
                  onMouseLeave={() => handleStopNote(note.name)}
                >
                  <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-medium pointer-events-none">
                    {note.name.replace(/\d/, '')}
                  </span>
                </button>
              ))}
            </div>

            {/* Black Keys */}
            <div className="absolute top-0 left-0 flex w-full pointer-events-none">
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
                            : 'bg-gradient-to-b from-gray-800 via-gray-900 to-black active:from-gray-700 active:via-gray-800 active:to-gray-900 shadow-xl'
                        } rounded-b-md border border-gray-600`}
                        style={{
                          width: 'var(--black-key-width)',
                          height: 'var(--black-key-height)',
                          left: 'calc(50% + var(--white-key-width) * 0.25)',
                          transform: 'translateX(-50%)'
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          handlePlayNote(blackKey.frequency, blackKey.name);
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          handleStopNote(blackKey.name);
                        }}
                        onMouseDown={() => handlePlayNote(blackKey.frequency, blackKey.name)}
                        onMouseUp={() => handleStopNote(blackKey.name)}
                        onMouseLeave={() => handleStopNote(blackKey.name)}
                      >
                        <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white font-medium pointer-events-none">
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
          <p>Tap the keys to play notes</p>
          <p className="mt-1">Current instrument: {instruments[selectedInstrument].name}</p>
          <p className="mt-1">Showing 3 octaves: C{currentOctave} to C{currentOctave + 2}</p>
          {isIOS && audioContextInitialized && <p className="mt-1 text-green-600">✓ Audio enabled for iOS</p>}
          {isIOS && !audioContextInitialized && <p className="mt-1 text-orange-600">⚠️ Tap a key to enable audio</p>}
        </div>
      </div>
    );
  }

  // Desktop layout with realistic piano key sizing
  return (
    <div className="w-full space-y-6">
      {/* iOS Audio Warning for desktop view */}
      {isIOS && !audioContextInitialized && (
        <div className="bg-orange-50 text-orange-800 p-4 rounded-md text-center text-sm font-medium border-2 border-orange-200">
          🎹 Tap any piano key to enable audio on iPhone/iPad devices
        </div>
      )}

      {/* Audio Status for iOS Desktop */}
      {isIOS && audioContextInitialized && (
        <div className="bg-green-50 text-green-800 p-3 rounded-md text-center text-sm">
          ✅ Audio enabled and ready to play!
        </div>
      )}

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

          {/* Octave Selection for Desktop */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Start Octave:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentOctave(prev => Math.max(1, prev - 1))}
                disabled={currentOctave <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="w-16 text-center font-mono">C{currentOctave}-C{currentOctave + 2}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentOctave(prev => Math.min(5, prev + 1))}
                disabled={currentOctave >= 5}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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

      {/* Status indicator for WebAssembly synth */}
      {isLoading && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-center text-sm">
          Loading advanced piano synthesizer...
        </div>
      )}

      {/* Realistic Piano Keyboard - 3 Octaves - Standard Sizing */}
      <div 
        className="relative w-screen -mx-4 bg-gray-900 p-2 shadow-2xl"
        onTouchStart={(e) => {
          handleTouchStart(e);
          // Initialize audio on first touch for iOS
          if (isIOS && !audioContextInitialized) {
            initializeAudioContext();
          }
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <style>{`
          .piano-container {
            --white-key-width: 23mm; /* Standard piano white key width */
            --white-key-height: 150mm; /* Standard proportional height */
            --black-key-width: 10mm; /* Standard piano black key width */
            --black-key-height: 90mm; /* Standard proportional height */
          }
        `}</style>
        
        <div className="piano-container relative w-full" style={{ height: '150mm' }}>
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
                onMouseDown={() => handlePlayNote(note.frequency, note.name)}
                onMouseUp={() => handleStopNote(note.name)}
                onMouseLeave={() => handleStopNote(note.name)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handlePlayNote(note.frequency, note.name);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleStopNote(note.name);
                }}
              >
                <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-medium pointer-events-none">
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
                        left: 'calc(50% + var(--white-key-width) * 0.25)',
                        transform: 'translateX(-50%)'
                      }}
                      onMouseDown={() => handlePlayNote(blackKey.frequency, blackKey.name)}
                      onMouseUp={() => handleStopNote(blackKey.name)}
                      onMouseLeave={() => handleStopNote(blackKey.name)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handlePlayNote(blackKey.frequency, blackKey.name);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleStopNote(blackKey.name);
                      }}
                    >
                      <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white font-medium pointer-events-none">
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
        <p>Tap or click the keys to play notes</p>
        <p className="mt-1">Current instrument: {instruments[selectedInstrument].name}</p>
        <p className="mt-1">Showing 3 octaves: C{currentOctave} to C{currentOctave + 2}</p>
        {isIOS && audioContextInitialized && <p className="mt-1 text-green-600">✓ Audio enabled for iOS</p>}
        {isIOS && !audioContextInitialized && <p className="mt-1 text-orange-600">⚠️ Tap a key to enable audio</p>}
      </div>
    </div>
  );
};
