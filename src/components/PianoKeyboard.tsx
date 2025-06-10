
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface Note {
  name: string;
  frequency: number;
  isSharp: boolean;
}

export const PianoKeyboard = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const notes: Note[] = [
    { name: 'C4', frequency: 261.63, isSharp: false },
    { name: 'C#4', frequency: 277.18, isSharp: true },
    { name: 'D4', frequency: 293.66, isSharp: false },
    { name: 'D#4', frequency: 311.13, isSharp: true },
    { name: 'E4', frequency: 329.63, isSharp: false },
    { name: 'F4', frequency: 349.23, isSharp: false },
    { name: 'F#4', frequency: 369.99, isSharp: true },
    { name: 'G4', frequency: 392.00, isSharp: false },
    { name: 'G#4', frequency: 415.30, isSharp: true },
    { name: 'A4', frequency: 440.00, isSharp: false },
    { name: 'A#4', frequency: 466.16, isSharp: true },
    { name: 'B4', frequency: 493.88, isSharp: false },
    { name: 'C5', frequency: 523.25, isSharp: false },
  ];

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

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContextRef.current.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 1);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 1);

    setIsPlaying(noteName);
    setTimeout(() => setIsPlaying(null), 200);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-center gap-4 mb-6">
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

      <div className="relative mx-auto" style={{ width: 'fit-content' }}>
        <div className="flex relative">
          {notes.map((note) => {
            if (note.isSharp) return null;
            return (
              <button
                key={note.name}
                className={`w-12 h-32 bg-white border-2 border-gray-300 transition-all duration-75 ${
                  isPlaying === note.name
                    ? 'bg-gray-200 transform scale-95'
                    : 'hover:bg-gray-50 active:bg-gray-200'
                }`}
                onMouseDown={() => playNote(note.frequency, note.name)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  playNote(note.frequency, note.name);
                }}
              >
                <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                  {note.name.replace('4', '').replace('5', '')}
                </span>
              </button>
            );
          })}
        </div>

        <div className="absolute top-0 flex">
          {notes.map((note, index) => {
            if (!note.isSharp) return <div key={note.name} className="w-12" />;
            return (
              <button
                key={note.name}
                className={`w-8 h-20 bg-gray-800 text-white border border-gray-600 -ml-4 z-10 transition-all duration-75 ${
                  isPlaying === note.name
                    ? 'bg-gray-600 transform scale-95'
                    : 'hover:bg-gray-700 active:bg-gray-600'
                }`}
                onMouseDown={() => playNote(note.frequency, note.name)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  playNote(note.frequency, note.name);
                }}
              >
                <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs">
                  {note.name.replace('4', '').replace('5', '')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>Tap or click the keys to play notes</p>
        <p className="mt-1">White keys: Natural notes | Black keys: Sharp/Flat notes</p>
      </div>
    </div>
  );
};
