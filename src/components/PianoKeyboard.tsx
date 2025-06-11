import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
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
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('grand-piano');
  const isMobile = useIsMobile();
  
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

  // Generate 2 octaves of notes starting from C4 for better mobile experience
  const notes: Note[] = [];
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const baseFrequency = 261.63; // C4

  for (let octave = 0; octave < 2; octave++) {
    for (let i = 0; i < noteNames.length; i++) {
      const noteName = noteNames[i];
      const frequency = baseFrequency * Math.pow(2, (octave * 12 + i) / 12);
      notes.push({
        name: `${noteName}${4 + octave}`,
        frequency,
        isSharp: noteName.includes('#')
      });
    }
  }

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

  const handlePlayNote = (frequency: number, noteName: string) => {
    if (isMuted) return;

    // Play the note using our synthesizer
    playNote(noteName);
    
    // Visual feedback
    setIsPlaying(noteName);
  };

  const handleStopNote = (noteName: string) => {
    // Stop the note using our synthesizer
    stopNote(noteName);
    
    // Clear visual feedback
    setIsPlaying(null);
  };

  const whiteKeys = notes.filter(note => !note.isSharp);
  const blackKeys = notes.filter(note => note.isSharp);

  // Mobile horizontal layout
  if (isMobile) {
    return (
      <div className="w-full space-y-4">
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

        {/* Mobile Horizontal Piano */}
        <div className="relative w-full overflow-x-auto bg-gray-900 p-2 rounded-lg shadow-2xl">
          <style>{`
            .piano-mobile {
              --key-width: 60px;
              --key-height: 180px;
              --black-key-width: 40px;
              --black-key-height: 120px;
            }
          `}</style>
          
          <div className="piano-mobile relative flex" style={{ minWidth: `calc(${whiteKeys.length} * 60px)` }}>
            {/* White Keys */}
            <div className="flex">
              {whiteKeys.map((note, index) => (
                <button
                  key={note.name}
                  className={`relative transition-all duration-150 ease-out touch-manipulation select-none ${
                    isPlaying === note.name
                      ? 'bg-gradient-to-b from-gray-200 via-gray-300 to-gray-100 transform translate-y-1 shadow-inner'
                      : 'bg-gradient-to-b from-white via-gray-50 to-gray-100 active:from-gray-200 active:via-gray-300 active:to-gray-100 shadow-lg'
                  } border-r border-gray-300 rounded-b-md`}
                  style={{
                    width: 'var(--key-width)',
                    height: 'var(--key-height)',
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
                  <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-medium pointer-events-none">
                    {note.name.replace(/\d/, '')}
                  </span>
                </button>
              ))}
            </div>

            {/* Black Keys */}
            <div className="absolute top-0 left-0 flex pointer-events-none">
              {whiteKeys.map((whiteNote, whiteIndex) => {
                const noteWithoutOctave = whiteNote.name.replace(/\d/, '');
                const hasBlackKeyAfter = ['C', 'D', 'F', 'G', 'A'].includes(noteWithoutOctave);
                
                if (!hasBlackKeyAfter) {
                  return (
                    <div 
                      key={whiteNote.name} 
                      style={{ width: 'var(--key-width)' }}
                    />
                  );
                }

                const blackKeyName = noteWithoutOctave + '#' + whiteNote.name.match(/\d/)?.[0];
                const blackKey = blackKeys.find(key => key.name === blackKeyName);

                return (
                  <div 
                    key={whiteNote.name} 
                    className="relative"
                    style={{ width: 'var(--key-width)' }}
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
                          left: 'calc(50% + 12px)',
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
          <p>Tap the keys to play notes</p>
          <p className="mt-1">Current instrument: {instruments[selectedInstrument].name}</p>
          {hasSynth && <p className="mt-1 text-green-600">✓ Using advanced WebAssembly synthesizer</p>}
        </div>
      </div>
    );
  }

  // Desktop layout
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
      {isLoading ? (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-center text-sm">
          Loading advanced piano synthesizer...
        </div>
      ) : hasSynth ? (
        <div className="bg-green-50 text-green-800 p-3 rounded-md text-center text-sm flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Using high-quality WebAssembly synthesizer for realistic piano sounds
        </div>
      ) : null}

      {/* Realistic Piano Keyboard */}
      <div className="relative w-full overflow-hidden bg-gray-900 p-2 rounded-lg shadow-2xl">
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
        <p>Tap or click the keys to play notes</p>
        <p className="mt-1">Current instrument: {instruments[selectedInstrument].name}</p>
      </div>
    </div>
  );
};
