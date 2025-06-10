
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX } from 'lucide-react';

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

  // Generate 3 octaves of notes starting from C3
  const notes: Note[] = [];
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const baseFrequency = 130.81; // C3

  for (let octave = 0; octave < 3; octave++) {
    for (let i = 0; i < noteNames.length; i++) {
      const noteName = noteNames[i];
      const frequency = baseFrequency * Math.pow(2, (octave * 12 + i) / 12);
      notes.push({
        name: `${noteName}${3 + octave}`,
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

      {/* Piano Keyboard */}
      <div className="relative w-full overflow-x-auto">
        <div className="relative min-w-full" style={{ minWidth: '800px' }}>
          {/* White Keys */}
          <div className="flex relative">
            {whiteKeys.map((note, index) => (
              <button
                key={note.name}
                className={`flex-1 h-32 bg-white border-2 border-gray-300 transition-all duration-75 relative ${
                  isPlaying === note.name
                    ? 'bg-gray-200 transform scale-95'
                    : 'hover:bg-gray-50 active:bg-gray-200'
                }`}
                style={{ minWidth: '40px' }}
                onMouseDown={() => playNote(note.frequency, note.name)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  playNote(note.frequency, note.name);
                }}
              >
                <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                  {note.name.replace(/\d/, '')}
                </span>
              </button>
            ))}
          </div>

          {/* Black Keys */}
          <div className="absolute top-0 left-0 flex">
            {whiteKeys.map((whiteNote, whiteIndex) => {
              // Find if there's a black key after this white key
              const noteWithoutOctave = whiteNote.name.replace(/\d/, '');
              const hasBlackKeyAfter = ['C', 'D', 'F', 'G', 'A'].includes(noteWithoutOctave);
              
              if (!hasBlackKeyAfter) {
                return <div key={whiteNote.name} className="flex-1" style={{ minWidth: '40px' }} />;
              }

              // Find the corresponding black key
              const blackKeyName = noteWithoutOctave + '#' + whiteNote.name.match(/\d/)?.[0];
              const blackKey = blackKeys.find(key => key.name === blackKeyName);

              return (
                <div key={whiteNote.name} className="flex-1 relative" style={{ minWidth: '40px' }}>
                  {blackKey && (
                    <button
                      className={`absolute top-0 right-0 w-6 h-20 bg-gray-800 text-white border border-gray-600 transform translate-x-1/2 z-10 transition-all duration-75 ${
                        isPlaying === blackKey.name
                          ? 'bg-gray-600 scale-95'
                          : 'hover:bg-gray-700 active:bg-gray-600'
                      }`}
                      onMouseDown={() => playNote(blackKey.frequency, blackKey.name)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        playNote(blackKey.frequency, blackKey.name);
                      }}
                    >
                      <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs">
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

      <div className="text-center text-sm text-gray-600">
        <p>Tap or click the keys to play notes</p>
        <p className="mt-1">Current instrument: {instruments[selectedInstrument].name}</p>
      </div>
    </div>
  );
};
