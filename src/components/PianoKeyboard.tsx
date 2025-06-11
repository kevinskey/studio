import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const audioContextRef = useRef<AudioContext | null>(null);
  const isMobile = useIsMobile();

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

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playNote = (frequency: number, noteName: string) => {
    if (!audioContextRef.current || isMuted) return;

    const instrument = instruments[selectedInstrument];
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];

    // Create harmonics for richer sound
    instrument.harmonics?.forEach((harmonic, index) => {
      const oscillator = audioContextRef.current!.createOscillator();
      const gainNode = audioContextRef.current!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current!.destination);

      oscillator.frequency.setValueAtTime(
        frequency * (index + 1), 
        audioContextRef.current!.currentTime
      );
      oscillator.type = instrument.waveType;

      const harmonicVolume = volume * 0.3 * harmonic;
      gainNode.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        harmonicVolume, 
        audioContextRef.current!.currentTime + instrument.attackTime
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001, 
        audioContextRef.current!.currentTime + instrument.releaseTime
      );

      oscillator.start(audioContextRef.current!.currentTime);
      oscillator.stop(audioContextRef.current!.currentTime + instrument.releaseTime);

      oscillators.push(oscillator);
      gainNodes.push(gainNode);
    });

    setIsPlaying(noteName);
    setTimeout(() => setIsPlaying(null), 200);
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
                    playNote(note.frequency, note.name);
                  }}
                  onMouseDown={() => playNote(note.frequency, note.name)}
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
                          playNote(blackKey.frequency, blackKey.name);
                        }}
                        onMouseDown={() => playNote(blackKey.frequency, blackKey.name)}
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
        </div>
      </div>
    );
  }

  // Desktop layout (unchanged)
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
                onMouseDown={() => playNote(note.frequency, note.name)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  playNote(note.frequency, note.name);
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
                        e.preventDefault();
                        playNote(blackKey.frequency, blackKey.name);
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
